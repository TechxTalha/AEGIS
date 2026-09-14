import { Typography, Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, ApiOutlined, DatabaseOutlined, SecurityScanOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const DashboardPage = () => {
    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <Title level={2} className="!mt-0 !mb-2 text-gray-800">Dashboard</Title>
                <Text className="text-gray-500">Welcome to the AEGIS Foundation. Your boilerplate is ready.</Text>
            </div>

            <Row gutter={[24, 24]} className="mb-8">
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="System Status"
                            value="Online"
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<SecurityScanOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="API Version"
                            value="v1.0"
                            prefix={<ApiOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Database"
                            value="Connected"
                            valueStyle={{ color: '#1677ff' }}
                            prefix={<DatabaseOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Active Sessions"
                            value={1}
                            prefix={<UserOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card bordered={false} className="shadow-sm">
                <Title level={4} className="!mt-0 !mb-4">Getting Started</Title>
                <Paragraph className="text-gray-600 text-base">
                    This is the foundational boilerplate for AEGIS. It includes a complete setup for:
                </Paragraph>
                <ul className="list-disc pl-5 text-gray-600 space-y-2 mb-6">
                    <li><strong>Spring Boot 3.5.16</strong> backend with modular monolith architecture</li>
                    <li><strong>React 19 + Vite</strong> frontend with TailwindCSS and Ant Design</li>
                    <li><strong>Secure Authentication</strong> using HTTP-only cookies and stateless JWTs</li>
                    <li><strong>Flyway Migrations</strong> for strict database versioning</li>
                    <li><strong>WebSocket Foundation</strong> for future real-time capabilities</li>
                </ul>
                <Paragraph className="text-gray-600 text-base italic">
                    Build your domain-specific features on top of this clean baseline!
                </Paragraph>
            </Card>
        </div>
    );
};

export default DashboardPage;
