import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/context/LanguageContext";
import { SessionProvider } from "@/context/SessionContext";
import { AdminAccessPage } from "@/pages/AdminAccessPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { ClassViewerPage } from "@/pages/ClassViewerPage";
import { LandingPage } from "@/pages/LandingPage";
import { StudentDashboardPage } from "@/pages/StudentDashboardPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const studentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student",
  component: StudentDashboardPage,
});

const classViewerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/class/$id",
  component: ClassViewerPage,
});

const adminAccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin-access",
  component: AdminAccessPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminDashboardPage,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  studentRoute,
  classViewerRoute,
  adminAccessRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <LanguageProvider>
      <SessionProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </SessionProvider>
    </LanguageProvider>
  );
}
