import { dotnetStaffApi, dotnetAuthApi } from './api';

// Import ApiResponse interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Updated interfaces to match .NET backend DTOs
export interface StaffProfile {
  id: number;
  userId: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  position: string;
  department: string;
  employmentType: string;
  hourlyRate: number;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  qualifications?: string;
  certifications?: string;
  preferredHoursPerWeek?: number;
  availableWeekdays: boolean;
  availableWeekends: boolean;
  availableNights: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  availabilities?: StaffAvailability[];
  leaveRequests?: StaffLeave[];
}

export interface CreateStaffRequest {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  position: string;
  department: string;
  employmentType: string;
  hourlyRate: number;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  qualifications?: string;
  certifications?: string;
  preferredHoursPerWeek?: number;
  availableWeekdays: boolean;
  availableWeekends: boolean;
  availableNights: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  startDate: string;
}

export interface UpdateStaffRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  position: string;
  department: string;
  employmentType: string;
  hourlyRate: number;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  qualifications?: string;
  certifications?: string;
  preferredHoursPerWeek?: number;
  availableWeekdays: boolean;
  availableWeekends: boolean;
  availableNights: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface StaffAvailability {
  id: number;
  staffId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffAvailabilityRequest {
  dayOfWeek: string;
  startTime: string; // TimeSpan format: "HH:mm:ss"
  endTime: string;   // TimeSpan format: "HH:mm:ss"
  isAvailable: boolean;
  notes?: string;
}

export interface UpdateStaffAvailabilityRequest {
  dayOfWeek: string;
  startTime: string; // TimeSpan format: "HH:mm:ss"
  endTime: string;   // TimeSpan format: "HH:mm:ss"
  isAvailable: boolean;
  notes?: string;
}

export interface StaffLeave {
  id: number;
  staffId: number;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: string;
  comments?: string;
  approvedBy?: number;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffLeaveRequest {
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
}

export interface UpdateStaffLeaveRequest {
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  onLeave: number;
  totalDepartments: number;
  departmentBreakdown: { [key: string]: number };
  employmentTypeBreakdown: { [key: string]: number };
  positionBreakdown: { [key: string]: number };
}

export interface StaffDocument {
  id: number;
  staffId: number;
  title: string;
  description?: string;
  documentType: 'Identity' | 'WorkPermit' | 'Visa' | 'Nationality' | 'Background' | 'Medical' | 'Training' | 'Contract' | 'Other';
  fileName: string;
  mimeType: string;
  fileSize: number;
  formattedFileSize: string;
  uploadedAt: string;
  uploadedBy: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export const staffService = {
  // Staff Profile CRUD operations
  getStaffProfiles: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    department?: string;
    position?: string;
    employmentType?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<StaffProfile>> => {
    const queryParams: any = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.pageSize) queryParams.pageSize = params.pageSize;
    if (params?.search) queryParams.search = params.search;
    if (params?.department) queryParams.department = params.department;
    if (params?.position) queryParams.position = params.position;
    if (params?.employmentType) queryParams.employmentType = params.employmentType;
    if (params?.isActive !== undefined) queryParams.isActive = params.isActive;

    const response = await dotnetStaffApi.get('/staff', { params: queryParams });
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to get staff profiles');
    }
  },

  getStaffProfile: async (id: number): Promise<StaffProfile> => {
    const response = await dotnetStaffApi.get(`/staff/${id}`);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to get staff profile');
    }
  },

  createStaffProfile: async (staffData: CreateStaffRequest): Promise<StaffProfile> => {
    console.log('Creating staff profile with data:', staffData);
    
    try {
      const response = await dotnetStaffApi.post('/staff', staffData);
      if (response.data.success) {
        console.log('Staff profile created successfully:', response.data.data);
        return response.data.data;
      } else {
        console.error('Staff profile creation failed:', response.data);
        throw new Error(response.data.message || 'Failed to create staff profile');
      }
    } catch (error: any) {
      console.error('Staff profile creation error:', error);
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
        // Handle validation errors from .NET
        if (error.response.data.errors) {
          const validationErrors = Object.entries(error.response.data.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          throw new Error(`Validation errors: ${validationErrors}`);
        }
      }
      throw error;
    }
  },

  updateStaffProfile: async (id: number, staffData: UpdateStaffRequest): Promise<StaffProfile> => {
    const response = await dotnetStaffApi.put(`/staff/${id}`, staffData);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to update staff profile');
    }
  },

  deleteStaffProfile: async (id: number): Promise<void> => {
    const response = await dotnetStaffApi.delete(`/staff/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete staff profile');
    }
  },

  searchStaff: async (params?: {
    query?: string;
    department?: string;
    position?: string;
    employmentType?: string;
    isActive?: boolean;
  }): Promise<StaffProfile[]> => {
    const queryParams: any = {};
    if (params?.query) queryParams.query = params.query;
    if (params?.department) queryParams.department = params.department;
    if (params?.position) queryParams.position = params.position;
    if (params?.employmentType) queryParams.employmentType = params.employmentType;
    if (params?.isActive !== undefined) queryParams.isActive = params.isActive;

    const response = await dotnetStaffApi.get('/staff/search', { params: queryParams });
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to search staff');
    }
  },

  // Staff Statistics
  getStaffStats: async (): Promise<StaffStats> => {
    const response = await dotnetStaffApi.get('/staff/stats');
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to get staff statistics');
    }
  },

  // Staff Availability operations
  getStaffAvailability: async (staffId: number): Promise<StaffAvailability[]> => {
    const response = await dotnetStaffApi.get(`/staff/${staffId}/availability`);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to get staff availability');
    }
  },

  createStaffAvailability: async (staffId: number, availabilityData: CreateStaffAvailabilityRequest): Promise<StaffAvailability> => {
    const response = await dotnetStaffApi.post(`/staff/${staffId}/availability`, availabilityData);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to create staff availability');
    }
  },

  updateStaffAvailability: async (staffId: number, availabilityId: number, availabilityData: UpdateStaffAvailabilityRequest): Promise<StaffAvailability> => {
    const response = await dotnetStaffApi.put(`/staff/${staffId}/availability/${availabilityId}`, availabilityData);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to update staff availability');
    }
  },

  deleteStaffAvailability: async (staffId: number, availabilityId: number): Promise<void> => {
    const response = await dotnetStaffApi.delete(`/staff/${staffId}/availability/${availabilityId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete staff availability');
    }
  },

  // Staff Leave Request operations
  getStaffLeaveRequests: async (staffId: number): Promise<StaffLeave[]> => {
    const response = await dotnetStaffApi.get(`/staff/${staffId}/leave-requests`);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to get leave requests');
    }
  },

  createLeaveRequest: async (staffId: number, leaveData: CreateStaffLeaveRequest): Promise<StaffLeave> => {
    const response = await dotnetStaffApi.post(`/staff/${staffId}/leave-requests`, leaveData);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to create leave request');
    }
  },

  updateLeaveRequest: async (staffId: number, leaveId: number, leaveData: UpdateStaffLeaveRequest): Promise<StaffLeave> => {
    const response = await dotnetStaffApi.put(`/staff/${staffId}/leave-requests/${leaveId}`, leaveData);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to update leave request');
    }
  },

  approveLeaveRequest: async (staffId: number, leaveId: number, comments?: string): Promise<StaffLeave> => {
    const response = await dotnetStaffApi.put(`/staff/${staffId}/leave-requests/${leaveId}/approve`, { comments });
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to approve leave request');
    }
  },

  rejectLeaveRequest: async (staffId: number, leaveId: number, comments?: string): Promise<StaffLeave> => {
    const response = await dotnetStaffApi.put(`/staff/${staffId}/leave-requests/${leaveId}/reject`, { comments });
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to reject leave request');
    }
  },

  deleteLeaveRequest: async (staffId: number, leaveId: number): Promise<void> => {
    const response = await dotnetStaffApi.delete(`/staff/${staffId}/leave-requests/${leaveId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete leave request');
    }
  },

  // User management operations (for creating staff users)
  getUsers: async (params?: any): Promise<User[]> => {
    const response = await dotnetAuthApi.get('/auth/users', { params });
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to get users');
    }
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await dotnetAuthApi.get(`/auth/users/${id}`);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to get user');
    }
  },

  createUser: async (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<User> => {
    const registerData = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'Carer'
    };
    const response = await dotnetAuthApi.post('/auth/register', registerData);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to create user');
    }
  },

  updateUser: async (id: number, userData: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
  }): Promise<User> => {
    // Transform the data to match backend expectations
    const backendData = {
      username: userData.username || '',
      email: userData.email || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      role: userData.roles?.[0] || '' // Backend expects single role, not array
    };
    
    console.log('Updating user with data:', backendData);
    
    const response = await dotnetAuthApi.put(`/auth/users/${id}`, backendData);
    if (response.data.success) {
      console.log('User update successful:', response.data.data);
      return response.data.data;
    } else {
      console.error('User update failed:', response.data.message);
      throw new Error(response.data.message || 'Failed to update user');
    }
  },

  deleteUser: async (id: number): Promise<void> => {
    const response = await dotnetAuthApi.delete(`/auth/users/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete user');
    }
  },

  adminChangePassword: async (userId: number, newPassword: string): Promise<void> => {
    const response = await dotnetAuthApi.post(`/auth/users/${userId}/reset-password`, {
      newPassword: newPassword
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to change password');
    }
  },

  // Document operations
  getStaffDocuments: async (staffId: number): Promise<StaffDocument[]> => {
    const response = await dotnetStaffApi.get<ApiResponse<StaffDocument[]>>(`/staff/${staffId}/documents`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch staff documents');
  },

  uploadStaffDocument: async (staffId: number, documentData: FormData): Promise<StaffDocument> => {
    const response = await dotnetStaffApi.post<ApiResponse<StaffDocument>>(`/staff/${staffId}/documents/upload`, documentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to upload document');
  },

  deleteStaffDocument: async (staffId: number, documentId: number): Promise<void> => {
    const response = await dotnetStaffApi.delete<ApiResponse<void>>(`/staff/${staffId}/documents/${documentId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete document');
    }
  },

  downloadStaffDocument: async (staffId: number, documentId: number): Promise<Blob> => {
    const response = await dotnetStaffApi.get(`/staff/${staffId}/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },
};

export default staffService;
