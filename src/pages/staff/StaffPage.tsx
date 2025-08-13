import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Paper,
  Chip,
  Avatar,
  Tooltip,
  Stack,
  Switch,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridActionsCellItem,
  GridRowParams,
} from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as VisibilityIcon,
  PersonAdd as PersonAddIcon,
  Visibility as ViewIcon,
  VpnKey as PasswordResetIcon,
} from '@mui/icons-material';
import PageLayout from '../../components/Layout/PageLayout';
import RoleBasedAccess, { AdminOnly, ManagerOrAbove } from '../../components/Auth/RoleBasedAccess';
import { useAuth } from '../../contexts/AuthContext';
import staffService, { StaffProfile, User } from '../../services/staffService';
import StaffAvailabilityManager from '../../components/staff/StaffAvailabilityManager';
import StaffLeaveManager from '../../components/staff/StaffLeaveManager';
import { useNavigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Interface for user form data that includes password field
interface UserFormData extends Partial<User> {
  password?: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`staff-tabpanel-${index}`}
      aria-labelledby={`staff-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StaffPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Helper function to get user privilege level
  const getUserPrivilegeLevel = () => {
    if (!user) {
      return 0;
    }

    const rolePrivileges: { [key: string]: number } = {
      'Admin': 4,
      'Manager': 3,
      'Care_Coordinator': 2,
      'Staff': 1
    };

    // Try to use roles array first, fallback to user_type
    let privilegeLevel = 0;

    if (user.roles && user.roles.length > 0) {
      privilegeLevel = Math.max(...user.roles.map(role => rolePrivileges[role] || 0));
    } else if (user.user_type) {
      privilegeLevel = rolePrivileges[user.user_type] || 0;
    }

    return privilegeLevel;
  };  // Helper function to check if user can perform action
  const canPerformAction = (action: string) => {
    const privilegeLevel = getUserPrivilegeLevel();
    console.log(`Debug - Checking action '${action}' with privilege level:`, privilegeLevel);

    switch (action) {
      case 'create':
        return privilegeLevel >= 3; // Manager or above
      case 'edit':
        return privilegeLevel >= 2; // Care Coordinator or above
      case 'delete':
        return privilegeLevel >= 4; // Admin only
      case 'view':
        return privilegeLevel >= 1; // All authenticated users
      default:
        return false;
    }
  };
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [openStaffDialog, setOpenStaffDialog] = useState(false);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form data - using UserFormData interface that includes password
  const [staffFormData, setStaffFormData] = useState<Partial<StaffProfile>>({
    userId: 0,
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: 'care',
    position: 'care_worker',
    employmentType: 'full_time',
    startDate: '',
    hourlyRate: 0,
    dateOfBirth: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    availableWeekdays: true,
    availableWeekends: false,
    availableNights: false,
    isActive: true,
  });

  const [userFormData, setUserFormData] = useState<UserFormData>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    roles: [],
    password: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Check if user is admin - Fixed to handle the actual user_type values
  const isAdmin = user?.user_type === "Admin" ||
    user?.user_type === "Administrator" ||
    user?.user_type === "manager" ||
    user?.user_type === "Manager";

  // Debug logging to see the user object structure
  useEffect(() => {
    console.log('Current user object:', user);
    console.log('User user_type:', user?.user_type);
    console.log('isAdmin calculated as:', isAdmin);
  }, [user, isAdmin]);

  useEffect(() => {
    if (user && isAdmin) {
      loadData();
    } else if (user && !isAdmin) {
      setError('You do not have permission to access staff management');
    }
  }, [user, isAdmin]);

  const validateStaffForm = () => {
    const errors: Record<string, string> = {};

    // User selection is required
    if (!staffFormData.userId || staffFormData.userId === 0) {
      errors.userId = 'Please select a user account to link to this staff profile';
    }

    // Required field validation (skip name and email if user is selected)
    if (!staffFormData.userId && !staffFormData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!staffFormData.userId && !staffFormData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!staffFormData.userId && !staffFormData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!staffFormData.userId && staffFormData.email) {
      // Email format validation only if not auto-filled
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(staffFormData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Always validate these fields
    if (!staffFormData.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }
    if (!staffFormData.position?.trim()) {
      errors.position = 'Position is required';
    }
    if (!staffFormData.department?.trim()) {
      errors.department = 'Department is required';
    }
    if (!staffFormData.dateOfBirth?.trim()) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    if (!staffFormData.startDate?.trim()) {
      errors.startDate = 'Start date is required';
    }
    if (!staffFormData.employeeId?.trim()) {
      errors.employeeId = 'Employee ID is required';
    }
    if (!staffFormData.addressLine1?.trim()) {
      errors.addressLine1 = 'Address is required';
    }
    if (!staffFormData.city?.trim()) {
      errors.city = 'City is required';
    }
    if (!staffFormData.state?.trim()) {
      errors.state = 'State is required';
    }
    if (!staffFormData.postalCode?.trim()) {
      errors.postalCode = 'Postal code is required';
    }
    if (!staffFormData.emergencyContactName?.trim()) {
      errors.emergencyContactName = 'Emergency contact name is required';
    }
    if (!staffFormData.emergencyContactPhone?.trim()) {
      errors.emergencyContactPhone = 'Emergency contact phone is required';
    }
    if (staffFormData.hourlyRate !== undefined && staffFormData.hourlyRate < 0) {
      errors.hourlyRate = 'Hourly rate must be positive';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [staffData, usersData] = await Promise.all([
        staffService.getStaffProfiles(),
        staffService.getUsers().catch(() => ({ results: [] })),
      ]);

      setStaffProfiles(Array.isArray(staffData) ? staffData : staffData.results || []);
      setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
    } catch (err: any) {
      console.error('Error loading staff data:', err);
      setError(err.response?.data?.message || 'Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStaff = async () => {
    try {
      // Clear previous errors
      setError(null);
      setFormErrors({});

      // Validate form
      if (!validateStaffForm()) {
        setError('Please fix the validation errors below');
        return;
      }

      if (selectedStaff) {
        await staffService.updateStaffProfile(selectedStaff.id, {
          firstName: staffFormData.firstName || '',
          lastName: staffFormData.lastName || '',
          email: staffFormData.email || '',
          phoneNumber: staffFormData.phoneNumber || '',
          position: staffFormData.position || '',
          department: staffFormData.department || '',
          employmentType: staffFormData.employmentType || '',
          hourlyRate: staffFormData.hourlyRate || 0,
          dateOfBirth: staffFormData.dateOfBirth || new Date().toISOString().split('T')[0],
          addressLine1: staffFormData.addressLine1 || '',
          addressLine2: staffFormData.addressLine2,
          city: staffFormData.city || '',
          state: staffFormData.state || '',
          postalCode: staffFormData.postalCode || '',
          qualifications: staffFormData.qualifications,
          certifications: staffFormData.certifications,
          preferredHoursPerWeek: staffFormData.preferredHoursPerWeek,
          availableWeekdays: staffFormData.availableWeekdays ?? true,
          availableWeekends: staffFormData.availableWeekends ?? false,
          availableNights: staffFormData.availableNights ?? false,
          emergencyContactName: staffFormData.emergencyContactName || '',
          emergencyContactPhone: staffFormData.emergencyContactPhone || '',
          emergencyContactRelationship: staffFormData.emergencyContactRelationship || '',
          startDate: staffFormData.startDate || new Date().toISOString().split('T')[0],
          endDate: staffFormData.endDate,
          isActive: staffFormData.isActive ?? true
        });
        setSuccess('Staff profile updated successfully');
      } else {
        console.log('Creating staff profile with data:', {
          userId: staffFormData.userId || 0,
          firstName: staffFormData.firstName || '',
          lastName: staffFormData.lastName || '',
          email: staffFormData.email || '',
          phoneNumber: staffFormData.phoneNumber || '',
          position: staffFormData.position || 'care_worker',
          department: staffFormData.department || 'care',
          employmentType: staffFormData.employmentType || 'full_time',
          hourlyRate: staffFormData.hourlyRate || 0,
          dateOfBirth: staffFormData.dateOfBirth || new Date().toISOString().split('T')[0],
          addressLine1: staffFormData.addressLine1 || '',
          addressLine2: staffFormData.addressLine2,
          city: staffFormData.city || '',
          state: staffFormData.state || '',
          postalCode: staffFormData.postalCode || '',
          qualifications: staffFormData.qualifications,
          certifications: staffFormData.certifications,
          preferredHoursPerWeek: staffFormData.preferredHoursPerWeek,
          availableWeekdays: staffFormData.availableWeekdays ?? true,
          availableWeekends: staffFormData.availableWeekends ?? false,
          availableNights: staffFormData.availableNights ?? false,
          emergencyContactName: staffFormData.emergencyContactName || '',
          emergencyContactPhone: staffFormData.emergencyContactPhone || '',
          emergencyContactRelationship: staffFormData.emergencyContactRelationship || '',
          startDate: staffFormData.startDate || new Date().toISOString().split('T')[0]
        });

        await staffService.createStaffProfile({
          userId: staffFormData.userId || 0,
          firstName: staffFormData.firstName || '',
          lastName: staffFormData.lastName || '',
          email: staffFormData.email || '',
          phoneNumber: staffFormData.phoneNumber || '',
          position: staffFormData.position || 'care_worker',
          department: staffFormData.department || 'care',
          employmentType: staffFormData.employmentType || 'full_time',
          hourlyRate: staffFormData.hourlyRate || 0,
          dateOfBirth: staffFormData.dateOfBirth || new Date().toISOString().split('T')[0],
          addressLine1: staffFormData.addressLine1 || '',
          addressLine2: staffFormData.addressLine2,
          city: staffFormData.city || '',
          state: staffFormData.state || '',
          postalCode: staffFormData.postalCode || '',
          qualifications: staffFormData.qualifications,
          certifications: staffFormData.certifications,
          preferredHoursPerWeek: staffFormData.preferredHoursPerWeek,
          availableWeekdays: staffFormData.availableWeekdays ?? true,
          availableWeekends: staffFormData.availableWeekends ?? false,
          availableNights: staffFormData.availableNights ?? false,
          emergencyContactName: staffFormData.emergencyContactName || '',
          emergencyContactPhone: staffFormData.emergencyContactPhone || '',
          emergencyContactRelationship: staffFormData.emergencyContactRelationship || '',
          startDate: staffFormData.startDate || new Date().toISOString().split('T')[0]
        });
        setSuccess('Staff profile created successfully');
      }
      handleCloseStaffDialog();
      loadData();
    } catch (err: any) {
      console.error('Staff save error:', err);
      if (err.response?.data) {
        console.error('Error details:', err.response.data);
      }
      setError(err.message || err.response?.data?.message || 'Failed to save staff profile');
    }
  };

  const handleSaveUser = async () => {
    try {
      if (selectedUser) {
        // For updates, handle password separately if user is admin
        const updateData = { ...userFormData };
        const passwordToSet = updateData.password;
        delete updateData.password; // Remove password from update data

        // Update user details first
        await staffService.updateUser(selectedUser.id!, updateData);

        // If password is provided and user is admin, use admin password reset
        if (passwordToSet && passwordToSet.trim() !== '') {
          const privilegeLevel = getUserPrivilegeLevel();
          if (privilegeLevel >= 4) { // Admin level
            await staffService.adminChangePassword(selectedUser.id!, passwordToSet);
          }
        }

        setSuccess('User updated successfully');
      } else {
        // For creation, password is required
        await staffService.createUser(userFormData as User & { password: string });
        setSuccess('User created successfully');
      }
      handleCloseUserDialog();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDeleteStaff = async (staffId: number) => {
    if (window.confirm('Are you sure you want to delete this staff profile?')) {
      try {
        await staffService.deleteStaffProfile(staffId);
        setSuccess('Staff profile deleted successfully');
        loadData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete staff profile');
      }
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await staffService.deleteUser(userId);
        setSuccess('User deleted successfully');
        loadData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleResetPassword = async (userId: number, userName: string) => {
    const newPassword = prompt(`Enter new password for ${userName}:`);
    if (newPassword && newPassword.trim() !== '') {
      try {
        await staffService.adminChangePassword(userId, newPassword);
        setSuccess(`Password reset successfully for ${userName}`);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to reset password');
      }
    }
  };

  const handleOpenStaffDialog = (staff?: StaffProfile) => {
    setSelectedStaff(staff || null);
    setStaffFormData(staff || {
      userId: 0,
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      department: 'care',
      position: 'care_worker',
      employmentType: 'full_time',
      startDate: '',
      hourlyRate: 0,
      dateOfBirth: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      availableWeekdays: true,
      availableWeekends: false,
      availableNights: false,
      isActive: true,
    });
    setError(null);
    setFormErrors({});
    setOpenStaffDialog(true);
  };

  const handleCloseStaffDialog = () => {
    setOpenStaffDialog(false);
    setSelectedStaff(null);
    setStaffFormData({});
    setError(null);
    setFormErrors({});
  };

  const handleOpenUserDialog = (user?: User) => {
    setSelectedUser(user || null);
    setUserFormData(
      user ? {
        ...user,
        password: '', // Don't populate password for existing users
      } : {
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        roles: [],
        password: '',
      }
    );
    setOpenUserDialog(true);
  };

  const handleCloseUserDialog = () => {
    setOpenUserDialog(false);
    setSelectedUser(null);
    setUserFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      roles: [],
      password: '',
    });
    setError(null);
  };

  const getDepartmentColor = (department: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
      nursing: 'error',
      care: 'primary',
      admin: 'secondary',
      management: 'warning',
      support: 'success',
    };
    return colors[department] || 'default';
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'manager':
      case 'supervisor':
      case 'team_leader':
      case 'coordinator':
        return <AdminIcon />;
      case 'registered_nurse':
      case 'nurse':
        return <PersonIcon color="error" />;
      case 'social_worker':
        return <PersonIcon color="info" />;
      case 'care_worker':
      case 'carer':
      case 'support_worker':
      default:
        return <PersonIcon />;
    }
  };

  const staffColumns: GridColDef[] = [
    {
      field: 'full_name',
      headerName: 'Name',
      width: 200,
      valueGetter: (_value, row) => `${row.firstName || ''} ${row.lastName || ''}`,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          {getPositionIcon(params.row.position)}
          <span>{params.value}</span>
        </Stack>
      ),
    },
    {
      field: 'employeeId',
      headerName: 'Employee ID',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value || 'Auto-generated'}
          variant="outlined"
          size="small"
          color="primary"
        />
      ),
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value?.charAt(0).toUpperCase() + params.value?.slice(1)}
          color={getDepartmentColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'position',
      headerName: 'Position',
      width: 130,
      renderCell: (params) => (
        <span>
          {typeof params.value === 'string' ? params.value.charAt(0).toUpperCase() + params.value.slice(1) : ''}
        </span>
      ),
    },
    {
      field: 'employmentType',
      headerName: 'Employment',
      width: 120,
      renderCell: (params) => (
        <span>
          {typeof params.value === 'string' ? params.value.replace('_', ' ').toUpperCase() : ''}
        </span>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params: GridRowParams) => {
        const actions = [];

        if (canPerformAction('view')) {
          actions.push(
            <GridActionsCellItem
              icon={<ViewIcon />}
              label="View"
              onClick={() => navigate(`/staff/${params.id}`)}
            />
          );
        }

        if (canPerformAction('edit')) {
          actions.push(
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() => handleOpenStaffDialog(params.row)}
            />
          );
        }

        if (canPerformAction('delete')) {
          actions.push(
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              onClick={() => handleDeleteStaff(params.id as number)}
              showInMenu
            />
          );
        }

        return actions;
      },
    },
  ];

  const userColumns: GridColDef[] = [
    {
      field: 'username',
      headerName: 'Username',
      width: 150,
    },
    {
      field: 'full_name',
      headerName: 'Full Name',
      width: 200,
      valueGetter: (_value, row) => `${row.firstName} ${row.lastName}`,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
    },
    {
      field: 'roles',
      headerName: 'Roles',
      width: 150,
      renderCell: (params) => (
        <span>
          {Array.isArray(params.value) ? params.value.join(', ') : ''}
        </span>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params: GridRowParams) => {
        const actions = [];

        if (canPerformAction('edit')) {
          actions.push(
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() => handleOpenUserDialog(params.row)}
            />
          );
        }

        // Admin-only password reset action
        if (getUserPrivilegeLevel() >= 4) {
          actions.push(
            <GridActionsCellItem
              icon={<PasswordResetIcon />}
              label="Reset Password"
              onClick={() => handleResetPassword(params.id as number, params.row.username)}
              showInMenu
            />
          );
        }

        if (canPerformAction('delete')) {
          actions.push(
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              onClick={() => handleDeleteUser(params.id as number)}
              showInMenu
            />
          );
        }

        return actions;
      },
    },
  ];

  // Show loading state while user is being loaded
  if (!user) {
    return (
      <PageLayout>
        <Container maxWidth="lg">
          <Typography>Loading...</Typography>
        </Container>
      </PageLayout>
    );
  }

  // Check permissions and show error if not authorized
  if (!isAdmin) {
    return (
      <PageLayout>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 2 }}>
            You do not have permission to access staff management. Please contact your administrator.
          </Alert>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Debug Info:</strong><br />
              - user_type: {user?.user_type || 'undefined'}<br />
              - username: {user?.username || 'undefined'}<br />
              - is_active: {user?.is_active ? 'true' : 'false'}
            </Typography>
          </Alert>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Container maxWidth="lg">
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Staff Management
          </Typography>
          <Stack direction="row" spacing={2}>
            <ManagerOrAbove>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenUserDialog()}
              >
                Add User
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenStaffDialog()}
              >
                Add Staff
              </Button>
            </ManagerOrAbove>
            <RoleBasedAccess requiredPrivilegeLevel={2}>
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => setTabValue(0)}
                color={tabValue === 0 ? 'primary' : 'inherit'}
              >
                View Staff
              </Button>
            </RoleBasedAccess>
          </Stack>
        </Stack>

        {/* Quick Stats */}
        <Stack direction="row" spacing={2} mb={3}>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonIcon color="primary" />
                <Box>
                  <Typography variant="h6">{Array.isArray(staffProfiles) ? staffProfiles.length : 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Staff
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AdminIcon color="secondary" />
                <Box>
                  <Typography variant="h6">{Array.isArray(users) ? users.filter(u => u.roles && (u.roles.includes('Carer') || u.roles.includes('Care_Coordinator'))).length : 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    System Users
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonIcon color="success" />
                <Box>
                  <Typography variant="h6">
                    {Array.isArray(staffProfiles) ? staffProfiles.filter(s => s.isActive).length : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Staff
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Tabs */}
        <Paper sx={{ width: '100%' }}>
          <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)}>
            <Tab label={`Staff Profiles (${Array.isArray(staffProfiles) ? staffProfiles.length : 0})`} />
            <Tab label={`System Users (${Array.isArray(users) ? users.length : 0})`} />
            <Tab label="Availability" />
            <Tab label="Leave Requests" />
          </Tabs>

          {/* Staff Profiles Tab */}
          <TabPanel value={tabValue} index={0}>
            <DataGrid
              rows={Array.isArray(staffProfiles) ? staffProfiles : []}
              columns={staffColumns}
              loading={loading}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 },
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              autoHeight
              sx={{ mt: 2 }}
            />
          </TabPanel>

          {/* System Users Tab */}
          <TabPanel value={tabValue} index={1}>
            <DataGrid
              rows={Array.isArray(users) ? users : []}
              columns={userColumns}
              loading={loading}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 },
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              autoHeight
              sx={{ mt: 2 }}
            />
          </TabPanel>

          {/* Availability Tab */}
          <TabPanel value={tabValue} index={2}>
            <StaffAvailabilityManager staffProfiles={staffProfiles} onUpdate={loadData} />
          </TabPanel>

          {/* Leave Requests Tab */}
          <TabPanel value={tabValue} index={3}>
            <StaffLeaveManager staffProfiles={staffProfiles} onUpdate={loadData} />
          </TabPanel>
        </Paper>

        {/* Staff Profile Dialog */}
        <Dialog open={openStaffDialog} onClose={handleCloseStaffDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedStaff ? 'Edit Staff Profile' : 'Create Staff Profile'}
            {!selectedStaff && (
              <Typography variant="caption" display="block" color="text.secondary">
                Employee ID will be auto-generated (e.g., EMP20250001)
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth error={!!formErrors.userId}>
                <InputLabel>User *</InputLabel>
                <Select
                  value={staffFormData.userId || ''}
                  onChange={(e) => {
                    const selectedUserId = e.target.value as number;
                    const selectedUser = users.find(u => u.id === selectedUserId);

                    setStaffFormData({
                      ...staffFormData,
                      userId: selectedUserId,
                      firstName: selectedUser?.firstName || '',
                      lastName: selectedUser?.lastName || '',
                      email: selectedUser?.email || ''
                    });

                    // Clear validation errors for auto-populated fields
                    setFormErrors({
                      ...formErrors,
                      userId: '',
                      firstName: '',
                      lastName: '',
                      email: ''
                    });
                  }}
                >
                  <MenuItem value="">
                    <em>Select a user (required)</em>
                  </MenuItem>
                  {Array.isArray(users) && users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.userId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {formErrors.userId}
                  </Typography>
                )}
              </FormControl>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="First Name"
                  value={staffFormData.firstName || ''}
                  onChange={(e) => {
                    setStaffFormData({ ...staffFormData, firstName: e.target.value });
                    if (formErrors.firstName) {
                      setFormErrors({ ...formErrors, firstName: '' });
                    }
                  }}
                  fullWidth
                  required
                  disabled={!!staffFormData.userId}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName || (staffFormData.userId ? "Auto-filled from selected user" : "")}
                />
                <TextField
                  label="Last Name"
                  value={staffFormData.lastName || ''}
                  onChange={(e) => {
                    setStaffFormData({ ...staffFormData, lastName: e.target.value });
                    if (formErrors.lastName) {
                      setFormErrors({ ...formErrors, lastName: '' });
                    }
                  }}
                  fullWidth
                  required
                  disabled={!!staffFormData.userId}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName || (staffFormData.userId ? "Auto-filled from selected user" : "")}
                />
              </Stack>

              <TextField
                label="Email"
                type="email"
                value={staffFormData.email || ''}
                onChange={(e) => {
                  setStaffFormData({ ...staffFormData, email: e.target.value });
                  if (formErrors.email) {
                    setFormErrors({ ...formErrors, email: '' });
                  }
                }}
                fullWidth
                required
                disabled={!!staffFormData.userId}
                error={!!formErrors.email}
                helperText={formErrors.email || (staffFormData.userId ? "Auto-filled from selected user" : "")}
              />

              <TextField
                label="Phone Number"
                value={staffFormData.phoneNumber || ''}
                onChange={(e) => {
                  setStaffFormData({ ...staffFormData, phoneNumber: e.target.value });
                  if (formErrors.phoneNumber) {
                    setFormErrors({ ...formErrors, phoneNumber: '' });
                  }
                }}
                fullWidth
                required
                error={!!formErrors.phoneNumber}
                helperText={formErrors.phoneNumber}
              />

              <Stack direction="row" spacing={2}>
                <FormControl fullWidth error={!!formErrors.department}>
                  <InputLabel>Department *</InputLabel>
                  <Select
                    value={staffFormData.department || 'care'}
                    onChange={(e) => {
                      setStaffFormData({ ...staffFormData, department: e.target.value as any });
                      if (formErrors.department) {
                        setFormErrors({ ...formErrors, department: '' });
                      }
                    }}
                  >
                    <MenuItem value="nursing">Nursing</MenuItem>
                    <MenuItem value="care">Care Services</MenuItem>
                    <MenuItem value="admin">Administration</MenuItem>
                    <MenuItem value="management">Management</MenuItem>
                    <MenuItem value="support">Support Services</MenuItem>
                  </Select>
                  {formErrors.department && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {formErrors.department}
                    </Typography>
                  )}
                </FormControl>

                <FormControl fullWidth error={!!formErrors.position}>
                  <InputLabel>Position *</InputLabel>
                  <Select
                    value={staffFormData.position || 'care_worker'}
                    onChange={(e) => {
                      setStaffFormData({ ...staffFormData, position: e.target.value as any });
                      if (formErrors.position) {
                        setFormErrors({ ...formErrors, position: '' });
                      }
                    }}
                  >
                    <MenuItem value="care_worker">Care Worker</MenuItem>
                    <MenuItem value="registered_nurse">Registered Nurse</MenuItem>
                    <MenuItem value="social_worker">Social Worker</MenuItem>
                    <MenuItem value="support_worker">Support Worker</MenuItem>
                    <MenuItem value="team_leader">Team Leader</MenuItem>
                    <MenuItem value="supervisor">Supervisor</MenuItem>
                    <MenuItem value="coordinator">Coordinator</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                  </Select>
                  {formErrors.position && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {formErrors.position}
                    </Typography>
                  )}
                </FormControl>
              </Stack>

              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Employment Type</InputLabel>
                  <Select
                    value={staffFormData.employmentType || 'full_time'}
                    onChange={(e) => setStaffFormData({ ...staffFormData, employmentType: e.target.value as any })}
                  >
                    <MenuItem value="full_time">Full Time</MenuItem>
                    <MenuItem value="part_time">Part Time</MenuItem>
                    <MenuItem value="casual">Casual</MenuItem>
                    <MenuItem value="contractor">Contractor</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Hourly Rate"
                  type="number"
                  value={staffFormData.hourlyRate || ''}
                  onChange={(e) => setStaffFormData({ ...staffFormData, hourlyRate: parseFloat(e.target.value) })}
                  fullWidth
                />
              </Stack>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={staffFormData.startDate || ''}
                  onChange={(e) => {
                    setStaffFormData({ ...staffFormData, startDate: e.target.value });
                    if (formErrors.startDate) {
                      setFormErrors({ ...formErrors, startDate: '' });
                    }
                  }}
                  fullWidth
                  required
                  error={!!formErrors.startDate}
                  helperText={formErrors.startDate}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={staffFormData.dateOfBirth || ''}
                  onChange={(e) => {
                    setStaffFormData({ ...staffFormData, dateOfBirth: e.target.value });
                    if (formErrors.dateOfBirth) {
                      setFormErrors({ ...formErrors, dateOfBirth: '' });
                    }
                  }}
                  fullWidth
                  required
                  error={!!formErrors.dateOfBirth}
                  helperText={formErrors.dateOfBirth}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <TextField
                label="Address Line 1"
                value={staffFormData.addressLine1 || ''}
                onChange={(e) => {
                  setStaffFormData({ ...staffFormData, addressLine1: e.target.value });
                  if (formErrors.addressLine1) {
                    setFormErrors({ ...formErrors, addressLine1: '' });
                  }
                }}
                fullWidth
                required
                error={!!formErrors.addressLine1}
                helperText={formErrors.addressLine1}
              />

              <TextField
                label="Address Line 2 (Optional)"
                value={staffFormData.addressLine2 || ''}
                onChange={(e) => setStaffFormData({ ...staffFormData, addressLine2: e.target.value })}
                fullWidth
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  label="City"
                  value={staffFormData.city || ''}
                  onChange={(e) => {
                    setStaffFormData({ ...staffFormData, city: e.target.value });
                    if (formErrors.city) {
                      setFormErrors({ ...formErrors, city: '' });
                    }
                  }}
                  fullWidth
                  required
                  error={!!formErrors.city}
                  helperText={formErrors.city}
                />
                <TextField
                  label="State"
                  value={staffFormData.state || ''}
                  onChange={(e) => {
                    setStaffFormData({ ...staffFormData, state: e.target.value });
                    if (formErrors.state) {
                      setFormErrors({ ...formErrors, state: '' });
                    }
                  }}
                  fullWidth
                  required
                  error={!!formErrors.state}
                  helperText={formErrors.state}
                />
                <TextField
                  label="Postal Code"
                  value={staffFormData.postalCode || ''}
                  onChange={(e) => {
                    setStaffFormData({ ...staffFormData, postalCode: e.target.value });
                    if (formErrors.postalCode) {
                      setFormErrors({ ...formErrors, postalCode: '' });
                    }
                  }}
                  fullWidth
                  required
                  error={!!formErrors.postalCode}
                  helperText={formErrors.postalCode}
                />
              </Stack>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Employee ID"
                  value={staffFormData.employeeId || ''}
                  onChange={(e) => {
                    setStaffFormData({ ...staffFormData, employeeId: e.target.value });
                    if (formErrors.employeeId) {
                      setFormErrors({ ...formErrors, employeeId: '' });
                    }
                  }}
                  fullWidth
                  required
                  error={!!formErrors.employeeId}
                  helperText={formErrors.employeeId || "Unique employee identifier"}
                />
                <TextField
                  label="Hourly Rate ($)"
                  type="number"
                  value={staffFormData.hourlyRate || ''}
                  onChange={(e) => {
                    setStaffFormData({ ...staffFormData, hourlyRate: Number(e.target.value) });
                    if (formErrors.hourlyRate) {
                      setFormErrors({ ...formErrors, hourlyRate: '' });
                    }
                  }}
                  fullWidth
                  error={!!formErrors.hourlyRate}
                  helperText={formErrors.hourlyRate}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Stack>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Qualifications"
                  value={staffFormData.qualifications || ''}
                  onChange={(e) => setStaffFormData({ ...staffFormData, qualifications: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                  helperText="Education, degrees, etc."
                />
                <TextField
                  label="Certifications"
                  value={staffFormData.certifications || ''}
                  onChange={(e) => setStaffFormData({ ...staffFormData, certifications: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                  helperText="Professional certifications"
                />
              </Stack>

              <TextField
                label="Preferred Hours Per Week"
                type="number"
                value={staffFormData.preferredHoursPerWeek || ''}
                onChange={(e) => setStaffFormData({ ...staffFormData, preferredHoursPerWeek: Number(e.target.value) })}
                fullWidth
                inputProps={{ min: 0, max: 80 }}
                helperText="Desired weekly working hours"
              />

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Availability</Typography>
              <Stack direction="row" spacing={3}>
                <FormControl component="fieldset">
                  <Typography variant="body2" gutterBottom>Available Weekdays</Typography>
                  <Switch
                    checked={staffFormData.availableWeekdays || false}
                    onChange={(e) => setStaffFormData({ ...staffFormData, availableWeekdays: e.target.checked })}
                  />
                </FormControl>
                <FormControl component="fieldset">
                  <Typography variant="body2" gutterBottom>Available Weekends</Typography>
                  <Switch
                    checked={staffFormData.availableWeekends || false}
                    onChange={(e) => setStaffFormData({ ...staffFormData, availableWeekends: e.target.checked })}
                  />
                </FormControl>
                <FormControl component="fieldset">
                  <Typography variant="body2" gutterBottom>Available Nights</Typography>
                  <Switch
                    checked={staffFormData.availableNights || false}
                    onChange={(e) => setStaffFormData({ ...staffFormData, availableNights: e.target.checked })}
                  />
                </FormControl>
              </Stack>

              <Typography variant="h6">Emergency Contact</Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Emergency Contact Name"
                  value={staffFormData.emergencyContactName || ''}
                  onChange={(e) => {
                    setStaffFormData({ ...staffFormData, emergencyContactName: e.target.value });
                    if (formErrors.emergencyContactName) {
                      setFormErrors({ ...formErrors, emergencyContactName: '' });
                    }
                  }}
                  fullWidth
                  required
                  error={!!formErrors.emergencyContactName}
                  helperText={formErrors.emergencyContactName}
                />
                <TextField
                  label="Emergency Contact Phone"
                  value={staffFormData.emergencyContactPhone || ''}
                  onChange={(e) => {
                    setStaffFormData({ ...staffFormData, emergencyContactPhone: e.target.value });
                    if (formErrors.emergencyContactPhone) {
                      setFormErrors({ ...formErrors, emergencyContactPhone: '' });
                    }
                  }}
                  fullWidth
                  required
                  error={!!formErrors.emergencyContactPhone}
                  helperText={formErrors.emergencyContactPhone}
                />
              </Stack>
              <TextField
                label="Relationship"
                value={staffFormData.emergencyContactRelationship || ''}
                onChange={(e) => setStaffFormData({ ...staffFormData, emergencyContactRelationship: e.target.value })}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseStaffDialog}>Cancel</Button>
            <Button onClick={handleSaveStaff} variant="contained">
              {selectedStaff ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* User Dialog */}
        <Dialog open={openUserDialog} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedUser ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Username"
                value={userFormData.username || ''}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Email"
                type="email"
                value={userFormData.email || ''}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                fullWidth
                required
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="First Name"
                  value={userFormData.firstName || ''}
                  onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Last Name"
                  value={userFormData.lastName || ''}
                  onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                  fullWidth
                />
              </Stack>
              <TextField
                label={selectedUser ? 'New Password (leave blank to keep current)' : 'Password'}
                type="password"
                value={userFormData.password || ''}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                fullWidth
                required={!selectedUser}
                helperText={
                  selectedUser
                    ? getUserPrivilegeLevel() >= 4
                      ? 'As admin, you can reset any user\'s password without knowing current password'
                      : 'Leave blank to keep current password'
                    : 'Required for new users'
                }
              />
              <FormControl fullWidth>
                <InputLabel>System Role</InputLabel>
                <Select
                  value={userFormData.roles?.[0] || 'Staff'}
                  onChange={(e) => setUserFormData({ ...userFormData, roles: [e.target.value] })}
                >
                  <MenuItem value="Admin">Admin (Full System Access)</MenuItem>
                  <MenuItem value="Manager">Manager (Staff & Operations)</MenuItem>
                  <MenuItem value="Care_Coordinator">Care Coordinator (Client Management)</MenuItem>
                  <MenuItem value="Staff">Staff (Basic Access)</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUserDialog}>Cancel</Button>
            <Button onClick={handleSaveUser} variant="contained">
              {selectedUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </PageLayout>
  );
};

export default StaffPage;
