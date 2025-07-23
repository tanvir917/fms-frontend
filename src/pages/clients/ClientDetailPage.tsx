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
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService, Client, ClientDocument } from '../../services/clientService';
import PageLayout from '../../components/Layout/PageLayout';

const ClientDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [client, setClient] = useState<Client | null>(null);
    const [documents, setDocuments] = useState<ClientDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
    const [formData, setFormData] = useState<Partial<Client>>({});
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [documentData, setDocumentData] = useState({
        title: '',
        description: '',
        document_type: 'other',
    });
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

            const [clientData, documentsData] = await Promise.all([
                clientService.getClient(parseInt(id!)),
                clientService.getClientDocuments(parseInt(id!)).catch(() => ({ results: [] })),
            ]);

            if (clientData) {
                setClient(clientData);
                setFormData(clientData);
            } else {
                setError('Client not found');
            }

            setDocuments(documentsData.results || documentsData || []);
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
            const updatedClient = await clientService.updateClient(parseInt(id!), formData);
            setClient(updatedClient);
            setSuccess('Client updated successfully');
            setOpenEditDialog(false);
        } catch (err: any) {
            console.error('Error updating client:', err);
            setError(err.response?.data?.message || 'Failed to update client');
        }
    };

    const handleUploadDocument = async () => {
        if (!documentFile) {
            setError('Please select a file');
            return;
        }

        try {
            const formDataToUpload = new FormData();
            formDataToUpload.append('file', documentFile);
            formDataToUpload.append('title', documentData.title);
            formDataToUpload.append('description', documentData.description);
            formDataToUpload.append('document_type', documentData.document_type);

            await clientService.uploadClientDocument(parseInt(id!), formDataToUpload);
            setSuccess('Document uploaded successfully');
            setOpenDocumentDialog(false);
            setDocumentFile(null);
            setDocumentData({ title: '', description: '', document_type: 'other' });

            // Reload documents
            const documentsData = await clientService.getClientDocuments(parseInt(id!));
            setDocuments(documentsData.results || documentsData || []);
        } catch (err: any) {
            console.error('Error uploading document:', err);
            setError(err.response?.data?.message || 'Failed to upload document');
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
        const colors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'secondary' | 'default'> = {
            low: 'success',
            medium: 'warning',
            high: 'error',
            respite: 'info',
            palliative: 'secondary',
        };
        return (
            <Chip
                label={level.charAt(0).toUpperCase() + level.slice(1)}
                color={colors[level] || 'default'}
            />
        );
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <PageLayout>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '50vh',
                    }}
                >
                    <CircularProgress />
                </Box>
            </PageLayout>
        );
    }

    if (error) {
        return (
            <PageLayout>
                <Alert severity="error">{error}</Alert>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/clients')}
                    sx={{ mt: 2 }}
                >
                    Back to Clients
                </Button>
            </PageLayout>
        );
    }

    if (!client) {
        return (
            <PageLayout>
                <Alert severity="info">No client data available</Alert>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/clients')}
                    sx={{ mt: 2 }}
                >
                    Back to Clients
                </Button>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <Container maxWidth="lg">
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        {client.first_name} {client.last_name}
                    </Typography>
                    <Box>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => setOpenEditDialog(true)}
                            sx={{ mr: 2 }}
                        >
                            Edit Client
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenDocumentDialog(true)}
                        >
                            Upload Document
                        </Button>
                    </Box>
                </Box>

                <Stack spacing={3}>
                    {/* Personal Information */}
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Paper sx={{ p: 3, flex: 1 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ mr: 1 }} />
                                Personal Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Age
                                        </Typography>
                                        <Typography variant="body1">
                                            {getAge(client.date_of_birth)} years old
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Gender
                                        </Typography>
                                        <Typography variant="body1">
                                            {client.gender === 'M' ? 'Male' : client.gender === 'F' ? 'Female' : 'Other'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Date of Birth
                                        </Typography>
                                        <Typography variant="body1">
                                            {new Date(client.date_of_birth).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Care Level
                                        </Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            {getCareLevel(client.care_level)}
                                        </Box>
                                    </Box>
                                </Box>
                            </Stack>
                        </Paper>

                        {/* Contact Information */}
                        <Paper sx={{ p: 3, flex: 1 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <PhoneIcon sx={{ mr: 1 }} />
                                Contact Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Phone Number
                                    </Typography>
                                    <Typography variant="body1">
                                        {client.phone_number || 'Not provided'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Email
                                    </Typography>
                                    <Typography variant="body1">
                                        {client.email || 'Not provided'}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>

                    {/* Address and Emergency Contact */}
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Paper sx={{ p: 3, flex: 1 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <HomeIcon sx={{ mr: 1 }} />
                                Address
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body1">
                                {client.address_line_1}
                                {client.address_line_2 && <><br />{client.address_line_2}</>}
                                <br />
                                {client.city}, {client.state} {client.postal_code}
                                <br />
                                {client.country}
                            </Typography>
                        </Paper>

                        <Paper sx={{ p: 3, flex: 1 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <EmergencyIcon sx={{ mr: 1 }} />
                                Emergency Contact
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Name
                                    </Typography>
                                    <Typography variant="body1">
                                        {client.emergency_contact_name}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Phone
                                        </Typography>
                                        <Typography variant="body1">
                                            {client.emergency_contact_phone}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Relationship
                                        </Typography>
                                        <Typography variant="body1">
                                            {client.emergency_contact_relationship}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>

                    {/* Medical Information */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <MedicalIcon sx={{ mr: 1 }} />
                            Medical Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            <Box sx={{ flex: '1 1 45%' }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Medical Conditions
                                </Typography>
                                <Typography variant="body1">
                                    {client.medical_conditions || 'None specified'}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: '1 1 45%' }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Current Medications
                                </Typography>
                                <Typography variant="body1">
                                    {client.medications || 'None specified'}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: '1 1 45%' }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Allergies
                                </Typography>
                                <Typography variant="body1">
                                    {client.allergies || 'None specified'}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: '1 1 45%' }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Dietary Requirements
                                </Typography>
                                <Typography variant="body1">
                                    {client.dietary_requirements || 'None specified'}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Documents */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <DocumentIcon sx={{ mr: 1 }} />
                            Documents ({documents.length})
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        {documents.length > 0 ? (
                            <List>
                                {documents.map((doc) => (
                                    <ListItem key={doc.id} divider>
                                        <ListItemIcon>
                                            <DocumentIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={doc.title}
                                            secondary={`${doc.document_type} • Uploaded ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                                        />
                                        <IconButton color="primary">
                                            <DownloadIcon />
                                        </IconButton>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Alert severity="info">
                                No documents available for this client.
                            </Alert>
                        )}
                    </Paper>
                </Stack>

                {/* Edit Client Dialog */}
                <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Edit Client Information</DialogTitle>
                    <DialogContent>
                        <Stack spacing={3} sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="First Name"
                                    fullWidth
                                    value={formData.first_name || ''}
                                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                                />
                                <TextField
                                    label="Last Name"
                                    fullWidth
                                    value={formData.last_name || ''}
                                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                                />
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
                                    fullWidth
                                    value={formData.email || ''}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                />
                            </Box>
                            <FormControl fullWidth>
                                <InputLabel>Care Level</InputLabel>
                                <Select
                                    value={formData.care_level || ''}
                                    onChange={(e) => handleInputChange('care_level', e.target.value)}
                                >
                                    <MenuItem value="low">Low Care</MenuItem>
                                    <MenuItem value="medium">Medium Care</MenuItem>
                                    <MenuItem value="high">High Care</MenuItem>
                                    <MenuItem value="respite">Respite Care</MenuItem>
                                    <MenuItem value="palliative">Palliative Care</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Medical Conditions"
                                fullWidth
                                multiline
                                rows={3}
                                value={formData.medical_conditions || ''}
                                onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
                        <Button onClick={handleEditClient} variant="contained">Update</Button>
                    </DialogActions>
                </Dialog>

                {/* Upload Document Dialog */}
                <Dialog open={openDocumentDialog} onClose={() => setOpenDocumentDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogContent>
                        <Stack spacing={3} sx={{ mt: 2 }}>
                            <TextField
                                label="Document Title"
                                fullWidth
                                required
                                value={documentData.title}
                                onChange={(e) => setDocumentData(prev => ({ ...prev, title: e.target.value }))}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Document Type</InputLabel>
                                <Select
                                    value={documentData.document_type}
                                    onChange={(e) => setDocumentData(prev => ({ ...prev, document_type: e.target.value }))}
                                >
                                    <MenuItem value="care_plan">Care Plan</MenuItem>
                                    <MenuItem value="medical_record">Medical Record</MenuItem>
                                    <MenuItem value="assessment">Assessment</MenuItem>
                                    <MenuItem value="photo_id">Photo ID</MenuItem>
                                    <MenuItem value="insurance">Insurance Document</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                rows={3}
                                value={documentData.description}
                                onChange={(e) => setDocumentData(prev => ({ ...prev, description: e.target.value }))}
                            />
                            <Button
                                variant="outlined"
                                component="label"
                                fullWidth
                                sx={{ p: 2 }}
                            >
                                {documentFile ? documentFile.name : 'Select File'}
                                <input
                                    type="file"
                                    hidden
                                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                />
                            </Button>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDocumentDialog(false)}>Cancel</Button>
                        <Button onClick={handleUploadDocument} variant="contained">Upload</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </PageLayout>
    );
};

export default ClientDetailPage;
