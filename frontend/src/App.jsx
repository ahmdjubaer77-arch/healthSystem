import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import FloatingAssistant from './components/chat/FloatingAssistant'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ErrorBoundary from './components/common/ErrorBoundary'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRouteGuard from './components/auth/AdminRouteGuard'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminCreateAccount from './pages/AdminCreateAccount'
import AdminProviders from './pages/AdminProviders'
import AdminHospitals from './pages/AdminHospitals'
import AdminDoctors from './pages/AdminDoctors'
import AdminPharmacies from './pages/AdminPharmacies'
import AdminAmbulances from './pages/AdminAmbulances'
import AdminVerifications from './pages/AdminVerifications'
import AdminBloodRequests from './pages/AdminBloodRequests'
import AdminEmergencyRequests from './pages/AdminEmergencyRequests'
import AdminBloodDonors from './pages/AdminBloodDonors'
import AdminAnalytics from './pages/AdminAnalytics'
import AdminAuditLogs from './pages/AdminAuditLogs'
import AdminPage from './pages/AdminPage'
import AdminComplaints from './pages/AdminComplaints'
import Home from './pages/Home'
import Health from './pages/Health'
import Emergency from './pages/Emergency'
import Blood from './pages/Blood'
import BloodRequest from './pages/BloodRequest'
import BloodRequestDetails from './pages/BloodRequestDetails'
import Hospitals from './pages/Hospitals'
import HospitalDetails from './pages/HospitalDetails'
import NearbyHospitals from './pages/NearbyHospitals'
import NearbyHospitalDetails from './pages/NearbyHospitalDetails'
import Ambulances from './pages/Ambulances'
import Doctors from './pages/Doctors'
import DoctorDetails from './pages/DoctorDetails'
import DoctorAppointment from './pages/DoctorAppointment'
import Providers from './pages/Providers'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import VerifyEmail from './pages/VerifyEmail'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import Privacy from './pages/Privacy'
import HealthSetup from './pages/HealthSetup'
import NotFound from './pages/NotFound'
import { useAuth } from './context/AuthContext'

function App() {
  const location = useLocation()
  const { accessToken } = useAuth()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const showAssistant = location.pathname === '/' || location.pathname === '/health'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <ErrorBoundary>
      <div className="app-shell min-h-screen text-[var(--text-soft)]">
        <div className="mx-auto max-w-[1440px] px-3 pb-10 pt-3 sm:px-5 lg:px-8">
          {!isAdminRoute && <Navbar />}
          <main className="mt-5">
            <Routes location={location}>
              <Route path="/" element={<Home />} />
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
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/health/setup" element={<ProtectedRoute><HealthSetup /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
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
                <Route path="reviews" element={<AdminPage page="Reviews" />} />
                <Route path="complaints" element={<AdminComplaints />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
                <Route path="notifications" element={<AdminPage page="Notifications" />} />
                <Route path="settings" element={<AdminPage page="Settings" />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          {!isAdminRoute && <Footer />}
        </div>
        {showAssistant && <FloatingAssistant accessToken={accessToken} isHealthPage={location.pathname === '/health'} />}
      </div>
    </ErrorBoundary>
  )
}

export default App
