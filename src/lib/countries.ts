import countries from "i18n-iso-countries";
import countriesEN from "i18n-iso-countries/langs/en.json";

// Register the English locale for country names
countries.registerLocale(countriesEN);

// Country data interface for search functionality
export interface Country {
    name: string;
    iso2: string;
    iso3: string;
}

// Get all countries using i18n-iso-countries
function getAllCountries(): Country[] {
    const countryList: Country[] = [];
    const countryNames = countries.getNames("en");

    for (const [iso2, name] of Object.entries(countryNames)) {
        const iso3 = countries.alpha2ToAlpha3(iso2);

        if (iso3) {
            countryList.push({
                name,
                iso2,
                iso3,
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
                country.iso2.toLowerCase().includes(normalizedQuery) ||
                country.iso3.toLowerCase().includes(normalizedQuery),
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
