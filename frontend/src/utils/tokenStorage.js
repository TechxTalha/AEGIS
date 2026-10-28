let accessToken = null;
let refreshToken = null;

export const setAccessToken = (token) => {
    accessToken = token;
    if (typeof window !== 'undefined') {
        try {
            if (token) localStorage.setItem('aegis_access_token', token);
            else localStorage.removeItem('aegis_access_token');
        } catch (e) {}
    }
};

export const getAccessToken = () => {
    if (accessToken) return accessToken;
    if (typeof window !== 'undefined') {
        try {
            return localStorage.getItem('aegis_access_token');
        } catch (e) {
            return null;
        }
    }
    return null;
};

export const clearAccessToken = () => {
    accessToken = null;
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem('aegis_access_token');
        } catch (e) {}
    }
};

export const setRefreshToken = (token) => {
    refreshToken = token;
    if (typeof window !== 'undefined') {
        try {
            if (token) localStorage.setItem('aegis_refresh_token', token);
            else localStorage.removeItem('aegis_refresh_token');
        } catch (e) {}
    }
};

export const getRefreshToken = () => {
    if (refreshToken) return refreshToken;
    if (typeof window !== 'undefined') {
        try {
            return localStorage.getItem('aegis_refresh_token');
        } catch (e) {
            return null;
        }
    }
    return null;
};

export const clearRefreshToken = () => {
    refreshToken = null;
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem('aegis_refresh_token');
        } catch (e) {}
    }
};
