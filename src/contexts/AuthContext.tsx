import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api'; // Use the centralized API instance

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
            const response = await api.post<AuthResponse>('/auth/login/', {
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
            console.error('Login error:', error);
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    };

    const register = async (userData: RegisterData): Promise<void> => {
        try {
            const response = await api.post<AuthResponse>('/auth/register/', userData);

            const { user: newUser, tokens } = response.data;

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
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await api.post('/auth/logout/', { refresh: refreshToken });
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
            const response = await api.patch<User>('/auth/profile/', profileData);
            const updatedUser = response.data;

            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
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
        loading
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
