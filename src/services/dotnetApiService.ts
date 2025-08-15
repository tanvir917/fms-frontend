// .NET API Type Definitions and Adapters
import { dotnetAuthApi, dotnetStaffApi, USE_DOTNET_APIS } from './api';

// .NET API Response Wrapper
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

// .NET User Types
interface DotNetUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  roles: string[];
}

interface DotNetRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// .NET Staff Types
interface DotNetStaffMember {
  id: number;
  userId: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  position: string;
  department: string;
  hourlyRate: number;
  dateOfBirth: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  hireDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DotNetStaffStats {
  totalStaff: number;
  activeStaff: number;
  onLeave: number;
  staffByDepartment: Record<string, number>;
}

interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Type conversion utilities
export const convertDotNetUserToFrontend = (dotNetUser: DotNetUser) => ({
  id: dotNetUser.id,
  username: dotNetUser.email, // Use email as username since .NET doesn't have username field
  email: dotNetUser.email,
  first_name: dotNetUser.firstName,
  last_name: dotNetUser.lastName,
  is_active: dotNetUser.isActive,
  is_staff: dotNetUser.roles.includes('Administrator') || dotNetUser.roles.includes('Manager') || dotNetUser.roles.includes('Supervisor'),
  is_superuser: dotNetUser.roles.includes('Administrator'),
  date_joined: dotNetUser.createdAt,
  groups: dotNetUser.roles,
  roles: dotNetUser.roles, // Full roles array for role-based access control
  user_type: dotNetUser.roles[0] || 'Staff', // Primary role for backward compatibility
});

export const convertDotNetStaffToFrontend = (dotNetStaff: DotNetStaffMember) => ({
  id: dotNetStaff.id,
  user: dotNetStaff.userId,
  user_email: dotNetStaff.email,
  user_first_name: dotNetStaff.firstName,
  user_last_name: dotNetStaff.lastName,
  full_name: `${dotNetStaff.firstName} ${dotNetStaff.lastName}`,
  employee_id: dotNetStaff.employeeId,
  department: mapDotNetDepartment(dotNetStaff.department),
  position: mapDotNetPosition(dotNetStaff.position),
  employment_type: 'full_time', // Default since .NET doesn't have this field
  start_date: dotNetStaff.hireDate,
  hourly_rate: dotNetStaff.hourlyRate,
  date_of_birth: dotNetStaff.dateOfBirth,
  address_line_1: dotNetStaff.address,
  city: 'Unknown', // Default since .NET has single address field
  state: 'Unknown',
  postal_code: '00000',
  emergency_contact_name: dotNetStaff.emergencyContactName,
  emergency_contact_phone: dotNetStaff.emergencyContactPhone,
  emergency_contact_relationship: 'Unknown',
  is_active: dotNetStaff.isActive,
  created_at: dotNetStaff.createdAt,
  updated_at: dotNetStaff.updatedAt,
  available_weekdays: true,
  available_weekends: false,
  available_nights: false,
});

// Department mapping
const mapDotNetDepartment = (department: string): 'nursing' | 'care' | 'admin' | 'management' | 'support' => {
  const departmentMap: Record<string, 'nursing' | 'care' | 'admin' | 'management' | 'support'> = {
    'Nursing': 'nursing',
    'Care': 'care',
    'Administration': 'admin',
    'Management': 'management',
    'Support': 'support',
  };
  return departmentMap[department] || 'care';
};

// Position mapping
const mapDotNetPosition = (position: string): 'carer' | 'nurse' | 'supervisor' | 'manager' | 'admin' | 'coordinator' => {
  const positionMap: Record<string, 'carer' | 'nurse' | 'supervisor' | 'manager' | 'admin' | 'coordinator'> = {
    'Carer': 'carer',
    'Nurse': 'nurse',
    'Supervisor': 'supervisor',
    'Manager': 'manager',
    'Administrator': 'admin',
    'Coordinator': 'coordinator',
  };
  return positionMap[position] || 'carer';
};

// .NET Auth Service
export const dotNetAuthService = {
  async login(email: string, password: string) {
    try {
      const response = await dotnetAuthApi.post<ApiResponse<{
        accessToken: string;
        refreshToken: string;
        expiresAt: string;
        user: {
          id: number;
          email: string;
          firstName: string;
          lastName: string;
          fullName: string;
          createdAt: string;
          updatedAt: string;
          isActive: boolean;
          roles: string[];
        };
      }>>('/auth/login', {
        email,
        password
      });
      
      if (response.data.success) {
        const loginData = response.data.data!;
        
        // Convert the backend user to frontend format
        const frontendUser = {
          id: loginData.user.id,
          username: loginData.user.email, // Use email as username
          email: loginData.user.email,
          first_name: loginData.user.firstName,
          last_name: loginData.user.lastName,
          is_active: loginData.user.isActive,
          is_staff: loginData.user.roles.includes('Administrator') || loginData.user.roles.includes('Manager'),
          is_superuser: loginData.user.roles.includes('Administrator'),
          date_joined: loginData.user.createdAt,
          groups: loginData.user.roles,
          roles: loginData.user.roles, // Full roles array for role-based access control
          user_type: loginData.user.roles[0] || 'Staff', // Primary role for backward compatibility
        };
        
        return {
          user: frontendUser,
          tokens: {
            access: loginData.accessToken,
            refresh: loginData.refreshToken,
          }
        };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('.NET Auth Service Error:', error);
      
      // Handle specific error types
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to .NET authentication service. Is it running on port 5001?');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw error; // Re-throw with original message
      } else {
        throw new Error('Unknown error occurred during login');
      }
    }
  },

  async register(userData: DotNetRegisterRequest) {
    const response = await dotnetAuthApi.post<ApiResponse<DotNetUser>>('/auth/register', userData);
    
    if (response.data.success) {
      return {
        user: convertDotNetUserToFrontend(response.data.data),
      };
    } else {
      throw new Error(response.data.message || 'Registration failed');
    }
  },

  async getProfile() {
    const response = await dotnetAuthApi.get<ApiResponse<DotNetUser>>('/auth/profile');
    
    if (response.data.success) {
      return convertDotNetUserToFrontend(response.data.data);
    } else {
      throw new Error(response.data.message || 'Failed to get profile');
    }
  },
};

// .NET Staff Service
export const dotNetStaffService = {
  async getStaff(page = 1, pageSize = 10, search?: string, department?: string, isActive?: boolean) {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    if (isActive !== undefined) params.append('isActive', isActive.toString());

    const response = await dotnetStaffApi.get<ApiResponse<PaginatedResponse<DotNetStaffMember>>>(`/staff?${params}`);
    
    if (response.data.success) {
      return {
        results: response.data.data.results.map(convertDotNetStaffToFrontend),
        count: response.data.data.count,
        next: response.data.data.next,
        previous: response.data.data.previous,
      };
    } else {
      throw new Error(response.data.message || 'Failed to get staff');
    }
  },

  async getStaffById(id: number) {
    const response = await dotnetStaffApi.get<ApiResponse<DotNetStaffMember>>(`/staff/${id}`);
    
    if (response.data.success) {
      return convertDotNetStaffToFrontend(response.data.data);
    } else {
      throw new Error(response.data.message || 'Failed to get staff member');
    }
  },

  async getStaffStats() {
    const response = await dotnetStaffApi.get<ApiResponse<DotNetStaffStats>>('/staff/stats');
    
    if (response.data.success) {
      return {
        total_staff: response.data.data.totalStaff,
        active_staff: response.data.data.activeStaff,
        on_leave: response.data.data.onLeave,
        by_department: response.data.data.staffByDepartment,
      };
    } else {
      throw new Error(response.data.message || 'Failed to get staff stats');
    }
  },

  async createStaff(staffData: any) {
    // Convert frontend format to .NET format
    const dotNetStaffData = {
      userId: staffData.user || 1, // Default user ID for testing
      employeeId: staffData.employee_id,
      firstName: staffData.user_first_name || staffData.first_name,
      lastName: staffData.user_last_name || staffData.last_name,
      email: staffData.user_email || staffData.email,
      phoneNumber: staffData.phone_number || '000-000-0000',
      position: staffData.position,
      department: staffData.department,
      hourlyRate: staffData.hourly_rate,
      dateOfBirth: staffData.date_of_birth,
      address: staffData.address_line_1,
      emergencyContactName: staffData.emergency_contact_name,
      emergencyContactPhone: staffData.emergency_contact_phone,
      hireDate: staffData.start_date,
    };

    const response = await dotnetStaffApi.post<ApiResponse<DotNetStaffMember>>('/staff', dotNetStaffData);
    
    if (response.data.success) {
      return convertDotNetStaffToFrontend(response.data.data);
    } else {
      throw new Error(response.data.message || 'Failed to create staff member');
    }
  },
};

// Export the flag to check which APIs to use
export { USE_DOTNET_APIS };
