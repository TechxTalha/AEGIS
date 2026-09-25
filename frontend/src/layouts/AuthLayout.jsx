import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

const AuthLayout = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white">Loading...</div>;
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 overflow-hidden">
            {/* Cyberpunk Animated Background Elements */}
            <div className="absolute inset-0 z-[-1] bg-[#0B0F19]"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00d2ff] rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3a7bd5] rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

            {/* Login Card */}
            <div className="w-full max-w-md p-8 sm:p-10 bg-[#151A2D]/80 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,210,255,0.1)] border border-white/5 relative">
                {/* Glowing border effect */}
                <div className="absolute inset-0 rounded-3xl border border-[#00d2ff]/20 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }}></div>
                
                <Outlet />
            </div>
        </div>
    );
};

export default AuthLayout;
