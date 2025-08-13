import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Chip,
    Button,
    Alert,
    Stack,
    Card,
    CardContent,
    Tab,
    Tabs,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
} from '@mui/material';
import {
    Edit as EditIcon,
    Person as PersonIcon,
    Home as HomeIcon,
    ContactEmergency as EmergencyIcon,
    Schedule as ScheduleIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Upload as UploadIcon,
    Download as DownloadIcon,
    AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { staffService, StaffProfile, StaffAvailability, StaffLeave, StaffDocument, UpdateStaffRequest, CreateStaffAvailabilityRequest, CreateStaffLeaveRequest } from '../../services/staffService';

dayjs.extend(utc);
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

const DAYS_OF_WEEK = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
];

const LEAVE_TYPES = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'emergency', label: 'Emergency Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
];

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

    // Form data states
    const [editFormData, setEditFormData] = useState<Partial<UpdateStaffRequest>>({});
    const [availabilityFormData, setAvailabilityFormData] = useState({
        dayOfWeek: '',
        startTime: null as Dayjs | null,
        endTime: null as Dayjs | null,
        isAvailable: true,
        notes: '',
    });
    const [leaveFormData, setLeaveFormData] = useState({
        leaveType: '',
        startDate: null as Dayjs | null,
        endDate: null as Dayjs | null,
        reason: '',
    });

    // Document-related state
    const [documents, setDocuments] = useState<StaffDocument[]>([]);
    const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [documentData, setDocumentData] = useState({
        title: '',
        description: '',
        documentType: 'Other' as StaffDocument['documentType'],
    });

    const isAdmin = user?.user_type === "Admin" ||
        user?.user_type === "Administrator" ||
        user?.user_type === "manager" ||
        user?.user_type === "Manager";

    useEffect(() => {
        if (id && isAdmin) {
            loadStaffData();
        }
    }, [id, isAdmin]);

    const loadStaffData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [staffData, availabilityData, leaveData, documentsData] = await Promise.all([
                staffService.getStaffProfile(parseInt(id!)),
                staffService.getStaffAvailability(parseInt(id!)).catch(() => []),
                staffService.getStaffLeaveRequests(parseInt(id!)).catch(() => []),
                staffService.getStaffDocuments(parseInt(id!)).catch(() => []),
            ]);

            setStaff(staffData);
            setAvailability(availabilityData);
            setLeaveRequests(leaveData);
            setDocuments(documentsData);
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

    const handleEditStaff = () => {
        if (staff) {
            setEditFormData({
                firstName: staff.firstName,
                lastName: staff.lastName,
                email: staff.email,
                position: staff.position,
                department: staff.department,
                employmentType: staff.employmentType,
                hourlyRate: staff.hourlyRate,
                phoneNumber: staff.phoneNumber,
                dateOfBirth: staff.dateOfBirth,
                addressLine1: staff.addressLine1,
                addressLine2: staff.addressLine2,
                city: staff.city,
                state: staff.state,
                postalCode: staff.postalCode,
                emergencyContactName: staff.emergencyContactName,
                emergencyContactPhone: staff.emergencyContactPhone,
                emergencyContactRelationship: staff.emergencyContactRelationship,
                preferredHoursPerWeek: staff.preferredHoursPerWeek,
                availableWeekdays: staff.availableWeekdays,
                availableWeekends: staff.availableWeekends,
                availableNights: staff.availableNights,
                qualifications: staff.qualifications,
                certifications: staff.certifications,
                startDate: staff.startDate,
                endDate: staff.endDate,
                isActive: staff.isActive,
            });
            setOpenEditDialog(true);
        }
    };

    const handleSaveStaff = async () => {
        try {
            if (!editFormData.firstName || !editFormData.lastName || !editFormData.email) {
                setError('Please fill in all required fields');
                return;
            }

            const updateRequest: UpdateStaffRequest = {
                firstName: editFormData.firstName,
                lastName: editFormData.lastName,
                email: editFormData.email,
                phoneNumber: editFormData.phoneNumber || '',
                position: editFormData.position || '',
                department: editFormData.department || '',
                employmentType: editFormData.employmentType || 'full_time',
                hourlyRate: editFormData.hourlyRate || 0,
                dateOfBirth: staff?.dateOfBirth || '',
                addressLine1: editFormData.addressLine1 || '',
                addressLine2: editFormData.addressLine2,
                city: editFormData.city || '',
                state: editFormData.state || '',
                postalCode: editFormData.postalCode || '',
                qualifications: editFormData.qualifications,
                certifications: editFormData.certifications,
                preferredHoursPerWeek: editFormData.preferredHoursPerWeek,
                availableWeekdays: editFormData.availableWeekdays ?? true,
                availableWeekends: editFormData.availableWeekends ?? false,
                availableNights: editFormData.availableNights ?? false,
                emergencyContactName: editFormData.emergencyContactName || '',
                emergencyContactPhone: editFormData.emergencyContactPhone || '',
                emergencyContactRelationship: editFormData.emergencyContactRelationship || '',
                startDate: staff?.startDate || '',
                endDate: editFormData.endDate,
                isActive: editFormData.isActive ?? true,
            };

            await staffService.updateStaffProfile(parseInt(id!), updateRequest);
            setSuccess('Staff profile updated successfully');
            setOpenEditDialog(false);
            loadStaffData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update staff profile');
        }
    };

    const handleAddAvailability = () => {
        setAvailabilityFormData({
            dayOfWeek: '',
            startTime: null,
            endTime: null,
            isAvailable: true,
            notes: '',
        });
        setOpenAvailabilityDialog(true);
    };

    const handleSaveAvailability = async () => {
        try {
            if (!availabilityFormData.dayOfWeek) {
                setError('Please select a day of the week');
                return;
            }

            const availabilityData: CreateStaffAvailabilityRequest = {
                dayOfWeek: availabilityFormData.dayOfWeek,
                startTime: availabilityFormData.startTime ? availabilityFormData.startTime.format('HH:mm:ss') : '09:00:00',
                endTime: availabilityFormData.endTime ? availabilityFormData.endTime.format('HH:mm:ss') : '17:00:00',
                isAvailable: availabilityFormData.isAvailable,
                notes: availabilityFormData.notes || undefined,
            };

            await staffService.createStaffAvailability(parseInt(id!), availabilityData);
            setSuccess('Availability added successfully');
            setOpenAvailabilityDialog(false);
            loadStaffData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add availability');
        }
    };

    const handleAddLeave = () => {
        setLeaveFormData({
            leaveType: '',
            startDate: null,
            endDate: null,
            reason: '',
        });
        setOpenLeaveDialog(true);
    };

    const handleSaveLeave = async () => {
        try {
            if (!leaveFormData.leaveType || !leaveFormData.startDate || !leaveFormData.endDate) {
                setError('Please fill in all required fields');
                return;
            }

            const leaveData: CreateStaffLeaveRequest = {
                leaveType: leaveFormData.leaveType,
                startDate: leaveFormData.startDate.startOf('day').utc().toISOString(),
                endDate: leaveFormData.endDate.startOf('day').utc().toISOString(),
                reason: leaveFormData.reason,
            };

            await staffService.createLeaveRequest(parseInt(id!), leaveData);
            setSuccess('Leave request submitted successfully');
            setOpenLeaveDialog(false);
            loadStaffData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit leave request');
        }
    };

    const handleDeleteAvailability = async (availabilityId: number) => {
        if (window.confirm('Are you sure you want to delete this availability?')) {
            try {
                await staffService.deleteStaffAvailability(parseInt(id!), availabilityId);
                setSuccess('Availability deleted successfully');
                loadStaffData();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to delete availability');
            }
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

    // Document handlers
    const handleUploadDocument = async () => {
        if (!documentFile || !documentData.title) {
            setError('Please provide a file and title');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('staffId', id!);
            formData.append('file', documentFile);
            formData.append('title', documentData.title);
            formData.append('description', documentData.description);
            formData.append('documentType', documentData.documentType);

            await staffService.uploadStaffDocument(parseInt(id!), formData);
            setSuccess('Document uploaded successfully');
            setOpenDocumentDialog(false);
            setDocumentFile(null);
            setDocumentData({ title: '', description: '', documentType: 'Other' });
            loadStaffData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload document');
        }
    };

    const handleDeleteDocument = async (documentId: number) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await staffService.deleteStaffDocument(parseInt(id!), documentId);
                setSuccess('Document deleted successfully');
                loadStaffData();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to delete document');
            }
        }
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
                            {staff.firstName} {staff.lastName}
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={handleEditStaff}
                        >
                            Edit Staff
                        </Button>
                    </Stack>

                    <Stack direction="row" spacing={2} mb={2}>
                        <Chip
                            label={staff.employeeId}
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
                            label={staff.isActive ? 'Active' : 'Inactive'}
                            color={staff.isActive ? 'success' : 'error'}
                        />
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                        Employee ID: {staff.employeeId} | Started: {new Date(staff.startDate).toLocaleDateString()}
                    </Typography>
                </Paper>

                {/* Tabs */}
                <Paper sx={{ width: '100%' }}>
                    <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                        <Tab label="Overview" />
                        <Tab label={`Availability (${availability.length})`} />
                        <Tab label={`Leave Requests (${leaveRequests.length})`} />
                        <Tab label={`Documents (${documents.length})`} />
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
                                                <Typography>{new Date(staff.dateOfBirth).toLocaleDateString()}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2">Email</Typography>
                                                <Typography>{staff.email}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2">Employment Type</Typography>
                                                <Typography>{staff.employmentType?.replace('_', ' ').toUpperCase()}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2">Hourly Rate</Typography>
                                                <Typography>${staff.hourlyRate}</Typography>
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
                                        {staff.addressLine1}
                                        {staff.addressLine2 && <>, {staff.addressLine2}</>}
                                        <br />
                                        {staff.city}, {staff.state} {staff.postalCode}
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
                                            <Typography>{staff.emergencyContactName}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Phone</Typography>
                                            <Typography>{staff.emergencyContactPhone}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Relationship</Typography>
                                            <Typography>{staff.emergencyContactRelationship}</Typography>
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
                                            <Typography>{staff.preferredHoursPerWeek || 'Not specified'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Weekdays</Typography>
                                            <Chip
                                                label={staff.availableWeekdays ? 'Available' : 'Not Available'}
                                                color={staff.availableWeekdays ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Weekends</Typography>
                                            <Chip
                                                label={staff.availableWeekends ? 'Available' : 'Not Available'}
                                                color={staff.availableWeekends ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Nights</Typography>
                                            <Chip
                                                label={staff.availableNights ? 'Available' : 'Not Available'}
                                                color={staff.availableNights ? 'success' : 'error'}
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
                                    onClick={handleAddAvailability}
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
                                                        {avail.dayOfWeek?.charAt(0).toUpperCase() + avail.dayOfWeek?.slice(1)}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {avail.startTime} - {avail.endTime}
                                                    </Typography>
                                                    <Chip
                                                        label={avail.isAvailable ? 'Available' : 'Not Available'}
                                                        color={avail.isAvailable ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                </Stack>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleDeleteAvailability(avail.id)}
                                                >
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
                                    onClick={handleAddLeave}
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
                                                        {leave.leaveType?.charAt(0).toUpperCase() + leave.leaveType?.slice(1)} Leave
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
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

                    {/* Documents Tab */}
                    <TabPanel value={tabValue} index={3}>
                        <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6">Staff Documents</Typography>
                                <Button
                                    startIcon={<UploadIcon />}
                                    variant="contained"
                                    onClick={() => setOpenDocumentDialog(true)}
                                >
                                    Upload Document
                                </Button>
                            </Stack>

                            {documents.length === 0 ? (
                                <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                                    <AttachFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="body1" color="text.secondary">
                                        No documents uploaded yet
                                    </Typography>
                                </Box>
                            ) : (
                                documents.map((document) => (
                                    <Card key={document.id}>
                                        <CardContent>
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                <Box>
                                                    <Typography variant="h6" gutterBottom>
                                                        {document.title}
                                                    </Typography>
                                                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                                        <Chip
                                                            label={document.documentType}
                                                            size="small"
                                                            color="primary"
                                                        />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {document.formattedFileSize} • {document.fileName}
                                                        </Typography>
                                                    </Stack>
                                                    {document.description && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {document.description}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="caption" color="text.secondary">
                                                        Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                                <Stack direction="row" spacing={1}>
                                                    <IconButton
                                                        onClick={async () => {
                                                            try {
                                                                const blob = await staffService.downloadStaffDocument(parseInt(id!), document.id);
                                                                const url = window.URL.createObjectURL(blob);
                                                                const link = window.document.createElement('a');
                                                                link.href = url;
                                                                link.download = document.fileName || 'document';
                                                                window.document.body.appendChild(link);
                                                                link.click();
                                                                window.document.body.removeChild(link);
                                                                window.URL.revokeObjectURL(url);
                                                            } catch (err: any) {
                                                                setError(err.response?.data?.message || 'Failed to download document');
                                                            }
                                                        }}
                                                        color="primary"
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() => handleDeleteDocument(document.id)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Stack>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </Stack>
                    </TabPanel>
                </Paper>

                {/* Edit Staff Dialog */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
                        <DialogTitle>Edit Staff Profile</DialogTitle>
                        <DialogContent>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="First Name"
                                        fullWidth
                                        value={editFormData.firstName || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                                    />
                                    <TextField
                                        label="Last Name"
                                        fullWidth
                                        value={editFormData.lastName || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Email"
                                        fullWidth
                                        value={editFormData.email || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    />
                                    <TextField
                                        label="Phone Number"
                                        fullWidth
                                        value={editFormData.phoneNumber || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Position"
                                        fullWidth
                                        value={editFormData.position || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                                    />
                                    <TextField
                                        label="Department"
                                        fullWidth
                                        value={editFormData.department || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>Employment Type</InputLabel>
                                        <Select
                                            value={editFormData.employmentType || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, employmentType: e.target.value })}
                                        >
                                            <MenuItem value="full_time">Full Time</MenuItem>
                                            <MenuItem value="part_time">Part Time</MenuItem>
                                            <MenuItem value="casual">Casual</MenuItem>
                                            <MenuItem value="contract">Contract</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="Hourly Rate"
                                        type="number"
                                        fullWidth
                                        value={editFormData.hourlyRate || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, hourlyRate: parseFloat(e.target.value) })}
                                    />
                                </Stack>
                                <TextField
                                    label="Address Line 1"
                                    fullWidth
                                    value={editFormData.addressLine1 || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, addressLine1: e.target.value })}
                                />
                                <TextField
                                    label="Address Line 2"
                                    fullWidth
                                    value={editFormData.addressLine2 || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, addressLine2: e.target.value })}
                                />
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="City"
                                        fullWidth
                                        value={editFormData.city || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                                    />
                                    <TextField
                                        label="State"
                                        fullWidth
                                        value={editFormData.state || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                                    />
                                    <TextField
                                        label="Postal Code"
                                        fullWidth
                                        value={editFormData.postalCode || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, postalCode: e.target.value })}
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Emergency Contact Name"
                                        fullWidth
                                        value={editFormData.emergencyContactName || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                                    />
                                    <TextField
                                        label="Emergency Contact Phone"
                                        fullWidth
                                        value={editFormData.emergencyContactPhone || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                                    />
                                    <TextField
                                        label="Emergency Contact Relationship"
                                        fullWidth
                                        value={editFormData.emergencyContactRelationship || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContactRelationship: e.target.value })}
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Qualifications"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={editFormData.qualifications || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, qualifications: e.target.value })}
                                    />
                                    <TextField
                                        label="Certifications"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={editFormData.certifications || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, certifications: e.target.value })}
                                    />
                                </Stack>
                                <TextField
                                    label="Preferred Hours Per Week"
                                    type="number"
                                    fullWidth
                                    value={editFormData.preferredHoursPerWeek || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, preferredHoursPerWeek: parseInt(e.target.value) || undefined })}
                                />
                                <Stack direction="row" spacing={2}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={editFormData.availableWeekdays || false}
                                                onChange={(e) => setEditFormData({ ...editFormData, availableWeekdays: e.target.checked })}
                                            />
                                        }
                                        label="Available Weekdays"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={editFormData.availableWeekends || false}
                                                onChange={(e) => setEditFormData({ ...editFormData, availableWeekends: e.target.checked })}
                                            />
                                        }
                                        label="Available Weekends"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={editFormData.availableNights || false}
                                                onChange={(e) => setEditFormData({ ...editFormData, availableNights: e.target.checked })}
                                            />
                                        }
                                        label="Available Nights"
                                    />
                                </Stack>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={editFormData.isActive || false}
                                            onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                                        />
                                    }
                                    label="Active Staff Member"
                                />
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
                            <Button onClick={handleSaveStaff} variant="contained">Save Changes</Button>
                        </DialogActions>
                    </Dialog>

                    {/* Add Availability Dialog */}
                    <Dialog open={openAvailabilityDialog} onClose={() => setOpenAvailabilityDialog(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>Add Availability</DialogTitle>
                        <DialogContent>
                            <Stack spacing={3} sx={{ mt: 2 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Day of Week</InputLabel>
                                    <Select
                                        value={availabilityFormData.dayOfWeek}
                                        onChange={(e) => setAvailabilityFormData({ ...availabilityFormData, dayOfWeek: e.target.value })}
                                    >
                                        {DAYS_OF_WEEK.map((day) => (
                                            <MenuItem key={day.value} value={day.value}>
                                                {day.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={availabilityFormData.isAvailable}
                                            onChange={(e) => setAvailabilityFormData({ ...availabilityFormData, isAvailable: e.target.checked })}
                                        />
                                    }
                                    label="Available on this day"
                                />

                                {availabilityFormData.isAvailable && (
                                    <Stack direction="row" spacing={2}>
                                        <TimePicker
                                            label="Start Time"
                                            value={availabilityFormData.startTime}
                                            onChange={(newValue) => setAvailabilityFormData({ ...availabilityFormData, startTime: newValue })}
                                            sx={{ flex: 1 }}
                                        />
                                        <TimePicker
                                            label="End Time"
                                            value={availabilityFormData.endTime}
                                            onChange={(newValue) => setAvailabilityFormData({ ...availabilityFormData, endTime: newValue })}
                                            sx={{ flex: 1 }}
                                        />
                                    </Stack>
                                )}

                                <TextField
                                    label="Notes (Optional)"
                                    multiline
                                    rows={3}
                                    value={availabilityFormData.notes}
                                    onChange={(e) => setAvailabilityFormData({ ...availabilityFormData, notes: e.target.value })}
                                    placeholder="Any special notes about availability on this day..."
                                />
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenAvailabilityDialog(false)}>Cancel</Button>
                            <Button onClick={handleSaveAvailability} variant="contained">Add Availability</Button>
                        </DialogActions>
                    </Dialog>

                    {/* Add Leave Request Dialog */}
                    <Dialog open={openLeaveDialog} onClose={() => setOpenLeaveDialog(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>Request Leave</DialogTitle>
                        <DialogContent>
                            <Stack spacing={3} sx={{ mt: 2 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Leave Type</InputLabel>
                                    <Select
                                        value={leaveFormData.leaveType}
                                        onChange={(e) => setLeaveFormData({ ...leaveFormData, leaveType: e.target.value })}
                                    >
                                        {LEAVE_TYPES.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Stack direction="row" spacing={2}>
                                    <DatePicker
                                        label="Start Date"
                                        value={leaveFormData.startDate}
                                        onChange={(newValue) => setLeaveFormData({ ...leaveFormData, startDate: newValue })}
                                        sx={{ flex: 1 }}
                                    />
                                    <DatePicker
                                        label="End Date"
                                        value={leaveFormData.endDate}
                                        onChange={(newValue) => setLeaveFormData({ ...leaveFormData, endDate: newValue })}
                                        sx={{ flex: 1 }}
                                    />
                                </Stack>

                                <TextField
                                    label="Reason"
                                    multiline
                                    rows={4}
                                    required
                                    value={leaveFormData.reason}
                                    onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                                    placeholder="Please provide a reason for your leave request..."
                                />
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenLeaveDialog(false)}>Cancel</Button>
                            <Button onClick={handleSaveLeave} variant="contained">Submit Request</Button>
                        </DialogActions>
                    </Dialog>

                    {/* Document Upload Dialog */}
                    <Dialog open={openDocumentDialog} onClose={() => setOpenDocumentDialog(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>Upload Document</DialogTitle>
                        <DialogContent>
                            <Stack spacing={3} sx={{ mt: 1 }}>
                                <TextField
                                    label="Document Title"
                                    fullWidth
                                    required
                                    value={documentData.title}
                                    onChange={(e) => setDocumentData({ ...documentData, title: e.target.value })}
                                    placeholder="e.g., Passport, Work Visa, Background Check"
                                />

                                <FormControl fullWidth>
                                    <InputLabel>Document Type</InputLabel>
                                    <Select
                                        value={documentData.documentType}
                                        onChange={(e) => setDocumentData({ ...documentData, documentType: e.target.value as StaffDocument['documentType'] })}
                                    >
                                        <MenuItem value="Identity">Identity Document</MenuItem>
                                        <MenuItem value="WorkPermit">Work Permit</MenuItem>
                                        <MenuItem value="Visa">Visa</MenuItem>
                                        <MenuItem value="Nationality">Nationality/Citizenship</MenuItem>
                                        <MenuItem value="Background">Background Check</MenuItem>
                                        <MenuItem value="Medical">Medical Certificate</MenuItem>
                                        <MenuItem value="Training">Training/Certification</MenuItem>
                                        <MenuItem value="Contract">Employment Contract</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Description (Optional)"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={documentData.description}
                                    onChange={(e) => setDocumentData({ ...documentData, description: e.target.value })}
                                    placeholder="Additional details about this document..."
                                />

                                <Box>
                                    <input
                                        type="file"
                                        onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                        style={{ display: 'none' }}
                                        id="document-file-input"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                                    />
                                    <label htmlFor="document-file-input">
                                        <Button
                                            variant="outlined"
                                            component="span"
                                            startIcon={<AttachFileIcon />}
                                            fullWidth
                                        >
                                            {documentFile ? documentFile.name : 'Choose File'}
                                        </Button>
                                    </label>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Supported formats: PDF, DOC, DOCX, JPG, PNG, TXT (Max 10MB)
                                    </Typography>
                                </Box>
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenDocumentDialog(false)}>Cancel</Button>
                            <Button onClick={handleUploadDocument} variant="contained" disabled={!documentFile || !documentData.title}>
                                Upload
                            </Button>
                        </DialogActions>
                    </Dialog>
                </LocalizationProvider>

            </Container>
        </PageLayout>
    );
};

export default StaffDetailPage;