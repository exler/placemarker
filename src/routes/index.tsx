import AuthButton from "@/components/AuthButton";
import CountrySelector from "@/components/CountrySelector";
import WorldMap from "@/components/WorldMap";
import type { Country } from "@/lib/countries";
import { countryStorage } from "@/lib/countryStorage";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

    // Initialize and load selected countries from IndexedDB
    useEffect(() => {
        const loadSelectedCountries = async () => {
            try {
                await countryStorage.init();
                const stored = await countryStorage.getSelectedCountries();
                setSelectedCountries(stored.map((country) => country.iso2));
            } catch (error) {
                console.error("Failed to load selected countries:", error);
            }
        };

        loadSelectedCountries();
    }, []);

    const handleMapLoad = useCallback((map: any) => {
        console.log("World map loaded successfully", map);
    }, []);

    const handleMapError = useCallback((error: Error) => {
        console.error("World map error:", error);
    }, []);

    const handleCountrySelect = useCallback((country: Country) => {
        setSelectedCountries((prev) => [...prev, country.iso2]);
        console.log("Country selected:", country.name);
    }, []);

    const handleCountryDeselect = useCallback((countryId: string) => {
        setSelectedCountries((prev) => prev.filter((id) => id !== countryId));
        console.log("Country deselected:", countryId);
    }, []);

    // Arrays are compared by reference, so [0, 20] will create a new array each time the component renders
    // causing the useEffect in WorldMap to trigger and cause a blinking effect.
    const initialCenter = useMemo<[number, number]>(() => [0, 20], []);
    return (
        <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-900 to-blue-700 dark:from-gray-900 dark:to-gray-800">
            {/* Authentication Button - Top Left */}
            <AuthButton />

            {/* Country Selector Widget - Top Right */}
            <div className="absolute top-4 right-4 z-10">
                <CountrySelector onCountrySelect={handleCountrySelect} onCountryDeselect={handleCountryDeselect} />
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
                    mapStyle="mapbox://styles/mapbox/satellite-v9"
                    selectedCountries={selectedCountries}
                    selectedCountryColor="#fbbf24"
                    onMapLoad={handleMapLoad}
                    onMapError={handleMapError}
                />
            </div>
        </div>
    );
}
