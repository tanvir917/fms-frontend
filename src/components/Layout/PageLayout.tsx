import React from 'react';
import { Box, Container } from '@mui/material';

interface PageLayoutProps {
    children: React.ReactNode;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
    disableContainer?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
    children,
    maxWidth = 'lg',
    disableContainer = false
}) => {
    return (
        <Box
            component="main"
            sx={{
                flexGrow: 1,
                py: 3,
                mt: 8, // Add margin top to account for AppBar (64px default)
                width: { sm: `calc(100% - 240px)` }, // Account for sidebar
                ml: { sm: `240px` }, // Account for sidebar
                minHeight: 'calc(100vh - 64px)', // Full height minus AppBar
            }}
        >
            {disableContainer ? (
                children
            ) : (
                <Container maxWidth={maxWidth}>
                    {children}
                </Container>
            )}
        </Box>
    );
};

export default PageLayout;