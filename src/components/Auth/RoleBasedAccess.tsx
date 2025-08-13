import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RoleBasedAccessProps {
    children: React.ReactNode;
    requiredRoles?: string[];
    requiredPrivilegeLevel?: number;
    fallback?: React.ReactNode;
    showForAll?: boolean;
}

/**
 * Component for role-based access control
 * 
 * @param requiredRoles - Array of roles that can access the content
 * @param requiredPrivilegeLevel - Minimum privilege level (1-4: Staff, Care_Coordinator, Manager, Admin)
 * @param fallback - Component to show when access is denied
 * @param showForAll - If true, shows content for all authenticated users
 */
const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
    children,
    requiredRoles = [],
    requiredPrivilegeLevel,
    fallback = null,
    showForAll = false
}) => {
    const { user } = useAuth();

    // If user is not authenticated, don't show content
    if (!user) {
        return <>{fallback}</>;
    }

    // If showForAll is true, show content for any authenticated user
    if (showForAll) {
        return <>{children}</>;
    }

    // Get user's roles array (from .NET backend) or fall back to user_type (Django backend)
    const userRoles = user.roles || [user.user_type];

    // Helper function to get user's privilege level
    const getUserPrivilegeLevel = (): number => {
        if (userRoles.includes('Admin')) return 4;
        if (userRoles.includes('Manager')) return 3;
        if (userRoles.includes('Care_Coordinator')) return 2;
        if (userRoles.includes('Staff')) return 1;

        // Legacy role support
        if (userRoles.includes('Administrator')) return 4;
        if (userRoles.includes('Supervisor')) return 3;
        if (userRoles.includes('Carer')) return 1;

        return 1; // Default to basic staff level
    };    // Check privilege level if specified
    if (requiredPrivilegeLevel !== undefined) {
        const userPrivilegeLevel = getUserPrivilegeLevel();
        console.log('RoleBasedAccess Debug - User privilege level:', userPrivilegeLevel);
        console.log('RoleBasedAccess Debug - Access granted:', userPrivilegeLevel >= requiredPrivilegeLevel);

        if (userPrivilegeLevel >= requiredPrivilegeLevel) {
            return <>{children}</>;
        }
        return <>{fallback}</>;
    }

    // Check specific roles if specified
    if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
        if (hasRequiredRole) {
            return <>{children}</>;
        }
        return <>{fallback}</>;
    }

    // If no requirements specified, show content
    return <>{children}</>;
};

export default RoleBasedAccess;

// Export convenience components for common use cases
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
    <RoleBasedAccess requiredPrivilegeLevel={4} fallback={fallback}>
        {children}
    </RoleBasedAccess>
);

export const ManagerOrAbove: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
    <RoleBasedAccess requiredPrivilegeLevel={3} fallback={fallback}>
        {children}
    </RoleBasedAccess>
);

export const CoordinatorOrAbove: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
    <RoleBasedAccess requiredPrivilegeLevel={2} fallback={fallback}>
        {children}
    </RoleBasedAccess>
);

export const StaffOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
    <RoleBasedAccess requiredRoles={['Staff']} fallback={fallback}>
        {children}
    </RoleBasedAccess>
);
