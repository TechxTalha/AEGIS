import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../../api/auth';
import { 
    getAccessToken, 
    setAccessToken, 
    clearAccessToken, 
    getRefreshToken, 
    setRefreshToken, 
    clearRefreshToken 
} from '../../utils/tokenStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Attempt to refresh token on initial load
        const initAuth = async () => {
            try {
                const response = await authApi.refresh();
                setAccessToken(response.accessToken);
                if (response.refreshToken) {
                    setRefreshToken(response.refreshToken);
                }
                setIsAuthenticated(true);
            } catch (error) {
                const storedAccessToken = getAccessToken();
                const storedRefreshToken = getRefreshToken();
                if (storedAccessToken || storedRefreshToken) {
                    // Keep authenticated state optimistically if credentials exist,
                    // request interceptor will handle silent refresh on next call
                    setIsAuthenticated(true);
                } else {
                    clearAccessToken();
                    clearRefreshToken();
                    setIsAuthenticated(false);
                }
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        const handleAuthExpired = () => {
            setIsAuthenticated(false);
        };
        window.addEventListener('aegis:auth_expired', handleAuthExpired);
        return () => window.removeEventListener('aegis:auth_expired', handleAuthExpired);
    }, []);

    const login = async (credentials) => {
        const response = await authApi.login(credentials);
        setAccessToken(response.accessToken);
        if (response.refreshToken) {
            setRefreshToken(response.refreshToken);
        }
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } finally {
            clearAccessToken();
            clearRefreshToken();
            setIsAuthenticated(false);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
