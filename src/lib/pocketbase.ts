import countries from "i18n-iso-countries";
import PocketBase from "pocketbase";
import type { Country } from "./countries";

// Initialize PocketBase instance
export const pb = new PocketBase("http://localhost:8090");

// Helper function to convert ISO3 code to Country object
function iso3ToCountry(iso3: string): Country | null {
    try {
        const iso2 = countries.alpha3ToAlpha2(iso3);
        if (!iso2) return null;

        const name = countries.getName(iso2, "en");
        if (!name) return null;

        return {
            name,
            iso2,
            iso3,
        };
    } catch (error) {
        console.error(`Failed to convert ISO3 ${iso3} to country:`, error);
        return null;
    }
}

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
    rememberMe?: boolean;
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
    constructor() {
        // Initialize auth state from localStorage
        this.initializeAuth();
    }

    private initializeAuth() {
        // First, try to restore session-only auth if it exists
        const sessionAuth = sessionStorage.getItem("pocketbase_auth_session");
        if (sessionAuth && !pb.authStore.isValid) {
            try {
                const authData = JSON.parse(sessionAuth);
                pb.authStore.save(authData.token, authData.model);
                console.log("Session-only auth restored:", pb.authStore.model?.email);
                return;
            } catch (error) {
                console.error("Failed to restore session auth:", error);
                sessionStorage.removeItem("pocketbase_auth_session");
            }
        }
        
        // PocketBase automatically handles auth state persistence from localStorage
        // This will restore the auth state if a valid token exists
        if (pb.authStore.isValid) {
            console.log("User already authenticated:", pb.authStore.model?.email);
        }
    }

    // Authentication methods
    async login(credentials: LoginCredentials): Promise<AuthUser> {
        try {
            const authData = await pb.collection("users").authWithPassword(credentials.email, credentials.password);

            // Set auth persistence based on rememberMe
            if (credentials.rememberMe) {
                // For persistent sessions (30 days), we don't need to do anything special
                // as PocketBase handles this automatically with localStorage
                console.log("Session will persist");
            } else {
                // For session-only auth, we'll clear the auth when the page unloads
                // but let PocketBase handle the immediate auth state normally
                this.setupSessionOnlyAuth();
            }

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

    private setupSessionOnlyAuth() {
        // For session-only auth, we want to persist until the browser/tab is actually closed
        // We'll override PocketBase's default localStorage behavior to use sessionStorage instead
        
        // Move the auth data from localStorage to sessionStorage
        const authData = {
            token: pb.authStore.token,
            model: pb.authStore.model,
        };
        
        // Clear the persistent localStorage entry
        localStorage.removeItem("pocketbase_auth");
        
        // Store in sessionStorage (persists until tab/browser closes)
        sessionStorage.setItem("pocketbase_auth_session", JSON.stringify(authData));
        
        // Set up restoration of sessionStorage auth on page reload
        const handlePageLoad = () => {
            // Only restore if we don't already have valid auth
            if (!pb.authStore.isValid) {
                const sessionAuth = sessionStorage.getItem("pocketbase_auth_session");
                if (sessionAuth) {
                    try {
                        const authData = JSON.parse(sessionAuth);
                        pb.authStore.save(authData.token, authData.model);
                    } catch (error) {
                        console.error("Failed to restore session auth:", error);
                        sessionStorage.removeItem("pocketbase_auth_session");
                    }
                }
            }
        };
        
        // Restore session auth immediately if needed
        handlePageLoad();
        
        // Also listen for storage events to handle auth state across tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "pocketbase_auth_session" && e.newValue === null) {
                // Session was cleared in another tab, clear here too
                pb.authStore.clear();
            }
        };
        
        window.addEventListener("storage", handleStorageChange);
        
        // Clean up sessionStorage when auth is cleared
        const unsubscribe = pb.authStore.onChange((token) => {
            if (!token) {
                sessionStorage.removeItem("pocketbase_auth_session");
                window.removeEventListener("storage", handleStorageChange);
                unsubscribe();
            } else {
                // Update sessionStorage when auth changes
                const authData = {
                    token: pb.authStore.token,
                    model: pb.authStore.model,
                };
                sessionStorage.setItem("pocketbase_auth_session", JSON.stringify(authData));
            }
        });
    } // Country selection methods
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
                filter: `user="${user.id}" && country_alpha3="${country.iso3}"`,
            });

            if (existingRecords.items.length === 0) {
                // Create new country selection record with only ISO3
                const record: Omit<CountrySelectionRecord, "id" | "created" | "updated"> = {
                    user: user.id,
                    country_alpha3: country.iso3,
                };

                await pb.collection("country_selections").create(record);
                console.log(`Country selection saved: ${country.name} (${country.iso3})`);
            }
        } catch (error) {
            console.error("Failed to save country selection:", error);
            throw new Error("Failed to save country selection");
        }
    }
    async removeCountrySelection(countryIso3: string): Promise<void> {
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
                filter: `user="${user.id}" && country_alpha3="${countryIso3}"`,
            });

            if (records.items.length > 0) {
                await pb.collection("country_selections").delete(records.items[0].id);
                console.log(`Country selection removed: ${countryIso3}`);
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
                const country = iso3ToCountry(record.country_alpha3);
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
    } // Auth state change listener
    onChange(callback: (token: string, model: unknown) => void) {
        return pb.authStore.onChange(callback);
    }
}

// Export singleton instance
export const pocketbaseService = new PocketbaseService();
