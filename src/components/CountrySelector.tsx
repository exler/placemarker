import type React from "react";
import { useEffect, useRef, useState } from "react";
import { type Country, searchCountries } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface CountrySelectorProps {
    initialSelectedCountries?: Country[];
    homelandCountry?: Country | null;
    onCountrySelect?: (country: Country) => void;
    onCountryDeselect?: (countryId: string) => void;
    onClearAll?: () => void;
    className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
    initialSelectedCountries = [],
    homelandCountry,
    onCountrySelect,
    onCountryDeselect,
    onClearAll,
    className = "",
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Country[]>([]);
    const [selectedCountries, setSelectedCountries] = useState<Country[]>(initialSelectedCountries);
    const [isLoading, setIsLoading] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
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

    const isHomeland = (countryAlpha3: string) => {
        return homelandCountry?.alpha3 === countryAlpha3;
    };

    // AIDEV-NOTE: Toggle function for collapse/expand functionality
    const toggleCollapsed = () => {
        setIsCollapsed((prev) => !prev);
        // Clear search when collapsing to reset state
        if (!isCollapsed) {
            setSearchQuery("");
            setFocusedIndex(-1);
        }
    };
    return (
        <div className={`${className}`}>
            {isCollapsed ? (
                // AIDEV-NOTE: Collapsed state - show small circle button with country count
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    className="w-12 h-12 bg-white rounded-full shadow-xl border border-gray-200 flex items-center justify-center hover:shadow-2xl transition-all duration-200 hover:scale-105"
                    title={`Show Countries (${selectedCountries.length} selected)`}
                >
                    <div className="text-center">
                        <svg
                            className="w-5 h-5 text-gray-600 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <title>Countries</title>
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                        </svg>
                    </div>
                </button>
            ) : (
                // AIDEV-NOTE: Expanded state - show full country selector panel
                <div className="w-80">
                    <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-h-10/12 overflow-hidden">
                        {/* Header with collapse button */}
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-800">Countries</h2>
                                <button
                                    type="button"
                                    onClick={toggleCollapsed}
                                    className="w-6 h-6 text-gray-500 hover:text-gray-700 transition-colors duration-150"
                                    title="Collapse"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                                        <title>Collapse</title>
                                        <path
                                            fill="currentColor"
                                            d="M6.823 7.823a.25.25 0 0 1 0 .354l-2.396 2.396A.25.25 0 0 1 4 10.396V5.604a.25.25 0 0 1 .427-.177Z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0M1.5 1.75v12.5c0 .138.112.25.25.25H9.5v-13H1.75a.25.25 0 0 0-.25.25M11 14.5h3.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25H11Z"
                                        />
                                    </svg>
                                </button>
                            </div>
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
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    Start typing to search countries...
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No countries found for "{searchQuery}"
                                </div>
                            ) : (
                                <div className="py-2">
                                    {searchResults.map((country, index) => {
                                        const selected = isCountrySelected(country.alpha3);
                                        const homeland = isHomeland(country.alpha3);
                                        const isFocused = index === focusedIndex;
                                        const isDisabled = homeland;

                                        return (
                                            <button
                                                type="button"
                                                key={country.alpha3}
                                                onClick={() => !isDisabled && handleCountrySelect(country)}
                                                className={cn(
                                                    "w-full px-4 py-2 text-left transition-colors duration-150 flex items-center justify-between",
                                                    {
                                                        "bg-yellow-50 border-l-4 border-yellow-400":
                                                            selected && !homeland,
                                                        "bg-blue-50 border-l-4 border-blue-400": homeland,
                                                        "bg-gray-50 border-l-4 border-gray-400":
                                                            isFocused && !selected && !homeland,
                                                        "hover:bg-gray-50": !selected && !isFocused && !homeland,
                                                        "opacity-75 cursor-not-allowed": isDisabled,
                                                        "disabled:opacity-50 disabled:cursor-not-allowed": isLoading,
                                                    },
                                                )}
                                                disabled={isLoading || isDisabled}
                                                onMouseEnter={() => setFocusedIndex(index)}
                                                data-index={index}
                                                title={homeland ? `${country.name} is your homeland` : undefined}
                                            >
                                                <div>
                                                    <div className="font-medium text-gray-900">{country.name}</div>
                                                    <div className="text-xs text-gray-500">{country.alpha3}</div>
                                                </div>
                                                {homeland && (
                                                    <div className="text-blue-600">
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <title>Homeland</title>
                                                            <path
                                                                fill="currentColor"
                                                                d="M4 20v-9.375L2.2 12l-1.175-1.575L12 2l11 8.4l-1.2 1.6L12 4.5L6 9.1V18h3v2zm10.925 2L10.7 17.75l1.4-1.425l2.825 2.825L20.6 13.5l1.4 1.425z"
                                                            />
                                                        </svg>
                                                    </div>
                                                )}
                                                {selected && !homeland && (
                                                    <div className="text-yellow-600">
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <title>Selected</title>
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </div>
                                                )}
                                                {!selected && !homeland && isFocused && (
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
            )}
        </div>
    );
};

export default CountrySelector;
