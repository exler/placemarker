import { type Country, searchCountries } from "@/lib/countries";
import { type SelectedCountry, countryStorage } from "@/lib/countryStorage";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface CountrySelectorProps {
    onCountrySelect?: (country: Country) => void;
    onCountryDeselect?: (countryId: string) => void;
    className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
    onCountrySelect,
    onCountryDeselect,
    className = "",
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Country[]>([]);
    const [selectedCountries, setSelectedCountries] = useState<SelectedCountry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Initialize IndexedDB and load selected countries
    useEffect(() => {
        const initializeStorage = async () => {
            try {
                await countryStorage.init();
                const selected = await countryStorage.getSelectedCountries();
                setSelectedCountries(selected);
            } catch (error) {
                console.error("Failed to initialize country storage:", error);
            }
        };

        initializeStorage();
    }, []);
    // Handle search input changes
    useEffect(() => {
        if (searchQuery.trim()) {
            const results = searchCountries(searchQuery, 8);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleCountrySelect = async (country: Country) => {
        setIsLoading(true);
        try {
            // Check if country is already selected
            const isSelected = await countryStorage.isCountrySelected(country.iso2);

            if (isSelected) {
                // Deselect the country
                await countryStorage.removeCountry(country.iso2);
                setSelectedCountries((prev) => prev.filter((c) => c.iso2 !== country.iso2));
                onCountryDeselect?.(country.iso2);
            } else {
                // Select the country
                await countryStorage.addCountry({
                    name: country.name,
                    iso2: country.iso2,
                    iso3: country.iso3,
                });

                const newSelected: SelectedCountry = {
                    id: country.iso2,
                    name: country.name,
                    iso2: country.iso2,
                    iso3: country.iso3,
                    selectedAt: new Date(),
                };

                setSelectedCountries((prev) => [...prev, newSelected]);
                onCountrySelect?.(country);
            }
        } catch (error) {
            console.error("Failed to toggle country selection:", error);
        } finally {
            setIsLoading(false);
            setSearchQuery("");
        }
    };

    const handleClearAll = async () => {
        setIsLoading(true);
        try {
            await countryStorage.clearAllCountries();

            // Notify about deselection for each country
            for (const country of selectedCountries) {
                onCountryDeselect?.(country.iso2);
            }

            setSelectedCountries([]);
        } catch (error) {
            console.error("Failed to clear all countries:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const isCountrySelected = (countryIso2: string) => {
        return selectedCountries.some((c) => c.iso2 === countryIso2);
    };
    return (
        <div className={`w-80 ${className}`}>
            {/* Country Selector Panel */}
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800">Country Selector</h2>
                    {selectedCountries.length > 0 && (
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600">{selectedCountries.length} selected</span>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                                disabled={isLoading}
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>

                {/* Search Input */}
                <div className="p-4 border-b border-gray-200">
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search countries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                    />
                </div>

                {/* Selected Countries */}
                {selectedCountries.length > 0 && (
                    <div className="px-4 py-3 border-b border-gray-200 bg-yellow-50">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected Countries</h3>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {selectedCountries.map((country) => (
                                <span
                                    key={country.iso2}
                                    className="inline-flex items-center px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full"
                                >
                                    {country.name}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Convert SelectedCountry to Country format for the handler
                                            const countryForHandler: Country = {
                                                name: country.name,
                                                iso2: country.iso2,
                                                iso3: country.iso3,
                                            };
                                            handleCountrySelect(countryForHandler);
                                        }}
                                        className="ml-1 hover:text-yellow-900"
                                        title={`Remove ${country.name}`}
                                        disabled={isLoading}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Results */}
                <div className="max-h-64 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                            <p className="mt-2 text-sm text-gray-500">Loading...</p>
                        </div>
                    ) : searchQuery.trim() === "" ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Start typing to search countries...</div>
                    ) : searchResults.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No countries found for "{searchQuery}"
                        </div>
                    ) : (
                        <div className="py-2">
                            {searchResults.map((country) => {
                                const selected = isCountrySelected(country.iso2);
                                return (
                                    <button
                                        type="button"
                                        key={country.iso2}
                                        onClick={() => handleCountrySelect(country)}
                                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                                            selected ? "bg-yellow-50 border-l-4 border-yellow-400" : ""
                                        }`}
                                        disabled={isLoading}
                                    >
                                        <div>
                                            <div className="font-medium text-gray-900">{country.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {country.iso2} • {country.iso3}
                                            </div>
                                        </div>
                                        {selected && (
                                            <div className="text-yellow-600">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <title>Selected</title>
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CountrySelector;
