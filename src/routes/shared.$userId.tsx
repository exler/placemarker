import PlacemarkerLogo from "@/assets/placemarker_logo.png";
import WorldMap from "@/components/WorldMap";
import type { Country } from "@/lib/countries";
import { alpha3ToCountry } from "@/lib/countries";
import { pocketbaseService } from "@/lib/pocketbase";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/shared/$userId")({
    component: SharedProfile,
});

function SharedProfile() {
    const { userId } = Route.useParams();
    const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [homelandCountry, setHomelandCountry] = useState<Country | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNotFound, setIsNotFound] = useState(false);
    const [profileOwnerName, setProfileOwnerName] = useState<string>("");

    useEffect(() => {
        // AIDEV-NOTE: Reset all state and start loading immediately to prevent flash of "not found"
        // This ensures the loading screen is shown from the start rather than showing "not found" briefly
        setIsLoading(true);
        setIsNotFound(false);
        setSelectedCountries([]);
        setHomelandCountry(null);
        setProfileOwnerName("");

        loadSharedProfile();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const loadSharedProfile = async () => {
        try {
            const sharedData = await pocketbaseService.getSharedProfile(userId);

            if (!sharedData) {
                setIsNotFound(true);
                return;
            }

            // Set country selections
            const countryAlpha3Codes = sharedData.countries.map((country) => country.alpha3);
            setSelectedCountries(countryAlpha3Codes);

            // Set homeland if available
            if (sharedData.profile.homeland_alpha3) {
                const homeland = alpha3ToCountry(sharedData.profile.homeland_alpha3);
                setHomelandCountry(homeland);
            }

            // Set profile owner name from the user's display_name or fall back to a default
            // AIDEV-NOTE: display_name is populated from user.name field via PocketBase expand
            setProfileOwnerName(sharedData.profile.display_name || "Traveler");
            setIsNotFound(false);
        } catch (error) {
            console.error("Failed to load shared profile:", error);
            setIsNotFound(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading shared map...</p>
                </div>
            </div>
        );
    }

    if (isNotFound) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <svg
                        className="w-16 h-16 text-gray-400 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <title>Not found</title>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Map Not Found</h1>
                    <p className="text-gray-600 mb-6">
                        This map is either private or doesn't exist. The owner may have stopped sharing it.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        ← Go to Placemarker
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-gray-100">
            <div className="absolute bottom-4 left-4 z-20">
                <img src={PlacemarkerLogo} alt="Placemarker" className="h-12 w-auto" />
            </div>
            {/* Header with logo and read-only indicator */}
            <div className="absolute top-4 left-4 z-40 flex items-center space-x-4">
                <div className="bg-white rounded-full px-4 py-2 shadow-lg">
                    <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <title>Shared</title>
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                            />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{profileOwnerName}'s map</span>
                    </div>
                </div>
            </div>

            {/* Country stats overlay */}
            <div className="absolute top-4 right-4 z-40 bg-white rounded-lg shadow-lg p-4 max-w-sm">
                <div className="flex items-center space-x-3 mb-3">
                    {homelandCountry && (
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <title>Homeland</title>
                                <path d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z" />
                            </svg>
                            <span className="text-xs text-gray-600">From {homelandCountry.name}</span>
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                        {selectedCountries.length} countries visited
                    </p>
                    {selectedCountries.length > 0 && (
                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                            {selectedCountries.map((countryAlpha3) => {
                                const country = alpha3ToCountry(countryAlpha3);
                                return country ? (
                                    <span
                                        key={countryAlpha3}
                                        className="inline-flex items-center px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full"
                                    >
                                        {country.name}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* World Map */}
            <WorldMap
                accessToken={MAPBOX_ACCESS_TOKEN}
                width="100%"
                height="100%"
                initialZoom={3}
                minZoom={3}
                borderColor="#ffffff"
                borderWidth={1.5}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                selectedCountries={selectedCountries}
                homelandCountries={homelandCountry ? [homelandCountry.alpha3] : undefined}
                selectedCountryColor="#fbbf24"
                homelandCountryColor="#3b82f6"
            />
        </div>
    );
}
