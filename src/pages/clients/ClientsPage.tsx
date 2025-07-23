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
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { clientService, Client } from '../../services/clientService';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../../components/Layout/PageLayout';

const ClientsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState<Partial<Client>>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadClients();
        }
    }, [user]);

    const loadClients = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await clientService.getClients();
            setClients(data.results || data || []);
        } catch (err: any) {
            console.error('Error loading clients:', err);
            if (err.response?.status === 401) {
                setError('You are not authorized to view clients. Please log in.');
                navigate('/login');
            } else {
                setError(err.response?.data?.message || 'Failed to load clients');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (client?: Client) => {
        setSelectedClient(client || null);
        setFormData(client || {
            first_name: '',
            last_name: '',
            date_of_birth: '',
            gender: 'M',
            address_line_1: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'Australia',
            care_level: 'medium',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            emergency_contact_relationship: '',
            is_active: true,
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedClient(null);
        setFormData({});
        setError(null);
    };

    const handleSaveClient = async () => {
        try {
            if (selectedClient) {
                await clientService.updateClient(selectedClient.id, formData);
                setSuccess('Client updated successfully');
            } else {
                await clientService.createClient(formData);
                setSuccess('Client created successfully');
            }
            handleCloseDialog();
            loadClients();
        } catch (err: any) {
            console.error('Error saving client:', err);
            setError(err.response?.data?.message || 'Failed to save client');
        }
    };

    const handleDeleteClient = async (clientId: number) => {
        if (window.confirm('Are you sure you want to delete this client?')) {
            try {
                await clientService.deleteClient(clientId);
                setSuccess('Client deleted successfully');
                loadClients();
            } catch (err: any) {
                console.error('Error deleting client:', err);
                setError(err.response?.data?.message || 'Failed to delete client');
            }
        }
    };

    const handleViewClient = (clientId: number) => {
        navigate(`/clients/${clientId}`);
    };

    const getAge = (dateOfBirth: string) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const getCareLevel = (level: string) => {
        const colors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
            low: 'success',
            medium: 'warning',
            high: 'error',
            respite: 'info',
            palliative: 'secondary',
        };
        return (
            <Chip
                label={level.charAt(0).toUpperCase() + level.slice(1)}
                color={colors[level] || 'info'}
                size="small"
            />
        );
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const columns: GridColDef[] = [
        {
            field: 'full_name',
            headerName: 'Name',
            width: 200,
            valueGetter: (value, row) => `${row.first_name} ${row.last_name}`,
        },
        {
            field: 'age',
            headerName: 'Age',
            width: 80,
            valueGetter: (value, row) => getAge(row.date_of_birth),
        },
        {
            field: 'gender',
            headerName: 'Gender',
            width: 100,
            valueGetter: (value, row) => row.gender === 'M' ? 'Male' : row.gender === 'F' ? 'Female' : 'Other',
        },
        {
            field: 'phone_number',
            headerName: 'Phone',
            width: 150,
            valueGetter: (value, row) => row.phone_number || 'N/A',
        },
        {
            field: 'care_level',
            headerName: 'Care Level',
            width: 130,
            renderCell: (params) => getCareLevel(params.value),
        },
        {
            field: 'city',
            headerName: 'City',
            width: 120,
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 150,
            getActions: (params: GridRowParams) => [
                <GridActionsCellItem
                    icon={<ViewIcon />}
                    label="View"
                    onClick={() => handleViewClient(params.id as number)}
                />,
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => handleOpenDialog(params.row)}
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => handleDeleteClient(params.id as number)}
                />,
            ],
        },
    ];

    if (!user) {
        return (
            <PageLayout>
                <Alert severity="warning">
                    Please log in to view clients.
                </Alert>
            </PageLayout>
        );
    }

    return (
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
                    Clients Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Client
                </Button>
            </Box>

            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={clients}
                    columns={columns}
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
                            children: clients.length === 0 && !loading ? (
                                <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                                    <Typography variant="h6" color="text.secondary">
                                        No clients available
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Add your first client to get started
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleOpenDialog()}
                                    >
                                        Add Client
                                    </Button>
                                </Stack>
                            ) : null
                        }
                    }}
                />
            </Paper>

            {/* Add/Edit Client Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedClient ? 'Edit Client' : 'Add New Client'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="First Name"
                                fullWidth
                                required
                                value={formData.first_name || ''}
                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                            />
                            <TextField
                                label="Last Name"
                                fullWidth
                                required
                                value={formData.last_name || ''}
                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Date of Birth"
                                type="date"
                                fullWidth
                                required
                                InputLabelProps={{ shrink: true }}
                                value={formData.date_of_birth || ''}
                                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Gender</InputLabel>
                                <Select
                                    value={formData.gender || 'M'}
                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                >
                                    <MenuItem value="M">Male</MenuItem>
                                    <MenuItem value="F">Female</MenuItem>
                                    <MenuItem value="O">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Phone Number"
                                fullWidth
                                value={formData.phone_number || ''}
                                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                            />
                            <TextField
                                label="Email"
                                type="email"
                                fullWidth
                                value={formData.email || ''}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                            />
                        </Box>
                        <TextField
                            label="Address Line 1"
                            fullWidth
                            required
                            value={formData.address_line_1 || ''}
                            onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="City"
                                fullWidth
                                required
                                value={formData.city || ''}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                            />
                            <TextField
                                label="State"
                                fullWidth
                                required
                                value={formData.state || ''}
                                onChange={(e) => handleInputChange('state', e.target.value)}
                            />
                            <TextField
                                label="Postal Code"
                                fullWidth
                                required
                                value={formData.postal_code || ''}
                                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                            />
                        </Box>
                        <FormControl fullWidth>
                            <InputLabel>Care Level</InputLabel>
                            <Select
                                value={formData.care_level || 'medium'}
                                onChange={(e) => handleInputChange('care_level', e.target.value)}
                            >
                                <MenuItem value="low">Low Care</MenuItem>
                                <MenuItem value="medium">Medium Care</MenuItem>
                                <MenuItem value="high">High Care</MenuItem>
                                <MenuItem value="respite">Respite Care</MenuItem>
                                <MenuItem value="palliative">Palliative Care</MenuItem>
                            </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Emergency Contact Name"
                                fullWidth
                                required
                                value={formData.emergency_contact_name || ''}
                                onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                            />
                            <TextField
                                label="Emergency Contact Phone"
                                fullWidth
                                required
                                value={formData.emergency_contact_phone || ''}
                                onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                            />
                        </Box>
                        <TextField
                            label="Emergency Contact Relationship"
                            fullWidth
                            required
                            value={formData.emergency_contact_relationship || ''}
                            onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSaveClient} variant="contained">
                        {selectedClient ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageLayout>
    );
};

export default ClientsPage;