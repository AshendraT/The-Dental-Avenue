import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';

// Pages
import Home from './pages/Home';
import Contact from './pages/Contact';
import BookAppointment from './pages/BookAppointment';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Layout wrapper for standard public/patient pages
const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

// Route wrapper to redirect to admin console if accessing the root path on admin subdomain
const HomeWrapper = () => {
  const isAdminSubdomain = window.location.hostname.startsWith('admin.');
  if (isAdminSubdomain) {
    return <Navigate to="/admin" replace />;
  }
  return (
    <MainLayout>
      <Home />
    </MainLayout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              
              {/* Standard Public Pages (with Navbar and Footer) */}
              <Route path="/" element={<HomeWrapper />} />
              <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
              
              {/* Protected Patient Pages */}
              <Route
                path="/book"
                element={
                  <ProtectedRoute allowedRoles={['patient', 'admin']}>
                    <MainLayout>
                      <BookAppointment />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <MainLayout>
                      <PatientDashboard />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Console (No Footer, custom layouts) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Authentication Routes (Standard full screen form layouts) */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Fallback 404 (with Navbar and Footer) */}
              <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />

            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
