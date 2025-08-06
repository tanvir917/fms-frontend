import axios from 'axios';

// Environment configuration for different backends
const USE_DOTNET_APIS = import.meta.env.VITE_USE_DOTNET_APIS === 'true';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const DOTNET_AUTH_URL = import.meta.env.VITE_DOTNET_AUTH_URL || 'http://localhost:5001/api';
const DOTNET_STAFF_URL = import.meta.env.VITE_DOTNET_STAFF_URL || 'http://localhost:5002/api';

// Create different API instances for different services
const createApiInstance = (baseURL: string) => {
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Django API instance (original)
const djangoApi = createApiInstance(API_BASE_URL);

// .NET Microservices API instances
const dotnetAuthApi = createApiInstance(DOTNET_AUTH_URL);
const dotnetStaffApi = createApiInstance(DOTNET_STAFF_URL);

// Default API instance (switches based on environment)
const api = USE_DOTNET_APIS ? dotnetAuthApi : djangoApi;

// Add request interceptor for authentication
const addAuthInterceptor = (apiInstance: any) => {
  apiInstance.interceptors.request.use(
    (config: any) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );
};

// Add response interceptor for error handling
const addResponseInterceptor = (apiInstance: any) => {
  apiInstance.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      console.error('API Error:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        backend: USE_DOTNET_APIS ? '.NET' : 'Django',
      });
      
      if (error.response?.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
  );
};

// Apply interceptors to all API instances
addAuthInterceptor(djangoApi);
addAuthInterceptor(dotnetAuthApi);
addAuthInterceptor(dotnetStaffApi);

addResponseInterceptor(djangoApi);
addResponseInterceptor(dotnetAuthApi);
addResponseInterceptor(dotnetStaffApi);

export default api;
export { djangoApi, dotnetAuthApi, dotnetStaffApi, USE_DOTNET_APIS };