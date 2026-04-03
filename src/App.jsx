import { Routes, Route, Navigate } from "react-router-dom";
import { visualAid as va } from "./config/visualAid";
import { PROGRAMS } from "./data/programs";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ProgramsPage from "./pages/ProgramsPage";
import ProgramDetailsPage from "./pages/ProgramDetailsPage";
import CheckoutPage from "./pages/CheckoutPage";
import AccountPage from "./pages/AccountPage";
import ContactPage from "./pages/ContactPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ETransferPage from "./pages/ETransferPage";
import PaymentConfirmPage from "./pages/PaymentConfirmPage";
import AdminPage from "./pages/AdminPage";
import AdminRoute from "./components/AdminRoute";
import DashboardPage from "./pages/DashboardPage";

function ProgramRouteWrapper({ programId, children }) {
  const program = PROGRAMS.find((p) => p.id === programId);
  if (!program) return <Navigate to="/programs" replace />;
  return children(program);
}

export default function App() {
  return (
    <div
      className={va.layout.appShell}
      style={{
        backgroundColor: va.colors.pageColor,
        color: va.colors.primaryText,
      }}
    >
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route
          path="/programs/level1"
          element={
            <ProgramRouteWrapper programId="level1">
              {(program) => <ProgramDetailsPage program={program} />}
            </ProgramRouteWrapper>
          }
        />
        <Route
          path="/programs/level2"
          element={
            <ProgramRouteWrapper programId="level2">
              {(program) => <ProgramDetailsPage program={program} />}
            </ProgramRouteWrapper>
          }
        />
        <Route
          path="/programs/level3"
          element={
            <ProgramRouteWrapper programId="level3">
              {(program) => <ProgramDetailsPage program={program} />}
            </ProgramRouteWrapper>
          }
        />
        <Route
          path="/checkout/level1"
          element={
            <ProtectedRoute>
              <ProgramRouteWrapper programId="level1">
                {(program) => <CheckoutPage program={program} />}
              </ProgramRouteWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/level2"
          element={
            <ProtectedRoute>
              <ProgramRouteWrapper programId="level2">
                {(program) => <CheckoutPage program={program} />}
              </ProgramRouteWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/level3"
          element={
            <ProtectedRoute>
              <ProgramRouteWrapper programId="level3">
                {(program) => <CheckoutPage program={program} />}
              </ProgramRouteWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/etransfer/:paymentId"
          element={
            <ProtectedRoute>
              <ETransferPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-confirm/:paymentId"
          element={
            <ProtectedRoute>
              <PaymentConfirmPage />
            </ProtectedRoute>
          }
        />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
