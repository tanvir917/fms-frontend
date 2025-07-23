import api from './api';

export interface Shift {
  id: number;
  client: number;
  client_name?: string;
  staff: number;
  staff_name?: string;
  shift_type: 'regular' | 'respite' | 'emergency' | 'overnight';
  start_datetime: string;
  end_datetime: string;
  duration_hours: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  actual_start_time?: string;
  actual_end_time?: string;
  care_instructions?: string;
  special_requirements?: string;
  hourly_rate: number;
  total_amount: number;
  notes?: string;
  supervisor_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftTemplate {
  id: number;
  name: string;
  shift_type: string;
  duration_hours: number;
  care_instructions?: string;
  special_requirements?: string;
  is_active: boolean;
}

export interface ShiftSwap {
  id: number;
  original_shift: number;
  requesting_staff: number;
  target_staff?: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  approved_at?: string;
  approved_by?: number;
}

export const rosterService = {
  // Get all shifts
  getShifts: async (params?: any) => {
    const response = await api.get('/roster/shifts/', { params });
    return response.data;
  },

  // Get shift by ID
  getShift: async (id: number) => {
    const response = await api.get(`/roster/shifts/${id}/`);
    return response.data;
  },

  // Create new shift
  createShift: async (shiftData: Partial<Shift>) => {
    const response = await api.post('/roster/shifts/', shiftData);
    return response.data;
  },

  // Update shift
  updateShift: async (id: number, shiftData: Partial<Shift>) => {
    const response = await api.put(`/roster/shifts/${id}/`, shiftData);
    return response.data;
  },

  // Delete shift
  deleteShift: async (id: number) => {
    await api.delete(`/roster/shifts/${id}/`);
  },

  // Update shift status
  updateShiftStatus: async (id: number, status: string) => {
    const response = await api.post(`/roster/shifts/${id}/status/`, { status });
    return response.data;
  },

  // Get weekly schedule
  getWeeklySchedule: async (weekStart: string) => {
    const response = await api.get('/roster/shifts/weekly-schedule/', { 
      params: { week_start: weekStart } 
    });
    return response.data;
  },

  // Create recurring shifts
  createRecurringShifts: async (shiftData: any) => {
    const response = await api.post('/roster/shifts/recurring/', shiftData);
    return response.data;
  },

  // Get roster statistics
  getRosterStats: async () => {
    const response = await api.get('/roster/shifts/stats/');
    return response.data;
  },

  // Shift Templates
  getShiftTemplates: async () => {
    const response = await api.get('/roster/templates/');
    return response.data;
  },

  createShiftTemplate: async (templateData: Partial<ShiftTemplate>) => {
    const response = await api.post('/roster/templates/', templateData);
    return response.data;
  },

  // Shift Swaps
  getShiftSwaps: async () => {
    const response = await api.get('/roster/swaps/');
    return response.data;
  },

  createShiftSwap: async (swapData: Partial<ShiftSwap>) => {
    const response = await api.post('/roster/swaps/', swapData);
    return response.data;
  },

  approveShiftSwap: async (id: number) => {
    const response = await api.post(`/roster/swaps/${id}/approve/`);
    return response.data;
  },
};