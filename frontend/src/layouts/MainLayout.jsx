import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Layout, Menu, Button, theme } from 'antd';
import { 
    LogoutOutlined, 
    DashboardOutlined, 
    UserOutlined, 
    UnorderedListOutlined, 
    RobotOutlined, 
    CheckSquareOutlined, 
    DatabaseOutlined,
    PlusOutlined
} from '@ant-design/icons';

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
        if (location.pathname.startsWith('/memory')) return 'memory';
        return 'dashboard';
    };

    return (
        <Layout className="h-screen max-h-screen overflow-hidden flex flex-col bg-[#0B0F19] text-white">
            {/* Top Navigation Bar with Grand Centered Logo & Aligned Command Branding */}
            <Header
                style={{ padding: '0 24px', background: 'rgba(11, 15, 25, 0.85)' }}
                className="flex justify-between items-center sticky top-0 z-50 h-20 flex-shrink-0 backdrop-blur-lg border-b border-white/5 relative"
            >
                {/* Left: AEGIS Command Branding & Status */}
                <div className="flex items-center gap-2.5 z-20">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff] shadow-neon animate-pulse" />
                    <span 
                        onClick={() => navigate('/')} 
                        className="text-lg font-bold tracking-tight text-white select-none cursor-pointer hover:text-cyan-400 transition-colors"
                    >
                        AEGIS Command
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-mono tracking-wider hidden sm:inline-block">
                        Online • 169.58.232.237
                    </span>
                </div>

                {/* Center: Grand High-Impact Shield Logo */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                    <div 
                        onClick={() => navigate('/')}
                        className="relative flex items-center justify-center cursor-pointer group"
                    >
                        <div className="absolute inset-0 bg-[#00d2ff] rounded-full blur-[26px] opacity-45 pointer-events-none group-hover:opacity-75 transition-opacity duration-300"></div>
                        <img
                            src="/apple-touch-icon.png"
                            alt="AEGIS Logo"
                            className="h-20 w-20 object-contain relative z-10 drop-shadow-[0_0_24px_rgba(0,210,255,0.95)] group-hover:scale-105 transition-transform duration-300 select-none"
                            style={{ height: '80px', width: '80px' }}
                        />
                    </div>
                </div>

                {/* Right: Action Controls (Launch Task + Logout) */}
                <div className="flex items-center gap-2.5 z-20">
                    <Button 
                        size="small"
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => navigate('/tasks')} 
                        className="bg-primary text-[#0B0F19] font-bold border-none shadow-neon hover:bg-primary/90 text-xs px-3.5 h-8 flex items-center cursor-pointer"
                    >
                        Launch Task
                    </Button>
                    <Button
                        type="text"
                        icon={<LogoutOutlined className="text-base" />}
                        onClick={handleLogout}
                        className="flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 rounded-lg transition-colors cursor-pointer"
                        title="Logout"
                    />
                </div>
            </Header>

            {/* Main Content Area - padded at bottom for fixed nav, zero-scroll on desktop */}
            <Content className="flex-1 overflow-y-auto lg:overflow-hidden pb-18 pt-1 px-3 lg:px-5 flex flex-col justify-center">
                <Outlet />
            </Content>

            {/* Bottom Navigation Bar (Mobile PWA) - Floating Pill Design */}
            <div className="fixed bottom-4 w-full z-50 px-4 flex justify-center pointer-events-none">
                <div className="rounded-2xl border border-[#00d2ff]/30 shadow-[0_8px_32px_rgba(0,210,255,0.2)] overflow-hidden backdrop-blur-xl w-full max-w-[390px] pointer-events-auto"
                    style={{ background: 'rgba(10, 15, 25, 0.95)' }}>
                    <div className="flex justify-between items-center h-[56px] w-full px-4">
                        <div 
                            onClick={() => navigate('/')} 
                            className={`h-full px-2 flex flex-col justify-center items-center cursor-pointer transition-all duration-300 relative ${getSelectedKey() === 'dashboard' ? 'text-primary' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <DashboardOutlined className={`text-lg mb-0.5 transition-transform ${getSelectedKey() === 'dashboard' ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]' : ''}`} />
                            <span className="text-[9px] uppercase font-bold tracking-widest">Home</span>
                            {getSelectedKey() === 'dashboard' && <div className="absolute bottom-0 w-[80%] h-[3px] bg-primary rounded-t-md shadow-[0_0_10px_rgba(0,210,255,1)] left-1/2 -translate-x-1/2"></div>}
                        </div>
                        
                        <div 
                            onClick={() => navigate('/tasks')} 
                            className={`h-full px-2 flex flex-col justify-center items-center cursor-pointer transition-all duration-300 relative ${getSelectedKey() === 'tasks' ? 'text-primary' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <UnorderedListOutlined className={`text-lg mb-0.5 transition-transform ${getSelectedKey() === 'tasks' ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]' : ''}`} />
                            <span className="text-[9px] uppercase font-bold tracking-widest">Tasks</span>
                            {getSelectedKey() === 'tasks' && <div className="absolute bottom-0 w-[80%] h-[3px] bg-primary rounded-t-md shadow-[0_0_10px_rgba(0,210,255,1)] left-1/2 -translate-x-1/2"></div>}
                        </div>

                        <div 
                            onClick={() => navigate('/approvals')} 
                            className={`h-full px-2 flex flex-col justify-center items-center cursor-pointer transition-all duration-300 relative ${getSelectedKey() === 'approvals' ? 'text-primary' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <CheckSquareOutlined className={`text-lg mb-0.5 transition-transform ${getSelectedKey() === 'approvals' ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]' : ''}`} />
                            <span className="text-[9px] uppercase font-bold tracking-widest">Alerts</span>
                            {getSelectedKey() === 'approvals' && <div className="absolute bottom-0 w-[80%] h-[3px] bg-primary rounded-t-md shadow-[0_0_10px_rgba(0,210,255,1)] left-1/2 -translate-x-1/2"></div>}
                        </div>

                        <div 
                            onClick={() => navigate('/agents')} 
                            className={`h-full px-2 flex flex-col justify-center items-center cursor-pointer transition-all duration-300 relative ${getSelectedKey() === 'agents' ? 'text-primary' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <RobotOutlined className={`text-lg mb-0.5 transition-transform ${getSelectedKey() === 'agents' ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]' : ''}`} />
                            <span className="text-[9px] uppercase font-bold tracking-widest">Agents</span>
                            {getSelectedKey() === 'agents' && <div className="absolute bottom-0 w-[80%] h-[3px] bg-primary rounded-t-md shadow-[0_0_10px_rgba(0,210,255,1)] left-1/2 -translate-x-1/2"></div>}
                        </div>

                        <div 
                            onClick={() => navigate('/memory')} 
                            className={`h-full px-2 flex flex-col justify-center items-center cursor-pointer transition-all duration-300 relative ${getSelectedKey() === 'memory' ? 'text-primary' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <DatabaseOutlined className={`text-lg mb-0.5 transition-transform ${getSelectedKey() === 'memory' ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]' : ''}`} />
                            <span className="text-[9px] uppercase font-bold tracking-widest">Memory</span>
                            {getSelectedKey() === 'memory' && <div className="absolute bottom-0 w-[80%] h-[3px] bg-primary rounded-t-md shadow-[0_0_10px_rgba(0,210,255,1)] left-1/2 -translate-x-1/2"></div>}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default MainLayout;
