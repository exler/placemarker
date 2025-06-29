import { useAuth } from "@/lib/auth";
import type { Country } from "@/lib/countries";
import { pocketbaseService } from "@/lib/pocketbase";
import type React from "react";
import { useEffect, useState } from "react";
import AuthModal from "./AuthModal";

interface AuthButtonProps {
    homelandCountry?: Country | null;
    onHomelandButtonClick?: () => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ homelandCountry, onHomelandButtonClick }) => {
    const { user, isAuthenticated, logout } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMapShared, setIsMapShared] = useState(false);
    const [isTogglingShare, setIsTogglingShare] = useState(false);
    const [isCopyingLink, setIsCopyingLink] = useState(false);

    // Load sharing status when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            loadShareStatus();
        } else {
            setIsMapShared(false);
        }
    }, [isAuthenticated]);

    const loadShareStatus = async () => {
        try {
            const shareStatus = await pocketbaseService.getMapShareStatus();
            setIsMapShared(shareStatus);
        } catch (error) {
            console.error("Failed to load share status:", error);
        }
    };

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

    const handleToggleSharing = async () => {
        if (!user) return;

        setIsTogglingShare(true);
        try {
            const newShareStatus = await pocketbaseService.toggleMapSharing();
            setIsMapShared(newShareStatus);

            if (newShareStatus) {
                // Copy share URL to clipboard
                const shareUrl = pocketbaseService.generateShareUrl(user.id);
                await navigator.clipboard.writeText(shareUrl);

                // You could show a toast notification here
                console.log("Share URL copied to clipboard:", shareUrl);
            }
        } catch (error) {
            console.error("Failed to toggle sharing:", error);
            // You could show an error toast here
        } finally {
            setIsTogglingShare(false);
        }
    };

    // AIDEV-NOTE: Copy share link functionality for when user wants to share their map URL
    const handleCopyShareLink = async () => {
        if (!user) return;

        setIsCopyingLink(true);
        try {
            const shareUrl = pocketbaseService.generateShareUrl(user.id);
            await navigator.clipboard.writeText(shareUrl);

            // You could show a toast notification here
            console.log("Share URL copied to clipboard:", shareUrl);
        } catch (error) {
            console.error("Failed to copy share link:", error);
            // You could show an error toast here
        } finally {
            setIsCopyingLink(false);
        }
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

                                {/* Homeland Selector Trigger */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        onHomelandButtonClick?.();
                                        handleCloseDropdown();
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <title>Homeland</title>
                                            <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z" />
                                        </svg>
                                        <span>Homeland</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {homelandCountry ? homelandCountry.name : "Not set"}
                                    </span>
                                </button>

                                {/* Share Map Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleToggleSharing();
                                        handleCloseDropdown();
                                    }}
                                    disabled={isTogglingShare}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between disabled:opacity-50"
                                >
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <title>Share</title>
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                                            />
                                        </svg>
                                        <span>{isMapShared ? "Unshare map" : "Share map"}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {isTogglingShare ? "..." : isMapShared ? "Public" : "Private"}
                                    </span>
                                </button>

                                {/* Copy Share Link Button - only show when map is shared */}
                                {isMapShared && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleCopyShareLink();
                                            handleCloseDropdown();
                                        }}
                                        disabled={isCopyingLink}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between disabled:opacity-50"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <title>Copy link</title>
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <span>Copy share link</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{isCopyingLink ? "..." : "📋"}</span>
                                    </button>
                                )}

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
