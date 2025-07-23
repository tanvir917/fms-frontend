import React from 'react';
import {
    Typography,
    Grid,
    Paper,
    Box,
    Card,
    CardContent,
    CardActionArea,
    useTheme,
} from '@mui/material';
import {
    Dashboard,
    People,
    Schedule,
    Note,
    Receipt,
    TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../../components/Layout/PageLayout';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();

    const dashboardCards = [
        {
            title: 'Clients',
            description: 'Manage client information and care plans',
            icon: <People sx={{ fontSize: 40 }} />,
            path: '/clients',
            color: theme.palette.primary.main,
            roles: ['admin', 'manager', 'staff', 'supervisor'],
        },
        {
            title: 'Roster',
            description: 'View and manage work schedules',
            icon: <Schedule sx={{ fontSize: 40 }} />,
            path: '/roster',
            color: theme.palette.secondary.main,
            roles: ['admin', 'manager', 'staff', 'supervisor'],
        },
        {
            title: 'Progress Notes',
            description: 'Record and view care notes',
            icon: <Note sx={{ fontSize: 40 }} />,
            path: '/notes',
            color: theme.palette.info.main,
            roles: ['admin', 'manager', 'staff', 'supervisor'],
        },
        {
            title: 'Billing',
            description: 'Manage invoices and payments',
            icon: <Receipt sx={{ fontSize: 40 }} />,
            path: '/billing',
            color: theme.palette.success.main,
            roles: ['admin', 'manager'],
        },
        {
            title: 'Reports',
            description: 'View analytics and insights',
            icon: <TrendingUp sx={{ fontSize: 40 }} />,
            path: '/reports',
            color: theme.palette.warning.main,
            roles: ['admin', 'manager'],
        },
    ];

    const filteredCards = dashboardCards.filter(card =>
        !user || card.roles.includes(user.user_type)
    );

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <PageLayout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>
                    {getGreeting()}{user ? `, ${user.first_name}` : ''}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Welcome to CareManagement System
                </Typography>
            </Box>

            {/* Quick Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                            0
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Active Clients
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary">
                            0
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Today's Shifts
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                            0
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Completed Shifts
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                            0
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Pending Notes
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Quick Actions */}
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
                Quick Actions
            </Typography>
            <Grid container spacing={3}>
                {filteredCards.map((card) => (
                    <Grid item xs={12} sm={6} md={4} key={card.title}>
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
                                sx={{ height: '100%', p: 2 }}
                            >
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Box
                                        sx={{
                                            color: card.color,
                                            mb: 2,
                                        }}
                                    >
                                        {card.icon}
                                    </Box>
                                    <Typography variant="h6" component="h3" gutterBottom>
                                        {card.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {card.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </PageLayout>
    );
};

export default DashboardPage;
