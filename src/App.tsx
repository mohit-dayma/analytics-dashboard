import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "@/components/layout/app-shell";
import OverviewPage from "@/features/overview/overview-page";
import OrdersPage from "@/features/orders/orders-page";

// The command palette is mounted inside AppShell so this route tree stays dumb.
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
