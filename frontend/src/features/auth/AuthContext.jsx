import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../../api/auth';
import { setAccessToken, clearAccessToken } from '../../utils/tokenStorage';

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
                setIsAuthenticated(true);
            } catch (error) {
                clearAccessToken();
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (credentials) => {
        const response = await authApi.login(credentials);
        setAccessToken(response.accessToken);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } finally {
            clearAccessToken();
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
