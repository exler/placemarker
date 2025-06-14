import { AuthProvider } from "@/lib/auth";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
    component: () => (
        <AuthProvider>
            <Outlet />
            <TanStackRouterDevtools position="top-right" />
        </AuthProvider>
    ),
});
