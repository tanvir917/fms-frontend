import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';

const AuthDebug: React.FC = () => {
    const { user, loading, backendType } = useAuth();
    const location = useLocation();

    return (
        <Paper style={{
            position: 'fixed',
            top: 10,
            right: 10,
            padding: 16,
            zIndex: 9999,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            maxWidth: 300
        }}>
            <Typography variant="h6" gutterBottom>Auth Debug</Typography>
            <Typography variant="body2"><strong>Loading:</strong> {loading.toString()}</Typography>
            <Typography variant="body2"><strong>Backend:</strong> {backendType}</Typography>
            <Typography variant="body2"><strong>Current Path:</strong> {location.pathname}</Typography>
            <Typography variant="body2"><strong>User:</strong> {user ? 'Logged in' : 'Not logged in'}</Typography>
            {user && (
                <Box mt={1}>
                    <Typography variant="body2"><strong>Username:</strong> {user.username}</Typography>
                    <Typography variant="body2"><strong>Role:</strong> {user.user_type}</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {user.email}</Typography>
                </Box>
            )}
            <Typography variant="body2" mt={1}>
                <strong>LocalStorage:</strong> {localStorage.getItem('accessToken') ? 'Has token' : 'No token'}
            </Typography>
        </Paper>
    );
};

export default AuthDebug;
