import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { testApiConnection } from '../../utils/apiTest';
import { useAuth } from '../../contexts/AuthContext';

const ApiDebug: React.FC = () => {
    const { user } = useAuth();
    const [testResults, setTestResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const runTests = async () => {
        setLoading(true);
        try {
            const results = await testApiConnection();
            setTestResults(results);
        } catch (error) {
            console.error('Test failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'success';
            case 'error': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                API Connection & Authentication Debug
            </Typography>

            <Stack spacing={2}>
                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={runTests}
                    loading={loading}
                    disabled={loading}
                >
                    {loading ? 'Testing...' : 'Test API Connection'}
                </Button>

                {/* Current User Status */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Current Authentication Status
                    </Typography>
                    {user ? (
                        <Alert severity="success">
                            Logged in as: {user.first_name} {user.last_name} ({user.username})
                            <br />
                            User Type: {user.user_type}
                            <br />
                            User ID: {user.id}
                        </Alert>
                    ) : (
                        <Alert severity="warning">
                            Not logged in
                        </Alert>
                    )}
                </Paper>

                {/* Test Results */}
                {testResults && (
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            API Test Results
                        </Typography>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Component</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Details</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>Authentication</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={testResults.auth.hasToken && testResults.auth.hasUser ? 'Valid' : 'Invalid'}
                                                color={testResults.auth.hasToken && testResults.auth.hasUser ? 'success' : 'error'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            Token: {testResults.auth.hasToken ? '✅' : '❌'}<br />
                                            User: {testResults.auth.hasUser ? '✅' : '❌'}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Client API</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={testResults.clientApi.status}
                                                color={getStatusColor(testResults.clientApi.status)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {testResults.clientApi.status === 'success' ? (
                                                <span>
                                                    Found {testResults.clientApi.data?.results?.length || testResults.clientApi.data?.length || 0} clients
                                                </span>
                                            ) : (
                                                <span style={{ color: 'red' }}>
                                                    {JSON.stringify(testResults.clientApi.error)}
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    {testResults.rosterApi && (
                                        <TableRow>
                                            <TableCell>Roster API</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={testResults.rosterApi.status}
                                                    color={getStatusColor(testResults.rosterApi.status)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {testResults.rosterApi.status === 'success' ? (
                                                    <span>
                                                        Found {testResults.rosterApi.data?.results?.length || testResults.rosterApi.data?.length || 0} shifts
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'red' }}>
                                                        {JSON.stringify(testResults.rosterApi.error)}
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Detailed Error Information */}
                        {(testResults.clientApi.status === 'error' || testResults.rosterApi?.status === 'error') && (
                            <Accordion sx={{ mt: 2 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography>Detailed Error Information</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <pre style={{ overflow: 'auto' }}>
                                        {JSON.stringify(testResults, null, 2)}
                                    </pre>
                                </AccordionDetails>
                            </Accordion>
                        )}
                    </Paper>
                )}

                {/* Instructions */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Instructions
                    </Typography>
                    <Typography variant="body2" component="div">
                        <ol>
                            <li><strong>If not logged in:</strong> Go to the login page and sign in with your credentials</li>
                            <li><strong>If authentication is invalid:</strong> Try logging out and logging back in</li>
                            <li><strong>If API calls fail:</strong>
                                <ul>
                                    <li>Check that the backend server is running on http://localhost:8000</li>
                                    <li>Verify your user has the proper permissions for the endpoints</li>
                                    <li>Check the browser network tab for detailed error messages</li>
                                </ul>
                            </li>
                            <li><strong>If you see "No data available":</strong> This means the API is working but there's no data in the database yet</li>
                        </ol>
                    </Typography>
                </Paper>
            </Stack>
        </Box>
    );
};

export default ApiDebug;