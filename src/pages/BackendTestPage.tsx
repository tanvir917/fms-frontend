import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Alert,
    Chip,
    CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { staffService } from '../services/staffService';

const BackendTestPage: React.FC = () => {
    const { user, backendType } = useAuth();
    const [staffStats, setStaffStats] = useState<any>(null);
    const [staffList, setStaffList] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const testStaffStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const stats = await staffService.getStaffStats();
            setStaffStats(stats);
        } catch (err: any) {
            setError(err.message || 'Failed to get staff stats');
        } finally {
            setLoading(false);
        }
    };

    const testStaffList = async () => {
        setLoading(true);
        setError(null);
        try {
            const staff = await staffService.getStaffProfiles({ page: 1, pageSize: 5 });
            setStaffList(staff);
        } catch (err: any) {
            setError(err.message || 'Failed to get staff list');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Auto-test staff stats on component mount
        testStaffStats();
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Backend Integration Test
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Chip
                    label={`Backend: ${backendType}`}
                    color={backendType.includes('.NET') ? 'primary' : 'secondary'}
                    variant="outlined"
                    sx={{ mr: 2 }}
                />
                {user && (
                    <Chip
                        label={`User: ${user.username}`}
                        color="success"
                        variant="outlined"
                    />
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                    variant="contained"
                    onClick={testStaffStats}
                    disabled={loading}
                >
                    Test Staff Stats
                </Button>
                <Button
                    variant="outlined"
                    onClick={testStaffList}
                    disabled={loading}
                >
                    Test Staff List
                </Button>
                {loading && <CircularProgress size={24} />}
            </Box>

            {staffStats && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Staff Statistics
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Total Staff</Typography>
                                <Typography variant="h6">{staffStats.total_staff || 0}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Active Staff</Typography>
                                <Typography variant="h6">{staffStats.active_staff || 0}</Typography>
                            </Box>
                            {staffStats.on_leave !== undefined && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">On Leave</Typography>
                                    <Typography variant="h6">{staffStats.on_leave}</Typography>
                                </Box>
                            )}
                        </Box>
                        {staffStats.department_breakdown && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Department Breakdown
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {Object.entries(staffStats.department_breakdown).map(([dept, count]) => (
                                        <Chip
                                            key={dept}
                                            label={`${dept}: ${count}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}

            {staffList && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Staff List (Page 1, First 5)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Total Count: {staffList.count || staffList.results?.length || 0}
                        </Typography>
                        {(staffList.results || []).map((staff: any) => (
                            <Box
                                key={staff.id}
                                sx={{
                                    p: 2,
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    mb: 1,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <Box>
                                    <Typography variant="body1">
                                        {staff.full_name || `${staff.user_first_name} ${staff.user_last_name}`}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {staff.employee_id} • {staff.department} • {staff.position}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={staff.is_active ? 'Active' : 'Inactive'}
                                    color={staff.is_active ? 'success' : 'default'}
                                    size="small"
                                />
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default BackendTestPage;
