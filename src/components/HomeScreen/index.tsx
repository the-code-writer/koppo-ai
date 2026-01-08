import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Avatar, List, Typography, Space, Divider, Tag, Button, Tooltip } from 'antd';
import { 
  TrophyOutlined, 
  RobotOutlined, 
  FallOutlined, 
  FireOutlined, 
  ThunderboltOutlined,
  WalletOutlined,
  PercentageOutlined,
  CrownOutlined,
  StarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  BarChartOutlined,
  DollarOutlined,
  RocketOutlined,
  AreaChartOutlined
} from '@ant-design/icons';
import './styles.scss';

const { Title, Text } = Typography;
const { Meta } = Card;
// Mock data - replace with actual API calls
const mockData = {
  totalProfit: 125430.50,
  activeBots: 12,
  totalLosses: 32420.75,
  topBots: [
    { id: 1, name: 'Alpha Trader', profit: 45230.20, winRate: 78.5, status: 'active' },
    { id: 2, name: 'Beta Scalper', profit: 38920.15, winRate: 72.3, status: 'active' },
    { id: 3, name: 'Gamma Momentum', profit: 28540.80, winRate: 68.9, status: 'paused' }
  ],
  strategies: [
    { name: 'Scalping', count: 5, performance: '+12.5%' },
    { name: 'Swing Trading', count: 4, performance: '+8.3%' },
    { name: 'Day Trading', count: 3, performance: '+15.7%' }
  ],
  winningStreak: 7,
  losingStreak: 2,
  derivAccounts: 3,
  totalWinRate: 73.4,
  weeklyPerformance: [
    { day: 'Mon', profit: 2340.50 },
    { day: 'Tue', profit: 1890.25 },
    { day: 'Wed', profit: -520.15 },
    { day: 'Thu', profit: 3450.80 },
    { day: 'Fri', profit: 2890.40 },
    { day: 'Sat', profit: 1560.20 }
  ],
  monthlyGrowth: 18.7,
  totalTrades: 1247,
  successRate: 73.4,
  avgProfitPerTrade: 125.30,
  accountBalance: 458920.35,
  commissionsEarned: 15420.80
};

