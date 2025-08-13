import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Chip,
    Divider,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Alert,
    CircularProgress,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tab,
    Tabs,
    Card,
    CardContent,
    CardActions,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Badge,
    Tooltip,
} from '@mui/material';
import {
    Edit as EditIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Home as HomeIcon,
    LocalHospital as MedicalIcon,
    ContactEmergency as EmergencyIcon,
    Description as DocumentIcon,
    Add as AddIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon,
    Notes as NotesIcon,
    Assignment as CarePlanIcon,
    ExpandMore as ExpandMoreIcon,
    Visibility as ViewIcon,
    CheckCircle as ActiveIcon,
    Cancel as InactiveIcon,
    Warning as DraftIcon,
    CheckCircle,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService, Client, ClientDocument, CarePlan, ClientNote, CareLevel, ClientStatus } from '../../services/clientService';
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
            id={`client-tabpanel-${index}`}
            aria-labelledby={`client-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const ClientDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [client, setClient] = useState<Client | null>(null);
    const [documents, setDocuments] = useState<ClientDocument[]>([]);
    const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
    const [notes, setNotes] = useState<ClientNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);

    // Dialog states
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
    const [openCarePlanDialog, setOpenCarePlanDialog] = useState(false);
    const [openNoteDialog, setOpenNoteDialog] = useState(false);

    // Form data states
    const [formData, setFormData] = useState<Partial<Client>>({});
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [documentData, setDocumentData] = useState({
        title: '',
        description: '',
        documentType: 'Other',
    });
    const [carePlanData, setCarePlanData] = useState<Partial<CarePlan>>({
        title: '',
        description: '',
        goals: '',
        interventionStrategies: '',
        startDate: '',
        reviewDate: '',
        status: 0, // Draft as numeric value
    });
    const [noteData, setNoteData] = useState<Partial<ClientNote>>({
        title: '',
        content: '',
        noteType: 0, // General as numeric value
        isPrivate: false,
    });

    const [selectedCarePlan, setSelectedCarePlan] = useState<CarePlan | null>(null);
    const [selectedNote, setSelectedNote] = useState<ClientNote | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [carePlanError, setCarePlanError] = useState<string | null>(null);
    const [noteError, setNoteError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadClientData();
        }
    }, [id]);

    const loadClientData = async () => {
        try {
            setLoading(true);
            setError(null);

            const clientId = parseInt(id!);
            const [clientData, documentsData, carePlansData, notesData] = await Promise.all([
                clientService.getClient(clientId),
                clientService.getClientDocuments(clientId).catch(() => []),
                clientService.getCarePlans(clientId).catch(() => []),
                clientService.getClientNotes(clientId).catch(() => []),
            ]);

            setClient(clientData);
            setFormData(clientData);
            setDocuments(documentsData || []);
            setCarePlans(carePlansData || []);
            setNotes(notesData || []);
        } catch (err: any) {
            console.error('Error loading client data:', err);
            if (err.response?.status === 404) {
                setError('Client not found');
            } else if (err.response?.status === 401) {
                setError('You are not authorized to view this client');
                navigate('/login');
            } else {
                setError(err.response?.data?.message || 'Failed to load client data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditClient = async () => {
        try {
            await clientService.updateClient(parseInt(id!), formData);
            setSuccess('Client updated successfully');
            setOpenEditDialog(false);
            loadClientData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update client');
        }
    };

    const handleUploadDocument = async () => {
        if (!documentFile || !documentData.title) {
            setError('Please provide a file and title');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('clientId', id!);
            formData.append('file', documentFile);
            formData.append('title', documentData.title);
            formData.append('description', documentData.description);
            formData.append('documentType', documentData.documentType);

            await clientService.uploadClientDocument(parseInt(id!), formData);
            setSuccess('Document uploaded successfully');
            setOpenDocumentDialog(false);
            setDocumentFile(null);
            setDocumentData({ title: '', description: '', documentType: 'Other' });
            loadClientData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload document');
        }
    };

    // ...existing code...

    const handleCreateCarePlan = async () => {
        try {
            setCarePlanError(null); // Clear previous errors

            // Map status string to numeric enum value for .NET API
            const statusMap: { [key: string]: number } = {
                'Draft': 0,
                'Active': 1,
                'Inactive': 2,
                'Completed': 3,
                'Discontinued': 4
            };

            // Ensure dates are in the correct format (ISO string)
            const formattedData: any = {
                ...carePlanData,
                clientId: parseInt(id!), // Include clientId to match URL parameter
                status: typeof carePlanData.status === 'string' ? statusMap[carePlanData.status] || 0 : carePlanData.status,
            };

            // Only include dates if they have values
            if (carePlanData.startDate) {
                formattedData.startDate = new Date(carePlanData.startDate).toISOString();
            }
            if (carePlanData.reviewDate) {
                formattedData.reviewDate = new Date(carePlanData.reviewDate).toISOString();
            }
            if (carePlanData.endDate) {
                formattedData.endDate = new Date(carePlanData.endDate).toISOString();
            }

            if (selectedCarePlan) {
                await clientService.updateCarePlan(parseInt(id!), selectedCarePlan.id, formattedData);
                setSuccess('Care plan updated successfully');
            } else {
                await clientService.createCarePlan(parseInt(id!), formattedData);
                setSuccess('Care plan created successfully');
            }
            setOpenCarePlanDialog(false);
            setSelectedCarePlan(null);
            setCarePlanData({
                title: '',
                description: '',
                goals: '',
                interventionStrategies: '',
                startDate: '',
                reviewDate: '',
                status: 0, // Draft as numeric value
            });
            loadClientData();
        } catch (err: any) {
            console.error('Care plan error:', err.response?.data);

            // Extract meaningful error message from .NET validation response
            let errorMessage = 'Failed to save care plan';
            if (err.response?.data) {
                const responseData = err.response.data;
                if (responseData.title) {
                    errorMessage = responseData.title;
                    // If there are specific validation errors, include them
                    if (responseData.errors) {
                        const validationErrors = Object.entries(responseData.errors)
                            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                            .join('; ');
                        errorMessage += ` - ${validationErrors}`;
                    }
                } else if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            }

            setCarePlanError(errorMessage);
        }
    };

    const handleActivateCarePlan = async (planId: number) => {
        try {
            await clientService.activateCarePlan(parseInt(id!), planId);
            setSuccess('Care plan activated successfully');
            loadClientData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to activate care plan');
        }
    };

    const handleCreateNote = async () => {
        try {
            setNoteError(null); // Clear previous errors

            // Map noteType string to numeric enum value for .NET API
            const noteTypeMap: { [key: string]: number } = {
                'General': 0,
                'Medical': 1,
                'Behavioral': 2,
                'Care': 3,
                'Administrative': 4
            };

            // Include clientId to match URL parameter for .NET API
            const formattedNoteData = {
                ...noteData,
                clientId: parseInt(id!),
                noteType: typeof noteData.noteType === 'string' ? noteTypeMap[noteData.noteType] || 0 : noteData.noteType,
            };

            if (selectedNote) {
                await clientService.updateClientNote(parseInt(id!), selectedNote.id, formattedNoteData);
                setSuccess('Note updated successfully');
            } else {
                await clientService.createClientNote(parseInt(id!), formattedNoteData);
                setSuccess('Note created successfully');
            }
            setOpenNoteDialog(false);
            setSelectedNote(null);
            setNoteData({
                title: '',
                content: '',
                noteType: 0, // General as numeric value
                isPrivate: false,
            });
            loadClientData();
        } catch (err: any) {
            console.error('Note error:', err.response?.data);

            // Extract meaningful error message from .NET validation response
            let errorMessage = 'Failed to save note';
            if (err.response?.data) {
                const responseData = err.response.data;
                if (responseData.title) {
                    errorMessage = responseData.title;
                    // If there are specific validation errors, include them
                    if (responseData.errors) {
                        const validationErrors = Object.entries(responseData.errors)
                            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                            .join('; ');
                        errorMessage += ` - ${validationErrors}`;
                    }
                } else if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            }

            setNoteError(errorMessage);
        }
    };

    const handleDeleteDocument = async (documentId: number) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await clientService.deleteClientDocument(parseInt(id!), documentId);
                setSuccess('Document deleted successfully');
                loadClientData();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to delete document');
            }
        }
    };

    const handleDeleteCarePlan = async (planId: number) => {
        if (window.confirm('Are you sure you want to delete this care plan?')) {
            try {
                await clientService.deleteCarePlan(parseInt(id!), planId);
                setSuccess('Care plan deleted successfully');
                loadClientData();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to delete care plan');
            }
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await clientService.deleteClientNote(parseInt(id!), noteId);
                setSuccess('Note deleted successfully');
                loadClientData();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to delete note');
            }
        }
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
        const colors: Record<CareLevel, 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
            [CareLevel.Low]: 'success',
            [CareLevel.Medium]: 'warning',
            [CareLevel.High]: 'error',
            [CareLevel.Respite]: 'info',
            [CareLevel.Palliative]: 'secondary',
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
                color={colors[level] || 'info'}
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

    const getStatusIcon = (status: string | number) => {
        // Map numeric status values to strings (for .NET API compatibility)
        const statusMap: { [key: number]: string } = {
            0: 'draft',
            1: 'active',
            2: 'inactive',
            3: 'completed',
            4: 'discontinued'
        };

        const statusString = typeof status === 'number'
            ? statusMap[status]
            : status?.toString()?.toLowerCase();

        switch (statusString) {
            case 'active':
                return <ActiveIcon color="success" />;
            case 'draft':
                return <DraftIcon color="warning" />;
            case 'completed':
                return <CheckCircle color="info" />;
            case 'cancelled':
            case 'discontinued':
                return <InactiveIcon color="error" />;
            default:
                return <InactiveIcon color="disabled" />;
        }
    };

    const getNoteTypeDisplay = (noteType: string | number) => {
        // Map numeric noteType values to display strings (for .NET API compatibility)
        const noteTypeMap: { [key: number]: string } = {
            0: 'General',
            1: 'Medical',
            2: 'Behavioral',
            3: 'Care',
            4: 'Administrative'
        };

        return typeof noteType === 'number'
            ? noteTypeMap[noteType] || 'General'
            : noteType;
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: '#4caf50',
            medium: '#ff9800',
            high: '#f44336',
            urgent: '#d32f2f',
        };
        return colors[priority?.toLowerCase()] || '#757575';
    };

    if (loading) {
        return (
            <PageLayout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </PageLayout>
        );
    }

    if (error || !client) {
        return (
            <PageLayout>
                <Alert severity="error">{error || 'Client not found'}</Alert>
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

                {/* Client Header */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h4" component="h1">
                            {client.firstName} {client.lastName}
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => setOpenEditDialog(true)}
                        >
                            Edit Client
                        </Button>
                    </Stack>

                    <Stack direction="row" spacing={2} mb={2}>
                        <Chip label={`Age: ${getAge(client.dateOfBirth)}`} icon={<PersonIcon />} />
                        {getCareLevel(client.careLevel)}
                        {getStatus(client.status)}
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                        Client ID: {client.id} | Created: {new Date(client.createdAt).toLocaleDateString()}
                    </Typography>
                </Paper>

                {/* Tabs */}
                <Paper sx={{ width: '100%' }}>
                    <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                        <Tab label="Overview" />
                        <Tab label={`Care Plans (${carePlans.length})`} />
                        <Tab label={`Notes (${notes.length})`} />
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
                                                <Typography>{new Date(client.dateOfBirth).toLocaleDateString()}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2">Gender</Typography>
                                                <Typography>{client.gender || 'Not specified'}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2">Phone</Typography>
                                                <Typography>{client.phoneNumber || 'Not provided'}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2">Email</Typography>
                                                <Typography>{client.email || 'Not provided'}</Typography>
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
                                        {client.address}
                                        <br />
                                        {client.city}, {client.state} {client.zipCode}
                                    </Typography>
                                </CardContent>
                            </Card>

                            {/* Medical Information */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        <MedicalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Medical Information
                                    </Typography>
                                    <Stack spacing={2}>
                                        {client.medicalConditions && (
                                            <Box>
                                                <Typography variant="subtitle2">Medical Conditions</Typography>
                                                <Typography>{client.medicalConditions}</Typography>
                                            </Box>
                                        )}
                                        {client.medications && (
                                            <Box>
                                                <Typography variant="subtitle2">Medications</Typography>
                                                <Typography>{client.medications}</Typography>
                                            </Box>
                                        )}
                                        {client.allergies && (
                                            <Box>
                                                <Typography variant="subtitle2">Allergies</Typography>
                                                <Typography>{client.allergies}</Typography>
                                            </Box>
                                        )}
                                        {client.specialInstructions && (
                                            <Box>
                                                <Typography variant="subtitle2">Special Instructions</Typography>
                                                <Typography>{client.specialInstructions}</Typography>
                                            </Box>
                                        )}
                                    </Stack>
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
                                            <Typography>{client.emergencyContactName}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Phone</Typography>
                                            <Typography>{client.emergencyContactPhone}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Relationship</Typography>
                                            <Typography>{client.emergencyContactRelationship}</Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Stack>
                    </TabPanel>

                    {/* Care Plans Tab */}
                    <TabPanel value={tabValue} index={1}>
                        <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6">Care Plans</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => {
                                        setCarePlanError(null); // Clear any previous errors
                                        setOpenCarePlanDialog(true);
                                    }}
                                >
                                    Add Care Plan
                                </Button>
                            </Stack>

                            {carePlans.length === 0 ? (
                                <Alert severity="info">No care plans found for this client.</Alert>
                            ) : (
                                carePlans.map((plan) => (
                                    <Card key={plan.id}>
                                        <CardContent>
                                            <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                                                <Box>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Typography variant="h6">{plan.title}</Typography>
                                                        {getStatusIcon(plan.status)}
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Created: {new Date(plan.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                                <Stack direction="row" spacing={1}>
                                                    <IconButton
                                                        onClick={() => {
                                                            setCarePlanError(null); // Clear any previous errors
                                                            setSelectedCarePlan(plan);
                                                            setCarePlanData(plan);
                                                            setOpenCarePlanDialog(true);
                                                        }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() => handleDeleteCarePlan(plan.id)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Stack>
                                            </Stack>

                                            <Typography paragraph>{plan.description}</Typography>

                                            <Accordion>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Typography>Care Details</Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <Stack spacing={2}>
                                                        <Box>
                                                            <Typography variant="subtitle2">Goals</Typography>
                                                            <Typography>{plan.goals}</Typography>
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="subtitle2">Intervention Strategies</Typography>
                                                            <Typography>{plan.interventionStrategies}</Typography>
                                                        </Box>
                                                        <Stack direction="row" spacing={4}>
                                                            <Box>
                                                                <Typography variant="subtitle2">Start Date</Typography>
                                                                <Typography>{new Date(plan.startDate).toLocaleDateString()}</Typography>
                                                            </Box>
                                                            {plan.reviewDate && (
                                                                <Box>
                                                                    <Typography variant="subtitle2">Review Date</Typography>
                                                                    <Typography>{new Date(plan.reviewDate).toLocaleDateString()}</Typography>
                                                                </Box>
                                                            )}
                                                        </Stack>
                                                    </Stack>
                                                </AccordionDetails>
                                            </Accordion>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </Stack>
                    </TabPanel>

                    {/* Notes Tab */}
                    <TabPanel value={tabValue} index={2}>
                        <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6">Client Notes</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => {
                                        setNoteError(null); // Clear any previous errors
                                        setOpenNoteDialog(true);
                                    }}
                                >
                                    Add Note
                                </Button>
                            </Stack>

                            {notes.length === 0 ? (
                                <Alert severity="info">No notes found for this client.</Alert>
                            ) : (
                                notes.map((note) => (
                                    <Card key={note.id}>
                                        <CardContent>
                                            <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                                                <Box>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Typography variant="h6">{note.title}</Typography>
                                                        {note.isPrivate && (
                                                            <Chip label="PRIVATE" color="secondary" size="small" />
                                                        )}
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {getNoteTypeDisplay(note.noteType)} • {new Date(note.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                                <Stack direction="row" spacing={1}>
                                                    <IconButton
                                                        onClick={() => {
                                                            setNoteError(null); // Clear any previous errors
                                                            setSelectedNote(note);
                                                            setNoteData(note);
                                                            setOpenNoteDialog(true);
                                                        }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() => handleDeleteNote(note.id)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Stack>
                                            </Stack>
                                            <Typography>{note.content}</Typography>
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
                                <Typography variant="h6">Documents</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setOpenDocumentDialog(true)}
                                >
                                    Upload Document
                                </Button>
                            </Stack>

                            {documents.length === 0 ? (
                                <Alert severity="info">No documents uploaded for this client.</Alert>
                            ) : (
                                documents.map((document) => (
                                    <Card key={document.id}>
                                        <CardContent>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Stack direction="row" alignItems="center" spacing={2}>
                                                    <DocumentIcon color="primary" />
                                                    <Box>
                                                        <Typography variant="h6">{document.title}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {document.documentType} • Uploaded {new Date(document.uploadDate).toLocaleDateString()}
                                                        </Typography>
                                                        {document.description && (
                                                            <Typography variant="body2">{document.description}</Typography>
                                                        )}
                                                    </Box>
                                                </Stack>
                                                <Stack direction="row" spacing={1}>
                                                    <IconButton
                                                        onClick={async () => {
                                                            try {
                                                                const blob = await clientService.downloadClientDocument(parseInt(id!), document.id);
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

                {/* Edit Client Dialog */}
                <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Edit Client</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="First Name"
                                    value={formData.firstName || ''}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    fullWidth
                                />
                                <TextField
                                    label="Last Name"
                                    value={formData.lastName || ''}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    fullWidth
                                />
                            </Stack>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Email"
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    fullWidth
                                />
                                <TextField
                                    label="Phone"
                                    value={formData.phoneNumber || ''}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    fullWidth
                                />
                            </Stack>
                            <TextField
                                label="Address"
                                value={formData.address || ''}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                fullWidth
                            />
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="City"
                                    value={formData.city || ''}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    fullWidth
                                />
                                <TextField
                                    label="State"
                                    value={formData.state || ''}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    fullWidth
                                />
                                <TextField
                                    label="Postcode"
                                    value={formData.zipCode || ''}
                                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                    fullWidth
                                />
                            </Stack>
                            <TextField
                                label="Medical Conditions"
                                multiline
                                rows={3}
                                value={formData.medicalConditions || ''}
                                onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Medications"
                                multiline
                                rows={3}
                                value={formData.medications || ''}
                                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Allergies"
                                multiline
                                rows={2}
                                value={formData.allergies || ''}
                                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                fullWidth
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
                        <Button onClick={handleEditClient} variant="contained">Save</Button>
                    </DialogActions>
                </Dialog>

                {/* Upload Document Dialog */}
                <Dialog open={openDocumentDialog} onClose={() => setOpenDocumentDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Title"
                                value={documentData.title}
                                onChange={(e) => setDocumentData({ ...documentData, title: e.target.value })}
                                fullWidth
                                required
                            />
                            <FormControl fullWidth>
                                <InputLabel>Document Type</InputLabel>
                                <Select
                                    value={documentData.documentType}
                                    onChange={(e) => setDocumentData({ ...documentData, documentType: e.target.value })}
                                >
                                    <MenuItem value="Medical">Medical Record</MenuItem>
                                    <MenuItem value="Legal">Legal Document</MenuItem>
                                    <MenuItem value="Insurance">Insurance Document</MenuItem>
                                    <MenuItem value="Personal">Personal Document</MenuItem>
                                    <MenuItem value="Care">Care Document</MenuItem>
                                    <MenuItem value="Assessment">Assessment</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Description"
                                multiline
                                rows={3}
                                value={documentData.description}
                                onChange={(e) => setDocumentData({ ...documentData, description: e.target.value })}
                                fullWidth
                            />
                            <input
                                type="file"
                                onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                style={{ marginTop: 16 }}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDocumentDialog(false)}>Cancel</Button>
                        <Button onClick={handleUploadDocument} variant="contained">Upload</Button>
                    </DialogActions>
                </Dialog>

                {/* Care Plan Dialog */}
                <Dialog open={openCarePlanDialog} onClose={() => setOpenCarePlanDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle>{selectedCarePlan ? 'Edit Care Plan' : 'Create Care Plan'}</DialogTitle>
                    <DialogContent>
                        {carePlanError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {carePlanError}
                            </Alert>
                        )}
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Title"
                                value={carePlanData.title || ''}
                                onChange={(e) => setCarePlanData({ ...carePlanData, title: e.target.value })}
                                fullWidth
                                required
                            />
                            <Stack direction="row" spacing={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={carePlanData.status || 0}
                                        onChange={(e) => setCarePlanData({ ...carePlanData, status: Number(e.target.value) })}
                                    >
                                        <MenuItem value={0}>Draft</MenuItem>
                                        <MenuItem value={1}>Active</MenuItem>
                                        <MenuItem value={2}>Inactive</MenuItem>
                                        <MenuItem value={3}>Completed</MenuItem>
                                        <MenuItem value={4}>Discontinued</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                            <TextField
                                label="Description"
                                multiline
                                rows={3}
                                value={carePlanData.description || ''}
                                onChange={(e) => setCarePlanData({ ...carePlanData, description: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Goals"
                                multiline
                                rows={3}
                                value={carePlanData.goals || ''}
                                onChange={(e) => setCarePlanData({ ...carePlanData, goals: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Intervention Strategies"
                                multiline
                                rows={3}
                                value={carePlanData.interventionStrategies || ''}
                                onChange={(e) => setCarePlanData({ ...carePlanData, interventionStrategies: e.target.value })}
                                fullWidth
                            />
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    value={carePlanData.startDate || ''}
                                    onChange={(e) => setCarePlanData({ ...carePlanData, startDate: e.target.value })}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Review Date"
                                    type="date"
                                    value={carePlanData.reviewDate || ''}
                                    onChange={(e) => setCarePlanData({ ...carePlanData, reviewDate: e.target.value })}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenCarePlanDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateCarePlan} variant="contained">
                            {selectedCarePlan ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Note Dialog */}
                <Dialog open={openNoteDialog} onClose={() => setOpenNoteDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle>{selectedNote ? 'Edit Note' : 'Create Note'}</DialogTitle>
                    <DialogContent>
                        {noteError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {noteError}
                            </Alert>
                        )}
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Title"
                                value={noteData.title || ''}
                                onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
                                fullWidth
                                required
                            />
                            <Stack direction="row" spacing={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Note Type</InputLabel>
                                    <Select
                                        value={noteData.noteType || 0}
                                        onChange={(e) => setNoteData({ ...noteData, noteType: Number(e.target.value) })}
                                    >
                                        <MenuItem value={0}>General Note</MenuItem>
                                        <MenuItem value={1}>Medical Observation</MenuItem>
                                        <MenuItem value={2}>Behavioral Note</MenuItem>
                                        <MenuItem value={3}>Care Update</MenuItem>
                                        <MenuItem value={4}>Administrative</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                            <TextField
                                label="Content"
                                multiline
                                rows={6}
                                value={noteData.content || ''}
                                onChange={(e) => setNoteData({ ...noteData, content: e.target.value })}
                                fullWidth
                                required
                            />
                            <FormControl>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <input
                                        type="checkbox"
                                        checked={noteData.isPrivate || false}
                                        onChange={(e) => setNoteData({ ...noteData, isPrivate: e.target.checked })}
                                    />
                                    <Typography>Mark as private</Typography>
                                </Stack>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenNoteDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateNote} variant="contained">
                            {selectedNote ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </PageLayout>
    );
};

export default ClientDetailPage;
