import React, { useState, useEffect } from 'react';
import {
    Typography,
    Paper,
    Box,
    Card,
    CardContent,
    CardActionArea,
    useTheme,
    Alert,
    CircularProgress,
    Stack,
    Button,
} from '@mui/material';
import {
    People,
    Schedule,
    Note,
    Receipt,
    TrendingUp,
    SupervisorAccount as SupervisorAccountIcon,
    ArrowForward as ArrowForwardIcon,
    AdminPanelSettings,
    Assignment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../../components/Layout/PageLayout';
import RoleBasedAccess, { AdminOnly, ManagerOrAbove, CoordinatorOrAbove } from '../../components/Auth/RoleBasedAccess';
import { clientService } from '../../services/clientService';
import { rosterService } from '../../services/rosterService';
import { staffService } from '../../services/staffService';

interface DashboardStats {
    activeClients: number;
    todayShifts: number;
    completedShifts: number;
    pendingNotes: number;
}

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();
    const [stats, setStats] = useState<DashboardStats>({
        activeClients: 0,
        todayShifts: 0,
        completedShifts: 0,
        pendingNotes: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [staffStats, setStaffStats] = useState<any>({
        total_staff: 0,
    });

    // Helper function to get user's privilege level
    const getUserPrivilegeLevel = (): number => {
        if (!user) return 0;

        const userRoles = user.roles || [user.user_type];

        if (userRoles.includes('Admin')) return 4;
        if (userRoles.includes('Manager')) return 3;
        if (userRoles.includes('Care_Coordinator')) return 2;
        if (userRoles.includes('Staff')) return 1;

        // Legacy role support
        if (userRoles.includes('Administrator') || userRoles.includes('admin')) return 4;
        if (userRoles.includes('Supervisor') || userRoles.includes('manager')) return 3;

        return 1; // Default to basic staff level
    };

    const privilegeLevel = getUserPrivilegeLevel();

    const dashboardCards = [
        {
            title: 'Clients',
            description: 'Manage client information and care plans',
            icon: <People sx={{ fontSize: 40 }} />,
            path: '/clients',
            color: theme.palette.primary.main,
            minPrivilegeLevel: 1, // All users
        },
        {
            title: 'Staff Management',
            description: 'Manage staff profiles and user accounts',
            icon: <SupervisorAccountIcon sx={{ fontSize: 40 }} />,
            path: '/staff',
            color: theme.palette.warning.main,
            minPrivilegeLevel: 3, // Manager and above
        },
        {
            title: 'Roster',
            description: 'View and manage work schedules',
            icon: <Schedule sx={{ fontSize: 40 }} />,
            path: '/roster',
            color: theme.palette.secondary.main,
            minPrivilegeLevel: 2, // Care Coordinator and above
        },
        {
            title: 'Progress Notes',
            description: 'Record and view care notes',
            icon: <Note sx={{ fontSize: 40 }} />,
            path: '/notes',
            color: theme.palette.info.main,
            minPrivilegeLevel: 1, // All users
        },
        {
            title: 'Billing',
            description: 'Manage invoices and payments',
            icon: <Receipt sx={{ fontSize: 40 }} />,
            path: '/billing',
            color: theme.palette.success.main,
            minPrivilegeLevel: 3, // Manager and above
        },
        {
            title: 'Reports',
            description: 'View analytics and insights',
            icon: <TrendingUp sx={{ fontSize: 40 }} />,
            path: '/reports',
            color: theme.palette.warning.main,
            minPrivilegeLevel: 3, // Manager and above
        },
        {
            title: 'System Admin',
            description: 'System configuration and administration',
            icon: <AdminPanelSettings sx={{ fontSize: 40 }} />,
            path: '/admin',
            color: theme.palette.error.main,
            minPrivilegeLevel: 4, // Admin only
        },
    ];

    useEffect(() => {
        if (user) {
            loadDashboardStats();
        }
    }, [user]);

    const loadDashboardStats = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load real stats from APIs
            const [clientsData, shiftsData] = await Promise.allSettled([
                clientService.getClients(),
                rosterService.getShifts(),
            ]);

            const clients = clientsData.status === 'fulfilled' ? clientsData.value : { results: [] };
            const shifts = shiftsData.status === 'fulfilled' ? shiftsData.value : { results: [] };

            const clientList = clients.results || clients || [];
            const shiftList = shifts.results || shifts || [];

            // Calculate today's date
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];

            // Calculate stats
            const activeClients = clientList.filter((client: any) => client.is_active).length;
            const todayShifts = shiftList.filter((shift: any) => {
                const shiftDate = new Date(shift.start_datetime).toISOString().split('T')[0];
                return shiftDate === todayString;
            }).length;
            const completedShifts = shiftList.filter((shift: any) => shift.status === 'completed').length;

            setStats({
                activeClients,
                todayShifts,
                completedShifts,
                pendingNotes: 0, // Will be updated when notes API is implemented
            });
        } catch (err: any) {
            console.error('Error loading dashboard stats:', err);
            // Don't show error for stats - just use default values
            setStats({
                activeClients: 0,
                todayShifts: 0,
                completedShifts: 0,
                pendingNotes: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const loadStaffStats = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load staff stats from API
            const staffData = await staffService.getStaffStats();

            setStaffStats(staffData);
        } catch (err: any) {
            console.error('Error loading staff stats:', err);
            setStaffStats({
                total_staff: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (privilegeLevel >= 3) { // Manager and above
            loadStaffStats();
        }
    }, [privilegeLevel]);

    const filteredCards = dashboardCards.filter(card =>
        privilegeLevel >= card.minPrivilegeLevel
    );

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (!user) {
        return (
            <PageLayout>
                <Alert severity="warning">
                    Please log in to view the dashboard.
                </Alert>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <Stack spacing={4}>
                {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Header Section */}
                <Box>
                    <Typography variant="h3" component="h1" gutterBottom>
                        {getGreeting()}, {user.first_name || user.username}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Welcome to Care Management System
                    </Typography>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
                        {user.roles?.[0] || user.user_type} Access Level
                    </Typography>
                </Box>

                {/* Quick Stats */}
                <Box>
                    <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
                        Overview
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 2,
                            justifyContent: 'space-between',
                        }}
                    >
                        {/* Active Clients */}
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
                            <Paper
                                sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    transition: 'transform 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: 3,
                                    },
                                    height: '100%',
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} />
                                ) : (
                                    <Stack spacing={1} alignItems="center">
                                        <Typography variant="h3" color="primary">
                                            {stats.activeClients}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Active Clients
                                        </Typography>
                                    </Stack>
                                )}
                            </Paper>
                        </Box>

                        {/* Today's Shifts */}
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
                            <Paper
                                sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    transition: 'transform 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: 3,
                                    },
                                    height: '100%',
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} />
                                ) : (
                                    <Stack spacing={1} alignItems="center">
                                        <Typography variant="h3" color="secondary">
                                            {stats.todayShifts}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Today's Shifts
                                        </Typography>
                                    </Stack>
                                )}
                            </Paper>
                        </Box>

                        {/* Completed Shifts */}
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
                            <Paper
                                sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    transition: 'transform 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: 3,
                                    },
                                    height: '100%',
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} />
                                ) : (
                                    <Stack spacing={1} alignItems="center">
                                        <Typography variant="h3" color="success.main">
                                            {stats.completedShifts}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Completed Shifts
                                        </Typography>
                                    </Stack>
                                )}
                            </Paper>
                        </Box>

                        {/* Pending Notes */}
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
                            <Paper
                                sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    transition: 'transform 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: 3,
                                    },
                                    height: '100%',
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} />
                                ) : (
                                    <Stack spacing={1} alignItems="center">
                                        <Typography variant="h3" color="warning.main">
                                            {stats.pendingNotes}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Pending Notes
                                        </Typography>
                                    </Stack>
                                )}
                            </Paper>
                        </Box>
                    </Box>
                </Box>

                {/* Staff Management Card - Manager and Above */}
                <ManagerOrAbove>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <SupervisorAccountIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Staff Management Overview
                            </Typography>
                            <Stack spacing={1}>
                                <Typography variant="h4">{staffStats.total_staff || 0}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Staff Members
                                </Typography>
                                <Button
                                    size="small"
                                    onClick={() => navigate('/staff')}
                                    startIcon={<ArrowForwardIcon />}
                                >
                                    Manage Staff
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </ManagerOrAbove>

                {/* Quick Actions */}
                <Box>
                    <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
                        Quick Actions
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 3,
                            justifyContent: 'flex-start',
                        }}
                    >
                        {filteredCards.map((card) => (
                            <Box
                                key={card.title}
                                sx={{
                                    flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' },
                                    minWidth: 280,
                                }}
                            >
                                <Card
                                    sx={{
                                        height: '100%',
                                        transition: 'transform 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 4,
                                        },
                                    }}
                                >
                                    <CardActionArea
                                        onClick={() => navigate(card.path)}
                                        sx={{ height: '100%', p: 3 }}
                                    >
                                        <CardContent sx={{ textAlign: 'center', p: 0 }}>
                                            <Stack spacing={2} alignItems="center">
                                                <Box
                                                    sx={{
                                                        color: card.color,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    {card.icon}
                                                </Box>
                                                <Typography variant="h6" component="h3">
                                                    {card.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {card.description}
                                                </Typography>
                                            </Stack>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Recent Activity Section */}
                <Box>
                    <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
                        Recent Activity
                    </Typography>
                    <Paper sx={{ p: 4 }}>
                        <Stack spacing={2} alignItems="center">
                            <Typography variant="h6" color="text.secondary">
                                No Recent Activity
                            </Typography>
                            <Typography variant="body1" color="text.secondary" textAlign="center">
                                Recent activity will appear here once you start using the system.
                                Try adding clients, creating shifts, or recording notes to see updates.
                            </Typography>
                        </Stack>
                    </Paper>
                </Box>
            </Stack>
        </PageLayout>
    );
};

export default DashboardPage;
