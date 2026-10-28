import axios from 'axios';
import { 
    getAccessToken, 
    setAccessToken, 
    clearAccessToken,
    getRefreshToken,
    setRefreshToken,
    clearRefreshToken
} from '../utils/tokenStorage';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true, // Crucial for sending/receiving HTTP-Only cookies
});

// Request Interceptor: Attach Access Token from Memory / Storage
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 / 403 & Silent Refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) {
            return Promise.reject(error);
        }

        const status = error.response?.status;
        const isAuthError = (status === 401 || status === 403) && 
                            !originalRequest._retry && 
                            !originalRequest.url?.includes('/auth/login') && 
                            !originalRequest.url?.includes('/auth/refresh');

        if (isAuthError) {
            if (isRefreshing) {
                // If a refresh is already happening, queue this request
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return axiosInstance(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const storedRefreshToken = getRefreshToken();

            try {
                // Attempt to refresh the token using HttpOnly cookie and body/header fallback
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
                    storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
                    { 
                        withCredentials: true,
                        headers: storedRefreshToken ? { 'X-Refresh-Token': storedRefreshToken } : {}
                    }
                );

                const newAccessToken = response.data.accessToken;
                setAccessToken(newAccessToken);
                if (response.data.refreshToken) {
                    setRefreshToken(response.data.refreshToken);
                }
                
                processQueue(null, newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearAccessToken();
                clearRefreshToken();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('aegis:auth_expired'));
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
