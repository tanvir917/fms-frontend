import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Stack,
    Chip,
    IconButton,
    Alert,
    Card,
    CardContent,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Person as PersonIcon,
    DateRange as DateIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
    staffService,
    StaffProfile,
    StaffLeave,
    CreateStaffLeaveRequest,
    UpdateStaffLeaveRequest
} from '../../services/staffService';

dayjs.extend(utc);

interface StaffLeaveManagerProps {
    staffProfiles: StaffProfile[];
    onUpdate: () => void;
}

interface LeaveFormData {
    staffId: number;
    leaveType: string;
    startDate: Dayjs | null;
    endDate: Dayjs | null;
    reason: string;
}

const LEAVE_TYPES = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'emergency', label: 'Emergency Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
];

const StaffLeaveManager: React.FC<StaffLeaveManagerProps> = ({
    staffProfiles,
    onUpdate,
}) => {
    const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
    const [leaveRequests, setLeaveRequests] = useState<Record<number, StaffLeave[]>>({});
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<StaffLeave | null>(null);
    const [formData, setFormData] = useState<LeaveFormData>({
        staffId: 0,
        leaveType: '',
        startDate: null,
        endDate: null,
        reason: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (staffProfiles.length > 0) {
            loadAllLeaveRequests();
        }
    }, [staffProfiles]);

    const loadAllLeaveRequests = async () => {
        setLoading(true);
        const newLeaveRequests: Record<number, StaffLeave[]> = {};

        try {
            await Promise.all(
                staffProfiles.map(async (staff) => {
                    try {
                        const leaves = await staffService.getStaffLeaveRequests(staff.id);
                        newLeaveRequests[staff.id] = leaves;
                    } catch (err) {
                        console.warn(`Failed to load leave requests for staff ${staff.id}:`, err);
                        newLeaveRequests[staff.id] = [];
                    }
                })
            );
            setLeaveRequests(newLeaveRequests);
        } catch (err: any) {
            setError('Failed to load some leave requests');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLeave = () => {
        setSelectedLeave(null);
        setFormData({
            staffId: 0,
            leaveType: '',
            startDate: null,
            endDate: null,
            reason: '',
        });
        setOpenDialog(true);
    };

    const handleEditLeave = (leave: StaffLeave) => {
        setSelectedLeave(leave);
        setFormData({
            staffId: leave.staffId,
            leaveType: leave.leaveType,
            startDate: dayjs(leave.startDate),
            endDate: dayjs(leave.endDate),
            reason: leave.reason,
        });
        setOpenDialog(true);
    };

    const handleSaveLeave = async () => {
        try {
            if (!formData.staffId || !formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason.trim()) {
                setError('Please fill in all required fields');
                return;
            }

            const leaveData: CreateStaffLeaveRequest | UpdateStaffLeaveRequest = {
                leaveType: formData.leaveType,
                startDate: formData.startDate.startOf('day').utc().toISOString(),
                endDate: formData.endDate.startOf('day').utc().toISOString(),
                reason: formData.reason,
            };

            if (selectedLeave) {
                await staffService.updateLeaveRequest(formData.staffId, selectedLeave.id, leaveData);
                setSuccess('Leave request updated successfully');
            } else {
                await staffService.createLeaveRequest(formData.staffId, leaveData);
                setSuccess('Leave request created successfully');
            }

            setOpenDialog(false);
            loadAllLeaveRequests();
            onUpdate();
        } catch (err: any) {
            setError(err.message || 'Failed to save leave request');
        }
    };

    const handleApproveLeave = async (staffId: number, leaveId: number) => {
        try {
            await staffService.approveLeaveRequest(staffId, leaveId);
            setSuccess('Leave request approved successfully');
            loadAllLeaveRequests();
            onUpdate();
        } catch (err: any) {
            setError(err.message || 'Failed to approve leave request');
        }
    };

    const handleRejectLeave = async (staffId: number, leaveId: number) => {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason === null) return; // User cancelled

        try {
            await staffService.rejectLeaveRequest(staffId, leaveId, reason);
            setSuccess('Leave request rejected successfully');
            loadAllLeaveRequests();
            onUpdate();
        } catch (err: any) {
            setError(err.message || 'Failed to reject leave request');
        }
    };

    const handleDeleteLeave = async (staffId: number, leaveId: number) => {
        if (window.confirm('Are you sure you want to delete this leave request?')) {
            try {
                await staffService.deleteLeaveRequest(staffId, leaveId);
                setSuccess('Leave request deleted successfully');
                loadAllLeaveRequests();
                onUpdate();
            } catch (err: any) {
                setError(err.message || 'Failed to delete leave request');
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'success';
            case 'rejected':
                return 'error';
            case 'pending':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getLeaveTypeColor = (leaveType: string) => {
        switch (leaveType?.toLowerCase()) {
            case 'annual':
                return 'primary';
            case 'sick':
                return 'error';
            case 'personal':
                return 'secondary';
            case 'emergency':
                return 'warning';
            case 'maternity':
            case 'paternity':
                return 'success';
            default:
                return 'default';
        }
    };

    // Get all leave requests in a flat array for display
    const allLeaveRequests = staffProfiles.flatMap(staff =>
        (leaveRequests[staff.id] || []).map(leave => ({
            ...leave,
            staffName: `${staff.firstName} ${staff.lastName}`,
            staffEmployeeId: staff.employeeId,
        }))
    );

    const pendingRequests = allLeaveRequests.filter(leave => leave.status === 'pending');
    const approvedRequests = allLeaveRequests.filter(leave => leave.status === 'approved');
    const rejectedRequests = allLeaveRequests.filter(leave => leave.status === 'rejected');

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box>
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

                {/* Summary Cards */}
                <Stack spacing={2} sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                        <Card sx={{ flex: 1, minWidth: 200 }}>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Pending Requests
                                </Typography>
                                <Typography variant="h4">
                                    {pendingRequests.length}
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: 1, minWidth: 200 }}>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Approved This Month
                                </Typography>
                                <Typography variant="h4">
                                    {approvedRequests.filter(leave =>
                                        dayjs(leave.startDate).month() === dayjs().month()
                                    ).length}
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: 1, minWidth: 200 }}>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Staff
                                </Typography>
                                <Typography variant="h4">
                                    {staffProfiles.length}
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: 1, minWidth: 200 }}>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Requests
                                </Typography>
                                <Typography variant="h4">
                                    {allLeaveRequests.length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Stack>
                </Stack>

                {/* Action Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateLeave}
                    >
                        Create Leave Request
                    </Button>
                </Box>

                {/* Leave Requests Table */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Staff Member</TableCell>
                                <TableCell>Leave Type</TableCell>
                                <TableCell>Start Date</TableCell>
                                <TableCell>End Date</TableCell>
                                <TableCell>Duration</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Reason</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        Loading leave requests...
                                    </TableCell>
                                </TableRow>
                            ) : allLeaveRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        No leave requests found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                allLeaveRequests
                                    .sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime())
                                    .map((leave) => {
                                        const startDate = dayjs(leave.startDate);
                                        const endDate = dayjs(leave.endDate);
                                        const duration = endDate.diff(startDate, 'day') + 1;

                                        return (
                                            <TableRow key={`${leave.staffId}-${leave.id}`}>
                                                <TableCell>
                                                    <Stack>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {leave.staffName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {leave.staffEmployeeId}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={leave.leaveType?.charAt(0).toUpperCase() + leave.leaveType?.slice(1)}
                                                        color={getLeaveTypeColor(leave.leaveType)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>{startDate.format('MMM DD, YYYY')}</TableCell>
                                                <TableCell>{endDate.format('MMM DD, YYYY')}</TableCell>
                                                <TableCell>{duration} day{duration !== 1 ? 's' : ''}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={leave.status?.toUpperCase()}
                                                        color={getStatusColor(leave.status)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            maxWidth: 200,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                        title={leave.reason}
                                                    >
                                                        {leave.reason}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEditLeave(leave)}
                                                            title="Edit"
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        {leave.status === 'pending' && (
                                                            <>
                                                                <IconButton
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => handleApproveLeave(leave.staffId, leave.id)}
                                                                    title="Approve"
                                                                >
                                                                    <ApproveIcon />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleRejectLeave(leave.staffId, leave.id)}
                                                                    title="Reject"
                                                                >
                                                                    <RejectIcon />
                                                                </IconButton>
                                                            </>
                                                        )}
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteLeave(leave.staffId, leave.id)}
                                                            title="Delete"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Create/Edit Leave Request Dialog */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {selectedLeave ? 'Edit Leave Request' : 'Create Leave Request'}
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={3} sx={{ mt: 2 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Staff Member</InputLabel>
                                <Select
                                    value={formData.staffId}
                                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value as number })}
                                    disabled={!!selectedLeave} // Cannot change staff member when editing
                                >
                                    {staffProfiles.map((staff) => (
                                        <MenuItem key={staff.id} value={staff.id}>
                                            {staff.firstName} {staff.lastName} ({staff.employeeId})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth required>
                                <InputLabel>Leave Type</InputLabel>
                                <Select
                                    value={formData.leaveType}
                                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
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
                                    value={formData.startDate}
                                    onChange={(newValue) => setFormData({ ...formData, startDate: newValue })}
                                    sx={{ flex: 1 }}
                                />
                                <DatePicker
                                    label="End Date"
                                    value={formData.endDate}
                                    onChange={(newValue) => setFormData({ ...formData, endDate: newValue })}
                                    sx={{ flex: 1 }}
                                />
                            </Stack>

                            <TextField
                                label="Reason"
                                multiline
                                rows={4}
                                required
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="Please provide a reason for the leave request..."
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                        <Button onClick={handleSaveLeave} variant="contained">
                            {selectedLeave ? 'Update Request' : 'Create Request'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default StaffLeaveManager;
