import { Typography, Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, ApiOutlined, DatabaseOutlined, SecurityScanOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const DashboardPage = () => {
    return (
        <div className="animate-fade-in pb-4 px-2">
            <div className="mb-6 pt-2">
                <Title level={2} className="!mt-0 !mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-bold tracking-tight">Command Center</Title>
                <Text className="text-gray-400">System status and high-level overview.</Text>
            </div>

            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={12} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Active Tasks"
                            value={2}
                            valueStyle={{ color: '#1677ff' }}
                            prefix={<ApiOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Online Agents"
                            value={3}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<UserOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Pending Approvals"
                            value={1}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<SecurityScanOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Failed Tasks"
                            value={0}
                            valueStyle={{ color: '#ff4d4f' }}
                            prefix={<DatabaseOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card bordered={false} className="shadow-glass mb-4">
                <Title level={4} className="!mt-0 !mb-4 text-white font-semibold">Recent Activity</Title>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <div>
                        <div className="font-medium text-gray-200">Deploy application to prod</div>
                        <div className="text-xs text-gray-400">Just now</div>
                    </div>
                    <span className="px-2 py-1 bg-blue-500/20 text-primary rounded text-xs font-medium border border-primary/30 shadow-neon">IN PROGRESS</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <div>
                        <div className="font-medium text-gray-200">sys.execute requires approval</div>
                        <div className="text-xs text-gray-400">5 mins ago</div>
                    </div>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium border border-yellow-500/30">WAITING</span>
                </div>
                <div className="flex justify-between items-center py-3">
                    <div>
                        <div className="font-medium text-gray-200">Research "Agent Patterns"</div>
                        <div className="text-xs text-gray-400">1 hour ago</div>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium border border-green-500/30">COMPLETED</span>
                </div>
            </Card>
        </div>
    );
};

export default DashboardPage;
