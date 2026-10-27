let accessToken = null;

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
