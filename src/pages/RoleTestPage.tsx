import React from 'react';
import {
    Container,
    Typography,
    Paper,
    Box,
    Button,
    Alert,
    Stack
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RoleDebugPanel from '../components/Debug/RoleDebugPanel';

const RoleTestPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/auth/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack spacing={3}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        Role-Based Access Control Test
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        This page demonstrates the role-based access control system integrated
                        between the .NET backend and React frontend.
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/dashboard')}
                            sx={{ mr: 2 }}
                        >
                            Go to Dashboard
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </Box>
                </Paper>

                {user ? (
                    <RoleDebugPanel />
                ) : (
                    <Alert severity="warning">
                        No user is currently logged in. Please log in to test role-based access.
                    </Alert>
                )}

                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Test Instructions
                    </Typography>
                    <Typography variant="body2" paragraph>
                        1. Login with the default admin account (admin@caremanagement.com / Admin123!)
                    </Typography>
                    <Typography variant="body2" paragraph>
                        2. Check the Role Debug Panel above to see your role information
                    </Typography>
                    <Typography variant="body2" paragraph>
                        3. Navigate to different pages to see role-based access in action
                    </Typography>
                    <Typography variant="body2" paragraph>
                        4. Try accessing features that require different privilege levels
                    </Typography>
                </Paper>

                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Role Hierarchy
                    </Typography>
                    <Stack spacing={1}>
                        <Typography variant="body2">
                            <strong>Administrator (Level 4):</strong> Full system access
                        </Typography>
                        <Typography variant="body2">
                            <strong>Manager (Level 3):</strong> Staff management, billing, reports
                        </Typography>
                        <Typography variant="body2">
                            <strong>Supervisor (Level 2):</strong> Client management, roster management
                        </Typography>
                        <Typography variant="body2">
                            <strong>Staff (Level 1):</strong> Basic client access, notes
                        </Typography>
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    );
};

export default RoleTestPage;
