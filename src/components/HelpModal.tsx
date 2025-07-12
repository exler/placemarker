import type React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface HelpModalProps {
    onClose?: () => void;
    className?: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose, className = "" }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle clicking outside modal to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose?.();
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscapeKey);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscapeKey);
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
                ref={modalRef}
                className={cn(
                    "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto",
                    className,
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Welcome to Placemarker! 🌍</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="text-gray-700 dark:text-gray-300 space-y-3">
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                            Track your travel adventures on an interactive world map!
                        </p>

                        <div className="space-y-2">
                            <p className="font-medium text-gray-800 dark:text-gray-200">How to get started:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>
                                    <strong>Create an account</strong> to sync your data across devices
                                </li>
                                <li>
                                    Use the country selector to search and mark the countries you visited in{" "}
                                    <span className="text-amber-500">yellow</span>
                                </li>
                                <li>
                                    Mark your homeland in <span className="text-blue-500">blue</span> using the user
                                    menu
                                </li>
                                <li>Share your travel map with friends and family</li>
                            </ul>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                💡 <strong>Pro tip:</strong> Your country selections are automatically saved locally,
                                even without an account!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
                    <a
                        href="https://github.com/exler/placemarker"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        title="View on GitHub"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                fillRule="evenodd"
                                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="text-sm font-medium">GitHub</span>
                    </a>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Got it, let's explore! 🚀
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
