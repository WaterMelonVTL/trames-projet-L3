import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { api } from '../public/api/api';
import { useNavigate } from 'react-router-dom';
import  LoadingAnimation from '../components/LoadingAnimation';
const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        loading: true
    });
    const navigate = useNavigate();

    const checkAuth = useCallback(async () => {
        try {
            // Try silent refresh
            console.log('Attempting token refresh...');
            const { accessToken } = await api.refreshToken();
            api.setAccessToken(accessToken);
            setAuthState({ isAuthenticated: true, loading: false });
            console.log('Token refresh successful');
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            api.setAccessToken(null);
            setAuthState({ isAuthenticated: false, loading: false });
            return false;
        }
    }, []);

    useEffect(() => {
        // Initial check when app loads
        checkAuth();
    }, [checkAuth]);

    const login = async (email, password, rememberMe) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787/api'}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Email: email, Password: password, Admin: false, RememberMe: rememberMe }),
                credentials: 'include'
            });
    
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }
    
            const { accessToken } = await response.json();
            api.setAccessToken(accessToken);
            
            // Immediately update auth state without additional check
            setAuthState({ isAuthenticated: true, loading: false });
            
        } catch (error) {
            setAuthState({ isAuthenticated: false, loading: false });
            throw error;
        }
    };

    const logout = () => {
        api.setAccessToken(null);
        setAuthState({ isAuthenticated: false, loading: false });
        navigate('/login');
    };

    const value = {
        ...authState,
        checkAuth,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {authState.loading ? (
                <LoadingAnimation texte={"Chargement en cours..."} colors = {"#999999"} />
            ) : children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);