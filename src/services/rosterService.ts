import api from './api';

export interface Shift {
  id?: number;
  client: number;
  client_name?: string;
  client_details?: {
    id: number;
    name: string;
    address: string;
  };
  staff: number;
  staff_name?: string;
  staff_details?: {
    id: number;
    name: string;
    employee_id: string;
    position: string;
  };
  shift_type: 'regular' | 'respite' | 'emergency' | 'overnight';
  start_datetime: string;
  end_datetime: string;
  duration_hours?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  actual_start_time?: string;
  actual_end_time?: string;
  care_instructions?: string;
  special_requirements?: string;
  hourly_rate: number;
  total_amount?: number;
  notes?: string;
  supervisor_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DropdownOption {
  id: number;
  display_name: string;
  employee_id?: string;
  position?: string;
  department?: string;
  address_line_1?: string;
  city?: string;
  is_active: boolean;
}

export interface DropdownData {
  clients: DropdownOption[];
  staff: DropdownOption[];
  shift_types: { value: string; label: string }[];
  status_options: { value: string; label: string }[];
}

export interface ShiftSwap {
  id?: number;
  original_shift: number;
  original_shift_details?: {
    id: number;
    client_name: string;
    start_datetime: string;
    end_datetime: string;
  };
  requesting_staff: number;
  target_staff?: number;
  requester_name?: string;
  responder_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason: string;
  requested_at?: string;
  created_at?: string;
  updated_at?: string;
}

export const rosterService = {
  // Shift CRUD operations
  getShifts: async (params?: any) => {
    const response = await api.get('/roster/shifts/', { params });
    return response.data;
  },

  getShift: async (id: number) => {
    const response = await api.get(`/roster/shifts/${id}/`);
    return response.data;
  },

  createShift: async (shiftData: Partial<Shift>) => {
    const response = await api.post('/roster/shifts/', shiftData);
    return response.data;
  },

  updateShift: async (id: number, shiftData: Partial<Shift>) => {
    const response = await api.put(`/roster/shifts/${id}/`, shiftData);
    return response.data;
  },

  deleteShift: async (id: number) => {
    await api.delete(`/roster/shifts/${id}/`);
  },

  updateShiftStatus: async (id: number, status: string) => {
    const response = await api.patch(`/roster/shifts/${id}/status/`, { status });
    return response.data;
  },

  // Dropdown data
  getDropdownData: async (): Promise<DropdownData> => {
    const response = await api.get('/roster/dropdown-data/');
    return response.data;
  },

  getClientsDropdown: async (): Promise<DropdownOption[]> => {
    const response = await api.get('/roster/clients/dropdown/');
    return response.data;
  },

  getStaffDropdown: async (): Promise<DropdownOption[]> => {
    const response = await api.get('/roster/staff/dropdown/');
    return response.data;
  },

  // Shift Swaps
  getShiftSwaps: async (params?: any) => {
    const response = await api.get('/roster/swaps/', { params });
    return response.data;
  },

  createShiftSwap: async (swapData: Partial<ShiftSwap>) => {
    const response = await api.post('/roster/swaps/', swapData);
    return response.data;
  },

  approveShiftSwap: async (id: number, comments?: string) => {
    const response = await api.post(`/roster/swaps/${id}/approve/`, { comments });
    return response.data;
  },

  // Schedule views
  getWeeklySchedule: async (date?: string) => {
    const params = date ? { date } : {};
    const response = await api.get('/roster/shifts/weekly-schedule/', { params });
    return response.data;
  },

  getRosterStats: async () => {
    const response = await api.get('/roster/shifts/stats/');
    return response.data;
  },
};

export default rosterService;