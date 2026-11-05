import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import FloatingAssistant from './components/chat/FloatingAssistant'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ErrorBoundary from './components/common/ErrorBoundary'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRouteGuard from './components/auth/AdminRouteGuard'
import { useAuth } from './context/AuthContext'

const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const AdminCreateAccount = lazy(() => import('./pages/AdminCreateAccount'))
const AdminProviders = lazy(() => import('./pages/AdminProviders'))
const AdminHospitals = lazy(() => import('./pages/AdminHospitals'))
const AdminDoctors = lazy(() => import('./pages/AdminDoctors'))
const AdminPharmacies = lazy(() => import('./pages/AdminPharmacies'))
const AdminAmbulances = lazy(() => import('./pages/AdminAmbulances'))
const AdminVerifications = lazy(() => import('./pages/AdminVerifications'))
const AdminBloodRequests = lazy(() => import('./pages/AdminBloodRequests'))
const AdminEmergencyRequests = lazy(() => import('./pages/AdminEmergencyRequests'))
const AdminBloodDonors = lazy(() => import('./pages/AdminBloodDonors'))
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'))
const AdminAuditLogs = lazy(() => import('./pages/AdminAuditLogs'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AdminComplaints = lazy(() => import('./pages/AdminComplaints'))
const Home = lazy(() => import('./pages/Home'))
const Health = lazy(() => import('./pages/Health'))
const Emergency = lazy(() => import('./pages/Emergency'))
const Blood = lazy(() => import('./pages/Blood'))
const BloodRequest = lazy(() => import('./pages/BloodRequest'))
const BloodRequestDetails = lazy(() => import('./pages/BloodRequestDetails'))
const Hospitals = lazy(() => import('./pages/Hospitals'))
const HospitalDetails = lazy(() => import('./pages/HospitalDetails'))
const NearbyHospitals = lazy(() => import('./pages/NearbyHospitals'))
const NearbyHospitalDetails = lazy(() => import('./pages/NearbyHospitalDetails'))
const Ambulances = lazy(() => import('./pages/Ambulances'))
const Doctors = lazy(() => import('./pages/Doctors'))
const DoctorDetails = lazy(() => import('./pages/DoctorDetails'))
const DoctorAppointment = lazy(() => import('./pages/DoctorAppointment'))
const Providers = lazy(() => import('./pages/Providers'))
const Medicines = lazy(() => import('./pages/Medicines'))
const Profile = lazy(() => import('./pages/Profile'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const Settings = lazy(() => import('./pages/Settings'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Privacy = lazy(() => import('./pages/Privacy'))
const HealthSetup = lazy(() => import('./pages/HealthSetup'))
const NotFound = lazy(() => import('./pages/NotFound'))

function App() {
  const location = useLocation()
  const { accessToken, user } = useAuth()
  const isAdminUser = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role)
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/')
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (isAdminUser && !isAdminRoute && location.pathname !== '/register') {
    return <Navigate to="/admin" replace />
  }

  return (
    <ErrorBoundary>
      <div className="app-shell min-h-screen text-[var(--text-soft)]">
        <div className={`mx-auto max-w-[1440px] px-3 pb-10 pt-3 sm:px-5 lg:px-8 ${isAdminRoute ? 'admin-app-frame' : ''}`}>
          {!isAdminRoute && <Navbar />}
          <main className={isAdminRoute ? 'admin-route-host' : 'mt-5'}>
            <Suspense fallback={<div className="app-route-loading" role="status">Loading page…</div>}>
              <Routes location={location}>
                <Route
                  path="/"
                  element={isAdminUser ? <Navigate to="/admin" replace /> : <Home />}
                />
                <Route path="/health" element={<ProtectedRoute><Health /></ProtectedRoute>} />
                <Route path="/emergency" element={<Emergency />} />
                <Route path="/blood" element={<Blood />} />
                <Route path="/blood/request" element={<BloodRequest />} />
                <Route path="/blood/requests/:id" element={<BloodRequestDetails />} />
                <Route path="/hospitals" element={<Hospitals />} />
                <Route path="/hospitals/nearby" element={<NearbyHospitals />} />
                <Route path="/hospitals/nearby/:id" element={<NearbyHospitalDetails />} />
                <Route path="/hospitals/:id" element={<HospitalDetails />} />
                <Route path="/ambulances" element={<Ambulances />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/doctors/:id" element={<DoctorDetails />} />
                <Route path="/doctors/:id/appointments" element={<DoctorAppointment />} />
                <Route path="/providers" element={<Providers />} />
                <Route path="/medicines" element={<Medicines />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/health/setup" element={<ProtectedRoute><HealthSetup /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route
                  path="/admin"
                  element={
                    <AdminRouteGuard>
                      <AdminLayout />
                    </AdminRouteGuard>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="create-admin" element={<AdminCreateAccount />} />
                  <Route path="providers" element={<AdminProviders />} />
                  <Route path="verifications" element={<AdminVerifications />} />
                  <Route path="blood" element={<AdminBloodRequests />} />
                  <Route path="blood/requests" element={<AdminBloodRequests />} />
                  <Route path="blood/donors" element={<AdminBloodDonors />} />
                  <Route path="emergency" element={<AdminEmergencyRequests />} />
                  <Route path="doctors" element={<AdminDoctors />} />
                  <Route path="hospitals" element={<AdminHospitals />} />
                  <Route path="pharmacies" element={<AdminPharmacies />} />
                  <Route path="ambulances" element={<AdminAmbulances />} />
                  <Route path="blood" element={<AdminPage page="Blood requests" />} />
                  <Route path="emergency" element={<AdminPage page="Emergency requests" />} />
                  <Route path="appointments" element={<AdminPage page="Appointments" />} />
                  <Route path="complaints" element={<AdminComplaints />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="audit-logs" element={<AdminAuditLogs />} />
                  <Route path="notifications" element={<AdminPage page="Notifications" />} />
                  <Route path="settings" element={<AdminPage page="Settings" />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          {!isAdminRoute && <Footer />}
        </div>
        {!isAdminRoute && (
          <FloatingAssistant
            accessToken={accessToken}
            isHealthPage={location.pathname === '/health'}
            isOpen={isAssistantOpen}
            onOpenChange={setIsAssistantOpen}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
