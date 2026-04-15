import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { cn } from './lib/utils';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ResumeBuilder from './pages/ResumeBuilder';
import JobSearch from './pages/JobSearch';
import Applications from './pages/Applications';
import CoverLetter from './pages/CoverLetter';
import OneClickApply from './pages/OneClickApply';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import PublicResume from './pages/PublicResume';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {user && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
      )}
      <div className={cn(
        "transition-all duration-300",
        user ? (isCollapsed ? "ml-0 md:ml-16" : "ml-0 md:ml-64") : ""
      )}>
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main>
          {children}
        </main>
        <Toaster position="top-center" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PayPalScriptProvider options={{ "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID || "test" }}>
        <Router>
          <AppLayout>
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
                path="/magic-apply"
                element={
                  <ProtectedRoute>
                    <OneClickApply />
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
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/resume/:id" element={<PublicResume />} />
            </Routes>
          </AppLayout>
        </Router>
      </PayPalScriptProvider>
    </AuthProvider>
  );
}
