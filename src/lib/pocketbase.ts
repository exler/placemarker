import { type Country, alpha3ToCountry } from "@/lib/countries";
import PocketBase from "pocketbase";

// Initialize PocketBase instance
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);

// Types for authentication
export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    created: string;
    updated: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

// Types for Pocketbase country selection record
export interface CountrySelectionRecord {
    id?: string;
    user: string; // user ID
    country_alpha3: string; // ISO 3166-1 alpha-3 country code
    created?: string;
    updated?: string;
}

class PocketbaseService {
    async login(credentials: LoginCredentials): Promise<AuthUser> {
        try {
            const authData = await pb.collection("users").authWithPassword(credentials.email, credentials.password);

            return {
                id: authData.record.id,
                email: authData.record.email,
                name: authData.record.name,
                avatar: authData.record.avatar,
                created: authData.record.created,
                updated: authData.record.updated,
            };
        } catch (error) {
            console.error("Login failed:", error);
            throw new Error("Invalid email or password");
        }
    }

    async logout(): Promise<void> {
        pb.authStore.clear();
    }

    getCurrentUser(): AuthUser | null {
        if (!pb.authStore.isValid || !pb.authStore.model) {
            return null;
        }

        return {
            id: pb.authStore.model.id,
            email: pb.authStore.model.email,
            name: pb.authStore.model.name,
            avatar: pb.authStore.model.avatar,
            created: pb.authStore.model.created,
            updated: pb.authStore.model.updated,
        };
    }

    isAuthenticated(): boolean {
        return pb.authStore.isValid;
    }

    async saveCountrySelection(country: Country): Promise<void> {
        if (!this.isAuthenticated()) {
            throw new Error("User must be authenticated to save country selections");
        }

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error("No authenticated user found");
        }

        try {
            // Check if this country is already selected by this user
            const existingRecords = await pb.collection("country_selections").getList(1, 1, {
                filter: `user="${user.id}" && country_alpha3="${country.alpha3}"`,
            });

            if (existingRecords.items.length === 0) {
                // Create new country selection record with only alpha-3
                const record: Omit<CountrySelectionRecord, "id" | "created" | "updated"> = {
                    user: user.id,
                    country_alpha3: country.alpha3,
                };

                await pb.collection("country_selections").create(record);
                console.log(`Country selection saved: ${country.name} (${country.alpha3})`);
            }
        } catch (error) {
            console.error("Failed to save country selection:", error);
            throw new Error("Failed to save country selection");
        }
    }

    async removeCountrySelection(countryAlpha3: string): Promise<void> {
        if (!this.isAuthenticated()) {
            throw new Error("User must be authenticated to remove country selections");
        }

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error("No authenticated user found");
        }

        try {
            // Find the record to delete
            const records = await pb.collection("country_selections").getList(1, 1, {
                filter: `user="${user.id}" && country_alpha3="${countryAlpha3}"`,
            });

            if (records.items.length > 0) {
                await pb.collection("country_selections").delete(records.items[0].id);
                console.log(`Country selection removed: ${countryAlpha3}`);
            }
        } catch (error) {
            console.error("Failed to remove country selection:", error);
            throw new Error("Failed to remove country selection");
        }
    }

    async getUserCountrySelections(): Promise<Country[]> {
        if (!this.isAuthenticated()) {
            return [];
        }

        const user = this.getCurrentUser();
        if (!user) {
            return [];
        }

        try {
            const records = await pb.collection("country_selections").getFullList({
                filter: `user="${user.id}"`,
                sort: "-created",
            });

            // Convert ISO3 codes to Country objects using the helper function
            const countries: Country[] = [];
            for (const record of records) {
                const country = alpha3ToCountry(record.country_alpha3);
                if (country) {
                    countries.push(country);
                }
            }

            return countries;
        } catch (error) {
            console.error("Failed to get user country selections:", error);
            return [];
        }
    }

    async clearAllCountrySelections(): Promise<void> {
        if (!this.isAuthenticated()) {
            throw new Error("User must be authenticated to clear country selections");
        }

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error("No authenticated user found");
        }

        try {
            const records = await pb.collection("country_selections").getFullList({
                filter: `user="${user.id}"`,
            });

            // Delete all records
            for (const record of records) {
                await pb.collection("country_selections").delete(record.id);
            }

            console.log("All country selections cleared");
        } catch (error) {
            console.error("Failed to clear country selections:", error);
            throw new Error("Failed to clear country selections");
        }
    }

    onChange(callback: (token: string, model: unknown) => void) {
        return pb.authStore.onChange(callback);
    }
}

// Export singleton instance
export const pocketbaseService = new PocketbaseService();
