import { clientService } from '../services/clientService';
import { rosterService } from '../services/rosterService';

export const testApiConnection = async () => {
    try {
        console.log('🔍 Testing API connection...');
        
        // Test authentication status
        const token = localStorage.getItem('accessToken');
        const user = localStorage.getItem('user');
        
        console.log('🔐 Auth Status:', {
            hasToken: !!token,
            hasUser: !!user,
            token: token ? `${token.substring(0, 20)}...` : null,
            user: user ? JSON.parse(user) : null
        });

        // Test client API
        try {
            const clients = await clientService.getClients();
            console.log('✅ Client API working:', clients);
            return {
                auth: { hasToken: !!token, hasUser: !!user },
                clientApi: { status: 'success', data: clients },
                rosterApi: null
            };
        } catch (clientError: any) {
            console.log('❌ Client API failed:', clientError);
            
            // Test roster API even if client fails
            try {
                const shifts = await rosterService.getShifts();
                console.log('✅ Roster API working:', shifts);
                return {
                    auth: { hasToken: !!token, hasUser: !!user },
                    clientApi: { status: 'error', error: clientError.response?.data || clientError.message },
                    rosterApi: { status: 'success', data: shifts }
                };
            } catch (rosterError: any) {
                console.log('❌ Roster API failed:', rosterError);
                return {
                    auth: { hasToken: !!token, hasUser: !!user },
                    clientApi: { status: 'error', error: clientError.response?.data || clientError.message },
                    rosterApi: { status: 'error', error: rosterError.response?.data || rosterError.message }
                };
            }
        }
    } catch (error) {
        console.error('💥 API test failed:', error);
        return {
            auth: { hasToken: false, hasUser: false },
            clientApi: { status: 'error', error: 'Connection failed' },
            rosterApi: { status: 'error', error: 'Connection failed' }
        };
    }
};