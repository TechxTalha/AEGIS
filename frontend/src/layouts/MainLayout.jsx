import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Layout, Menu, Button, theme } from 'antd';
import { LogoutOutlined, DashboardOutlined, UserOutlined, UnorderedListOutlined, RobotOutlined, CheckSquareOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;

const MainLayout = () => {
    const { isAuthenticated, isLoading, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = async () => {
        await logout();
    };

    const getSelectedKey = () => {
        if (location.pathname.startsWith('/tasks')) return 'tasks';
        if (location.pathname.startsWith('/approvals')) return 'approvals';
        if (location.pathname.startsWith('/agents')) return 'agents';
        return 'dashboard';
    };

    return (
        <Layout className="min-h-screen flex flex-col bg-[#0B0F19] text-white">
            {/* Top Navigation Bar */}
            <Header
                style={{ padding: '0 16px', background: 'rgba(11, 15, 25, 0.65)' }}
                className="flex justify-between items-center sticky top-0 z-50 h-20 backdrop-blur-lg border-b border-white/5 relative"
            >
                {/* Left side spacer */}
                <div className="w-10"></div>

                {/* Centered Logo */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    <img
                        src="/apple-touch-icon.png"
                        alt="AEGIS Logo"
                        className="h-28 mt-4 w-auto object-contain drop-shadow-[0_0_15px_rgba(0,210,255,0.6)]"
                        style={{ mixBlendMode: 'screen' }}
                    />
                </div>

                <Button
                    type="text"
                    icon={<LogoutOutlined className="text-lg" />}
                    onClick={handleLogout}
                    className="flex items-center text-gray-400 hover:text-red-500 transition-colors hover:shadow-neon hover:bg-red-500/10 h-10 w-10 flex-shrink-0"
                />
            </Header>

            {/* Main Content Area - padded at bottom for fixed nav */}
            <Content className="flex-1 overflow-y-auto pb-24 pt-4 px-3">
                <Outlet />
            </Content>

            {/* Bottom Navigation Bar (Mobile PWA) - Floating Pill Design */}
            <div className="fixed bottom-6 w-full z-50 px-4 flex justify-center pointer-events-none">
                <div className="rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,210,255,0.15)] overflow-hidden backdrop-blur-xl w-full max-w-[400px] pointer-events-auto"
                    style={{ background: 'rgba(15, 20, 35, 0.85)' }}>
                    <div className="flex justify-around items-center h-16 w-full">
                        <div 
                            onClick={() => navigate('/')} 
                            className={`flex-1 h-full flex flex-col justify-center items-center cursor-pointer transition-all duration-300 relative ${getSelectedKey() === 'dashboard' ? 'text-primary' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <DashboardOutlined className="text-xl mb-1" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">Home</span>
                            {getSelectedKey() === 'dashboard' && <div className="absolute bottom-0 w-1/2 h-[3px] bg-primary rounded-t-md shadow-[0_0_8px_rgba(0,210,255,0.8)]"></div>}
                        </div>
                        
                        <div 
                            onClick={() => navigate('/tasks')} 
                            className={`flex-1 h-full flex flex-col justify-center items-center cursor-pointer transition-all duration-300 relative ${getSelectedKey() === 'tasks' ? 'text-primary' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <UnorderedListOutlined className="text-xl mb-1" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">Tasks</span>
                            {getSelectedKey() === 'tasks' && <div className="absolute bottom-0 w-1/2 h-[3px] bg-primary rounded-t-md shadow-[0_0_8px_rgba(0,210,255,0.8)]"></div>}
                        </div>

                        <div 
                            onClick={() => navigate('/approvals')} 
                            className={`flex-1 h-full flex flex-col justify-center items-center cursor-pointer transition-all duration-300 relative ${getSelectedKey() === 'approvals' ? 'text-primary' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <CheckSquareOutlined className="text-xl mb-1" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">Alerts</span>
                            {getSelectedKey() === 'approvals' && <div className="absolute bottom-0 w-1/2 h-[3px] bg-primary rounded-t-md shadow-[0_0_8px_rgba(0,210,255,0.8)]"></div>}
                        </div>

                        <div 
                            onClick={() => navigate('/agents')} 
                            className={`flex-1 h-full flex flex-col justify-center items-center cursor-pointer transition-all duration-300 relative ${getSelectedKey() === 'agents' ? 'text-primary' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <RobotOutlined className="text-xl mb-1" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">Agents</span>
                            {getSelectedKey() === 'agents' && <div className="absolute bottom-0 w-1/2 h-[3px] bg-primary rounded-t-md shadow-[0_0_8px_rgba(0,210,255,0.8)]"></div>}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default MainLayout;
