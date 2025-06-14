import countries from "i18n-iso-countries";
import countriesEN from "i18n-iso-countries/langs/en.json";

// Register the English locale for country names
countries.registerLocale(countriesEN);

// Country data interface for search functionality
export interface Country {
    name: string;
    alpha3: string;
}

// Get all countries using i18n-iso-countries
function getAllCountries(): Country[] {
    const countryList: Country[] = [];
    const countryNames = countries.getNames("en");

    for (const [alpha2, name] of Object.entries(countryNames)) {
        const alpha3 = countries.alpha2ToAlpha3(alpha2);

        if (alpha3) {
            countryList.push({
                name,
                alpha3,
            });
        }
    }

    return countryList.sort((a, b) => a.name.localeCompare(b.name));
}

// Cache the countries list for performance
const countriesList = getAllCountries();

// Helper function to search countries
export function searchCountries(query: string, limit = 10): Country[] {
    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();

    return countriesList
        .filter(
            (country: Country) =>
                country.name.toLowerCase().includes(normalizedQuery) ||
                country.alpha3.toLowerCase().includes(normalizedQuery),
        )
        .sort((a: Country, b: Country) => {
            // Prioritize exact matches at the beginning
            const aStartsWith = a.name.toLowerCase().startsWith(normalizedQuery);
            const bStartsWith = b.name.toLowerCase().startsWith(normalizedQuery);

            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;

            // Then sort alphabetically
            return a.name.localeCompare(b.name);
        })
        .slice(0, limit);
}

// Helper function to convert alpha-3 code to Country object
export function alpha3ToCountry(alpha3: string): Country | null {
    try {
        const name = countries.getName(alpha3, "en");
        if (!name) return null;

        return {
            name,
            alpha3,
        };
    } catch (error) {
        console.error(`Failed to convert alpha-3 code ${alpha3} to country:`, error);
        return null;
    }
}
