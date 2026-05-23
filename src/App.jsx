import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { visualAid as va } from "./config/visualAid";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import InstructorRoute from "./components/InstructorRoute";

const HomePage = lazy(() => import("./pages/HomePage"));
const PublicCoursesPage = lazy(() => import("./pages/PublicCoursesPage"));
const PublicCoursePage = lazy(() => import("./pages/PublicCoursePage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const ETransferPage = lazy(() => import("./pages/ETransferPage"));
const PaymentConfirmPage = lazy(() => import("./pages/PaymentConfirmPage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const EnrolledCoursesPage = lazy(() => import("./pages/EnrolledCoursesPage"));
const CoursePage = lazy(() => import("./pages/CoursePage"));
const ClassPage = lazy(() => import("./pages/ClassPage"));
const InstructorDashboard = lazy(() => import("./pages/InstructorDashboard"));
const ClassCheckoutPage = lazy(() => import("./pages/ClassCheckoutPage"));
const CertificateVerifyPage = lazy(() => import("./pages/CertificateVerifyPage"));

export default function App() {
  const routeFallback = (
    <main style={{ padding: "32px", color: va.colors.primaryTextDark }}>
      Loading...
    </main>
  );

  return (
    <div
      className={va.layout.appShell}
      style={{
        backgroundColor: va.colors.pageColor,
        color: va.colors.primaryText,
      }}
    >
      <Navbar />

      <Suspense fallback={routeFallback}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<PublicCoursesPage />} />
          <Route path="/courses/:courseId" element={<PublicCoursePage />} />
          <Route path="/programs/*" element={<Navigate to="/courses" replace />} />
          <Route path="/checkout/level1" element={<Navigate to="/courses" replace />} />
          <Route path="/checkout/level2" element={<Navigate to="/courses" replace />} />
          <Route path="/checkout/level3" element={<Navigate to="/courses" replace />} />
          <Route
            path="/checkout/class/:classSectionId"
            element={
              <ProtectedRoute>
                <ClassCheckoutPage />
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
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route
            path="/certificates/verify/:certificateCode"
            element={<CertificateVerifyPage />}
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
            path="/instructor"
            element={
              <InstructorRoute>
                <InstructorDashboard />
              </InstructorRoute>
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
          <Route
            path="/dashboard/courses"
            element={
              <ProtectedRoute>
                <EnrolledCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/courses/:courseId"
            element={
              <ProtectedRoute>
                <CoursePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/courses/:courseId/classes/:classSectionId"
            element={
              <ProtectedRoute>
                <ClassPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
}
