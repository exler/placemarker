import { type Country, searchCountries } from "@/lib/countries";
import { cn } from "@/lib/utils";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface HomelandSelectorProps {
    currentHomeland?: Country | null;
    onHomelandSelect?: (country: Country) => void;
    onHomelandClear?: () => void;
    onClose?: () => void;
    className?: string;
}

export const HomelandSelector: React.FC<HomelandSelectorProps> = ({
    currentHomeland,
    onHomelandSelect,
    onHomelandClear,
    onClose,
    className = "",
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Country[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Focus search input when component mounts
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

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
        if (searchResults.length === 0) {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose?.();
            }
            return;
        }

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
                    handleHomelandSelect(searchResults[focusedIndex]);
                }
                break;
            case "Escape":
                e.preventDefault();
                if (searchQuery) {
                    setSearchQuery("");
                    setFocusedIndex(-1);
                } else {
                    onClose?.();
                }
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
    const handleHomelandSelect = async (country: Country) => {
        setIsLoading(true);
        try {
            onHomelandSelect?.(country);
            onClose?.();
        } catch (error) {
            console.error("Failed to select homeland:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleHomelandClear = async () => {
        setIsLoading(true);
        try {
            onHomelandClear?.();
            onClose?.();
        } catch (error) {
            console.error("Failed to clear homeland:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-96 max-h-96 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 bg-blue-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Select Your Homeland</h2>
                        <p className="text-sm text-gray-600">Choose the country you call home</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <title>Close dialog</title>
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                {/* Current Homeland */}
                {currentHomeland && (
                    <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-1">Current Homeland</h3>
                                <div className="flex items-center text-sm text-blue-700">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <title>Home icon</title>
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z" />
                                    </svg>
                                    {currentHomeland.name}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleHomelandClear}
                                disabled={isLoading}
                                className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-md border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Clear homeland"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
                {/* Search Input */}
                <div className="p-4 border-b border-gray-200">
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search for your homeland..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                        Use <kbd>↑↓</kbd> to navigate, <kbd>Enter</kbd> to select, <kbd>Esc</kbd> to close.
                    </p>
                </div>
                {/* Search Results */}
                <div className="max-h-64 overflow-y-auto" ref={resultsRef}>
                    {isLoading ? (
                        <div className="p-4 text-center">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                            <p className="mt-2 text-sm text-gray-500">Setting homeland...</p>
                        </div>
                    ) : searchQuery.trim() === "" ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            Start typing to search for your homeland country...
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No countries found for "{searchQuery}"
                        </div>
                    ) : (
                        <div className="py-2">
                            {searchResults.map((country, index) => {
                                const isCurrentHomeland = currentHomeland?.alpha3 === country.alpha3;
                                const isFocused = index === focusedIndex;
                                return (
                                    <button
                                        type="button"
                                        key={country.alpha3}
                                        onClick={() => handleHomelandSelect(country)}
                                        className={cn(
                                            "w-full px-4 py-2 text-left transition-colors duration-150 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed",
                                            {
                                                "bg-blue-50 border-l-4 border-blue-400": isCurrentHomeland,
                                                "bg-gray-50 border-l-4 border-gray-400":
                                                    isFocused && !isCurrentHomeland,
                                                "hover:bg-gray-50": !isCurrentHomeland && !isFocused,
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
                                        {isCurrentHomeland && (
                                            <div className="text-blue-600">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <title>Current homeland</title>
                                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z" />
                                                </svg>
                                            </div>
                                        )}
                                        {!isCurrentHomeland && isFocused && (
                                            <div className="text-gray-600">
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

export default HomelandSelector;
