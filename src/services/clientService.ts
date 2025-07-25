import api from './api';

export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  date_of_birth: string;
  age?: number;
  gender: 'M' | 'F' | 'O' | 'P';
  phone_number?: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  care_level: 'low' | 'medium' | 'high' | 'respite' | 'palliative';
  medical_conditions?: string;
  medications?: string;
  allergies?: string;
  dietary_requirements?: string;
  special_requirements?: string;
  mobility_notes?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  status: 'active' | 'inactive' | 'waiting_list' | 'discharged';
  is_active: boolean;
  current_care_plan?: CarePlan;
  notes_count?: number;
  documents_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CarePlan {
  id: number;
  client: number;
  client_name?: string;
  plan_type: 'initial' | 'ongoing' | 'respite' | 'palliative' | 'transitional';
  title: string;
  description: string;
  care_goals: string;
  intervention_strategies: string;
  support_requirements: string;
  risk_assessments?: string;
  start_date: string;
  end_date?: string;
  review_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  is_active: boolean;
  created_by?: number;
  created_by_name?: string;
  approved_by?: number;
  approved_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientNote {
  id: number;
  client: number;
  client_name?: string;
  care_plan?: number;
  note_type: 'general' | 'medical' | 'behavioral' | 'incident' | 'care_update';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  content: string;
  is_confidential: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientDocument {
  id: number;
  client: number;
  client_name?: string;
  care_plan?: number;
  document_type: string;
  title: string;
  description?: string;
  file: string;
  file_size?: number;
  uploaded_by?: number;
  uploaded_by_name?: string;
  uploaded_at: string;
}

export const clientService = {
  // Client CRUD operations
  getClients: async (params?: any) => {
    const response = await api.get('/clients/', { params });
    return response.data;
  },

  getClient: async (id: number) => {
    const response = await api.get(`/clients/${id}/`);
    return response.data;
  },

  createClient: async (clientData: Partial<Client>) => {
    const response = await api.post('/clients/', clientData);
    return response.data;
  },

  updateClient: async (id: number, clientData: Partial<Client>) => {
    const response = await api.put(`/clients/${id}/`, clientData);
    return response.data;
  },

  deleteClient: async (id: number) => {
    await api.delete(`/clients/${id}/`);
  },

  searchClients: async (query: string, filters?: any) => {
    const params = { q: query, ...filters };
    const response = await api.get('/clients/search/', { params });
    return response.data;
  },

  getClientStats: async () => {
    const response = await api.get('/clients/stats/');
    return response.data;
  },

  // Care Plan operations
  getCarePlans: async (clientId: number) => {
    const response = await api.get(`/clients/${clientId}/care-plans/`);
    return response.data;
  },

  createCarePlan: async (clientId: number, carePlanData: Partial<CarePlan>) => {
    const response = await api.post(`/clients/${clientId}/care-plans/`, carePlanData);
    return response.data;
  },

  updateCarePlan: async (clientId: number, planId: number, carePlanData: Partial<CarePlan>) => {
    const response = await api.put(`/clients/${clientId}/care-plans/${planId}/`, carePlanData);
    return response.data;
  },

  deleteCarePlan: async (clientId: number, planId: number) => {
    await api.delete(`/clients/${clientId}/care-plans/${planId}/`);
  },

  activateCarePlan: async (clientId: number, planId: number) => {
    const response = await api.post(`/clients/${clientId}/care-plans/${planId}/activate/`);
    return response.data;
  },

  // Client Notes operations
  getClientNotes: async (clientId: number) => {
    const response = await api.get(`/clients/${clientId}/notes/`);
    return response.data;
  },

  createClientNote: async (clientId: number, noteData: Partial<ClientNote>) => {
    const response = await api.post(`/clients/${clientId}/notes/`, noteData);
    return response.data;
  },

  updateClientNote: async (clientId: number, noteId: number, noteData: Partial<ClientNote>) => {
    const response = await api.put(`/clients/${clientId}/notes/${noteId}/`, noteData);
    return response.data;
  },

  deleteClientNote: async (clientId: number, noteId: number) => {
    await api.delete(`/clients/${clientId}/notes/${noteId}/`);
  },

  // Document operations
  getClientDocuments: async (clientId: number) => {
    const response = await api.get(`/clients/${clientId}/documents/`);
    return response.data;
  },

  uploadClientDocument: async (clientId: number, documentData: FormData) => {
    const response = await api.post(`/clients/${clientId}/documents/`, documentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteClientDocument: async (clientId: number, documentId: number) => {
    await api.delete(`/clients/${clientId}/documents/${documentId}/`);
  },
};