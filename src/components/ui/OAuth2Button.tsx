import { cn } from "@/lib/utils";

export const OAuth2Button: React.FC<{
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    isAuthenticationProcessStarted?: boolean;
    className?: string;
}> = ({ label, icon, onClick, isAuthenticationProcessStarted, className }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isAuthenticationProcessStarted}
            className={cn(
                "w-full cursor-pointer flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                className,
            )}
        >
            {isAuthenticationProcessStarted ? (
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2" />
                    Authenticating...
                </div>
            ) : (
                <div className="flex items-center">
                    <div className="w-5 h-5 mr-2">{icon}</div>
                    {label}
                </div>
            )}
        </button>
    );
};
