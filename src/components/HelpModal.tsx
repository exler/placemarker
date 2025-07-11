import { cn } from "@/lib/utils";
import type React from "react";
import { useEffect, useRef } from "react";

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
                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
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
