import { useAuth } from "@/lib/auth";
import type React from "react";
import { useState } from "react";
import AuthModal from "./AuthModal";

export const AuthButton: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleAuthButtonClick = () => {
        if (isAuthenticated) {
            setIsDropdownOpen(!isDropdownOpen);
        } else {
            setIsModalOpen(true);
        }
    };

    const handleLogout = async () => {
        await logout();
        setIsDropdownOpen(false);
    };

    const handleCloseDropdown = () => {
        setIsDropdownOpen(false);
    };

    return (
        <>
            <div className="relative">
                {/* Main Auth Button */}
                <button
                    type="button"
                    onClick={handleAuthButtonClick}
                    className={`
                        fixed top-4 left-4 z-40 
                        flex items-center space-x-2 
                        px-4 py-2.5 
                        rounded-full shadow-lg 
                        transition-all duration-200 
                        hover:shadow-xl hover:scale-105
                        ${
                            isAuthenticated
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
                        }
                    `}
                    title={isAuthenticated ? `Signed in as ${user?.email}` : "Sign in to sync your selections"}
                >
                    {isAuthenticated ? (
                        <>
                            {/* User Avatar or Icon */}
                            <div className="w-5 h-5 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <title>User</title>
                                    <path
                                        fillRule="evenodd"
                                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <span className="hidden sm:inline text-sm font-medium">
                                {user?.name || user?.email?.split("@")[0]}
                            </span>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <title>Dropdown</title>
                                <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <title>Sign in</title>
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                                />
                            </svg>
                            <span className="hidden sm:inline text-sm font-medium">Sign In</span>
                        </>
                    )}
                </button>

                {/* Dropdown Menu */}
                {isAuthenticated && isDropdownOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-30"
                            onClick={handleCloseDropdown}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    handleCloseDropdown();
                                }
                            }}
                        />

                        {/* Dropdown Content */}
                        <div className="fixed top-16 left-4 z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                            {/* User Info */}
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                <p className="text-sm font-medium text-gray-900">{user?.name || "User"}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>

                            {/* Menu Items */}
                            <div className="py-2">
                                <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                                    <p>✅ Country selections synced</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <title>Sign out</title>
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Auth Modal */}
            <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};

export default AuthButton;
