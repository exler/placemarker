import PlacemarkerLogo from "@/assets/placemarker_logo.png";
import CountrySelector from "@/components/CountrySelector";
import HomelandSelector from "@/components/HomelandSelector";
import UserMenu from "@/components/UserMenu";
import WorldMap from "@/components/WorldMap";
import { useAuth } from "@/lib/auth";
import type { Country } from "@/lib/countries";
import { type SelectedCountry, countryStorage } from "@/lib/countryStorage";
import { pocketbaseService } from "@/lib/pocketbase";
import { userSettingsStorage } from "@/lib/userSettingsStorage";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [initialCountries, setInitialCountries] = useState<Country[]>([]);
    const [homelandCountry, setHomelandCountry] = useState<Country | null>(null);
    const [isHomelandSelectorOpen, setIsHomelandSelectorOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const { isAuthenticated } = useAuth(); // Initialize and load selected countries from IndexedDB/Pocketbase
    useEffect(() => {
        const loadSelectedCountries = async () => {
            try {
                await countryStorage.init();
                await userSettingsStorage.init();

                const stored = await countryStorage.getSelectedCountries();
                const storedHomeland = await userSettingsStorage.getHomeland();

                // Convert SelectedCountry[] to Country[] for the component
                const countries: Country[] = stored.map((sc) => ({
                    name: sc.name,
                    alpha3: sc.alpha3,
                }));

                setInitialCountries(countries);
                setSelectedCountries(stored.map((country) => country.alpha3));

                if (storedHomeland) {
                    setHomelandCountry({
                        name: storedHomeland.name,
                        alpha3: storedHomeland.alpha3,
                    });
                }

                setIsInitialized(true);
            } catch (error) {
                console.error("Failed to load selected countries:", error);
                setIsInitialized(true);
            }
        };

        loadSelectedCountries();
    }, []);

    // Sync with Pocketbase when user authentication state changes
    useEffect(() => {
        const syncWithPocketbase = async () => {
            if (isAuthenticated && isInitialized) {
                try {
                    // Get selections from Pocketbase
                    const pocketbaseCountries = await pocketbaseService.getUserCountrySelections();
                    const pocketbaseHomeland = await pocketbaseService.getHomeland();

                    // Convert to SelectedCountry format for local storage compatibility
                    const pocketbaseSelections: SelectedCountry[] = pocketbaseCountries.map((country) => ({
                        id: country.alpha3,
                        name: country.name,
                        alpha3: country.alpha3,
                        selectedAt: new Date(),
                    }));

                    // Get current local selections
                    const localSelections = await countryStorage.getSelectedCountries();
                    const localHomeland = await userSettingsStorage.getHomeland();

                    // Create a map of all unique countries (prefer Pocketbase data for conflicts)
                    const countryMap = new Map<string, SelectedCountry>();

                    // Add local selections first
                    for (const country of localSelections) {
                        countryMap.set(country.alpha3, country);
                    }

                    // Add/override with Pocketbase selections
                    for (const country of pocketbaseSelections) {
                        countryMap.set(country.alpha3, country);
                    }

                    const mergedSelections = Array.from(countryMap.values());

                    // Handle homeland sync
                    const syncedHomeland = pocketbaseHomeland || localHomeland;
                    if (syncedHomeland) {
                        if (
                            pocketbaseHomeland &&
                            (!localHomeland || localHomeland.alpha3 !== pocketbaseHomeland.alpha3)
                        ) {
                            // PocketBase has different homeland, update local
                            await userSettingsStorage.setHomeland(pocketbaseHomeland);
                        } else if (localHomeland && !pocketbaseHomeland) {
                            // Local has homeland but PocketBase doesn't, sync to PocketBase
                            await pocketbaseService.setHomeland(localHomeland);
                        }
                        setHomelandCountry(syncedHomeland);
                    }

                    // Update component state
                    const countries: Country[] = mergedSelections.map((sc) => ({
                        name: sc.name,
                        alpha3: sc.alpha3,
                    }));

                    setInitialCountries(countries);
                    setSelectedCountries(mergedSelections.map((c) => c.alpha3));

                    // Sync any local-only selections to Pocketbase
                    for (const localCountry of localSelections) {
                        const existsInPocketbase = pocketbaseSelections.some((pc) => pc.alpha3 === localCountry.alpha3);
                        if (!existsInPocketbase) {
                            try {
                                await pocketbaseService.saveCountrySelection({
                                    name: localCountry.name,
                                    alpha3: localCountry.alpha3,
                                });
                            } catch (error) {
                                console.error("Failed to sync local selection to Pocketbase:", error);
                            }
                        }
                    }

                    console.log("Successfully synced with Pocketbase");
                } catch (error) {
                    console.error("Failed to sync with Pocketbase:", error);
                }
            } else if (!isAuthenticated) {
                // User logged out, clear homeland
                setHomelandCountry(null);
                await userSettingsStorage.clearHomeland();
            }
        };

        syncWithPocketbase();
    }, [isAuthenticated, isInitialized]);

    const handleMapLoad = useCallback((map: unknown) => {
        console.log("World map loaded successfully", map);
    }, []);

    const handleMapError = useCallback((error: Error) => {
        console.error("World map error:", error);
    }, []);

    const handleCountrySelect = useCallback(
        async (country: Country) => {
            try {
                // Prevent selecting homeland as visited
                if (homelandCountry?.alpha3 === country.alpha3) {
                    console.log("Cannot select homeland as visited country");
                    return;
                }

                // Add to local storage
                await countryStorage.addCountry({
                    name: country.name,
                    alpha3: country.alpha3,
                });

                // Update component state
                setSelectedCountries((prev) => [...prev, country.alpha3]);
                setInitialCountries((prev) => [...prev, country]);

                // Also save to Pocketbase if authenticated
                if (isAuthenticated) {
                    try {
                        await pocketbaseService.saveCountrySelection(country);
                    } catch (error) {
                        console.error("Failed to save country to Pocketbase:", error);
                    }
                }

                console.log("Country selected:", country.name);
            } catch (error) {
                console.error("Failed to select country:", error);
            }
        },
        [isAuthenticated, homelandCountry],
    );

    const handleCountryDeselect = useCallback(
        async (countryId: string) => {
            try {
                // Remove from local storage
                await countryStorage.removeCountry(countryId);

                // Update component state
                setSelectedCountries((prev) => prev.filter((id) => id !== countryId));
                setInitialCountries((prev) => prev.filter((c) => c.alpha3 !== countryId));

                // Also remove from Pocketbase if authenticated
                if (isAuthenticated) {
                    try {
                        await pocketbaseService.removeCountrySelection(countryId);
                    } catch (error) {
                        console.error("Failed to remove country from Pocketbase:", error);
                    }
                }

                console.log("Country deselected:", countryId);
            } catch (error) {
                console.error("Failed to deselect country:", error);
            }
        },
        [isAuthenticated],
    );

    const handleClearAll = useCallback(async () => {
        try {
            // Clear local storage
            await countryStorage.clearAllCountries();

            // Update component state
            setSelectedCountries([]);
            setInitialCountries([]);

            // Also clear from Pocketbase if authenticated
            if (isAuthenticated) {
                try {
                    await pocketbaseService.clearAllCountrySelections();
                } catch (error) {
                    console.error("Failed to clear countries from Pocketbase:", error);
                }
            }

            console.log("All countries cleared");
        } catch (error) {
            console.error("Failed to clear all countries:", error);
        }
    }, [isAuthenticated]);

    const handleHomelandSelect = useCallback(
        async (country: Country) => {
            try {
                // Set as homeland
                setHomelandCountry(country);
                await userSettingsStorage.setHomeland(country);

                // Also save to Pocketbase if authenticated
                if (isAuthenticated) {
                    try {
                        await pocketbaseService.setHomeland(country);
                    } catch (error) {
                        console.error("Failed to save homeland to Pocketbase:", error);
                    }
                }

                // Check if this country is currently selected as visited
                const isCurrentlySelected = selectedCountries.includes(country.alpha3);

                if (isCurrentlySelected) {
                    // Remove from visited countries
                    await countryStorage.removeCountry(country.alpha3);
                    setSelectedCountries((prev) => prev.filter((id) => id !== country.alpha3));
                    setInitialCountries((prev) => prev.filter((c) => c.alpha3 !== country.alpha3));

                    if (isAuthenticated) {
                        try {
                            await pocketbaseService.removeCountrySelection(country.alpha3);
                        } catch (error) {
                            console.error("Failed to remove country from Pocketbase:", error);
                        }
                    }
                }

                console.log("Homeland set:", country.name);
            } catch (error) {
                console.error("Failed to set homeland:", error);
            }
        },
        [selectedCountries, isAuthenticated],
    );

    const handleHomelandClear = useCallback(async () => {
        try {
            // Clear from local storage
            await userSettingsStorage.clearHomeland();
            setHomelandCountry(null);

            // Also clear from Pocketbase if authenticated
            if (isAuthenticated) {
                try {
                    await pocketbaseService.clearHomeland();
                } catch (error) {
                    console.error("Failed to clear homeland from Pocketbase:", error);
                }
            }

            console.log("Homeland cleared");
        } catch (error) {
            console.error("Failed to clear homeland:", error);
        }
    }, [isAuthenticated]);

    // Arrays are compared by reference, so [0, 20] will create a new array each time the component renders
    // causing the useEffect in WorldMap to trigger and cause a blinking effect.
    const initialCenter = useMemo<[number, number]>(() => [10, 20], []);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-900 to-blue-700 dark:from-gray-900 dark:to-gray-800">
            {/* Logo - Bottom Left */}
            <div className="absolute bottom-4 left-4 z-20">
                <img src={PlacemarkerLogo} alt="Placemarker" className="h-12 w-auto" />
            </div>

            {/* User Menu - Top Left */}
            <UserMenu homelandCountry={homelandCountry} onHomelandButtonClick={() => setIsHomelandSelectorOpen(true)} />

            {/* Country Selector Widget - Top Right */}
            <div className="absolute top-4 right-4 z-10">
                <CountrySelector
                    initialSelectedCountries={initialCountries}
                    homelandCountry={homelandCountry}
                    onCountrySelect={handleCountrySelect}
                    onCountryDeselect={handleCountryDeselect}
                    onClearAll={handleClearAll}
                />
            </div>

            {/* Homeland Selector Modal */}
            {isHomelandSelectorOpen && (
                <HomelandSelector
                    currentHomeland={homelandCountry}
                    onHomelandSelect={handleHomelandSelect}
                    onHomelandClear={handleHomelandClear}
                    onClose={() => setIsHomelandSelectorOpen(false)}
                />
            )}

            {/* World Map */}
            <div className="absolute inset-0">
                <WorldMap
                    accessToken={MAPBOX_ACCESS_TOKEN}
                    width="100%"
                    height="100%"
                    initialZoom={3}
                    minZoom={3}
                    initialCenter={initialCenter}
                    borderColor="#ffffff"
                    borderWidth={1.5}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    selectedCountries={selectedCountries}
                    homelandCountries={homelandCountry ? [homelandCountry.alpha3] : undefined}
                    selectedCountryColor="#fbbf24"
                    homelandCountryColor="#3b82f6"
                    onMapLoad={handleMapLoad}
                    onMapError={handleMapError}
                />
            </div>
        </div>
    );
}
