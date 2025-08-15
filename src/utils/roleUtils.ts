// Centralized role and privilege management utilities
export interface UserRole {
  name: string;
  level: number;
  description: string;
}

// Define role hierarchies for both backends
export const DOTNET_ROLES: Record<string, UserRole> = {
  'Administrator': { name: 'Administrator', level: 4, description: 'Full system access' },
  'Manager': { name: 'Manager', level: 3, description: 'Staff & operations management' },
  'Supervisor': { name: 'Supervisor', level: 2, description: 'Oversight & coordination' },
  'Staff': { name: 'Staff', level: 1, description: 'Basic access' },
};

// Legacy Django roles for backward compatibility
export const DJANGO_ROLES: Record<string, UserRole> = {
  'Admin': { name: 'Admin', level: 4, description: 'Full system access' },
  'Manager': { name: 'Manager', level: 3, description: 'Management privileges' },
  'Care_Coordinator': { name: 'Care_Coordinator', level: 2, description: 'Client management' },
  'Staff': { name: 'Staff', level: 1, description: 'Basic access' },
  'Carer': { name: 'Carer', level: 1, description: 'Care provider' },
};

// Combined role mapping for privilege level calculation
export const ALL_ROLES = { ...DOTNET_ROLES, ...DJANGO_ROLES };

/**
 * Get user's highest privilege level based on their roles
 * @param user User object with roles array or user_type
 * @returns Number from 0-4 (0 = no access, 4 = admin)
 */
export const getUserPrivilegeLevel = (user: any | null): number => {
    if (!user) {
        console.log('roleUtils: No user provided, returning privilege level 0');
        return 0;
    }

    console.log('roleUtils: Processing user for privilege level:', {
        user,
        roles: user.roles,
        userType: user.user_type,
        groups: user.groups
    });

    // Check roles array first (preferred for .NET backend)
    if (user.roles && Array.isArray(user.roles)) {
        console.log('roleUtils: Found roles array:', user.roles);
        
        for (const role of user.roles) {
            if (DOTNET_ROLES[role]) {
                console.log(`roleUtils: Found .NET role "${role}" with privilege level ${DOTNET_ROLES[role].level}`);
                return DOTNET_ROLES[role].level;
            }
        }
    }

    // Fallback to user_type (for backward compatibility with Django)
    if (user.user_type && DJANGO_ROLES[user.user_type]) {
        const role = DJANGO_ROLES[user.user_type];
        console.log(`roleUtils: Found Django user_type "${user.user_type}" with privilege level ${role.level}`);
        return role.level;
    }

    // Fallback to groups (legacy support)
    if (user.groups && Array.isArray(user.groups)) {
        console.log('roleUtils: Checking groups array:', user.groups);
        
        for (const group of user.groups) {
            if (DOTNET_ROLES[group]) {
                console.log(`roleUtils: Found group "${group}" with privilege level ${DOTNET_ROLES[group].level}`);
                return DOTNET_ROLES[group].level;
            }
            if (DJANGO_ROLES[group]) {
                console.log(`roleUtils: Found group "${group}" with privilege level ${DJANGO_ROLES[group].level}`);
                return DJANGO_ROLES[group].level;
            }
        }
    }

    console.log('roleUtils: No matching roles found, defaulting to privilege level 1');
    return 1; // Default to basic staff level
};

/**
 * Check if user has required privilege level
 * @param user User object
 * @param requiredLevel Minimum privilege level required (1-4)
 * @returns Boolean indicating if user has sufficient privileges
 */
export const hasPrivilegeLevel = (user: any, requiredLevel: number): boolean => {
  return getUserPrivilegeLevel(user) >= requiredLevel;
};

/**
 * Check if user has any of the specified roles
 * @param user User object
 * @param requiredRoles Array of role names to check
 * @returns Boolean indicating if user has any of the required roles
 */
export const hasAnyRole = (user: any, requiredRoles: string[]): boolean => {
  if (!user) return false;

  const userRoles = user.roles || [user.user_type];
  return requiredRoles.some(role => userRoles.includes(role));
};

/**
 * Get user's role display name and description
 * @param user User object
 * @returns Object with role name and description
 */
export const getUserRoleInfo = (user: any): { name: string; description: string; level: number } => {
  if (!user) return { name: 'Guest', description: 'No access', level: 0 };

  const userRoles = user.roles || [user.user_type];
  
  // Find the highest privilege role
  let highestRole: UserRole | null = null;
  for (const role of userRoles) {
    const roleInfo = ALL_ROLES[role];
    if (roleInfo && (!highestRole || roleInfo.level > highestRole.level)) {
      highestRole = roleInfo;
    }
  }

  return highestRole || { name: 'Staff', description: 'Basic access', level: 1 };
};

// Predefined privilege levels for common actions
export const PRIVILEGE_LEVELS = {
  VIEW_BASIC: 1,      // All authenticated users
  COORDINATE: 2,      // Supervisor and above
  MANAGE: 3,          // Manager and above
  ADMIN: 4,           // Administrator only
} as const;

// Action-based permission mapping
export const PERMISSIONS = {
  // Client management
  CLIENT_VIEW: PRIVILEGE_LEVELS.VIEW_BASIC,
  CLIENT_CREATE: PRIVILEGE_LEVELS.COORDINATE,
  CLIENT_EDIT: PRIVILEGE_LEVELS.COORDINATE,
  CLIENT_DELETE: PRIVILEGE_LEVELS.MANAGE,

  // Staff management
  STAFF_VIEW: PRIVILEGE_LEVELS.VIEW_BASIC,
  STAFF_CREATE: PRIVILEGE_LEVELS.MANAGE,
  STAFF_EDIT: PRIVILEGE_LEVELS.COORDINATE,
  STAFF_DELETE: PRIVILEGE_LEVELS.ADMIN,

  // Roster management
  ROSTER_VIEW: PRIVILEGE_LEVELS.VIEW_BASIC,
  ROSTER_CREATE: PRIVILEGE_LEVELS.MANAGE,
  ROSTER_EDIT: PRIVILEGE_LEVELS.MANAGE,
  ROSTER_DELETE: PRIVILEGE_LEVELS.MANAGE,

  // Notes and documentation
  NOTES_VIEW: PRIVILEGE_LEVELS.VIEW_BASIC,
  NOTES_CREATE: PRIVILEGE_LEVELS.VIEW_BASIC,
  NOTES_EDIT: PRIVILEGE_LEVELS.COORDINATE,
  NOTES_DELETE: PRIVILEGE_LEVELS.COORDINATE,

  // Billing
  BILLING_VIEW: PRIVILEGE_LEVELS.MANAGE,
  BILLING_CREATE: PRIVILEGE_LEVELS.MANAGE,
  BILLING_EDIT: PRIVILEGE_LEVELS.MANAGE,
  BILLING_DELETE: PRIVILEGE_LEVELS.ADMIN,

  // User management
  USER_VIEW: PRIVILEGE_LEVELS.MANAGE,
  USER_CREATE: PRIVILEGE_LEVELS.ADMIN,
  USER_EDIT: PRIVILEGE_LEVELS.MANAGE,
  USER_DELETE: PRIVILEGE_LEVELS.ADMIN,
} as const;

/**
 * Check if user can perform a specific action
 * @param user User object
 * @param action Action name from PERMISSIONS
 * @returns Boolean indicating if user can perform the action
 */
export const canPerformAction = (user: any, action: keyof typeof PERMISSIONS): boolean => {
  const requiredLevel = PERMISSIONS[action];
  return hasPrivilegeLevel(user, requiredLevel);
};
