import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { USE_DOTNET_APIS } from '../services/api'; // Use the centralized API instance
import { dotNetAuthService } from '../services/dotnetApiService';

// Types
interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string; // Primary role for backward compatibility
    roles?: string[]; // Full roles array from .NET backend
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
    backendType: string; // Add backend type indicator
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
            console.log('Login attempt - Backend type:', USE_DOTNET_APIS ? '.NET Core' : 'Django');
            let response: AuthResponse;

            if (USE_DOTNET_APIS) {
                console.log('Attempting .NET login to:', 'http://localhost:5001');
                // Use .NET Authentication API
                response = await dotNetAuthService.login(username, password);
            } else {
                console.log('Attempting Django login to:', api.defaults.baseURL);
                // Use Django API
                const apiResponse = await api.post<AuthResponse>('/auth/login/', {
                    username,
                    password,
                });
                response = apiResponse.data;
            }

            const { user: userData, tokens } = response;

            // Store tokens and user data
            localStorage.setItem('accessToken', tokens.access);
            localStorage.setItem('refreshToken', tokens.refresh);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            console.log('Login successful for user:', userData.username);
        } catch (error: any) {
            console.error('Login error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                backend: USE_DOTNET_APIS ? '.NET Core' : 'Django'
            });

            // Provide more specific error messages
            let errorMessage = 'Login failed';
            if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
                errorMessage = USE_DOTNET_APIS
                    ? 'Cannot connect to .NET authentication service. Please ensure it is running on port 5001.'
                    : 'Cannot connect to Django backend. Please ensure it is running on port 8000.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Invalid username or password';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            throw new Error(errorMessage);
        }
    };

    const register = async (userData: RegisterData): Promise<void> => {
        try {
            let response: AuthResponse;

            if (USE_DOTNET_APIS) {
                // Convert to .NET format
                const dotNetUserData = {
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                    firstName: userData.first_name,
                    lastName: userData.last_name,
                    role: userData.user_type || 'User',
                };

                await dotNetAuthService.register(dotNetUserData);
                // .NET register doesn't return tokens, so we need to login after
                response = await dotNetAuthService.login(userData.username, userData.password);
            } else {
                // Use Django API
                const apiResponse = await api.post<AuthResponse>('/auth/register/', userData);
                response = apiResponse.data;
            }

            const { user: newUser, tokens } = response;

            // Store tokens and user data
            localStorage.setItem('accessToken', tokens.access);
            localStorage.setItem('refreshToken', tokens.refresh);
            localStorage.setItem('user', JSON.stringify(newUser));

            setUser(newUser);
        } catch (error: any) {
            console.error('Registration error:', error);
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    };

    const logout = async (): Promise<void> => {
        try {
            if (!USE_DOTNET_APIS) {
                // Only Django has logout API
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    await api.post('/auth/logout/', { refresh: refreshToken });
                }
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage and state regardless of API call success
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const updateProfile = async (profileData: Partial<User>): Promise<void> => {
        try {
            if (USE_DOTNET_APIS) {
                // .NET doesn't have profile update endpoint yet
                throw new Error('Profile update not available in .NET backend');
            } else {
                const response = await api.patch<User>('/auth/profile/', profileData);
                const updatedUser = response.data;

                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error: any) {
            console.error('Profile update error:', error);
            throw new Error(error.response?.data?.message || 'Profile update failed');
        }
    };

    const value: AuthContextType = {
        user,
        login,
        register,
        logout,
        updateProfile,
        loading,
        backendType: USE_DOTNET_APIS ? '.NET Core' : 'Django'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Export the centralized API instance instead of local one
export { api };
