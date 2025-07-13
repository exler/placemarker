import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AuthProvider } from "@/lib/auth";

export const Route = createRootRoute({
    component: () => (
        <AuthProvider>
            <Outlet />
            <TanStackRouterDevtools position="bottom-right" />
        </AuthProvider>
    ),
});
