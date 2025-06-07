import CountrySelector from "@/components/CountrySelector";
import WorldMap from "@/components/WorldMap";
import type { Country } from "@/lib/countries";
import { countryStorage } from "@/lib/countryStorage";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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

    const handleMapLoad = (map: mapboxgl.Map) => {
        console.log("World map loaded successfully", map);
    };

    const handleMapError = (error: Error) => {
        console.error("World map error:", error);
    };

    const handleCountrySelect = (country: Country) => {
        setSelectedCountries((prev) => [...prev, country.iso2]);
        console.log("Country selected:", country.name);
    };

    const handleCountryDeselect = (countryId: string) => {
        setSelectedCountries((prev) => prev.filter((id) => id !== countryId));
        console.log("Country deselected:", countryId);
    };
    return (
        <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-900 to-blue-700 dark:from-gray-900 dark:to-gray-800">
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
                    initialCenter={[0, 20]}
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
