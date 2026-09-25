import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider } from './features/auth/AuthContext';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import TasksDashboard from './features/tasks/TasksDashboard';
import TaskDetail from './features/tasks/TaskDetail';
import ApprovalsPage from './features/approvals/ApprovalsPage';
import AgentsPage from './features/agents/AgentsPage';
import './assets/index.css';

function App() {
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#00d2ff',
                    colorBgBase: '#0B0F19',
                    colorBgContainer: '#151A2D',
                    colorBgElevated: '#1F2937',
                    colorBorder: '#1F2937',
                    fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    borderRadius: 12,
                },
            }}
        >
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route element={<AuthLayout />}>
                            <Route path="/login" element={<LoginPage />} />
                        </Route>

                        <Route element={<MainLayout />}>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/tasks" element={<TasksDashboard />} />
                            <Route path="/tasks/:id" element={<TaskDetail />} />
                            <Route path="/approvals" element={<ApprovalsPage />} />
                            <Route path="/agents" element={<AgentsPage />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ConfigProvider>
    );
}

export default App;
