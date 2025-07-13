import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import PlacemarkerLogo from "@/assets/placemarker_logo.png";
import CountrySelector from "@/components/CountrySelector";
import HelpModal from "@/components/HelpModal";
import HomelandSelector from "@/components/HomelandSelector";
import UserMenu from "@/components/UserMenu";
import WorldMap from "@/components/WorldMap";
import { useAuth } from "@/lib/auth";
import type { Country } from "@/lib/countries";
import { countryStorage, type SelectedCountry } from "@/lib/countryStorage";
import { pocketbaseService } from "@/lib/pocketbase";
import { userSettingsStorage } from "@/lib/userSettingsStorage";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [initialCountries, setInitialCountries] = useState<Country[]>([]);
    const [homelandCountry, setHomelandCountry] = useState<Country | null>(null);
    const [isHomelandSelectorOpen, setIsHomelandSelectorOpen] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false); // AIDEV-NOTE: Help modal state for first-time users
    const [showCountryNames, setShowCountryNames] = useState(false); // AIDEV-NOTE: Show country names on map toggle
    const [isInitialized, setIsInitialized] = useState(false);

    const { isAuthenticated } = useAuth();

    // Initialize and load selected countries from IndexedDB/Pocketbase
    useEffect(() => {
        const loadSelectedCountries = async () => {
            try {
                await countryStorage.init();
                await userSettingsStorage.init();

                const stored = await countryStorage.getSelectedCountries();

                // Convert SelectedCountry[] to Country[] for the component
                const countries: Country[] = stored.map((sc) => ({
                    name: sc.name,
                    alpha3: sc.alpha3,
                }));

                setInitialCountries(countries);
                setSelectedCountries(stored.map((country) => country.alpha3));

                // AIDEV-NOTE: Load country names setting from user settings
                const shouldShowNames = await userSettingsStorage.shouldShowCountryNames();
                setShowCountryNames(shouldShowNames);

                setIsInitialized(true);
            } catch (error) {
                console.error("Failed to load selected countries:", error);
                setIsInitialized(true);
            }
        };

        loadSelectedCountries();
    }, []);

    // AIDEV-NOTE: Check if user is seeing the app for the first time and show help modal
    useEffect(() => {
        const checkFirstTimeUser = async () => {
            if (isInitialized) {
                try {
                    const hasSeenWelcome = await userSettingsStorage.hasSeenWelcomeModal();
                    if (!hasSeenWelcome) {
                        setIsHelpModalOpen(true);
                    }
                } catch (error) {
                    console.error("Failed to check welcome modal status:", error);
                }
            }
        };

        checkFirstTimeUser();
    }, [isInitialized]);

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

                    // Handle homeland state
                    setHomelandCountry(pocketbaseHomeland);

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
            // Clear state
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

    // AIDEV-NOTE: Handle help modal close and mark as seen for first-time users
    const handleHelpModalClose = useCallback(async () => {
        try {
            setIsHelpModalOpen(false);
            await userSettingsStorage.markWelcomeModalAsSeen();
        } catch (error) {
            console.error("Failed to mark welcome modal as seen:", error);
        }
    }, []);

    const handleHelpModalOpen = useCallback(() => {
        setIsHelpModalOpen(true);
    }, []);

    // AIDEV-NOTE: Handler for toggling country names on the map
    const handleToggleCountryNames = useCallback(async (show: boolean) => {
        try {
            await userSettingsStorage.setShowCountryNames(show);
            setShowCountryNames(show);
        } catch (error) {
            console.error("Failed to save country names setting:", error);
        }
    }, []);

    // Arrays are compared by reference, so [0, 20] will create a new array each time the component renders
    // causing the useEffect in WorldMap to trigger and cause a blinking effect.
    const initialCenter = useMemo<[number, number]>(() => [10, 20], []);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-900 to-blue-700 dark:from-gray-900 dark:to-gray-800">
            {/* Logo and Help Button - Bottom Left */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
                <img src={PlacemarkerLogo} alt="Placemarker" className="h-12 w-auto" />
                <button
                    type="button"
                    onClick={handleHelpModalOpen}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:text-gray-200 transition-all duration-200"
                    aria-label="Show help"
                    title="Help"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </button>
            </div>

            {/* User Menu - Top Left */}
            <UserMenu
                homelandCountry={homelandCountry}
                onHomelandButtonClick={() => setIsHomelandSelectorOpen(true)}
                showCountryNames={showCountryNames}
                onToggleCountryNames={handleToggleCountryNames}
            />

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

            {/* Help Modal - AIDEV-NOTE: For first-time users */}
            {isHelpModalOpen && <HelpModal onClose={handleHelpModalClose} />}

            {/* World Map */}
            <div className="absolute inset-0">
                <WorldMap
                    accessToken={MAPBOX_ACCESS_TOKEN}
                    width="100%"
                    height="100%"
                    initialZoom={3}
                    minZoom={2}
                    initialCenter={initialCenter}
                    borderColor="#ffffff"
                    borderWidth={1.5}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    selectedCountries={selectedCountries}
                    homelandCountries={homelandCountry ? [homelandCountry.alpha3] : undefined}
                    showCountryNames={showCountryNames}
                    selectedCountryColor="#fbbf24"
                    homelandCountryColor="#3b82f6"
                    onMapLoad={handleMapLoad}
                    onMapError={handleMapError}
                />
            </div>
        </div>
    );
}

export default Index;
