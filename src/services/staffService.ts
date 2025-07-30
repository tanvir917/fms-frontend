import api from './api';

export interface StaffProfile {
  id: number;
  user: number;
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
  full_name?: string;
  employee_id: string;
  department: 'nursing' | 'care' | 'admin' | 'management' | 'support';
  position: 'carer' | 'nurse' | 'supervisor' | 'manager' | 'admin' | 'coordinator';
  employment_type: 'full_time' | 'part_time' | 'casual' | 'contractor';
  start_date: string;
  end_date?: string;
  hourly_rate: number;
  date_of_birth: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  qualifications?: string;
  certifications?: string;
  preferred_hours_per_week?: number;
  available_weekdays: boolean;
  available_weekends: boolean;
  available_nights: boolean;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffAvailability {
  id: number;
  staff: number;
  staff_name?: string;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes?: string;
}

export interface StaffLeave {
  id: number;
  staff: number;
  staff_name?: string;
  leave_type: 'annual' | 'sick' | 'personal' | 'maternity' | 'emergency' | 'unpaid';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: number;
  approved_by_name?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface StaffStats {
  total_staff: number;
  active_staff: number;
  on_leave: number;
  total_departments: number;
  department_breakdown: {
    [key: string]: number;
  };
  employment_type_breakdown: {
    [key: string]: number;
  };
}

export const staffService = {
  // Staff Profile CRUD operations
  getStaffProfiles: async (params?: any) => {
    const response = await api.get('/staff/', { params });
    return response.data;
  },

  getStaffProfile: async (id: number) => {
    const response = await api.get(`/staff/${id}/`);
    return response.data;
  },

  createStaffProfile: async (staffData: Partial<StaffProfile>) => {
    const response = await api.post('/staff/', staffData);
    return response.data;
  },

  updateStaffProfile: async (id: number, staffData: Partial<StaffProfile>) => {
    const response = await api.put(`/staff/${id}/`, staffData);
    return response.data;
  },

  deleteStaffProfile: async (id: number) => {
    await api.delete(`/staff/${id}/`);
  },

  // Staff Statistics
  getStaffStats: async () => {
    try {
      const response = await api.get('/staff/stats/');
      return response.data;
    } catch (error) {
      // If stats endpoint doesn't exist, generate basic stats from staff list
      console.warn('Staff stats endpoint not available, generating basic stats');
      const staffResponse = await api.get('/staff/');
      const staff = staffResponse.data.results || staffResponse.data || [];
      
      const totalStaff = staff.length;
      const activeStaff = staff.filter((s: StaffProfile) => s.is_active).length;
      
      const departmentBreakdown: { [key: string]: number } = {};
      const employmentTypeBreakdown: { [key: string]: number } = {};
      
      staff.forEach((s: StaffProfile) => {
        departmentBreakdown[s.department] = (departmentBreakdown[s.department] || 0) + 1;
        employmentTypeBreakdown[s.employment_type] = (employmentTypeBreakdown[s.employment_type] || 0) + 1;
      });
      
      return {
        total_staff: totalStaff,
        active_staff: activeStaff,
        on_leave: 0, // Would need to calculate from leave data
        total_departments: Object.keys(departmentBreakdown).length,
        department_breakdown: departmentBreakdown,
        employment_type_breakdown: employmentTypeBreakdown,
      };
    }
  },

  // Staff Availability operations
  getStaffAvailability: async (params?: { staff?: string | number } | number) => {
    // Handle both old and new parameter formats
    let queryParams = {};
    if (typeof params === 'number') {
      queryParams = { staff: params };
    } else if (params && typeof params === 'object' && 'staff' in params) {
      queryParams = { staff: params.staff };
    }
    
    const response = await api.get('/staff/availability/', { params: queryParams });
    return response.data;
  },

  createStaffAvailability: async (availabilityData: Partial<StaffAvailability>) => {
    const response = await api.post('/staff/availability/', availabilityData);
    return response.data;
  },

  updateStaffAvailability: async (id: number, availabilityData: Partial<StaffAvailability>) => {
    const response = await api.put(`/staff/availability/${id}/`, availabilityData);
    return response.data;
  },

  deleteStaffAvailability: async (id: number) => {
    await api.delete(`/staff/availability/${id}/`);
  },

  // Staff Leave operations
  getStaffLeave: async (params?: { staff?: string | number } | number) => {
    // Handle both old and new parameter formats
    let queryParams = {};
    if (typeof params === 'number') {
      queryParams = { staff: params };
    } else if (params && typeof params === 'object' && 'staff' in params) {
      queryParams = { staff: params.staff };
    }
    
    const response = await api.get('/staff/leave/', { params: queryParams });
    return response.data;
  },

  // Alias for backward compatibility
  getStaffLeaveRequests: async (params?: { staff?: string | number } | number) => {
    return staffService.getStaffLeave(params);
  },

  createStaffLeave: async (leaveData: Partial<StaffLeave>) => {
    const response = await api.post('/staff/leave/', leaveData);
    return response.data;
  },

  updateStaffLeave: async (id: number, leaveData: Partial<StaffLeave>) => {
    const response = await api.put(`/staff/leave/${id}/`, leaveData);
    return response.data;
  },

  deleteStaffLeave: async (id: number) => {
    await api.delete(`/staff/leave/${id}/`);
  },

  approveLeave: async (id: number, comments?: string) => {
    const response = await api.patch(`/staff/leave/${id}/approve/`, { comments });
    return response.data;
  },

  rejectLeave: async (id: number, comments?: string) => {
    const response = await api.patch(`/staff/leave/${id}/reject/`, { comments });
    return response.data;
  },

  // User management operations (for creating staff users)
  // Fixed: Use /auth/users/ instead of /users/
  getUsers: async (params?: any) => {
    const response = await api.get('/auth/users/', { params });
    return response.data;
  },

  createUser: async (userData: Partial<User>) => {
    const response = await api.post('/auth/users/', userData);
    return response.data;
  },

  updateUser: async (id: number, userData: Partial<User>) => {
    const response = await api.put(`/auth/users/${id}/`, userData);
    return response.data;
  },

  deleteUser: async (id: number) => {
    await api.delete(`/auth/users/${id}/`);
  },
};

export default staffService;