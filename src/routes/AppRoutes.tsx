import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Import pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ClientsPage from '../pages/clients/ClientsPage';
import ClientDetailPage from '../pages/clients/ClientDetailPage';
import StaffPage from '../pages/staff/StaffPage';
import RosterPage from '../pages/roster/RosterPage';
import NotesPage from '../pages/notes/NotesPage';
import BillingPage from '../pages/billing/BillingPage';
import ProfilePage from '../pages/profile/ProfilePage';
import ApiDebug from '../components/Debug/ApiDebug';
import StaffDetailPage from '../pages/staff/StaffDetailPage';

// Protected Route wrapper
interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// Public Route wrapper (redirect to dashboard if already logged in)
interface PublicRouteProps {
    children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <PublicRoute>
                        <RegisterPage />
                    </PublicRoute>
                }
            />

            {/* Protected routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/clients"
                element={
                    <ProtectedRoute>
                        <ClientsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/clients/:id"
                element={
                    <ProtectedRoute>
                        <ClientDetailPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/staff"
                element={
                    <ProtectedRoute>
                        <StaffPage />
                    </ProtectedRoute>
                }
            />
            <Route path="/staff/:id" element={<StaffDetailPage />} />
            <Route
                path="/roster"
                element={
                    <ProtectedRoute>
                        <RosterPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/notes"
                element={
                    <ProtectedRoute>
                        <NotesPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/billing"
                element={
                    <ProtectedRoute>
                        <BillingPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                }
            />

            {/* Debug route - only available in development */}
            <Route
                path="/debug"
                element={
                    <ProtectedRoute>
                        <ApiDebug />
                    </ProtectedRoute>
                }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch all route */}
            <Route
                path="*"
                element={
                    <ProtectedRoute>
                        <Navigate to="/dashboard" replace />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

export default AppRoutes;
