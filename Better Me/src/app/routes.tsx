import { createBrowserRouter, Navigate, useRouteError, useNavigate } from "react-router";
import { DashboardLayout } from "./components/dashboard-layout";
import { OrdersList } from "./pages/orders-list";
import { ImportCSV } from "./pages/import-csv";
import { CreateOrder } from "./pages/create-order";
import { Dashboard } from "./pages/dashboard";
import { UserManagement } from "./pages/user-management";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import AdminOnlyPage from "./pages/AdminOnlyPage";
import NotFoundPage from "./pages/NotFoundPage";
import DashboardRedirect from "./pages/DashboardRedirect";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useEffect } from "react";

function RootErrorBoundary() {
  const error = useRouteError() as any;
  const navigate = useNavigate();

  useEffect(() => {
    // If we get a 404 error for /dashboard, redirect to home
    if (error?.status === 404 && error?.data?.includes?.('/dashboard')) {
      navigate('/', { replace: true });
    }
  }, [error, navigate]);

  // For any 404, redirect to home
  if (error?.status === 404) {
    return <NotFoundPage />;
  }

  // For other errors, show a generic error page
  return <NotFoundPage />;
}

export const router = createBrowserRouter(
  [
    {
      path: "/login",
      Component: LoginPage,
      errorElement: <RootErrorBoundary />,
    },
    {
      path: "/register",
      Component: RegisterPage,
      errorElement: <RootErrorBoundary />,
    },
    {
      path: "/dashboard",
      Component: DashboardRedirect,
      errorElement: <RootErrorBoundary />,
    },
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      errorElement: <RootErrorBoundary />,
      children: [
        { index: true, Component: Dashboard },
        { path: "orders", Component: OrdersList },
        { path: "import", Component: ImportCSV },
        { path: "create", Component: CreateOrder },
        {
          path: "profile",
          Component: ProfilePage,
        },
        {
          path: "user-management",
          element: (
            <ProtectedRoute requireAdmin>
              <UserManagement />
            </ProtectedRoute>
          ),
        },
        {
          path: "admin",
          element: (
            <ProtectedRoute requireAdmin>
              <AdminOnlyPage />
            </ProtectedRoute>
          ),
        },
        { path: "*", Component: NotFoundPage },
      ],
    },
    {
      path: "*",
      Component: NotFoundPage,
      errorElement: <RootErrorBoundary />,
    },
  ],
  {
    future: {
      v7_skipActionErrorRevalidation: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_fetcherPersist: true,
    },
  }
);