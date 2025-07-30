import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Stack,
    Card,
    CardContent,
    Tab,
    Tabs,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Edit as EditIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Home as HomeIcon,
    ContactEmergency as EmergencyIcon,
    Schedule as ScheduleIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { staffService, StaffProfile, StaffAvailability, StaffLeave } from '../../services/staffService';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../../components/Layout/PageLayout';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`staff-detail-tabpanel-${index}`}
            aria-labelledby={`staff-detail-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const StaffDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [staff, setStaff] = useState<StaffProfile | null>(null);
    const [availability, setAvailability] = useState<StaffAvailability[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<StaffLeave[]>([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openAvailabilityDialog, setOpenAvailabilityDialog] = useState(false);
    const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const isAdmin = user?.user_type === 'Administrator';

    useEffect(() => {
        if (id && isAdmin) {
            loadStaffData();
        }
    }, [id, isAdmin]);

    const loadStaffData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [staffData, availabilityData, leaveData] = await Promise.all([
                staffService.getStaffProfile(parseInt(id!)),
                staffService.getStaffAvailability(parseInt(id!)).catch(() => ({ results: [] })),
                staffService.getStaffLeaveRequests(parseInt(id!)).catch(() => ({ results: [] })),
            ]);

            setStaff(staffData);
            setAvailability(availabilityData.results || availabilityData || []);
            setLeaveRequests(leaveData.results || leaveData || []);
        } catch (err: any) {
            console.error('Error loading staff data:', err);
            if (err.response?.status === 404) {
                setError('Staff member not found');
            } else if (err.response?.status === 401) {
                setError('Please log in again to access this page');
            } else {
                setError(err.response?.data?.message || 'Failed to load staff data');
            }
        } finally {
            setLoading(false);
        }
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

    if (!isAdmin) {
        return (
            <PageLayout>
                <Alert severity="error">
                    You do not have permission to access staff details.
                </Alert>
            </PageLayout>
        );
    }

    if (loading) {
        return (
            <PageLayout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <Typography>Loading...</Typography>
                </Box>
            </PageLayout>
        );
    }

    if (error || !staff) {
        return (
            <PageLayout>
                <Alert severity="error">{error || 'Staff member not found'}</Alert>
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

                {/* Staff Header */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h4" component="h1">
                            {staff.user_first_name} {staff.user_last_name}
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => setOpenEditDialog(true)}
                        >
                            Edit Staff
                        </Button>
                    </Stack>

                    <Stack direction="row" spacing={2} mb={2}>
                        <Chip
                            label={staff.employee_id}
                            icon={<PersonIcon />}
                        />
                        <Chip
                            label={staff.department?.charAt(0).toUpperCase() + staff.department?.slice(1)}
                            color={getDepartmentColor(staff.department)}
                        />
                        <Chip
                            label={staff.position?.charAt(0).toUpperCase() + staff.position?.slice(1)}
                        />
                        <Chip
                            label={staff.is_active ? 'Active' : 'Inactive'}
                            color={staff.is_active ? 'success' : 'error'}
                        />
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                        Employee ID: {staff.employee_id} | Started: {new Date(staff.start_date).toLocaleDateString()}
                    </Typography>
                </Paper>

                {/* Tabs */}
                <Paper sx={{ width: '100%' }}>
                    <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                        <Tab label="Overview" />
                        <Tab label={`Availability (${availability.length})`} />
                        <Tab label={`Leave Requests (${leaveRequests.length})`} />
                    </Tabs>

                    {/* Overview Tab */}
                    <TabPanel value={tabValue} index={0}>
                        <Stack spacing={3}>
                            {/* Personal Information */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Personal Information
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Stack direction="row" spacing={4}>
                                            <Box>
                                                <Typography variant="subtitle2">Date of Birth</Typography>
                                                <Typography>{new Date(staff.date_of_birth).toLocaleDateString()}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2">Email</Typography>
                                                <Typography>{staff.user_email}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2">Employment Type</Typography>
                                                <Typography>{staff.employment_type?.replace('_', ' ').toUpperCase()}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2">Hourly Rate</Typography>
                                                <Typography>${staff.hourly_rate}</Typography>
                                            </Box>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Address Information */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        <HomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Address
                                    </Typography>
                                    <Typography>
                                        {staff.address_line_1}
                                        {staff.address_line_2 && <>, {staff.address_line_2}</>}
                                        <br />
                                        {staff.city}, {staff.state} {staff.postal_code}
                                    </Typography>
                                </CardContent>
                            </Card>

                            {/* Emergency Contact */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        <EmergencyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Emergency Contact
                                    </Typography>
                                    <Stack direction="row" spacing={4}>
                                        <Box>
                                            <Typography variant="subtitle2">Name</Typography>
                                            <Typography>{staff.emergency_contact_name}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Phone</Typography>
                                            <Typography>{staff.emergency_contact_phone}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Relationship</Typography>
                                            <Typography>{staff.emergency_contact_relationship}</Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Work Preferences */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Work Preferences
                                    </Typography>
                                    <Stack direction="row" spacing={4}>
                                        <Box>
                                            <Typography variant="subtitle2">Preferred Hours/Week</Typography>
                                            <Typography>{staff.preferred_hours_per_week || 'Not specified'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Weekdays</Typography>
                                            <Chip
                                                label={staff.available_weekdays ? 'Available' : 'Not Available'}
                                                color={staff.available_weekdays ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Weekends</Typography>
                                            <Chip
                                                label={staff.available_weekends ? 'Available' : 'Not Available'}
                                                color={staff.available_weekends ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Nights</Typography>
                                            <Chip
                                                label={staff.available_nights ? 'Available' : 'Not Available'}
                                                color={staff.available_nights ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Qualifications */}
                            {(staff.qualifications || staff.certifications) && (
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Qualifications & Certifications
                                        </Typography>
                                        {staff.qualifications && (
                                            <Box mb={2}>
                                                <Typography variant="subtitle2">Qualifications</Typography>
                                                <Typography>{staff.qualifications}</Typography>
                                            </Box>
                                        )}
                                        {staff.certifications && (
                                            <Box>
                                                <Typography variant="subtitle2">Certifications</Typography>
                                                <Typography>{staff.certifications}</Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </Stack>
                    </TabPanel>

                    {/* Availability Tab */}
                    <TabPanel value={tabValue} index={1}>
                        <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6">Staff Availability</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setOpenAvailabilityDialog(true)}
                                >
                                    Add Availability
                                </Button>
                            </Stack>

                            {availability.length === 0 ? (
                                <Alert severity="info">No availability schedule set for this staff member.</Alert>
                            ) : (
                                availability.map((avail) => (
                                    <Card key={avail.id}>
                                        <CardContent>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Stack>
                                                    <Typography variant="h6">
                                                        {avail.day_of_week?.charAt(0).toUpperCase() + avail.day_of_week?.slice(1)}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {avail.start_time} - {avail.end_time}
                                                    </Typography>
                                                    <Chip
                                                        label={avail.is_available ? 'Available' : 'Not Available'}
                                                        color={avail.is_available ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                </Stack>
                                                <IconButton color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </Stack>
                    </TabPanel>

                    {/* Leave Requests Tab */}
                    <TabPanel value={tabValue} index={2}>
                        <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6">Leave Requests</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setOpenLeaveDialog(true)}
                                >
                                    Request Leave
                                </Button>
                            </Stack>

                            {leaveRequests.length === 0 ? (
                                <Alert severity="info">No leave requests found for this staff member.</Alert>
                            ) : (
                                leaveRequests.map((leave) => (
                                    <Card key={leave.id}>
                                        <CardContent>
                                            <Stack direction="row" justifyContent="space-between" alignItems="start">
                                                <Box>
                                                    <Typography variant="h6">
                                                        {leave.leave_type?.charAt(0).toUpperCase() + leave.leave_type?.slice(1)} Leave
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                                    </Typography>
                                                    <Typography>{leave.reason}</Typography>
                                                </Box>
                                                <Chip
                                                    label={leave.status?.toUpperCase()}
                                                    color={
                                                        leave.status === 'approved' ? 'success' :
                                                            leave.status === 'rejected' ? 'error' :
                                                                leave.status === 'pending' ? 'warning' : 'default'
                                                    }
                                                />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </Stack>
                    </TabPanel>
                </Paper>
            </Container>
        </PageLayout>
    );
};

export default StaffDetailPage;