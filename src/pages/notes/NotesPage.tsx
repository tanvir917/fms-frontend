import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const NotesPage: React.FC = () => {
    return (
        <Box
            component="main"
            sx={{
                flexGrow: 1,
                py: 3,
                width: { sm: `calc(100% - 240px)` },
                ml: { sm: `240px` },
            }}
        >
            <Container maxWidth="lg">
                <Typography variant="h4" component="h1" gutterBottom>
                    Progress Notes
                </Typography>
                <Typography variant="body1">
                    Progress notes functionality will be implemented here.
                </Typography>
            </Container>
        </Box>
    );
};

export default NotesPage;