export function HomeScreen() {
  const [data, setData] = useState(mockData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch real data here
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getProfitColor = (value: number) => {
    return value >= 0 ? '#52c41a' : '#ff4d4f';
  };

  const getPerformanceColor = (performance: string) => {
    return performance.startsWith('+') ? '#52c41a' : '#ff4d4f';
  };

  return (
    <div className="home-screen">
      {/* Hero Banner Section */}
      <div className="metrics-section">
        <Card
          hoverable
          className="banner-card"
          cover={
            <img
              draggable={false}
              alt="Trading Analytics Dashboard"
              src="/src/assets/banner.jpg"
            />
          }
          style={{marginTop: 32}}
        >
          <Meta 
            title="Trading Analytics Dashboard" 
            description="Real-time insights and performance metrics for your trading bots" 
          />
        </Card>
      </div>

      {/* Key Metrics Section */}
      <div className="metrics-section">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={12}>
            <Card className="metric-card profit-card">
              <Statistic
                title="Total Profit"
                value={data.totalProfit}
                formatter={() => formatCurrency(data.totalProfit)}
                prefix={<DollarOutlined />}
                valueStyle={{ color: getProfitColor(data.totalProfit) }}
              />
              <div className="metric-trend">
                <ArrowUpOutlined /> +12.5% this month
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={12}>
            <Card className="metric-card">
              <Statistic
                title="Active Bots"
                value={data.activeBots}
                prefix={<RobotOutlined />}
                suffix="/ 15"
              />
              <Progress 
                percent={(data.activeBots / 15) * 100} 
                showInfo={false}
                strokeColor="#1890ff"
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={12}>
            <Card className="metric-card">
              <Statistic
                title="Commissions Earned"
                value={data.commissionsEarned}
                formatter={() => formatCurrency(data.commissionsEarned)}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div className="metric-trend">
                <ArrowUpOutlined /> +8.3% this month
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={12}>
            <Card className="metric-card">
              <Statistic
                title="Account Balance"
                value={data.accountBalance}
                formatter={() => formatCurrency(data.accountBalance)}
                prefix={<WalletOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div className="metric-trend">
                <ArrowUpOutlined /> +18.7% this month
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Detailed Analytics Section */}
      <div className="analytics-section">
        <Row gutter={[24, 24]}>
          {/* Top Bots Ranking */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <TrophyOutlined />
                  <span>Top 3 Bots Performance</span>
                </Space>
              }
              className="analytics-card"
            >
              <List
                dataSource={data.topBots}
                renderItem={(bot, index) => (
                  <List.Item className="bot-item">
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          className={`bot-avatar rank-${index + 1}`}
                          icon={index === 0 ? <CrownOutlined /> : index === 1 ? <StarOutlined /> : <TrophyOutlined />}
                        />
                      }
                      title={
                        <Space>
                          <span>{bot.name}</span>
                          <Tag color={bot.status === 'active' ? 'green' : 'orange'}>
                            {bot.status}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space split={<Divider type="vertical" />}>
                          <span style={{ color: getProfitColor(bot.profit) }}>
                            {formatCurrency(bot.profit)}
                          </span>
                          <span>{bot.winRate}% win rate</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* Strategy Performance */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <BarChartOutlined />
                  <span>Strategy Performance</span>
                </Space>
              }
              className="analytics-card"
            >
              <List
                dataSource={data.strategies}
                renderItem={(strategy) => (
                  <List.Item className="strategy-item">
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{strategy.name}</span>
                          <Tag color="blue">{strategy.count} bots</Tag>
                        </Space>
                      }
                      description={
                        <div className="strategy-performance">
                          <Progress
                            percent={parseFloat(strategy.performance.replace('+', '').replace('%', ''))}
                            showInfo={false}
                            strokeColor={getPerformanceColor(strategy.performance)}
                          />
                          <Text style={{ color: getPerformanceColor(strategy.performance) }}>
                            {strategy.performance}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Streaks and Accounts Section */}
      <div className="streaks-section">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={12}>
            <Card className="streak-card winning">
              <div className="streak-content">
                <FireOutlined className="streak-icon" />
                <Statistic
                  title="Winning Streak"
                  value={data.winningStreak}
                  suffix="days"
                />
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={12}>
            <Card className="streak-card losing">
              <div className="streak-content">
                <ThunderboltOutlined className="streak-icon" />
                <Statistic
                  title="Losing Streak"
                  value={data.losingStreak}
                  suffix="days"
                />
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={12}>
            <Card className="streak-card">
              <div className="streak-content">
                <WalletOutlined className="streak-icon" />
                <Statistic
                  title="Deriv Accounts"
                  value={data.derivAccounts}
                  suffix="active"
                />
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={12}>
            <Card className="streak-card">
              <div className="streak-content">
                <AreaChartOutlined className="streak-icon" />
                <Statistic
                  title="Monthly Growth"
                  value={data.monthlyGrowth}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Additional Analytics */}
      <div className="additional-analytics">
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Card title="Trading Overview" className="overview-card">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div className="overview-item">
                  <span>Total Trades</span>
                  <Text strong>{data.totalTrades.toLocaleString()}</Text>
                </div>
                <div className="overview-item">
                  <span>Success Rate</span>
                  <Text strong style={{ color: '#52c41a' }}>{data.successRate}%</Text>
                </div>
                <div className="overview-item">
                  <span>Avg Profit/Trade</span>
                  <Text strong>{formatCurrency(data.avgProfitPerTrade)}</Text>
                </div>
                <div className="overview-item">
                  <span>Account Balance</span>
                  <Text strong style={{ color: '#1890ff' }}>
                    {formatCurrency(data.accountBalance)}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
          
          <Col xs={24}>
            <Card title="Weekly Performance" className="weekly-card">
              <Row gutter={16}>
                {data.weeklyPerformance.map((day, index) => (
                  <Col xs={12} sm={8} md={8} lg={8} xl={8} key={day.day}>
                    <div className="day-performance">
                      <Text type="secondary">{day.day}</Text>
                      <div className="day-profit">
                        <Text strong style={{ color: getProfitColor(day.profit) }}>
                          {day.profit > 0 ? '+' : ''}{formatCurrency(day.profit).replace('$', '')}
                        </Text>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Card title="Quick Actions" className="actions-card">
          <Space wrap>
            <Button type="primary" icon={<RobotOutlined />}>
              Manage Bots
            </Button>
            <Button icon={<BarChartOutlined />}>
              View Reports
            </Button>
            <Button icon={<EyeOutlined />}>
              Live Trading
            </Button>
            <Button icon={<RocketOutlined />}>
              Set Goals
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
}