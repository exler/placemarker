import mapboxgl from "mapbox-gl";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

// Types for the component props
interface WorldMapProps {
    /**
     * Mapbox access token for authentication.
     */
    accessToken: string;
    /**
     * Width of the map container.
     */
    width?: string | number;
    /**
     * Height of the map container.
     */
    height?: string | number;
    /**
     * Initial zoom level (0-24).
     */
    initialZoom?: number;
    /**
     * Initial center coordinates [longitude, latitude].
     */
    initialCenter?: [number, number];
    /**
     * Color for country borders.
     */
    borderColor?: string;
    /**
     * Width of country borders.
     */
    borderWidth?: number;
    /**
     * Map style URL.
     */
    mapStyle?: string;
    /**
     * Array of selected country ISO2 codes to highlight in yellow.
     */
    selectedCountries?: string[];
    /**
     * Color for selected countries fill.
     */
    selectedCountryColor?: string;
    /**
     * Callback when map is loaded.
     */
    onMapLoad?: (map: mapboxgl.Map) => void;
    /**
     * Callback when map encounters an error.
     */
    onMapError?: (error: Error) => void;
}

const defaultProps: Required<
    Pick<
        WorldMapProps,
        | "width"
        | "height"
        | "initialZoom"
        | "initialCenter"
        | "borderColor"
        | "borderWidth"
        | "mapStyle"
        | "selectedCountryColor"
    >
> = {
    width: "100%",
    height: "500px",
    initialZoom: 2,
    initialCenter: [0, 20],
    borderColor: "#ffffff",
    borderWidth: 2,
    mapStyle: "mapbox://styles/mapbox/satellite-dark-v11",
    selectedCountryColor: "#fbbf24", // Tailwind yellow-400
};

/**
 * WorldMap component that displays a Mercator projection world map with country borders
 * using Mapbox GL JS.
 */
export const WorldMap: React.FC<WorldMapProps> = ({
    accessToken,
    width = defaultProps.width,
    height = defaultProps.height,
    initialZoom = defaultProps.initialZoom,
    initialCenter = defaultProps.initialCenter,
    borderColor = defaultProps.borderColor,
    borderWidth = defaultProps.borderWidth,
    mapStyle = defaultProps.mapStyle,
    selectedCountries = [],
    selectedCountryColor = defaultProps.selectedCountryColor,
    onMapLoad,
    onMapError,
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Validate required props
        if (!accessToken) {
            const errorMsg = "Mapbox access token is required";
            setError(errorMsg);
            onMapError?.(new Error(errorMsg));
            return;
        }

        if (!mapContainer.current) {
            const errorMsg = "Map container ref is not available";
            setError(errorMsg);
            onMapError?.(new Error(errorMsg));
            return;
        }

        // Set the access token
        mapboxgl.accessToken = accessToken;

        try {
            // Initialize the map
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: mapStyle,
                center: initialCenter,
                zoom: initialZoom,
                projection: "mercator" as const,
                attributionControl: true,
                logoPosition: "bottom-right",
            });

            // Handle map load event
            map.current.on("load", () => {
                if (!map.current) return;
                try {
                    // Remove all text layers to hide country names, city names, and labels
                    const style = map.current.getStyle();
                    if (style?.layers) {
                        const textLayers = style.layers.filter(
                            (layer) => layer.type === "symbol" && 
                            layer.layout && 
                            ("text-field" in layer.layout || "icon-image" in layer.layout)
                        );
                        
                        textLayers.forEach((layer) => {
                            if (map.current?.getLayer(layer.id)) {
                                map.current.removeLayer(layer.id);
                            }
                        });
                    }

                    // Add country boundaries source
                    map.current.addSource("country-boundaries", {
                        type: "vector",
                        url: "mapbox://mapbox.country-boundaries-v1",
                    });

                    // Add country borders layer
                    map.current.addLayer({
                        id: "country-borders",
                        type: "line",
                        source: "country-boundaries",
                        "source-layer": "country_boundaries",
                        layout: {
                            "line-join": "round",
                            "line-cap": "round",
                        },
                        paint: {
                            "line-color": borderColor,
                            "line-width": borderWidth,
                            "line-opacity": 0.8,
                        },
                    });

                    // Add subtle country fill for better visibility
                    map.current.addLayer(
                        {
                            id: "country-fills",
                            type: "fill",
                            source: "country-boundaries",
                            "source-layer": "country_boundaries",
                            paint: {
                                "fill-color": "transparent",
                                "fill-opacity": 0.1,
                                "fill-outline-color": borderColor,
                            },
                        },
                        "country-borders",
                    );

                    // Add selected countries highlight layer
                    map.current.addLayer(
                        {
                            id: "selected-countries",
                            type: "fill",
                            source: "country-boundaries",
                            "source-layer": "country_boundaries",
                            paint: {
                                "fill-color": selectedCountryColor,
                                "fill-opacity": [
                                    "case",
                                    ["in", ["get", "iso_3166_1"], ["literal", selectedCountries]],
                                    0.7,
                                    0,
                                ],
                            },
                        },
                        "country-borders",
                    );

                    setIsLoading(false);
                    setError(null);
                    onMapLoad?.(map.current);
                } catch (err) {
                    const error = err instanceof Error ? err : new Error("Failed to add map layers");
                    setError(error.message);
                    onMapError?.(error);
                    setIsLoading(false);
                }
            });

            // Handle map errors
            map.current.on("error", (e) => {
                const error = new Error(`Map error: ${e.error?.message || "Unknown error"}`);
                setError(error.message);
                onMapError?.(error);
                setIsLoading(false);
            });

            // Handle style load errors
            map.current.on("styleimagemissing", (e) => {
                console.warn("Missing style image:", e.id);
            });
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Failed to initialize map");
            setError(error.message);
            onMapError?.(error);
            setIsLoading(false);
        }

        // Cleanup function
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [
        accessToken,
        mapStyle,
        initialCenter,
        initialZoom,
        borderColor,
        borderWidth,
        selectedCountries,
        selectedCountryColor,
        onMapLoad,
        onMapError,
    ]);

    // Update selected countries when they change
    useEffect(() => {
        if (map.current?.isStyleLoaded() && map.current.getLayer("selected-countries")) {
            try {
                map.current.setPaintProperty("selected-countries", "fill-opacity", [
                    "case",
                    ["in", ["get", "iso_3166_1"], ["literal", selectedCountries]],
                    0.7,
                    0,
                ]);
            } catch (error) {
                console.warn("Failed to update selected countries:", error);
            }
        }
    }, [selectedCountries]);

    // Handle container size changes
    useEffect(() => {
        if (map.current) {
            // Trigger a resize when dimensions change
            setTimeout(() => {
                map.current?.resize();
            }, 100);
        }
    }, []);

    // Compute container size
    const containerStyle: React.CSSProperties = {
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
    };

    return (
        <div style={containerStyle} className="worldmap-container relative">
            {/* Map container */}
            <div ref={mapContainer} className="worldmap-canvas w-full h-full rounded-lg overflow-hidden" />

            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 rounded-lg">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        <p className="text-sm text-gray-600">Loading world map...</p>
                    </div>
                </div>
            )}

            {/* Error indicator */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90 rounded-lg">
                    <div className="text-center p-4">
                        <div className="text-red-600 text-lg font-semibold mb-2">Map Error</div>
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Export types for external use
export type { WorldMapProps };

// Default export
export default WorldMap;
