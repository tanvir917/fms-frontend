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

    const menuItems = [
        { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['admin', 'manager', 'staff', 'supervisor'] },
        { text: 'Clients', icon: <People />, path: '/clients', roles: ['admin', 'manager', 'staff', 'supervisor'] },
        { text: 'Staff', icon: <Group />, path: '/staff', roles: ['admin', 'manager'] },
        { text: 'Roster', icon: <Schedule />, path: '/roster', roles: ['admin', 'manager', 'staff', 'supervisor'] },
        { text: 'Notes', icon: <Note />, path: '/notes', roles: ['admin', 'manager', 'staff', 'supervisor'] },
        { text: 'Billing', icon: <Receipt />, path: '/billing', roles: ['admin', 'manager'] },
    ];

    const filteredMenuItems = menuItems.filter(item =>
        !user || item.roles.includes(user.user_type)
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
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}

                {user && (user.user_type == "Administrator") && (
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => navigate('/staff')}>
                            <ListItemIcon>
                                <SupervisorAccountIcon />
                            </ListItemIcon>
                            <ListItemText primary="Staff Management" />
                        </ListItemButton>
                    </ListItem>
                )}
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
                        CareManagement System
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
                                width: 240,
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
                                width: 240,
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
