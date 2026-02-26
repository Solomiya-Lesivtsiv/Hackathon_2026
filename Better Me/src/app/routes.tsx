import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./components/dashboard-layout";
import { OrdersList } from "./pages/orders-list";
import { ImportCSV } from "./pages/import-csv";
import { CreateOrder } from "./pages/create-order";
import { Dashboard } from "./pages/dashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import AdminOnlyPage from "./pages/AdminOnlyPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
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
        path: "admin",
        element: (
          <ProtectedRoute requireAdmin>
            <AdminOnlyPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);