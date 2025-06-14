import PlacemarkerLogo from "@/assets/placemarker_logo.png";
import AuthButton from "@/components/AuthButton";
import CountrySelector from "@/components/CountrySelector";
import WorldMap from "@/components/WorldMap";
import { useAuth } from "@/lib/auth";
import type { Country } from "@/lib/countries";
import { type SelectedCountry, countryStorage } from "@/lib/countryStorage";
import { pocketbaseService } from "@/lib/pocketbase";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [initialCountries, setInitialCountries] = useState<Country[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    const { isAuthenticated } = useAuth();

    // Initialize and load selected countries from IndexedDB/Pocketbase
    useEffect(() => {
        const loadSelectedCountries = async () => {
            try {
                await countryStorage.init();
                const stored = await countryStorage.getSelectedCountries();

                // Convert SelectedCountry[] to Country[] for the component
                const countries: Country[] = stored.map((sc) => ({
                    name: sc.name,
                    alpha3: sc.alpha3,
                }));

                setInitialCountries(countries);
                setSelectedCountries(stored.map((country) => country.alpha3));
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

                    // Convert to SelectedCountry format for local storage compatibility
                    const pocketbaseSelections: SelectedCountry[] = pocketbaseCountries.map((country) => ({
                        id: country.alpha3,
                        name: country.name,
                        alpha3: country.alpha3,
                        selectedAt: new Date(),
                    }));

                    // Get current local selections
                    const localSelections = await countryStorage.getSelectedCountries();

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
                                console.error(`Failed to sync ${localCountry.name} to Pocketbase:`, error);
                            }
                        }
                    }

                    console.log("Successfully synced with Pocketbase");
                } catch (error) {
                    console.error("Failed to sync with Pocketbase:", error);
                }
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
        [isAuthenticated],
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

    // Arrays are compared by reference, so [0, 20] will create a new array each time the component renders
    // causing the useEffect in WorldMap to trigger and cause a blinking effect.
    const initialCenter = useMemo<[number, number]>(() => [0, 20], []);
    return (
        <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-900 to-blue-700 dark:from-gray-900 dark:to-gray-800">
            {/* Logo - Bottom Left */}
            <div className="absolute bottom-4 left-4 z-20">
                <img src={PlacemarkerLogo} alt="Placemarker" className="h-12 w-auto" />
            </div>

            {/* Authentication Button - Top Left */}
            <AuthButton />

            {/* Country Selector Widget - Top Right */}
            <div className="absolute top-4 right-4 z-10">
                <CountrySelector
                    initialSelectedCountries={initialCountries}
                    onCountrySelect={handleCountrySelect}
                    onCountryDeselect={handleCountryDeselect}
                    onClearAll={handleClearAll}
                />
            </div>

            {/* World Map */}
            <div className="absolute inset-0">
                <WorldMap
                    accessToken={MAPBOX_ACCESS_TOKEN}
                    width="100%"
                    height="100%"
                    initialZoom={2}
                    initialCenter={initialCenter}
                    borderColor="#ffffff"
                    borderWidth={1.5}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    selectedCountries={selectedCountries}
                    selectedCountryColor="#fbbf24"
                    onMapLoad={handleMapLoad}
                    onMapError={handleMapError}
                />
            </div>
        </div>
    );
}
