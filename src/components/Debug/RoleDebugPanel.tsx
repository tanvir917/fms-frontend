import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Paper, Typography, Chip, List, ListItem, ListItemText, Button } from '@mui/material';
import { getUserPrivilegeLevel, getUserRoleInfo, PERMISSIONS, canPerformAction } from '../../utils/roleUtils';

const RoleDebugPanel: React.FC = () => {
    const { user, logout } = useAuth();

    const handleForceRefresh = () => {
        // Clear localStorage and force re-login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.reload();
    };

    if (!user) {
        return (
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6">Role Debug Panel</Typography>
                <Typography color="text.secondary">No user logged in</Typography>
            </Paper>
        );
    }

    const privilegeLevel = getUserPrivilegeLevel(user);
    const roleInfo = getUserRoleInfo(user);

    const testPermissions = [
        'CLIENT_VIEW', 'CLIENT_CREATE', 'CLIENT_EDIT', 'CLIENT_DELETE',
        'STAFF_VIEW', 'STAFF_CREATE', 'STAFF_EDIT', 'STAFF_DELETE',
        'USER_CREATE', 'USER_EDIT', 'USER_DELETE',
        'BILLING_VIEW', 'BILLING_CREATE'
    ];

    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Role Debug Panel</Typography>

            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>User Information</Typography>
                <Typography><strong>Name:</strong> {user.first_name} {user.last_name}</Typography>
                <Typography><strong>Email:</strong> {user.email}</Typography>
                <Typography><strong>Username:</strong> {user.username}</Typography>

                <Box sx={{ mt: 2 }}>
                    <Button
                        variant="outlined"
                        color="warning"
                        onClick={handleForceRefresh}
                        size="small"
                    >
                        Force Refresh (Clear Cache)
                    </Button>
                </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Role Information</Typography>
                <Typography><strong>Primary Role:</strong> {roleInfo?.name || 'Unknown'}</Typography>
                <Typography><strong>Description:</strong> {roleInfo?.description || 'No description'}</Typography>
                <Typography><strong>Privilege Level:</strong> {privilegeLevel} / 4</Typography>

                {user.roles && user.roles.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" gutterBottom>All Roles:</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {user.roles.map(role => (
                                <Chip key={role} label={role} size="small" />
                            ))}
                        </Box>
                    </Box>
                )}

                {user.user_type && (
                    <Typography><strong>Legacy User Type:</strong> {user.user_type}</Typography>
                )}

                {/* Debug raw user object */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2" gutterBottom><strong>Raw User Object:</strong></Typography>
                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
                        {JSON.stringify(user, null, 2)}
                    </Typography>
                </Box>
            </Box>            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Permission Test</Typography>
                <List dense>
                    {testPermissions.map(permission => {
                        const hasPermission = canPerformAction(user, permission as keyof typeof PERMISSIONS);
                        return (
                            <ListItem key={permission} sx={{ py: 0 }}>
                                <ListItemText
                                    primary={permission}
                                    secondary={
                                        <Chip
                                            label={hasPermission ? 'ALLOWED' : 'DENIED'}
                                            color={hasPermission ? 'success' : 'error'}
                                            size="small"
                                        />
                                    }
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Backend Information</Typography>
                <Typography><strong>Backend:</strong> .NET Core (.NET 8)</Typography>
                <Typography><strong>Authentication:</strong> JWT Bearer Token</Typography>
                <Typography><strong>API Response Format:</strong> ApiResponse&lt;T&gt; wrapper</Typography>
            </Box>
        </Paper>
    );
};

export default RoleDebugPanel;
