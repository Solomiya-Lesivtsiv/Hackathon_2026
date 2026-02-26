import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./components/dashboard-layout";
import { OrdersList } from "./pages/orders-list";
import { ImportCSV } from "./pages/import-csv";
import { CreateOrder } from "./pages/create-order";
import { Dashboard } from "./pages/dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "orders", Component: OrdersList },
      { path: "import", Component: ImportCSV },
      { path: "create", Component: CreateOrder },
    ],
  },
]);
