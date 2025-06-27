import { useAuth } from "@/lib/auth";
import { useForm } from "@tanstack/react-form";
import type React from "react";
import { useState } from "react";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface LoginFormData {
    email: string;
    password: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { login, loginWithGitHub } = useAuth(); // AIDEV-NOTE: Include GitHub OAuth2 login method
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const form = useForm({
        defaultValues: {
            email: "",
            password: "",
        } as LoginFormData,
        onSubmit: async ({ value }) => {
            setIsLoading(true);
            setError(null);

            try {
                await login(value.email, value.password);
                onClose();
                form.reset();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Login failed");
            } finally {
                setIsLoading(false);
            }
        },
    });

    const handleClose = () => {
        form.reset();
        setError(null);
        onClose();
    };

    // AIDEV-NOTE: GitHub OAuth2 authentication handler
    const handleGitHubLogin = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await loginWithGitHub();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "GitHub authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            tabIndex={-1}
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                    onClose();
                }
            }}
        >
            {/* Darkened Background Overlay */}
            <div 
                className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div 
                className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 scale-100 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800">Sign In</h2>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={isLoading}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <title>Close</title>
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="px-6 py-6 space-y-4"
                >
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Email Field */}
                    <form.Field
                        name="email"
                        validators={{
                            onChange: ({ value }) => {
                                if (!value) return "Email is required";
                                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                                    return "Please enter a valid email address";
                                }
                                return undefined;
                            },
                        }}
                    >
                        {(field) => (
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    onBlur={field.handleBlur}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your email"
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                                {field.state.meta.errors && (
                                    <p className="mt-1 text-sm text-red-600">{field.state.meta.errors[0]}</p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    {/* Password Field */}
                    <form.Field
                        name="password"
                        validators={{
                            onChange: ({ value }) => {
                                if (!value) return "Password is required";
                                if (value.length < 6) return "Password must be at least 6 characters";
                                return undefined;
                            },
                        }}
                    >
                        {(field) => (
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    onBlur={field.handleBlur}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your password"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                {field.state.meta.errors && (
                                    <p className="mt-1 text-sm text-red-600">{field.state.meta.errors[0]}</p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                            {([canSubmit, isSubmitting]) => (
                                <button
                                    type="submit"
                                    disabled={!canSubmit || isLoading}
                                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading || isSubmitting ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                            Signing in...
                                        </div>
                                    ) : (
                                        "Sign In"
                                    )}
                                </button>
                            )}
                        </form.Subscribe>
                    </div>

                    {/* AIDEV-NOTE: GitHub OAuth2 registration section for new user onboarding */}
                    <div className="pt-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">or</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={handleGitHubLogin}
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2" />
                                    Authenticating...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <title>GitHub</title>
                                        <path
                                            fillRule="evenodd"
                                            d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Continue with GitHub
                                </div>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        By signing in, you agree to sync your country selections with our servers.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
