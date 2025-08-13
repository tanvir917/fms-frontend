import { dotnetClientApi } from './api';

// Define enums to match .NET backend exactly
export enum CareLevel {
  Low = 0,
  Medium = 1,
  High = 2,
  Respite = 3,
  Palliative = 4
}

export enum ClientStatus {
  Active = 0,
  Inactive = 1,
  Discharged = 2,
  Deceased = 3,
  OnHold = 4
}

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  fullName?: string;
  dateOfBirth: string;
  age?: number;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  medicaidNumber?: string;
  medicareNumber?: string;
  socialSecurityNumber?: string;
  careLevel: CareLevel;
  status: ClientStatus;
  admissionDate?: string;
  dischargeDate?: string;
  medicalConditions?: string;
  medications?: string;
  allergies?: string;
  specialInstructions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  carePlans?: CarePlan[];
  documents?: ClientDocument[];
  clientNotes?: ClientNote[];
}

export interface CarePlan {
  id: number;
  clientId: number;
  title: string;
  description?: string;
  goals?: string;
  interventionStrategies?: string;
  startDate: string;
  endDate?: string;
  reviewDate?: string;
  status: 'Draft' | 'Active' | 'Inactive' | 'Completed' | 'Discontinued' | number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ClientNote {
  id: number;
  clientId: number;
  title: string;
  content: string;
  noteType: 'General' | 'Medical' | 'Behavioral' | 'Care' | 'Administrative';
  noteDate: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ClientDocument {
  id: number;
  clientId: number;
  title: string;
  description?: string;
  documentType: 'Medical' | 'Legal' | 'Insurance' | 'Personal' | 'Care' | 'Assessment' | 'Other';
  filePath: string;
  fileName: string;
  fileSize?: string;
  contentType?: string;
  uploadDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateClientDto {
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  dateOfBirth: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  medicaidNumber?: string;
  medicareNumber?: string;
  socialSecurityNumber?: string;
  careLevel: CareLevel;
  status: ClientStatus;
  admissionDate?: string;
  medicalConditions?: string;
  medications?: string;
  allergies?: string;
  specialInstructions?: string;
  notes?: string;
}

export interface UpdateClientDto {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  preferredName?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  medicaidNumber?: string;
  medicareNumber?: string;
  socialSecurityNumber?: string;
  careLevel?: CareLevel;
  status?: ClientStatus;
  admissionDate?: string;
  dischargeDate?: string;
  medicalConditions?: string;
  medications?: string;
  allergies?: string;
  specialInstructions?: string;
  notes?: string;
}

export interface ClientSearchDto {
  name?: string;
  email?: string;
  phoneNumber?: string;
  careLevel?: CareLevel;
  status?: ClientStatus;
  admissionDateFrom?: string;
  admissionDateTo?: string;
  ageFrom?: number;
  ageTo?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface ClientStatsDto {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  dischargedClients: number;
  clientsByCareLevel: Record<string, number>;
  clientsByStatus: Record<string, number>;
  newClientsThisMonth: number;
  dischargedThisMonth: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
}

export const clientService = {
  // Client CRUD operations - Updated for .NET API
  getClients: async (params?: ClientSearchDto): Promise<PaginatedResponse<Client>> => {
    const response = await dotnetClientApi.get<ApiResponse<PaginatedResponse<Client>>>('/clients', { params });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch clients');
  },

  getClient: async (id: number): Promise<Client> => {
    const response = await dotnetClientApi.get<ApiResponse<Client>>(`/clients/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch client');
  },

  createClient: async (clientData: CreateClientDto): Promise<Client> => {
    const response = await dotnetClientApi.post<ApiResponse<Client>>('/clients', clientData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create client');
  },

  updateClient: async (id: number, clientData: UpdateClientDto): Promise<Client> => {
    const response = await dotnetClientApi.put<ApiResponse<Client>>(`/clients/${id}`, clientData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update client');
  },

  deleteClient: async (id: number): Promise<void> => {
    const response = await dotnetClientApi.delete<ApiResponse<void>>(`/clients/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete client');
    }
  },

  getClientStats: async (): Promise<ClientStatsDto> => {
    const response = await dotnetClientApi.get<ApiResponse<ClientStatsDto>>('/clients/stats');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch client stats');
  },

  // Care Plan operations - Updated for .NET API
  getCarePlans: async (clientId: number): Promise<CarePlan[]> => {
    const response = await dotnetClientApi.get<ApiResponse<CarePlan[]>>(`/clients/${clientId}/careplans`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch care plans');
  },

  createCarePlan: async (clientId: number, carePlanData: any): Promise<CarePlan> => {
    const response = await dotnetClientApi.post<ApiResponse<CarePlan>>(`/clients/${clientId}/careplans`, carePlanData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create care plan');
  },

  updateCarePlan: async (clientId: number, planId: number, carePlanData: any): Promise<CarePlan> => {
    const response = await dotnetClientApi.put<ApiResponse<CarePlan>>(`/clients/${clientId}/careplans/${planId}`, carePlanData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update care plan');
  },

  deleteCarePlan: async (clientId: number, planId: number): Promise<void> => {
    const response = await dotnetClientApi.delete<ApiResponse<void>>(`/clients/${clientId}/careplans/${planId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete care plan');
    }
  },

  // Client Notes operations - Updated for .NET API
  getClientNotes: async (clientId: number): Promise<ClientNote[]> => {
    const response = await dotnetClientApi.get<ApiResponse<ClientNote[]>>(`/clients/${clientId}/notes`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch client notes');
  },

  createClientNote: async (clientId: number, noteData: any): Promise<ClientNote> => {
    const response = await dotnetClientApi.post<ApiResponse<ClientNote>>(`/clients/${clientId}/notes`, noteData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create client note');
  },

  updateClientNote: async (clientId: number, noteId: number, noteData: any): Promise<ClientNote> => {
    const response = await dotnetClientApi.put<ApiResponse<ClientNote>>(`/clients/${clientId}/notes/${noteId}`, noteData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update client note');
  },

  deleteClientNote: async (clientId: number, noteId: number): Promise<void> => {
    const response = await dotnetClientApi.delete<ApiResponse<void>>(`/clients/${clientId}/notes/${noteId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete client note');
    }
  },

  // Document operations - Updated for .NET API
  getClientDocuments: async (clientId: number): Promise<ClientDocument[]> => {
    const response = await dotnetClientApi.get<ApiResponse<ClientDocument[]>>(`/clients/${clientId}/documents`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch client documents');
  },

  uploadClientDocument: async (clientId: number, documentData: FormData): Promise<ClientDocument> => {
    const response = await dotnetClientApi.post<ApiResponse<ClientDocument>>(`/clients/${clientId}/documents/upload`, documentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to upload document');
  },

  deleteClientDocument: async (clientId: number, documentId: number): Promise<void> => {
    const response = await dotnetClientApi.delete<ApiResponse<void>>(`/clients/${clientId}/documents/${documentId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete document');
    }
  },

  downloadClientDocument: async (clientId: number, documentId: number): Promise<Blob> => {
    const response = await dotnetClientApi.get(`/clients/${clientId}/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },
};