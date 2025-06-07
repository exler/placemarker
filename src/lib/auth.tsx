import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { AuthUser } from "./pocketbase";
import { pocketbaseService } from "./pocketbase";

// Interface for the model object from PocketBase auth store
interface PocketBaseAuthModel {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    created: string;
    updated: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initialize auth state
        const initializeAuth = () => {
            const currentUser = pocketbaseService.getCurrentUser();
            setUser(currentUser);
            setIsLoading(false);
        };

        initializeAuth(); // Listen for auth changes
        const unsubscribe = pocketbaseService.onChange((token, model) => {
            if (token && model) {
                // Type guard to ensure model has the expected properties
                const isValidModel = (obj: unknown): obj is PocketBaseAuthModel => {
                    return typeof obj === "object" && obj !== null && "id" in obj && "email" in obj;
                };

                if (isValidModel(model)) {
                    const authUser: AuthUser = {
                        id: model.id,
                        email: model.email,
                        name: model.name,
                        avatar: model.avatar,
                        created: model.created,
                        updated: model.updated,
                    };
                    setUser(authUser);
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        });

        return unsubscribe;
    }, []);
    const login = async (email: string, password: string, rememberMe = false) => {
        const authUser = await pocketbaseService.login({
            email,
            password,
            rememberMe,
        });
        setUser(authUser);
    };

    const logout = async () => {
        try {
            await pocketbaseService.logout();
            setUser(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user && pocketbaseService.isAuthenticated(),
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
