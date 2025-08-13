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
import { clientService, Client, CareLevel, ClientStatus, CreateClientDto, UpdateClientDto } from '../../services/clientService';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../../components/Layout/PageLayout';
import RoleBasedAccess, { AdminOnly, ManagerOrAbove } from '../../components/Auth/RoleBasedAccess';

const ClientsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Helper function to get user privilege level
    const getUserPrivilegeLevel = () => {
        console.log('Debug - User object:', user);
        console.log('Debug - User roles:', user?.roles);
        console.log('Debug - User type:', user?.user_type);

        if (!user) {
            console.log('Debug - No user found, returning 0');
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
            console.log('Debug - Used roles array, privilege level:', privilegeLevel);
        } else if (user.user_type) {
            privilegeLevel = rolePrivileges[user.user_type] || 0;
            console.log('Debug - Used user_type fallback, privilege level:', privilegeLevel);
        }

        console.log('Debug - Final calculated privilege level:', privilegeLevel);
        return privilegeLevel;
    };    // Helper function to check if user can perform action
    const canPerformAction = (action: string) => {
        const privilegeLevel = getUserPrivilegeLevel();

        switch (action) {
            case 'create':
                return privilegeLevel >= 2; // Care Coordinator or above
            case 'edit':
                return privilegeLevel >= 2; // Care Coordinator or above
            case 'delete':
                return privilegeLevel >= 3; // Manager or above
            case 'view':
                return privilegeLevel >= 1; // All authenticated users
            default:
                return false;
        }
    };
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState<CreateClientDto | UpdateClientDto>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Validation functions
    const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        // Remove all non-digit characters and spaces
        const cleanPhone = phone.replace(/\D/g, '');
        // Australian phone numbers: 
        // - Mobile: 04xx xxx xxx (10 digits starting with 04)
        // - Landline: 0x xxxx xxxx (10 digits starting with 02, 03, 07, 08)
        // - International format: +61 4xx xxx xxx or +61 x xxxx xxxx
        if (cleanPhone.startsWith('614') && cleanPhone.length === 12) {
            // International mobile format: +61 4xx xxx xxx
            return true;
        }
        if (cleanPhone.startsWith('61') && cleanPhone.length === 11) {
            // International landline format: +61 x xxxx xxxx
            const areaCode = cleanPhone.substring(2, 3);
            return ['2', '3', '7', '8'].includes(areaCode);
        }
        if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
            // Domestic format
            if (cleanPhone.startsWith('04')) {
                // Mobile: 04xx xxx xxx
                return true;
            }
            // Landline: 0x xxxx xxxx
            const areaCode = cleanPhone.substring(1, 2);
            return ['2', '3', '7', '8'].includes(areaCode);
        }
        return false;
    };

    const validateZipCode = (zipCode: string): boolean => {
        // Australian postcode format: 4 digits (0000-9999)
        return /^\d{4}$/.test(zipCode);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Required fields
        if (!formData.firstName?.trim()) {
            errors.firstName = 'First name is required';
        }
        if (!formData.lastName?.trim()) {
            errors.lastName = 'Last name is required';
        }
        if (!formData.dateOfBirth) {
            errors.dateOfBirth = 'Date of birth is required';
        }

        // Email validation
        if (formData.email && !validateEmail(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Phone validation
        if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
            errors.phoneNumber = 'Please enter a valid Australian phone number (e.g., 0412 345 678 or 02 1234 5678)';
        }

        if (formData.emergencyContactPhone && !validatePhone(formData.emergencyContactPhone)) {
            errors.emergencyContactPhone = 'Please enter a valid Australian phone number (e.g., 0412 345 678 or 02 1234 5678)';
        }

        // Postcode validation
        if (formData.zipCode && !validateZipCode(formData.zipCode)) {
            errors.zipCode = 'Please enter a valid Australian postcode (4 digits, e.g., 2000)';
        }

        // Date validation
        if (formData.dateOfBirth) {
            const birthDate = new Date(formData.dateOfBirth);
            const today = new Date();
            if (birthDate > today) {
                errors.dateOfBirth = 'Date of birth cannot be in the future';
            }
            const minDate = new Date('1900-01-01');
            if (birthDate < minDate) {
                errors.dateOfBirth = 'Please enter a valid date of birth';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Format date for PostgreSQL/API (ISO 8601 format)
    const formatDateForApi = (dateString: string): string => {
        if (!dateString) return '';

        // If it's already in YYYY-MM-DD format, convert to ISO string
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            // Create date in local timezone and convert to ISO
            const date = new Date(dateString + 'T00:00:00');
            return date.toISOString();
        }

        // Otherwise, create a new Date and format it
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return '';
        }

        return date.toISOString();
    };

    useEffect(() => {
        if (user) {
            loadClients();
        }
    }, [user, page, pageSize]);

    const loadClients = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await clientService.getClients({
                page: page + 1, // API expects 1-based page numbers
                pageSize: pageSize
            });
            setClients(response.results || []);
            setTotalCount(response.count || 0);
        } catch (err: any) {
            console.error('Error loading clients:', err);
            if (err.message?.includes('401') || err.message?.includes('unauthorized')) {
                setError('You are not authorized to view clients. Please log in.');
                navigate('/login');
            } else {
                setError(err.message || 'Failed to load clients');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (client?: Client) => {
        setSelectedClient(client || null);
        if (client) {
            // For editing - populate with existing data
            setFormData({
                firstName: client.firstName,
                lastName: client.lastName,
                middleName: client.middleName,
                preferredName: client.preferredName,
                dateOfBirth: client.dateOfBirth?.split('T')[0], // Format for date input
                gender: client.gender,
                address: client.address,
                city: client.city,
                state: client.state,
                zipCode: client.zipCode,
                phoneNumber: client.phoneNumber,
                email: client.email,
                emergencyContactName: client.emergencyContactName,
                emergencyContactPhone: client.emergencyContactPhone,
                emergencyContactRelationship: client.emergencyContactRelationship,
                careLevel: client.careLevel,
                status: client.status,
                admissionDate: client.admissionDate?.split('T')[0],
                medicalConditions: client.medicalConditions,
                medications: client.medications,
                allergies: client.allergies,
                specialInstructions: client.specialInstructions,
                notes: client.notes,
            });
        } else {
            // For creating - set defaults
            setFormData({
                firstName: '',
                lastName: '',
                dateOfBirth: '',
                careLevel: CareLevel.Medium,
                status: ClientStatus.Active,
                emergencyContactName: '',
                emergencyContactPhone: '',
                emergencyContactRelationship: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedClient(null);
        setFormData({});
        setError(null);
        setFormErrors({});
    };

    const handleSaveClient = async () => {
        try {
            // Validate form before saving
            if (!validateForm()) {
                return;
            }

            // Prepare data with properly formatted dates
            const dataToSave = {
                ...formData,
                dateOfBirth: formatDateForApi(formData.dateOfBirth || ''),
                admissionDate: formData.admissionDate ? formatDateForApi(formData.admissionDate) : undefined,
            };

            if (selectedClient) {
                await clientService.updateClient(selectedClient.id, dataToSave as UpdateClientDto);
                setSuccess('Client updated successfully');
            } else {
                await clientService.createClient(dataToSave as CreateClientDto);
                setSuccess('Client created successfully');
            }
            handleCloseDialog();
            loadClients();
        } catch (err: any) {
            console.error('Error saving client:', err);
            setError(err.message || 'Failed to save client');
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
                setError(err.message || 'Failed to delete client');
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

    const getCareLevel = (level: CareLevel) => {
        const colors: Record<CareLevel, 'success' | 'warning' | 'error' | 'info'> = {
            [CareLevel.Low]: 'success',
            [CareLevel.Medium]: 'warning',
            [CareLevel.High]: 'error',
            [CareLevel.Respite]: 'info',
            [CareLevel.Palliative]: 'info',
        };
        const labels: Record<CareLevel, string> = {
            [CareLevel.Low]: 'Low',
            [CareLevel.Medium]: 'Medium',
            [CareLevel.High]: 'High',
            [CareLevel.Respite]: 'Respite',
            [CareLevel.Palliative]: 'Palliative',
        };
        return (
            <Chip
                label={labels[level]}
                color={colors[level]}
                size="small"
            />
        );
    };

    const getStatus = (status: ClientStatus) => {
        const colors: Record<ClientStatus, 'success' | 'warning' | 'error' | 'info'> = {
            [ClientStatus.Active]: 'success',
            [ClientStatus.Inactive]: 'warning',
            [ClientStatus.Discharged]: 'error',
            [ClientStatus.Deceased]: 'error',
            [ClientStatus.OnHold]: 'info',
        };
        const labels: Record<ClientStatus, string> = {
            [ClientStatus.Active]: 'Active',
            [ClientStatus.Inactive]: 'Inactive',
            [ClientStatus.Discharged]: 'Discharged',
            [ClientStatus.Deceased]: 'Deceased',
            [ClientStatus.OnHold]: 'On Hold',
        };
        return (
            <Chip
                label={labels[status]}
                color={colors[status]}
                size="small"
            />
        );
    };

    const handleInputChange = (field: keyof (CreateClientDto | UpdateClientDto), value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear the specific field error when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'fullName',
            headerName: 'Name',
            width: 200,
            valueGetter: (value, row) => row.fullName || `${row.firstName} ${row.lastName}`,
        },
        {
            field: 'age',
            headerName: 'Age',
            width: 80,
            valueGetter: (value, row) => getAge(row.dateOfBirth),
        },
        {
            field: 'gender',
            headerName: 'Gender',
            width: 100,
            valueGetter: (value, row) => row.gender || 'N/A',
        },
        {
            field: 'phoneNumber',
            headerName: 'Phone',
            width: 150,
            valueGetter: (value, row) => row.phoneNumber || 'N/A',
        },
        {
            field: 'careLevel',
            headerName: 'Care Level',
            width: 130,
            renderCell: (params) => getCareLevel(params.value),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => getStatus(params.value),
        },
        {
            field: 'city',
            headerName: 'City',
            width: 120,
            valueGetter: (value, row) => row.city || 'N/A',
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 150,
            getActions: (params: GridRowParams) => {
                const actions = [];

                if (canPerformAction('view')) {
                    actions.push(
                        <GridActionsCellItem
                            icon={<ViewIcon />}
                            label="View"
                            onClick={() => handleViewClient(params.id as number)}
                        />
                    );
                }

                if (canPerformAction('edit')) {
                    actions.push(
                        <GridActionsCellItem
                            icon={<EditIcon />}
                            label="Edit"
                            onClick={() => handleOpenDialog(params.row)}
                        />
                    );
                }

                if (canPerformAction('delete')) {
                    actions.push(
                        <GridActionsCellItem
                            icon={<DeleteIcon />}
                            label="Delete"
                            onClick={() => handleDeleteClient(params.id as number)}
                            showInMenu
                        />
                    );
                }

                return actions;
            },
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
                <RoleBasedAccess requiredPrivilegeLevel={2}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add Client
                    </Button>
                </RoleBasedAccess>
            </Box>

            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={clients}
                    columns={columns}
                    rowCount={totalCount}
                    loading={loading}
                    pageSizeOptions={[5, 10, 25]}
                    paginationModel={{ page, pageSize }}
                    paginationMode="server"
                    onPaginationModelChange={(model) => {
                        setPage(model.page);
                        setPageSize(model.pageSize);
                    }}
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
                                value={formData.firstName || ''}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                error={!!formErrors.firstName}
                                helperText={formErrors.firstName}
                            />
                            <TextField
                                label="Middle Name"
                                fullWidth
                                value={formData.middleName || ''}
                                onChange={(e) => handleInputChange('middleName', e.target.value)}
                            />
                            <TextField
                                label="Last Name"
                                fullWidth
                                required
                                value={formData.lastName || ''}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                error={!!formErrors.lastName}
                                helperText={formErrors.lastName}
                            />
                        </Box>
                        <TextField
                            label="Preferred Name"
                            fullWidth
                            value={formData.preferredName || ''}
                            onChange={(e) => handleInputChange('preferredName', e.target.value)}
                            helperText="Optional: What the client likes to be called"
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Date of Birth"
                                type="date"
                                fullWidth
                                required
                                InputLabelProps={{ shrink: true }}
                                value={formData.dateOfBirth || ''}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                inputProps={{
                                    max: new Date().toISOString().split('T')[0], // Prevent future dates
                                    min: "1900-01-01" // Reasonable minimum date
                                }}
                                error={!!formErrors.dateOfBirth}
                                helperText={formErrors.dateOfBirth}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Gender</InputLabel>
                                <Select
                                    value={formData.gender || ''}
                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                    label="Gender"
                                >
                                    <MenuItem value="">
                                        <em>Select Gender</em>
                                    </MenuItem>
                                    <MenuItem value="Male">Male</MenuItem>
                                    <MenuItem value="Female">Female</MenuItem>
                                    <MenuItem value="Non-binary">Non-binary</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                    <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Phone Number"
                                fullWidth
                                value={formData.phoneNumber || ''}
                                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                placeholder="0412 345 678"
                                inputProps={{
                                    pattern: "^(\\+61|0)[2-478]\\d{8}$"
                                }}
                                error={!!formErrors.phoneNumber}
                                helperText={formErrors.phoneNumber || "Format: 0412 345 678 (mobile) or 02 1234 5678 (landline)"}
                            />
                            <TextField
                                label="Email"
                                type="email"
                                fullWidth
                                value={formData.email || ''}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                error={!!formErrors.email}
                                helperText={formErrors.email}
                            />
                        </Box>
                        <TextField
                            label="Address"
                            fullWidth
                            value={formData.address || ''}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="City"
                                fullWidth
                                value={formData.city || ''}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                            />
                            <TextField
                                label="State/Territory"
                                fullWidth
                                value={formData.state || ''}
                                onChange={(e) => handleInputChange('state', e.target.value)}
                                placeholder="NSW"
                                inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }}
                                helperText="State/Territory (e.g., NSW, VIC, QLD, WA, SA, TAS, ACT, NT)"
                            />
                            <TextField
                                label="Postcode"
                                fullWidth
                                value={formData.zipCode || ''}
                                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                                placeholder="2000"
                                error={!!formErrors.zipCode}
                                helperText={formErrors.zipCode || "Format: 4 digits (e.g., 2000)"}
                                inputProps={{ maxLength: 4 }}
                            />
                        </Box>
                        <FormControl fullWidth>
                            <InputLabel>Care Level</InputLabel>
                            <Select
                                value={formData.careLevel ?? CareLevel.Medium}
                                onChange={(e) => handleInputChange('careLevel', e.target.value as CareLevel)}
                            >
                                <MenuItem value={CareLevel.Low}>Low Care</MenuItem>
                                <MenuItem value={CareLevel.Medium}>Medium Care</MenuItem>
                                <MenuItem value={CareLevel.High}>High Care</MenuItem>
                                <MenuItem value={CareLevel.Respite}>Respite Care</MenuItem>
                                <MenuItem value={CareLevel.Palliative}>Palliative Care</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={formData.status ?? ClientStatus.Active}
                                onChange={(e) => handleInputChange('status', e.target.value as ClientStatus)}
                            >
                                <MenuItem value={ClientStatus.Active}>Active</MenuItem>
                                <MenuItem value={ClientStatus.Inactive}>Inactive</MenuItem>
                                <MenuItem value={ClientStatus.OnHold}>On Hold</MenuItem>
                                <MenuItem value={ClientStatus.Discharged}>Discharged</MenuItem>
                                <MenuItem value={ClientStatus.Deceased}>Deceased</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Admission Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.admissionDate || ''}
                            onChange={(e) => handleInputChange('admissionDate', e.target.value)}
                            inputProps={{
                                max: new Date().toISOString().split('T')[0], // Prevent future dates
                            }}
                            helperText="Date when client was admitted to care"
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Emergency Contact Name"
                                fullWidth
                                value={formData.emergencyContactName || ''}
                                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                            />
                            <TextField
                                label="Emergency Contact Phone"
                                fullWidth
                                value={formData.emergencyContactPhone || ''}
                                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                                placeholder="0412 345 678"
                                error={!!formErrors.emergencyContactPhone}
                                helperText={formErrors.emergencyContactPhone || "Format: 0412 345 678 (mobile) or 02 1234 5678 (landline)"}
                            />
                        </Box>
                        <TextField
                            label="Emergency Contact Relationship"
                            fullWidth
                            value={formData.emergencyContactRelationship || ''}
                            onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                        />
                        <TextField
                            label="Medical Conditions"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.medicalConditions || ''}
                            onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                        />
                        <TextField
                            label="Medications"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.medications || ''}
                            onChange={(e) => handleInputChange('medications', e.target.value)}
                        />
                        <TextField
                            label="Allergies"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.allergies || ''}
                            onChange={(e) => handleInputChange('allergies', e.target.value)}
                        />
                        <TextField
                            label="Special Instructions"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.specialInstructions || ''}
                            onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                        />
                        <TextField
                            label="Notes"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.notes || ''}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
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