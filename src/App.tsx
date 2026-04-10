import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ResumeBuilder from './pages/ResumeBuilder';
import JobSearch from './pages/JobSearch';
import Applications from './pages/Applications';
import CoverLetter from './pages/CoverLetter';
import Settings from './pages/Settings';
import PublicResume from './pages/PublicResume';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export default function App() {
  return (
    <AuthProvider>
      <PayPalScriptProvider options={{ "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID || "test" }}>
        <Router>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-builder"
                element={
                  <ProtectedRoute>
                    <ResumeBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-builder/:id"
                element={
                  <ProtectedRoute>
                    <ResumeBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/job-search"
                element={
                  <ProtectedRoute>
                    <JobSearch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications"
                element={
                  <ProtectedRoute>
                    <Applications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cover-letter"
                element={
                  <ProtectedRoute>
                    <CoverLetter />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="/resume/:id" element={<PublicResume />} />
            </Routes>
          </main>
          <Toaster position="top-center" />
        </div>
      </Router>
      </PayPalScriptProvider>
    </AuthProvider>
  );
}
