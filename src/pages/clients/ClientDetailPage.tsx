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
import { clientService, Client, ClientDocument, CarePlan, ClientNote } from '../../services/clientService';
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
        document_type: 'other',
    });
    const [carePlanData, setCarePlanData] = useState<Partial<CarePlan>>({
        title: '',
        description: '',
        plan_type: 'ongoing',
        care_goals: '',
        intervention_strategies: '',
        support_requirements: '',
        start_date: '',
        review_date: '',
        status: 'draft',
    });
    const [noteData, setNoteData] = useState<Partial<ClientNote>>({
        title: '',
        content: '',
        note_type: 'general',
        priority: 'medium',
        is_confidential: false,
    });

    const [selectedCarePlan, setSelectedCarePlan] = useState<CarePlan | null>(null);
    const [selectedNote, setSelectedNote] = useState<ClientNote | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

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
            setDocuments(documentsData.results || documentsData || []);
            setCarePlans(carePlansData.results || carePlansData || []);
            setNotes(notesData.results || notesData || []);
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
            formData.append('file', documentFile);
            formData.append('title', documentData.title);
            formData.append('description', documentData.description);
            formData.append('document_type', documentData.document_type);

            await clientService.uploadClientDocument(parseInt(id!), formData);
            setSuccess('Document uploaded successfully');
            setOpenDocumentDialog(false);
            setDocumentFile(null);
            setDocumentData({ title: '', description: '', document_type: 'other' });
            loadClientData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload document');
        }
    };

    // ...existing code...

    const handleCreateCarePlan = async () => {
        try {
            // Ensure dates are in the correct format (YYYY-MM-DD)
            const formattedData = {
                ...carePlanData,
                start_date: carePlanData.start_date ? new Date(carePlanData.start_date).toISOString().split('T')[0] : '',
                review_date: carePlanData.review_date ? new Date(carePlanData.review_date).toISOString().split('T')[0] : '',
                end_date: carePlanData.end_date ? new Date(carePlanData.end_date).toISOString().split('T')[0] : undefined,
            };

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
                plan_type: 'ongoing',
                care_goals: '',
                intervention_strategies: '',
                support_requirements: '',
                start_date: '',
                review_date: '',
                status: 'draft',
            });
            loadClientData();
        } catch (err: any) {
            console.error('Care plan error:', err.response?.data);
            setError(err.response?.data?.message || err.response?.data || 'Failed to save care plan');
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
            if (selectedNote) {
                await clientService.updateClientNote(parseInt(id!), selectedNote.id, noteData);
                setSuccess('Note updated successfully');
            } else {
                await clientService.createClientNote(parseInt(id!), noteData);
                setSuccess('Note created successfully');
            }
            setOpenNoteDialog(false);
            setSelectedNote(null);
            setNoteData({
                title: '',
                content: '',
                note_type: 'general',
                priority: 'medium',
                is_confidential: false,
            });
            loadClientData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save note');
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <ActiveIcon color="success" />;
            case 'draft':
                return <DraftIcon color="warning" />;
            case 'completed':
                return <CheckCircle color="info" />;
            case 'cancelled':
                return <InactiveIcon color="error" />;
            default:
                return <InactiveIcon color="disabled" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: '#4caf50',
            medium: '#ff9800',
            high: '#f44336',
            urgent: '#d32f2f',
        };
        return colors[priority] || '#757575';
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
                            {client.first_name} {client.last_name}
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
                        <Chip label={`Age: ${getAge(client.date_of_birth)}`} icon={<PersonIcon />} />
                        {getCareLevel(client.care_level)}
                        <Chip
                            label={client.status?.charAt(0).toUpperCase() + client.status?.slice(1)}
                            color={client.status === 'active' ? 'success' : 'default'}
                        />
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                        Client ID: {client.id} | Created: {new Date(client.created_at).toLocaleDateString()}
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
                                                <Typography>{new Date(client.date_of_birth).toLocaleDateString()}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2">Gender</Typography>
                                                <Typography>
                                                    {client.gender === 'M' ? 'Male' : client.gender === 'F' ? 'Female' : 'Other'}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2">Phone</Typography>
                                                <Typography>{client.phone_number || 'Not provided'}</Typography>
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
                                        {client.address_line_1}
                                        {client.address_line_2 && <>, {client.address_line_2}</>}
                                        <br />
                                        {client.city}, {client.state} {client.postal_code}
                                        <br />
                                        {client.country}
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
                                        {client.medical_conditions && (
                                            <Box>
                                                <Typography variant="subtitle2">Medical Conditions</Typography>
                                                <Typography>{client.medical_conditions}</Typography>
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
                                        {client.dietary_requirements && (
                                            <Box>
                                                <Typography variant="subtitle2">Dietary Requirements</Typography>
                                                <Typography>{client.dietary_requirements}</Typography>
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
                                            <Typography>{client.emergency_contact_name}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Phone</Typography>
                                            <Typography>{client.emergency_contact_phone}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2">Relationship</Typography>
                                            <Typography>{client.emergency_contact_relationship}</Typography>
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
                                    onClick={() => setOpenCarePlanDialog(true)}
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
                                                        {plan.is_active && (
                                                            <Chip label="ACTIVE" color="success" size="small" />
                                                        )}
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {plan.plan_type?.charAt(0).toUpperCase() + plan.plan_type?.slice(1)} Plan
                                                    </Typography>
                                                </Box>
                                                <Stack direction="row" spacing={1}>
                                                    <IconButton
                                                        onClick={() => {
                                                            setSelectedCarePlan(plan);
                                                            setCarePlanData(plan);
                                                            setOpenCarePlanDialog(true);
                                                        }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    {!plan.is_active && (
                                                        <Tooltip title="Activate this care plan">
                                                            <IconButton
                                                                onClick={() => handleActivateCarePlan(plan.id)}
                                                                color="primary"
                                                            >
                                                                <CheckCircle />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
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
                                                            <Typography variant="subtitle2">Care Goals</Typography>
                                                            <Typography>{plan.care_goals}</Typography>
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="subtitle2">Intervention Strategies</Typography>
                                                            <Typography>{plan.intervention_strategies}</Typography>
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="subtitle2">Support Requirements</Typography>
                                                            <Typography>{plan.support_requirements}</Typography>
                                                        </Box>
                                                        <Stack direction="row" spacing={4}>
                                                            <Box>
                                                                <Typography variant="subtitle2">Start Date</Typography>
                                                                <Typography>{new Date(plan.start_date).toLocaleDateString()}</Typography>
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="subtitle2">Review Date</Typography>
                                                                <Typography>{new Date(plan.review_date).toLocaleDateString()}</Typography>
                                                            </Box>
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
                                    onClick={() => setOpenNoteDialog(true)}
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
                                                        <Chip
                                                            label={note.priority?.toUpperCase()}
                                                            style={{
                                                                backgroundColor: getPriorityColor(note.priority),
                                                                color: 'white',
                                                            }}
                                                            size="small"
                                                        />
                                                        {note.is_confidential && (
                                                            <Chip label="CONFIDENTIAL" color="secondary" size="small" />
                                                        )}
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {note.note_type?.charAt(0).toUpperCase() + note.note_type?.slice(1)} •
                                                        {new Date(note.created_at).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                                <Stack direction="row" spacing={1}>
                                                    <IconButton
                                                        onClick={() => {
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
                                                            {document.document_type?.replace('_', ' ').toUpperCase()} •
                                                            Uploaded {new Date(document.uploaded_at).toLocaleDateString()}
                                                        </Typography>
                                                        {document.description && (
                                                            <Typography variant="body2">{document.description}</Typography>
                                                        )}
                                                    </Box>
                                                </Stack>
                                                <Stack direction="row" spacing={1}>
                                                    <IconButton
                                                        component="a"
                                                        href={document.file}
                                                        target="_blank"
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
                                    value={formData.first_name || ''}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    fullWidth
                                />
                                <TextField
                                    label="Last Name"
                                    value={formData.last_name || ''}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
                                    value={formData.phone_number || ''}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    fullWidth
                                />
                            </Stack>
                            <TextField
                                label="Address Line 1"
                                value={formData.address_line_1 || ''}
                                onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Address Line 2"
                                value={formData.address_line_2 || ''}
                                onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
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
                                    label="Postal Code"
                                    value={formData.postal_code || ''}
                                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                    fullWidth
                                />
                            </Stack>
                            <TextField
                                label="Medical Conditions"
                                multiline
                                rows={3}
                                value={formData.medical_conditions || ''}
                                onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
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
                                    value={documentData.document_type}
                                    onChange={(e) => setDocumentData({ ...documentData, document_type: e.target.value })}
                                >
                                    <MenuItem value="care_plan">Care Plan</MenuItem>
                                    <MenuItem value="medical_record">Medical Record</MenuItem>
                                    <MenuItem value="assessment">Assessment</MenuItem>
                                    <MenuItem value="photo_id">Photo ID</MenuItem>
                                    <MenuItem value="insurance">Insurance Document</MenuItem>
                                    <MenuItem value="consent_form">Consent Form</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
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
                                    <InputLabel>Plan Type</InputLabel>
                                    <Select
                                        value={carePlanData.plan_type || 'ongoing'}
                                        onChange={(e) => setCarePlanData({ ...carePlanData, plan_type: e.target.value as any })}
                                    >
                                        <MenuItem value="initial">Initial Assessment</MenuItem>
                                        <MenuItem value="ongoing">Ongoing Care</MenuItem>
                                        <MenuItem value="respite">Respite Care</MenuItem>
                                        <MenuItem value="palliative">Palliative Care</MenuItem>
                                        <MenuItem value="transitional">Transitional Care</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={carePlanData.status || 'draft'}
                                        onChange={(e) => setCarePlanData({ ...carePlanData, status: e.target.value as any })}
                                    >
                                        <MenuItem value="draft">Draft</MenuItem>
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="completed">Completed</MenuItem>
                                        <MenuItem value="cancelled">Cancelled</MenuItem>
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
                                label="Care Goals"
                                multiline
                                rows={3}
                                value={carePlanData.care_goals || ''}
                                onChange={(e) => setCarePlanData({ ...carePlanData, care_goals: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Intervention Strategies"
                                multiline
                                rows={3}
                                value={carePlanData.intervention_strategies || ''}
                                onChange={(e) => setCarePlanData({ ...carePlanData, intervention_strategies: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Support Requirements"
                                multiline
                                rows={3}
                                value={carePlanData.support_requirements || ''}
                                onChange={(e) => setCarePlanData({ ...carePlanData, support_requirements: e.target.value })}
                                fullWidth
                            />
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    value={carePlanData.start_date || ''}
                                    onChange={(e) => setCarePlanData({ ...carePlanData, start_date: e.target.value })}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Review Date"
                                    type="date"
                                    value={carePlanData.review_date || ''}
                                    onChange={(e) => setCarePlanData({ ...carePlanData, review_date: e.target.value })}
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
                                        value={noteData.note_type || 'general'}
                                        onChange={(e) => setNoteData({ ...noteData, note_type: e.target.value as any })}
                                    >
                                        <MenuItem value="general">General Note</MenuItem>
                                        <MenuItem value="medical">Medical Observation</MenuItem>
                                        <MenuItem value="behavioral">Behavioral Note</MenuItem>
                                        <MenuItem value="incident">Incident Report</MenuItem>
                                        <MenuItem value="care_update">Care Update</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Priority</InputLabel>
                                    <Select
                                        value={noteData.priority || 'medium'}
                                        onChange={(e) => setNoteData({ ...noteData, priority: e.target.value as any })}
                                    >
                                        <MenuItem value="low">Low</MenuItem>
                                        <MenuItem value="medium">Medium</MenuItem>
                                        <MenuItem value="high">High</MenuItem>
                                        <MenuItem value="urgent">Urgent</MenuItem>
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
                                        checked={noteData.is_confidential || false}
                                        onChange={(e) => setNoteData({ ...noteData, is_confidential: e.target.checked })}
                                    />
                                    <Typography>Mark as confidential</Typography>
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
