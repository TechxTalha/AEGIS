import { useState } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from './AuthContext';
import { authApi } from '../../api/auth';

const { Title, Text } = Typography;

const LoginPage = () => {
    const { login } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [form] = Form.useForm();

    const onFinish = async (values) => {
        setLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            if (isRegister) {
                await authApi.register({
                    username: values.username.trim(),
                    email: values.email.trim(),
                    password: values.password
                });
                // Auto login after successful registration
                await login({
                    username: values.username.trim(),
                    password: values.password
                });
            } else {
                await login({
                    username: values.username.trim(),
                    password: values.password
                });
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || (isRegister ? 'Registration failed.' : 'Login failed. Please check your credentials.');
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center animate-fade-in">
            {/* Animated Logo */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#00d2ff] rounded-full blur-[30px] opacity-20"></div>
                <div className="w-36 h-36 rounded-full overflow-hidden relative z-10 drop-shadow-[0_0_25px_rgba(0,210,255,0.8)] border border-[#00d2ff]/30 mx-auto">
                    <img 
                        src="/apple-touch-icon.png" 
                        alt="AEGIS Logo" 
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
            
            <Title level={3} className="!mt-0 !mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold tracking-widest text-center uppercase">
                Command Center
            </Title>
            <Text className="text-gray-400 mb-8 block text-center uppercase tracking-widest text-xs">
                {isRegister ? 'Register New Operator' : 'Authorize your identity'}
            </Text>

            {error && <Alert message={error} type="error" showIcon className="w-full mb-6" />}
            {successMsg && <Alert message={successMsg} type="success" showIcon className="w-full mb-6" />}

            <Form
                form={form}
                name="login_form"
                className="w-full"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                layout="vertical"
                size="large"
            >
                <Form.Item
                    name="username"
                    rules={[
                        { required: true, message: 'Please input your Username!' },
                        { min: 3, message: 'Username must be at least 3 characters!' }
                    ]}
                >
                    <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Username" />
                </Form.Item>

                {isRegister && (
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your Email!' },
                            { type: 'email', message: 'Please enter a valid email address!' }
                        ]}
                    >
                        <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="Email address" />
                    </Form.Item>
                )}

                <Form.Item
                    name="password"
                    rules={[
                        { required: true, message: 'Please input your Password!' },
                        { min: 6, message: 'Password must be at least 6 characters!' }
                    ]}
                >
                    <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Password" />
                </Form.Item>

                <Form.Item className="mt-8 mb-0">
                    <Button type="primary" htmlType="submit" className="w-full h-12 font-bold text-sm tracking-widest uppercase shadow-neon border-none bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-[#0B0F19]" loading={loading}>
                        {isRegister ? 'Create Operator Account' : 'Initialize Connection'}
                    </Button>
                </Form.Item>

                <div className="mt-4 text-center">
                    <Button
                        type="link"
                        className="text-[#00d2ff] hover:text-[#00d2ff]/80 text-xs tracking-wider uppercase font-semibold"
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError('');
                            setSuccessMsg('');
                            form.resetFields();
                        }}
                    >
                        {isRegister
                            ? 'Already have credentials? Sign In'
                            : 'New operator? Create Account'}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default LoginPage;
