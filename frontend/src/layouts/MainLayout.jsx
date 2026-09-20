import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Layout, Menu, Button, theme } from 'antd';
import { LogoutOutlined, DashboardOutlined, UserOutlined, UnorderedListOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
    const { isAuthenticated, isLoading, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = async () => {
        await logout();
    };

    return (
        <Layout className="min-h-screen">
            <Sider trigger={null} collapsible collapsed={false} className="shadow-lg" theme="light">
                <div className="h-16 flex items-center justify-center font-bold text-2xl tracking-widest text-primary border-b border-gray-100">
                    AEGIS
                </div>
                <Menu
                    theme="light"
                    mode="inline"
                    selectedKeys={[location.pathname.startsWith('/tasks') ? 'tasks' : 'dashboard']}
                    onClick={({ key }) => {
                        if (key === 'dashboard') navigate('/');
                        if (key === 'tasks') navigate('/tasks');
                    }}
                    items={[
                        {
                            key: 'dashboard',
                            icon: <DashboardOutlined />,
                            label: 'Dashboard',
                        },
                        {
                            key: 'tasks',
                            icon: <UnorderedListOutlined />,
                            label: 'Tasks',
                        },
                        {
                            key: 'profile',
                            icon: <UserOutlined />,
                            label: 'Profile',
                        },
                    ]}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }} className="flex justify-between items-center px-6 shadow-sm">
                    <div className="font-semibold text-lg text-gray-700">Project Workspace</div>
                    <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} className="flex items-center text-gray-600 hover:text-red-500 transition-colors">
                        Logout
                    </Button>
                </Header>
                <Content className="m-6 p-6" style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
