import { type Country, searchCountries } from "@/lib/countries";
import { cn } from "@/lib/utils";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface CountrySelectorProps {
    initialSelectedCountries?: Country[];
    onCountrySelect?: (country: Country) => void;
    onCountryDeselect?: (countryId: string) => void;
    onClearAll?: () => void;
    className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
    initialSelectedCountries = [],
    onCountrySelect,
    onCountryDeselect,
    onClearAll,
    className = "",
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Country[]>([]);
    const [selectedCountries, setSelectedCountries] = useState<Country[]>(initialSelectedCountries);
    const [isLoading, setIsLoading] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Update selected countries when initialSelectedCountries prop changes
    useEffect(() => {
        setSelectedCountries(initialSelectedCountries);
    }, [initialSelectedCountries]);

    // Handle search input changes
    useEffect(() => {
        if (searchQuery.trim()) {
            const results = searchCountries(searchQuery, 8);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }

        setFocusedIndex(-1); // Reset focus when search results change
    }, [searchQuery]);

    // Handle keyboard navigation on search results list
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (searchResults.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setFocusedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
                break;
            case "ArrowUp":
                e.preventDefault();
                setFocusedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
                break;
            case "Enter":
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
                    handleCountrySelect(searchResults[focusedIndex]);
                }
                break;
            case "Escape":
                e.preventDefault();
                setSearchQuery("");
                setFocusedIndex(-1);
                searchInputRef.current?.blur();
                break;
        }
    };

    // Scroll focused item into view
    useEffect(() => {
        if (resultsRef.current && focusedIndex >= 0 && focusedIndex < searchResults.length) {
            const focusedElement = resultsRef.current.querySelector(`[data-index="${focusedIndex}"]`);
            if (focusedElement) {
                focusedElement.scrollIntoView({ block: "nearest", inline: "start" });
            }
        }
    }, [focusedIndex, searchResults]);

    const handleCountrySelect = async (country: Country) => {
        setIsLoading(true);
        try {
            const isSelected = isCountrySelected(country.alpha3);

            if (isSelected) {
                // Deselect the country
                setSelectedCountries((prev) => prev.filter((c) => c.alpha3 !== country.alpha3));
                onCountryDeselect?.(country.alpha3);
            } else {
                // Select the country
                setSelectedCountries((prev) => [...prev, country]);
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
            setSelectedCountries([]);
            onClearAll?.();
        } catch (error) {
            console.error("Failed to clear all countries:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const isCountrySelected = (countryAlpha3: string) => {
        return selectedCountries.some((c) => c.alpha3 === countryAlpha3);
    };
    return (
        <div className={`w-80 ${className}`}>
            {/* Country Selector Panel */}
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-h-10/12 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800">Countries</h2>
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
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                        Use <kbd>↑↓</kbd> to navigate, <kbd>Enter</kbd> to select, <kbd>Esc</kbd> to clear.
                    </p>
                </div>

                {/* Selected Countries */}
                {selectedCountries.length > 0 && (
                    <div className="px-4 py-3 border-b border-gray-200 bg-yellow-50">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected Countries</h3>
                        <div className="flex flex-wrap gap-1 max-h-96 overflow-auto">
                            {selectedCountries.map((country) => (
                                <span
                                    key={country.alpha3}
                                    className="inline-flex items-center px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full"
                                >
                                    {country.name}
                                    <button
                                        type="button"
                                        onClick={() => handleCountrySelect(country)}
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
                <div className="max-h-64 overflow-y-auto" ref={resultsRef}>
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
                            {searchResults.map((country, index) => {
                                const selected = isCountrySelected(country.alpha3);
                                const isFocused = index === focusedIndex;
                                return (
                                    <button
                                        type="button"
                                        key={country.alpha3}
                                        onClick={() => handleCountrySelect(country)}
                                        className={cn(
                                            "w-full px-4 py-2 text-left transition-colors duration-150 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed",
                                            {
                                                "bg-yellow-50 border-l-4 border-yellow-400": selected,
                                                "bg-blue-50 border-l-4 border-blue-400": isFocused,
                                                "hover:bg-gray-50": !selected && !isFocused,
                                            },
                                        )}
                                        disabled={isLoading}
                                        onMouseEnter={() => setFocusedIndex(index)}
                                        data-index={index}
                                    >
                                        <div>
                                            <div className="font-medium text-gray-900">{country.name}</div>
                                            <div className="text-xs text-gray-500">{country.alpha3}</div>
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
                                        {!selected && isFocused && (
                                            <div className="text-blue-600">
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <title>Focused</title>
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5l7 7-7 7"
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
