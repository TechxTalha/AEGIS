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
        <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <LockOutlined className="text-2xl text-primary" />
            </div>
            
            <Title level={3} className="!mt-0 !mb-2 text-gray-800">Welcome Back</Title>
            <Text className="text-gray-500 mb-8 block text-center">Please enter your details to sign in to your AEGIS account.</Text>

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
                    <Button type="primary" htmlType="submit" className="w-full h-12 font-medium text-base shadow-md shadow-primary/20" loading={loading}>
                        Sign In
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default LoginPage;
