import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const StaffPage: React.FC = () => {
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
          Staff Management
        </Typography>
        <Typography variant="body1">
          Staff management functionality will be implemented here.
        </Typography>
      </Container>
    </Box>
  );
};

export default StaffPage;
