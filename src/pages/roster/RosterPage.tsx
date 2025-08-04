import React, { useState, useEffect } from 'react';
import {
    Typography,
    Button,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Alert,
    Tabs,
    Tab,
    Stack,
    Box,
} from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridActionsCellItem,
    GridRowParams,
} from '@mui/x-data-grid';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { rosterService, Shift, ShiftSwap, DropdownOption } from '../../services/rosterService';
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
            id={`roster-tabpanel-${index}`}
            aria-labelledby={`roster-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const RosterPage: React.FC = () => {
    const { user } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [shiftSwaps, setShiftSwaps] = useState<ShiftSwap[]>([]);
    const [clients, setClients] = useState<DropdownOption[]>([]);
    const [staff, setStaff] = useState<DropdownOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [swapsLoading, setSwapsLoading] = useState(true);
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [openShiftDialog, setOpenShiftDialog] = useState(false);
    const [openSwapDialog, setOpenSwapDialog] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [selectedSwap, setSelectedSwap] = useState<ShiftSwap | null>(null);
    const [shiftFormData, setShiftFormData] = useState<Partial<Shift>>({});
    const [swapFormData, setSwapFormData] = useState<Partial<ShiftSwap>>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadShifts();
            loadShiftSwaps();
            loadDropdownData();
        }
    }, [user]);

    const loadShifts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await rosterService.getShifts();
            setShifts(data.results || data || []);
        } catch (err: any) {
            console.error('Error loading shifts:', err);
            if (err.response?.status === 401) {
                setError('You are not authorized to view shifts. Please log in.');
            } else {
                setError(err.response?.data?.message || 'Failed to load shifts');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadShiftSwaps = async () => {
        try {
            setSwapsLoading(true);
            const data = await rosterService.getShiftSwaps();
            setShiftSwaps(data.results || data || []);
        } catch (err: any) {
            console.error('Error loading shift swaps:', err);
        } finally {
            setSwapsLoading(false);
        }
    };

    const loadDropdownData = async () => {
        try {
            setDropdownLoading(true);
            const [clientsData, staffData] = await Promise.all([
                rosterService.getClientsDropdown(),
                rosterService.getStaffDropdown()
            ]);
            setClients(clientsData);
            setStaff(staffData);
        } catch (err: any) {
            console.error('Error loading dropdown data:', err);
            setError('Failed to load dropdown data');
        } finally {
            setDropdownLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleOpenShiftDialog = (shift?: Shift) => {
        setSelectedShift(shift || null);
        setShiftFormData(shift || {
            shift_type: 'regular',
            status: 'scheduled',
            hourly_rate: 30,
            start_datetime: dayjs().format('YYYY-MM-DDTHH:mm'),
            end_datetime: dayjs().add(4, 'hour').format('YYYY-MM-DDTHH:mm'),
        });
        setOpenShiftDialog(true);
    };

    const handleCloseShiftDialog = () => {
        setOpenShiftDialog(false);
        setSelectedShift(null);
        setShiftFormData({});
        setError(null);
    };

    const handleSaveShift = async () => {
        try {
            if (selectedShift && selectedShift.id !== undefined) {
                await rosterService.updateShift(selectedShift.id, shiftFormData);
                setSuccess('Shift updated successfully');
            } else {
                await rosterService.createShift(shiftFormData);
                setSuccess('Shift created successfully');
            }
            handleCloseShiftDialog();
            loadShifts();
        } catch (err: any) {
            console.error('Error saving shift:', err);
            setError(err.response?.data?.message || 'Failed to save shift');
        }
    };

    const handleDeleteShift = async (shiftId: number) => {
        if (window.confirm('Are you sure you want to delete this shift?')) {
            try {
                await rosterService.deleteShift(shiftId);
                setSuccess('Shift deleted successfully');
                loadShifts();
            } catch (err: any) {
                console.error('Error deleting shift:', err);
                setError(err.response?.data?.message || 'Failed to delete shift');
            }
        }
    };

    const handleUpdateShiftStatus = async (shiftId: number, status: string) => {
        try {
            await rosterService.updateShiftStatus(shiftId, status);
            setSuccess('Shift status updated successfully');
            loadShifts();
        } catch (err: any) {
            console.error('Error updating shift status:', err);
            setError(err.response?.data?.message || 'Failed to update shift status');
        }
    };

    const handleOpenSwapDialog = (swap?: ShiftSwap) => {
        setSelectedSwap(swap || null);
        setSwapFormData(swap || {
            reason: '',
            status: 'pending',
        });
        setOpenSwapDialog(true);
    };

    const handleCloseSwapDialog = () => {
        setOpenSwapDialog(false);
        setSelectedSwap(null);
        setSwapFormData({});
        setError(null);
    };

    const handleSaveSwap = async () => {
        try {
            await rosterService.createShiftSwap(swapFormData);
            setSuccess('Shift swap request created successfully');
            handleCloseSwapDialog();
            loadShiftSwaps();
        } catch (err: any) {
            console.error('Error creating shift swap:', err);
            setError(err.response?.data?.message || 'Failed to create shift swap');
        }
    };

    const handleApproveSwap = async (swapId: number) => {
        try {
            await rosterService.approveShiftSwap(swapId);
            setSuccess('Shift swap approved successfully');
            loadShiftSwaps();
        } catch (err: any) {
            console.error('Error approving shift swap:', err);
            setError(err.response?.data?.message || 'Failed to approve shift swap');
        }
    };

    const getStatusChip = (status: string) => {
        const colors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
            scheduled: 'info',
            in_progress: 'warning',
            completed: 'success',
            cancelled: 'error',
            no_show: 'error',
            pending: 'warning',
            approved: 'success',
            rejected: 'error',
        };
        return (
            <Chip
                label={status.replace('_', ' ').toUpperCase()}
                color={colors[status] || 'default'}
                size="small"
            />
        );
    };

    const handleShiftInputChange = (field: string, value: any) => {
        setShiftFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSwapInputChange = (field: string, value: any) => {
        setSwapFormData(prev => ({ ...prev, [field]: value }));
    };

    const shiftColumns: GridColDef[] = [
        {
            field: 'client_name',
            headerName: 'Client',
            width: 150,
            valueGetter: (value, row) => row.client_name || `Client ${row.client}`,
        },
        {
            field: 'staff_name',
            headerName: 'Staff',
            width: 150,
            valueGetter: (value, row) => row.staff_name || `Staff ${row.staff}`,
        },
        {
            field: 'shift_type',
            headerName: 'Type',
            width: 120,
            valueGetter: (value, row) => row.shift_type?.replace('_', ' ').toUpperCase() || 'REGULAR',
        },
        {
            field: 'start_datetime',
            headerName: 'Start Time',
            width: 180,
            valueGetter: (value, row) => new Date(row.start_datetime).toLocaleString(),
        },
        {
            field: 'end_datetime',
            headerName: 'End Time',
            width: 180,
            valueGetter: (value, row) => new Date(row.end_datetime).toLocaleString(),
        },
        {
            field: 'duration_hours',
            headerName: 'Duration',
            width: 100,
            valueGetter: (value, row) => `${row.duration_hours || 0}h`,
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => getStatusChip(params.value),
        },
        {
            field: 'total_amount',
            headerName: 'Amount',
            width: 100,
            valueGetter: (value, row) => `$${row.total_amount || 0}`,
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 150,
            getActions: (params: GridRowParams) => [
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => handleOpenShiftDialog(params.row)}
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => handleDeleteShift(params.id as number)}
                />,
            ],
        },
    ];

    const swapColumns: GridColDef[] = [
        {
            field: 'original_shift',
            headerName: 'Shift ID',
            width: 100,
        },
        {
            field: 'requesting_staff',
            headerName: 'Requesting Staff',
            width: 150,
            valueGetter: (value, row) => `Staff ${row.requesting_staff}`,
        },
        {
            field: 'target_staff',
            headerName: 'Target Staff',
            width: 150,
            valueGetter: (value, row) => row.target_staff ? `Staff ${row.target_staff}` : 'Any Staff',
        },
        {
            field: 'reason',
            headerName: 'Reason',
            width: 200,
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => getStatusChip(params.value),
        },
        {
            field: 'requested_at',
            headerName: 'Requested',
            width: 180,
            valueGetter: (value, row) => new Date(row.requested_at).toLocaleString(),
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            getActions: (params: GridRowParams) => [
                ...(params.row.status === 'pending' ? [
                    <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Approve"
                        onClick={() => handleApproveSwap(params.id as number)}
                    />
                ] : [])
            ],
        },
    ];

    if (!user) {
        return (
            <PageLayout>
                <Alert severity="warning">
                    Please log in to view roster.
                </Alert>
            </PageLayout>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <PageLayout>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        Roster Management
                    </Typography>
                </Box>

                <Paper sx={{ width: '100%' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={handleTabChange}>
                            <Tab label="Shifts" />
                            <Tab label="Shift Swaps" />
                        </Tabs>
                    </Box>

                    <TabPanel value={tabValue} index={0}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Scheduled Shifts</Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenShiftDialog()}
                            >
                                Add Shift
                            </Button>
                        </Box>
                        <Box sx={{ height: 500, width: '100%' }}>
                            <DataGrid
                                rows={shifts}
                                columns={shiftColumns}
                                initialState={{
                                    pagination: {
                                        paginationModel: { page: 0, pageSize: 10 },
                                    },
                                }}
                                pageSizeOptions={[5, 10, 25]}
                                loading={loading}
                                disableRowSelectionOnClick
                                slotProps={{
                                    noRowsOverlay: {
                                        children: shifts.length === 0 && !loading ? (
                                            <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                                                <Typography variant="h6" color="text.secondary">
                                                    No shifts scheduled
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Create your first shift to get started
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleOpenShiftDialog()}
                                                >
                                                    Add Shift
                                                </Button>
                                            </Stack>
                                        ) : null
                                    }
                                }}
                            />
                        </Box>
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Shift Swap Requests</Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenSwapDialog()}
                            >
                                Request Swap
                            </Button>
                        </Box>
                        <Box sx={{ height: 500, width: '100%' }}>
                            <DataGrid
                                rows={shiftSwaps}
                                columns={swapColumns}
                                initialState={{
                                    pagination: {
                                        paginationModel: { page: 0, pageSize: 10 },
                                    },
                                }}
                                pageSizeOptions={[5, 10, 25]}
                                loading={swapsLoading}
                                disableRowSelectionOnClick
                                slotProps={{
                                    noRowsOverlay: {
                                        children: shiftSwaps.length === 0 && !swapsLoading ? (
                                            <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                                                <Typography variant="h6" color="text.secondary">
                                                    No shift swap requests
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Create your first swap request to get started
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleOpenSwapDialog()}
                                                >
                                                    Request Swap
                                                </Button>
                                            </Stack>
                                        ) : null
                                    }
                                }}
                            />
                        </Box>
                    </TabPanel>
                </Paper>

                {/* Add/Edit Shift Dialog */}
                <Dialog open={openShiftDialog} onClose={handleCloseShiftDialog} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {selectedShift ? 'Edit Shift' : 'Add New Shift'}
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={3} sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Client</InputLabel>
                                    <Select
                                        value={shiftFormData.client || ''}
                                        onChange={(e) => handleShiftInputChange('client', e.target.value)}
                                        disabled={dropdownLoading}
                                    >
                                        {clients.map((client) => (
                                            <MenuItem key={client.id} value={client.id}>
                                                {client.display_name}
                                                {client.address_line_1 && (
                                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                                        {client.address_line_1}, {client.city}
                                                    </Typography>
                                                )}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth required>
                                    <InputLabel>Staff</InputLabel>
                                    <Select
                                        value={shiftFormData.staff || ''}
                                        onChange={(e) => handleShiftInputChange('staff', e.target.value)}
                                        disabled={dropdownLoading}
                                    >
                                        {staff.filter(s => s.is_active).map((staffMember) => (
                                            <MenuItem key={staffMember.id} value={staffMember.id}>
                                                {staffMember.display_name}
                                                {staffMember.employee_id && (
                                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                                        ID: {staffMember.employee_id} | {staffMember.position}
                                                    </Typography>
                                                )}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Shift Type</InputLabel>
                                    <Select
                                        value={shiftFormData.shift_type || 'regular'}
                                        onChange={(e) => handleShiftInputChange('shift_type', e.target.value)}
                                    >
                                        <MenuItem value="regular">Regular</MenuItem>
                                        <MenuItem value="respite">Respite</MenuItem>
                                        <MenuItem value="emergency">Emergency</MenuItem>
                                        <MenuItem value="overnight">Overnight</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={shiftFormData.status || 'scheduled'}
                                        onChange={(e) => handleShiftInputChange('status', e.target.value)}
                                    >
                                        <MenuItem value="scheduled">Scheduled</MenuItem>
                                        <MenuItem value="in_progress">In Progress</MenuItem>
                                        <MenuItem value="completed">Completed</MenuItem>
                                        <MenuItem value="cancelled">Cancelled</MenuItem>
                                        <MenuItem value="no_show">No Show</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <DateTimePicker
                                    label="Start Date & Time"
                                    value={shiftFormData.start_datetime ? dayjs(shiftFormData.start_datetime) : null}
                                    onChange={(value) => handleShiftInputChange('start_datetime', value?.format('YYYY-MM-DDTHH:mm'))}
                                    sx={{ flex: 1 }}
                                />
                                <DateTimePicker
                                    label="End Date & Time"
                                    value={shiftFormData.end_datetime ? dayjs(shiftFormData.end_datetime) : null}
                                    onChange={(value) => handleShiftInputChange('end_datetime', value?.format('YYYY-MM-DDTHH:mm'))}
                                    sx={{ flex: 1 }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Duration (hours)"
                                    type="number"
                                    fullWidth
                                    value={shiftFormData.duration_hours || ''}
                                    onChange={(e) => handleShiftInputChange('duration_hours', parseFloat(e.target.value))}
                                />
                                <TextField
                                    label="Hourly Rate ($)"
                                    type="number"
                                    fullWidth
                                    value={shiftFormData.hourly_rate || ''}
                                    onChange={(e) => handleShiftInputChange('hourly_rate', parseFloat(e.target.value))}
                                />
                            </Box>
                            <TextField
                                label="Care Instructions"
                                fullWidth
                                multiline
                                rows={3}
                                value={shiftFormData.care_instructions || ''}
                                onChange={(e) => handleShiftInputChange('care_instructions', e.target.value)}
                            />
                            <TextField
                                label="Special Requirements"
                                fullWidth
                                multiline
                                rows={2}
                                value={shiftFormData.special_requirements || ''}
                                onChange={(e) => handleShiftInputChange('special_requirements', e.target.value)}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseShiftDialog}>Cancel</Button>
                        <Button onClick={handleSaveShift} variant="contained">
                            {selectedShift ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Add Shift Swap Dialog */}
                <Dialog open={openSwapDialog} onClose={handleCloseSwapDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>Request Shift Swap</DialogTitle>
                    <DialogContent>
                        <Stack spacing={3} sx={{ mt: 2 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Original Shift</InputLabel>
                                <Select
                                    value={swapFormData.original_shift || ''}
                                    onChange={(e) => handleSwapInputChange('original_shift', e.target.value)}
                                >
                                    {shifts.map((shift) => (
                                        <MenuItem key={shift.id} value={shift.id}>
                                            Shift #{shift.id} - {shift.client_name}
                                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                                {new Date(shift.start_datetime).toLocaleString()}
                                            </Typography>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth required>
                                <InputLabel>Requesting Staff</InputLabel>
                                <Select
                                    value={swapFormData.requesting_staff || ''}
                                    onChange={(e) => handleSwapInputChange('requesting_staff', e.target.value)}
                                >
                                    {staff.filter(s => s.is_active).map((staffMember) => (
                                        <MenuItem key={staffMember.id} value={staffMember.id}>
                                            {staffMember.display_name}
                                            {staffMember.employee_id && (
                                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                                    ID: {staffMember.employee_id}
                                                </Typography>
                                            )}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Target Staff (Optional)</InputLabel>
                                <Select
                                    value={swapFormData.target_staff || ''}
                                    onChange={(e) => handleSwapInputChange('target_staff', e.target.value || undefined)}
                                >
                                    <MenuItem value="">Any Staff</MenuItem>
                                    {staff.filter(s => s.is_active).map((staffMember) => (
                                        <MenuItem key={staffMember.id} value={staffMember.id}>
                                            {staffMember.display_name}
                                            {staffMember.employee_id && (
                                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                                    ID: {staffMember.employee_id}
                                                </Typography>
                                            )}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Reason for Swap"
                                fullWidth
                                required
                                multiline
                                rows={3}
                                value={swapFormData.reason || ''}
                                onChange={(e) => handleSwapInputChange('reason', e.target.value)}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseSwapDialog}>Cancel</Button>
                        <Button onClick={handleSaveSwap} variant="contained">
                            Request Swap
                        </Button>
                    </DialogActions>
                </Dialog>
            </PageLayout>
        </LocalizationProvider>
    );
};

export default RosterPage;
