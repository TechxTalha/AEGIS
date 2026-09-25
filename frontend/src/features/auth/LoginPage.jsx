import { useState } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from './AuthContext';

const { Title, Text } = Typography;

const LoginPage = () => {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const onFinish = async (values) => {
        setLoading(true);
        setError('');
        try {
            await login(values);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center animate-fade-in">
            {/* Animated Logo */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#00d2ff] rounded-full blur-[30px] opacity-20"></div>
                <img 
                    src="/apple-touch-icon.png" 
                    alt="AEGIS Logo" 
                    className="w-32 h-auto object-contain relative z-10 drop-shadow-[0_0_20px_rgba(0,210,255,0.6)]"
                    style={{ mixBlendMode: 'screen' }}
                />
            </div>
            
            <Title level={3} className="!mt-0 !mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold tracking-widest text-center uppercase">
                Command Center
            </Title>
            <Text className="text-gray-400 mb-8 block text-center uppercase tracking-widest text-xs">
                Authorize your identity
            </Text>

            {error && <Alert message={error} type="error" showIcon className="w-full mb-6" />}

            <Form
                name="login_form"
                className="w-full"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                layout="vertical"
                size="large"
            >
                <Form.Item
                    name="username"
                    rules={[{ required: true, message: 'Please input your Username!' }]}
                >
                    <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Username" />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please input your Password!' }]}
                >
                    <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Password" />
                </Form.Item>

                <Form.Item className="mt-8 mb-0">
                    <Button type="primary" htmlType="submit" className="w-full h-12 font-bold text-sm tracking-widest uppercase shadow-neon border-none bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-[#0B0F19]" loading={loading}>
                        Initialize Connection
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default LoginPage;
