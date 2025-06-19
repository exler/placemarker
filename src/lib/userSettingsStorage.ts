// Storage service for user settings
export interface UserSettings {
    id: string;
    homelandCountry?: {
        name: string;
        alpha3: string;
        setAt: Date;
    };
    updatedAt: Date;
}

class UserSettingsStorageService {
    private dbName = "placemarker-user-settings-db";
    private version = 1;
    private storeName = "user-settings";
    private db: IDBDatabase | null = null;
    private readonly USER_SETTINGS_ID = "user-settings"; // Single record for all user settings

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject(new Error("Failed to open user settings IndexedDB"));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object store for user settings
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: "id" });
                    store.createIndex("updatedAt", "updatedAt", { unique: false });
                }
            };
        });
    }

    private async getUserSettings(): Promise<UserSettings> {
        if (!this.db) throw new Error("User settings database not initialized");

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not available"));
                return;
            }
            const transaction = this.db.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.get(this.USER_SETTINGS_ID);

            request.onerror = () => {
                reject(new Error("Failed to get user settings"));
            };

            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    resolve(result);
                } else {
                    // Return default settings if none exist
                    const defaultSettings: UserSettings = {
                        id: this.USER_SETTINGS_ID,
                        updatedAt: new Date(),
                    };
                    resolve(defaultSettings);
                }
            };
        });
    }

    private async saveUserSettings(settings: UserSettings): Promise<void> {
        if (!this.db) throw new Error("User settings database not initialized");

        settings.updatedAt = new Date();

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not available"));
                return;
            }
            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.put(settings);

            request.onerror = () => {
                reject(new Error("Failed to save user settings"));
            };

            request.onsuccess = () => {
                resolve();
            };
        });
    }

    async setHomeland(country: { name: string; alpha3: string }): Promise<void> {
        const settings = await this.getUserSettings();
        settings.homelandCountry = {
            name: country.name,
            alpha3: country.alpha3,
            setAt: new Date(),
        };
        await this.saveUserSettings(settings);
    }

    async getHomeland(): Promise<{ name: string; alpha3: string } | null> {
        const settings = await this.getUserSettings();
        return settings.homelandCountry
            ? {
                  name: settings.homelandCountry.name,
                  alpha3: settings.homelandCountry.alpha3,
              }
            : null;
    }

    async clearHomeland(): Promise<void> {
        const settings = await this.getUserSettings();
        settings.homelandCountry = undefined;
        await this.saveUserSettings(settings);
    }

    async isHomeland(countryAlpha3: string): Promise<boolean> {
        const settings = await this.getUserSettings();
        return settings.homelandCountry?.alpha3 === countryAlpha3;
    }
}

// Export singleton instance
export const userSettingsStorage = new UserSettingsStorageService();
