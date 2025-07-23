import api from './api';

export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
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
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientDocument {
  id: number;
  client: number;
  document_type: string;
  title: string;
  description?: string;
  file: string;
  uploaded_by: number;
  uploaded_at: string;
}

export const clientService = {
  // Get all clients
  getClients: async (params?: any) => {
    const response = await api.get('/clients/', { params });
    return response.data;
  },

  // Get client by ID
  getClient: async (id: number) => {
    const response = await api.get(`/clients/${id}/`);
    return response.data;
  },

  // Create new client
  createClient: async (clientData: Partial<Client>) => {
    const response = await api.post('/clients/', clientData);
    return response.data;
  },

  // Update client
  updateClient: async (id: number, clientData: Partial<Client>) => {
    const response = await api.put(`/clients/${id}/`, clientData);
    return response.data;
  },

  // Delete client
  deleteClient: async (id: number) => {
    await api.delete(`/clients/${id}/`);
  },

  // Search clients
  searchClients: async (query: string) => {
    const response = await api.get('/clients/search/', { params: { q: query } });
    return response.data;
  },

  // Get client statistics
  getClientStats: async () => {
    const response = await api.get('/clients/stats/');
    return response.data;
  },

  // Get client documents
  getClientDocuments: async (clientId: number) => {
    const response = await api.get(`/clients/${clientId}/documents/`);
    return response.data;
  },

  // Upload client document
  uploadClientDocument: async (clientId: number, documentData: FormData) => {
    const response = await api.post(`/clients/${clientId}/documents/`, documentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};