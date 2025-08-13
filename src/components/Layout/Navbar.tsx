import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard,
    People,
    Group,
    Schedule,
    Note,
    Receipt,
    AccountCircle,
    Logout,
    SupervisorAccount as SupervisorAccountIcon,
    AdminPanelSettings,
    PersonAdd,
    Assignment,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        await logout();
        handleClose();
        navigate('/login');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Helper function to check if user has required role
    const hasRole = (requiredRoles: string[]): boolean => {
        if (!user) return false;

        // Check both the roles array (for .NET backend) and user_type (for Django backend)
        const userRoles = user.roles || [user.user_type];
        return requiredRoles.some(role => userRoles.includes(role));
    };

    // Helper function to get user's highest privilege level
    const getUserPrivilegeLevel = (): number => {
        if (!user) return 0;

        const userRoles = user.roles || [user.user_type];

        if (userRoles.includes('Admin')) return 4;
        if (userRoles.includes('Manager')) return 3;
        if (userRoles.includes('Care_Coordinator')) return 2;
        if (userRoles.includes('Staff')) return 1;

        // Legacy role support
        if (userRoles.includes('Administrator')) return 4;
        if (userRoles.includes('Supervisor')) return 3;

        return 1; // Default to basic staff level
    };

    const privilegeLevel = getUserPrivilegeLevel();

    const menuItems = [
        {
            text: 'Dashboard',
            icon: <Dashboard />,
            path: '/dashboard',
            minPrivilegeLevel: 1, // All users
            description: 'View system overview and key metrics'
        },
        {
            text: 'Clients',
            icon: <People />,
            path: '/clients',
            minPrivilegeLevel: 1, // All users can view clients
            description: 'Manage client information and care plans'
        },
        {
            text: 'Staff Management',
            icon: <Group />,
            path: '/staff',
            minPrivilegeLevel: 3, // Manager and Admin only
            description: 'Manage staff profiles and user accounts'
        },
        {
            text: 'Roster',
            icon: <Schedule />,
            path: '/roster',
            minPrivilegeLevel: 2, // Care Coordinator and above
            description: 'View and manage staff schedules'
        },
        {
            text: 'Notes',
            icon: <Note />,
            path: '/notes',
            minPrivilegeLevel: 1, // All users
            description: 'Access client care notes and documentation'
        },
        {
            text: 'Billing',
            icon: <Receipt />,
            path: '/billing',
            minPrivilegeLevel: 3, // Manager and Admin only
            description: 'Handle billing and financial operations'
        },
    ];

    // Admin-only features
    const adminMenuItems = privilegeLevel >= 4 ? [
        {
            text: 'System Admin',
            icon: <AdminPanelSettings />,
            path: '/admin',
            minPrivilegeLevel: 4,
            description: 'System administration and configuration'
        }
    ] : [];

    const filteredMenuItems = [...menuItems, ...adminMenuItems].filter(item =>
        privilegeLevel >= item.minPrivilegeLevel
    );

    const drawer = (
        <div>
            <Toolbar />
            <List>
                {filteredMenuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                if (isMobile) {
                                    setMobileOpen(false);
                                }
                            }}
                            title={item.description}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                secondary={privilegeLevel >= 4 ? item.description : undefined}
                                secondaryTypographyProps={{
                                    fontSize: '0.75rem',
                                    color: 'text.secondary'
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    // Don't show navbar on auth pages
    if (!user && (location.pathname === '/login' || location.pathname === '/register')) {
        return null;
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    {user && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { md: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Care Management System
                        {user && (
                            <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                {user.roles?.[0] || user.user_type} Access
                            </Typography>
                        )}
                    </Typography>

                    {user ? (
                        <div>
                            <IconButton
                                size="large"
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleMenu}
                                color="inherit"
                            >
                                <Avatar sx={{ width: 32, height: 32 }}>
                                    {user.first_name?.[0] || user.username?.[0] || 'U'}
                                </Avatar>
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>
                                    <AccountCircle sx={{ mr: 1 }} />
                                    Profile
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <Logout sx={{ mr: 1 }} />
                                    Logout
                                </MenuItem>
                            </Menu>
                        </div>
                    ) : (
                        <Box>
                            <Button color="inherit" onClick={() => navigate('/login')}>
                                Login
                            </Button>
                            <Button color="inherit" onClick={() => navigate('/register')}>
                                Register
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            {user && (
                <>
                    {/* Desktop drawer */}
                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: 'none', md: 'block' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: 260, // Slightly wider to accommodate descriptions
                            },
                        }}
                        open
                    >
                        {drawer}
                    </Drawer>

                    {/* Mobile drawer */}
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{
                            keepMounted: true, // Better open performance on mobile.
                        }}
                        sx={{
                            display: { xs: 'block', md: 'none' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: 260,
                            },
                        }}
                    >
                        {drawer}
                    </Drawer>
                </>
            )}
        </Box>
    );
};

export default Navbar;
