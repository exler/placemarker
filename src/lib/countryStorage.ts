// IndexedDB service for storing selected countries
export interface SelectedCountry {
    id: string;
    name: string;
    iso2: string;
    iso3: string;
    selectedAt: Date;
}

class CountryStorageService {
    private dbName = "placemarker-db";
    private version = 1;
    private storeName = "selected-countries";
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject(new Error("Failed to open IndexedDB"));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object store for selected countries
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: "id" });
                    store.createIndex("name", "name", { unique: false });
                    store.createIndex("iso2", "iso2", { unique: false });
                    store.createIndex("selectedAt", "selectedAt", { unique: false });
                }
            };
        });
    }

    async addCountry(country: Omit<SelectedCountry, "id" | "selectedAt">): Promise<void> {
        if (!this.db) throw new Error("Database not initialized");

        const countryWithMetadata: SelectedCountry = {
            ...country,
            id: country.iso2,
            selectedAt: new Date(),
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.put(countryWithMetadata);

            request.onerror = () => {
                reject(new Error("Failed to add country"));
            };

            request.onsuccess = () => {
                resolve();
            };
        });
    }

    async removeCountry(countryId: string): Promise<void> {
        if (!this.db) throw new Error("Database not initialized");

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(countryId);

            request.onerror = () => {
                reject(new Error("Failed to remove country"));
            };

            request.onsuccess = () => {
                resolve();
            };
        });
    }

    async getSelectedCountries(): Promise<SelectedCountry[]> {
        if (!this.db) throw new Error("Database not initialized");

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onerror = () => {
                reject(new Error("Failed to get countries"));
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }

    async isCountrySelected(countryId: string): Promise<boolean> {
        if (!this.db) throw new Error("Database not initialized");

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.get(countryId);

            request.onerror = () => {
                reject(new Error("Failed to check country"));
            };

            request.onsuccess = () => {
                resolve(!!request.result);
            };
        });
    }

    async clearAllCountries(): Promise<void> {
        if (!this.db) throw new Error("Database not initialized");

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onerror = () => {
                reject(new Error("Failed to clear countries"));
            };

            request.onsuccess = () => {
                resolve();
            };
        });
    }
}

// Export singleton instance
export const countryStorage = new CountryStorageService();
