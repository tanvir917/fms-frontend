import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Types
interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
    phone_number?: string;
    profile_picture?: string;
    is_active: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    register: (userData: RegisterData) => Promise<void>;
    updateProfile: (userData: Partial<User>) => Promise<void>;
}

interface RegisterData {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirm: string;
    user_type?: string;
    phone_number?: string;
}

interface AuthResponse {
    user: User;
    tokens: {
        access: string;
        refresh: string;
    };
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    localStorage.setItem('accessToken', access);

                    return apiClient(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, logout user - but don't redirect here
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    // Let the ProtectedRoute component handle the redirect
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing user session
        const token = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (error) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            }
        }

        setLoading(false);
    }, []);

    const login = async (username: string, password: string): Promise<void> => {
        try {
            const response = await apiClient.post<AuthResponse>('/auth/login/', {
                username,
                password,
            });

            const { user: userData, tokens } = response.data;

            // Store tokens and user data
            localStorage.setItem('accessToken', tokens.access);
            localStorage.setItem('refreshToken', tokens.refresh);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
        } catch (error: any) {
            if (error.response?.data?.non_field_errors) {
                throw new Error(error.response.data.non_field_errors[0]);
            } else if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else {
                throw new Error('Login failed. Please check your credentials.');
            }
        }
    };

    const register = async (userData: RegisterData): Promise<void> => {
        try {
            const response = await apiClient.post<AuthResponse>('/auth/register/', userData);

            const { user: newUser, tokens } = response.data;

            // Store tokens and user data
            localStorage.setItem('accessToken', tokens.access);
            localStorage.setItem('refreshToken', tokens.refresh);
            localStorage.setItem('user', JSON.stringify(newUser));

            setUser(newUser);
        } catch (error: any) {
            if (error.response?.data) {
                // Handle validation errors
                const errors = error.response.data;
                const errorMessages = Object.values(errors).flat() as string[];
                throw new Error(errorMessages.join(', '));
            } else {
                throw new Error('Registration failed. Please try again.');
            }
        }
    };

    const logout = async (): Promise<void> => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await apiClient.post('/auth/logout/', { refresh: refreshToken });
            }
        } catch (error) {
            // Ignore logout API errors
            console.error('Logout API error:', error);
        } finally {
            // Always clear local storage and state
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const updateProfile = async (profileData: Partial<User>): Promise<void> => {
        try {
            const response = await apiClient.patch<User>('/auth/profile/', profileData);

            const updatedUser = response.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } catch (error: any) {
            if (error.response?.data) {
                const errors = error.response.data;
                const errorMessages = Object.values(errors).flat() as string[];
                throw new Error(errorMessages.join(', '));
            } else {
                throw new Error('Profile update failed. Please try again.');
            }
        }
    };

    const contextValue: AuthContextType = {
        user,
        loading,
        login,
        logout,
        register,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Export API client for use in other components
export { apiClient };
