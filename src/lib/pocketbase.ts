import PocketBase from "pocketbase";
import { alpha3ToCountry, type Country } from "@/lib/countries";

// Initialize PocketBase instance
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);

// Types for authentication
export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    created: string;
    updated: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

// Types for user profile record
export interface UserProfileRecord {
    id?: string;
    user: string; // user ID
    shared?: boolean;
    homeland_alpha3?: string; // ISO 3166-1 alpha-3 country code for homeland
    display_name?: string; // Display name from user's name field
    created?: string;
    updated?: string;
}

// Types for Pocketbase country selection record
export interface CountrySelectionRecord {
    id?: string;
    profile: string; // profile ID
    country_alpha3: string; // ISO 3166-1 alpha-3 country code
    created?: string;
    updated?: string;
}

class PocketbaseService {
    async login(credentials: LoginCredentials): Promise<AuthUser> {
        try {
            const authData = await pb.collection("users").authWithPassword(credentials.email, credentials.password);

            const authUser = {
                id: authData.record.id,
                email: authData.record.email,
                name: authData.record.name,
                created: authData.record.created,
                updated: authData.record.updated,
            };

            // Ensure user profile exists after login
            await this.ensureUserProfile(authUser);

            return authUser;
        } catch (error) {
            console.error("Login failed:", error);
            throw new Error("Invalid email or password");
        }
    }

    // AIDEV-NOTE: OAuth2 authentication for new user registration and existing user login
    async loginWithOAuth2(provider: string): Promise<AuthUser> {
        try {
            const authData = await pb.collection("users").authWithOAuth2({ provider });

            const authUser = {
                id: authData.record.id,
                email: authData.record.email,
                name: authData.record.name,
                created: authData.record.created,
                updated: authData.record.updated,
            };

            // Ensure user profile exists after OAuth login
            await this.ensureUserProfile(authUser);

            return authUser;
        } catch (error) {
            console.error("OAuth2 login failed:", error);
            throw new Error("OAuth2 authentication failed. Please try again.");
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
            created: pb.authStore.model.created,
            updated: pb.authStore.model.updated,
        };
    }

    isAuthenticated(): boolean {
        return pb.authStore.isValid;
    }

    // AIDEV-NOTE: Ensures user profile exists, creates one if it doesn't
    private async ensureUserProfile(user: AuthUser): Promise<UserProfileRecord> {
        try {
            // Try to get existing profile
            const existingProfiles = await pb.collection("user_profiles").getList(1, 1, {
                filter: `user="${user.id}"`,
                requestKey: null,
            });

            if (existingProfiles.items.length > 0) {
                return existingProfiles.items[0] as unknown as UserProfileRecord;
            }

            // Create new profile if it doesn't exist
            const newProfile = await pb.collection("user_profiles").create({
                user: user.id,
                display_name: user.name || "",
                shared: false,
            });

            console.log("Created new user profile");
            return newProfile as unknown as UserProfileRecord;
        } catch (error) {
            console.error("Failed to ensure user profile:", error);
            throw new Error("Failed to create user profile");
        }
    }

    // AIDEV-NOTE: Get user profile (creates if doesn't exist)
    async getUserProfile(): Promise<UserProfileRecord> {
        if (!this.isAuthenticated()) {
            throw new Error("User must be authenticated to get profile");
        }

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error("No authenticated user found");
        }

