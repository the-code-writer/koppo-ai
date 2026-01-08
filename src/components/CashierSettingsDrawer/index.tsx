import { useState, useEffect } from 'react';
import { Card, Tabs, Typography, Button, Input, Switch, Select, Space, Table, Tag, Alert, Statistic, Row, Col, Divider, Tooltip, message, Drawer } from 'antd';
import { CopyOutlined, WalletOutlined, ArrowDownOutlined, ArrowUpOutlined, SettingOutlined, HistoryOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './styles.scss';
import { User } from '../../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Mock data - replace with actual API calls
const mockWithdrawalHistory = [
  { id: 1, amount: 1500, method: 'Bank Transfer', status: 'completed', date: '2024-01-15', processingTime: '2 hours' },
  { id: 2, amount: 750, method: 'Crypto Wallet', status: 'completed', date: '2024-01-12', processingTime: '30 minutes' },
  { id: 3, amount: 2000, method: 'Bank Transfer', status: 'pending', date: '2024-01-18', processingTime: 'Processing...' },
  { id: 4, amount: 500, method: 'Crypto Wallet', status: 'failed', date: '2024-01-10', processingTime: 'Failed' },
];

const mockDepositHistory = [
  { id: 1, amount: 5000, method: 'USDT (TRC20)', status: 'completed', date: '2024-01-17', txHash: '0x1234...5678' },
  { id: 2, amount: 3000, method: 'USDT (TRC20)', status: 'completed', date: '2024-01-14', txHash: '0x8765...4321' },
  { id: 3, amount: 1000, method: 'USDT (TRC20)', status: 'pending', date: '2024-01-18', txHash: 'Pending...' },
];
interface ProfileSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}
export function CashierSettingsDrawer({ visible, onClose, user }: ProfileSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState('deposits');
  const [withdrawalSettings, setWithdrawalSettings] = useState({
    autoWithdrawal: false,
    withdrawalThreshold: 1000,
    withdrawalMethod: 'bank',
    withdrawalSchedule: 'weekly',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      routingNumber: ''
    },
    cryptoWallet: {
      address: '',
      network: 'TRC20'
    }
  });
  const [depositAddress, setDepositAddress] = useState('TRX2Q9Y4F9X8Z7P6K5J3H2G1F0D9S8A7');
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    message.success('Address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = () => {
    message.success('Withdrawal settings saved successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'processing';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      case 'failed': return <ExclamationCircleOutlined />;
      default: return null;
    }
  };

  const withdrawalColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => <Text>{date}</Text>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <Text strong>${amount.toLocaleString()}</Text>
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => <Tag color="blue">{method}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Processing Time',
      dataIndex: 'processingTime',
      key: 'processingTime',
      render: (time: string) => <Text type="secondary">{time}</Text>
    }
  ];

  const depositColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => <Text>{date}</Text>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <Text strong>${amount.toLocaleString()}</Text>
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => <Tag color="green">{method}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Transaction',
      dataIndex: 'txHash',
      key: 'txHash',
      render: (hash: string) => (
        <Tooltip title={hash}>
          <Text code copyable={{ text: hash }}>
            {hash.length > 10 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash}
          </Text>
        </Tooltip>
      )
    }
  ];

  return (
    <Drawer
      title="Linked Accounts"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="profile-settings-drawer"
    >
    <div className="deposits-withdrawals">
      <div className="page-header">
        <Title level={2} className="page-title">
          <WalletOutlined /> Deposits & Withdrawals
        </Title>
        <Text className="page-subtitle">
          Manage your funds with secure deposits and automated withdrawals
        </Text>
      </div>

      {/* Statistics Cards */}
      <div className="stats-section">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Total Deposits"
                value={9000}
                formatter={() => '$9,000'}
                prefix={<ArrowDownOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Total Withdrawals"
                value={4750}
                formatter={() => '$4,750'}
                prefix={<ArrowUpOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Pending Transactions"
                value={2}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Available Balance"
                value={4250}
                formatter={() => '$4,250'}
                prefix={<WalletOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <Card className="main-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab} className="deposit-tabs">
          <TabPane 
            tab={
              <span>
                <ArrowDownOutlined />
                Deposits
              </span>
            } 
            key="deposits"
          >
            <div className="tab-content">
              {/* Deposit Address Section */}
              <div className="deposit-address-section">
                <Title level={4}>USDT Deposit Address</Title>
                <Alert
                  message="Send USDT to the address below"
                  description="Only send USDT (TRC20) to this address. Other networks or tokens may result in permanent loss."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
                
                <Card className="address-card">
                  <div className="address-container">
                    <div className="address-info">
                      <Text strong>Network: TRC20 (TRON)</Text>
                      <div className="address-display">
                        <Input
                          value={depositAddress}
                          readOnly
                          size="large"
                          className="address-input"
                        />
                        <Button
                          type="primary"
                          icon={<CopyOutlined />}
                          onClick={handleCopyAddress}
                          className="copy-button"
                        >
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      <Text type="secondary" className="address-note">
                        Minimum deposit: 10 USDT | Confirmation time: 1-5 minutes
                      </Text>
                    </div>
                  </div>
                </Card>
              </div>

              <Divider />

              {/* Deposit History */}
              <div className="history-section">
                <Title level={4}>
                  <HistoryOutlined /> Deposit History
                </Title>
                <Table
                  columns={depositColumns}
                  dataSource={mockDepositHistory}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  className="history-table"
                />
              </div>
            </div>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <ArrowUpOutlined />
                Withdrawals
              </span>
            } 
            key="withdrawals"
          >
            <div className="tab-content">
              {/* Withdrawal Settings */}
              <div className="withdrawal-settings-section">
                <Title level={4}>
                  <SettingOutlined /> Withdrawal Settings
                </Title>
                
                <Card className="settings-card">
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Auto Withdrawal Toggle */}
                    <div className="setting-item">
                      <div className="setting-header">
                        <Text strong>Automated Withdrawals</Text>
                        <Switch
                          checked={withdrawalSettings.autoWithdrawal}
                          onChange={(checked) => setWithdrawalSettings({
                            ...withdrawalSettings,
                            autoWithdrawal: checked
                          })}
                        />
                      </div>
                      <Text type="secondary">
                        Enable automatic withdrawals when your balance reaches the threshold
                      </Text>
                    </div>

                    {/* Withdrawal Threshold */}
                    <div className="setting-item">
                      <Text strong>Withdrawal Threshold</Text>
                      <Input
                        type="number"
                        value={withdrawalSettings.withdrawalThreshold}
                        onChange={(e) => setWithdrawalSettings({
                          ...withdrawalSettings,
                          withdrawalThreshold: Number(e.target.value)
                        })}
                        prefix="$"
                        placeholder="1000"
                        disabled={!withdrawalSettings.autoWithdrawal}
                      />
                      <Text type="secondary">
                        Minimum balance required to trigger automatic withdrawal
                      </Text>
                    </div>

                    {/* Withdrawal Method */}
                    <div className="setting-item">
                      <Text strong>Preferred Withdrawal Method</Text>
                      <Select
                        value={withdrawalSettings.withdrawalMethod}
                        onChange={(value) => setWithdrawalSettings({
                          ...withdrawalSettings,
                          withdrawalMethod: value
                        })}
                        style={{ width: '100%' }}
                        disabled={!withdrawalSettings.autoWithdrawal}
                      >
                        <Option value="bank">Bank Transfer</Option>
                        <Option value="crypto">Crypto Wallet</Option>
                      </Select>
                    </div>

                    {/* Withdrawal Schedule */}
                    <div className="setting-item">
                      <Text strong>Withdrawal Schedule</Text>
                      <Select
                        value={withdrawalSettings.withdrawalSchedule}
                        onChange={(value) => setWithdrawalSettings({
                          ...withdrawalSettings,
                          withdrawalSchedule: value
                        })}
                        style={{ width: '100%' }}
                        disabled={!withdrawalSettings.autoWithdrawal}
                      >
                        <Option value="daily">Daily</Option>
                        <Option value="weekly">Weekly</Option>
                        <Option value="monthly">Monthly</Option>
                      </Select>
                    </div>

                    {/* Bank Details */}
                    {withdrawalSettings.withdrawalMethod === 'bank' && (
                      <div className="bank-details">
                        <Title level={5}>Bank Details</Title>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Input
                            placeholder="Account Name"
                            value={withdrawalSettings.bankDetails.accountName}
                            onChange={(e) => setWithdrawalSettings({
                              ...withdrawalSettings,
                              bankDetails: {
                                ...withdrawalSettings.bankDetails,
                                accountName: e.target.value
                              }
                            })}
                          />
                          <Input
                            placeholder="Account Number"
                            value={withdrawalSettings.bankDetails.accountNumber}
                            onChange={(e) => setWithdrawalSettings({
                              ...withdrawalSettings,
                              bankDetails: {
                                ...withdrawalSettings.bankDetails,
                                accountNumber: e.target.value
                              }
                            })}
                          />
                          <Input
                            placeholder="Bank Name"
                            value={withdrawalSettings.bankDetails.bankName}
                            onChange={(e) => setWithdrawalSettings({
                              ...withdrawalSettings,
                              bankDetails: {
                                ...withdrawalSettings.bankDetails,
                                bankName: e.target.value
                              }
                            })}
                          />
                          <Input
                            placeholder="Routing Number"
                            value={withdrawalSettings.bankDetails.routingNumber}
                            onChange={(e) => setWithdrawalSettings({
                              ...withdrawalSettings,
                              bankDetails: {
                                ...withdrawalSettings.bankDetails,
                                routingNumber: e.target.value
                              }
                            })}
                          />
                        </Space>
                      </div>
                    )}

                    {/* Crypto Wallet */}
                    {withdrawalSettings.withdrawalMethod === 'crypto' && (
                      <div className="crypto-details">
                        <Title level={5}>Crypto Wallet Details</Title>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Input
                            placeholder="Wallet Address"
                            value={withdrawalSettings.cryptoWallet.address}
                            onChange={(e) => setWithdrawalSettings({
                              ...withdrawalSettings,
                              cryptoWallet: {
                                ...withdrawalSettings.cryptoWallet,
                                address: e.target.value
                              }
                            })}
                          />
                          <Select
                            value={withdrawalSettings.cryptoWallet.network}
                            onChange={(value) => setWithdrawalSettings({
                              ...withdrawalSettings,
                              cryptoWallet: {
                                ...withdrawalSettings.cryptoWallet,
                                network: value
                              }
                            })}
                            style={{ width: '100%' }}
                          >
                            <Option value="TRC20">TRC20 (TRON)</Option>
                            <Option value="ERC20">ERC20 (Ethereum)</Option>
                            <Option value="BEP20">BEP20 (BSC)</Option>
                          </Select>
                        </Space>
                      </div>
                    )}

                    <Button
                      type="primary"
                      size="large"
                      onClick={handleSaveSettings}
                      style={{ width: '100%' }}
                    >
                      Save Settings
                    </Button>
                  </Space>
                </Card>
              </div>

              <Divider />

              {/* Withdrawal History */}
              <div className="history-section">
                <Title level={4}>
                  <HistoryOutlined /> Withdrawal History
                </Title>
                <Table
                  columns={withdrawalColumns}
                  dataSource={mockWithdrawalHistory}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  className="history-table"
                />
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div></Drawer>
  );
}