        return await this.ensureUserProfile(user);
    }

    async saveCountrySelection(country: Country): Promise<void> {
        if (!this.isAuthenticated()) {
            throw new Error("User must be authenticated to save country selections");
        }

        try {
            const profile = await this.getUserProfile();

            // Check if this country is already selected by this user's profile
            const existingRecords = await pb.collection("country_selections").getList(1, 1, {
                filter: `profile="${profile.id}" && country_alpha3="${country.alpha3}"`,
            });

            if (existingRecords.items.length === 0) {
                // Create new country selection record with profile reference
                const record = {
                    profile: profile.id as string,
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

        try {
            const profile = await this.getUserProfile();

            // Find the record to delete
            const records = await pb.collection("country_selections").getList(1, 1, {
                filter: `profile="${profile.id}" && country_alpha3="${countryAlpha3}"`,
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

        try {
            const profile = await this.getUserProfile();

            const records = await pb.collection("country_selections").getFullList({
                filter: `profile="${profile.id}"`,
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

        try {
            const profile = await this.getUserProfile();

            const records = await pb.collection("country_selections").getFullList({
                filter: `profile="${profile.id}"`,
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

    async setHomeland(country: Country): Promise<void> {
        if (!this.isAuthenticated()) {
            throw new Error("User must be authenticated to set homeland");
        }

        try {
            const profile = await this.getUserProfile();

            // Update the user profile's homeland_alpha3 field
            await pb.collection("user_profiles").update(profile.id as string, {
                homeland_alpha3: country.alpha3,
            });

            console.log(`Homeland set: ${country.name} (${country.alpha3})`);
        } catch (error) {
            console.error("Failed to set homeland:", error);
            throw new Error("Failed to set homeland");
        }
    }

    async getHomeland(): Promise<Country | null> {
        if (!this.isAuthenticated()) {
            return null;
        }

        try {
            const profile = await this.getUserProfile();

            if (!profile.homeland_alpha3) {
                return null;
            }

            const country = alpha3ToCountry(profile.homeland_alpha3);
            return country;
        } catch (error) {
            console.error("Failed to get homeland:", error);
            return null;
        }
    }

    async clearHomeland(): Promise<void> {
        if (!this.isAuthenticated()) {
            throw new Error("User must be authenticated to clear homeland");
        }

        try {
            const profile = await this.getUserProfile();

            await pb.collection("user_profiles").update(profile.id as string, {
                homeland_alpha3: null,
            });

            console.log("Homeland cleared");
        } catch (error) {
            console.error("Failed to clear homeland:", error);
            throw new Error("Failed to clear homeland");
        }
    }

    // AIDEV-NOTE: Share map functionality - toggle sharing and get share status
    async toggleMapSharing(): Promise<boolean> {
        if (!this.isAuthenticated()) {
            throw new Error("User must be authenticated to toggle map sharing");
        }

        try {
            const profile = await this.getUserProfile();
            const newSharedValue = !profile.shared;

            await pb.collection("user_profiles").update(profile.id as string, {
                shared: newSharedValue,
            });

            console.log(`Map sharing ${newSharedValue ? "enabled" : "disabled"}`);
            return newSharedValue;
        } catch (error) {
            console.error("Failed to toggle map sharing:", error);
            throw new Error("Failed to toggle map sharing");
        }
    }

    async getMapShareStatus(): Promise<boolean> {
        if (!this.isAuthenticated()) {
            return false;
        }

        try {
            const profile = await this.getUserProfile();
            return profile.shared || false;
        } catch (error) {
            console.error("Failed to get map share status:", error);
            return false;
        }
    }

    // AIDEV-NOTE: Get shared profile data by user ID for public viewing
    async getSharedProfile(profileId: string): Promise<{ profile: UserProfileRecord; countries: Country[] } | null> {
        try {
            // Get the user profile with expanded user relation - this will only work if it's shared due to view rules
            const profileRecord = await pb.collection("user_profiles").getOne(profileId, {
                expand: "user", // Expand the user relation to get user details
            });

            const profile = profileRecord as unknown as UserProfileRecord;

            // Set display_name from expanded user data if available
            if (profileRecord.expand?.user?.name) {
                profile.display_name = profileRecord.expand.user.name;
            }

            // Get country selections for this profile
            const countryRecords = await pb.collection("country_selections").getFullList({
                filter: `profile="${profile.id}"`,
                sort: "-created",
            });

            // Convert to Country objects
            const countries: Country[] = [];
            for (const record of countryRecords) {
                const country = alpha3ToCountry(record.country_alpha3);
                if (country) {
                    countries.push(country);
                }
            }

            return { profile, countries };
        } catch (error) {
            console.error("Failed to get shared profile:", error);
            return null;
        }
    }

    generateShareUrl(profileId: string): string {
        const baseUrl = window.location.origin;
        return `${baseUrl}/shared/${profileId}`;
    }

    onChange(callback: (token: string, model: unknown) => void) {
        return pb.authStore.onChange(callback);
    }
}

// Export singleton instance
export const pocketbaseService = new PocketbaseService();
