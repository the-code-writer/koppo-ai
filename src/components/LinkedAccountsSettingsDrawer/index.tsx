import { useState } from "react";
import { Drawer, Button, Avatar, Space, Typography, Switch, Card, Badge, Tooltip, Divider, Modal, Alert } from "antd";
import { User, authAPI } from '../../services/api';
import { GoogleAuth } from '../../utils/GoogleAuth';
import { TelegramAuth } from '../../utils/TelegramAuth';
import { DerivAuth } from '../../utils/DerivAuth';
import derivLogo from '../../assets/deriv-logo.svg';
import { MessageOutlined, GoogleOutlined, WalletOutlined, LinkOutlined, CheckCircleFilled } from "@ant-design/icons";
import "./styles.scss";

const { Title, Text } = Typography;

interface ProfileSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export function LinkedAccountsSettingsDrawer({ visible, onClose, user }: ProfileSettingsDrawerProps) {
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  
  // Connected Accounts State
  const [connectedAccounts, setConnectedAccounts] = useState([
    {
      id: 'deriv_demo_001',
      type: 'deriv',
      name: 'Demo Account',
      accountId: 'DRV1234567',
      accountType: 'Demo',
      currency: 'USD',
      balance: 10000.00,
      status: 'active',
      connectedAt: '2024-01-15T10:30:00Z',
      platform: 'Deriv'
    },
    {
      id: 'deriv_real_001',
      type: 'deriv',
      name: 'Real Account',
      accountId: 'DRV7654321',
      accountType: 'Real Money',
      currency: 'EUR',
      balance: 2500.50,
      status: 'active',
      connectedAt: '2024-01-10T14:22:00Z',
      platform: 'Deriv'
    }
  ]);
  
  // Google Auth State
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [googleAuthModalVisible, setGoogleAuthModalVisible] = useState(false);
  
  // Telegram Auth State
  const [telegramAuthLoading, setTelegramAuthLoading] = useState(false);
  const [telegramAuthModalVisible, setTelegramAuthModalVisible] = useState(false);
  
  // Deriv Auth State
  const [derivAuthLoading, setDerivAuthLoading] = useState(false);
  const [derivAuthModalVisible, setDerivAuthModalVisible] = useState(false);
  
  // Connected Accounts Drawer State
  const [accountsDrawerVisible, setAccountsDrawerVisible] = useState(false);
  
  const handleLinkTelegram = (checked: boolean) => {
    setTelegramLinked(checked);
    // TODO: Implement Telegram OAuth flow
    console.log('Linking Telegram account:', checked);
  };

  const handleLinkGoogle = (checked: boolean) => {
    setGoogleLinked(checked);
    // TODO: Implement Google OAuth flow
    console.log('Linking Google account:', checked);
  };

  // Google Auth Functions
  const handleGoogleSignIn = async () => {
    setGoogleAuthLoading(true);
    try {
      const result = await GoogleAuth.signInWithPopup();
      
      if (result.success && result.user) {
        console.log('Google sign-in successful:', result.user);
        // Get comprehensive user data
                const userData = GoogleAuth.decodeUserData(result.user);
                console.log('User Data:', userData);
                
                // Get formatted data for display
                const formattedData = GoogleAuth.getFormattedUserData(result.user);
                console.log('Formatted Data:', formattedData);
        setGoogleLinked(true);
        setGoogleAuthModalVisible(false);
        
        // Update user data if needed
        alert(`Successfully connected Google account: ${result.user.email}`);
      } else {
        console.error('Google sign-in failed:', result.error);
        alert(result.error || 'Failed to sign in with Google');
      }
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  const openGoogleAuthModal = () => {
    setGoogleAuthModalVisible(true);
  };

  // Telegram Auth Functions
  const handleTelegramSignIn = async () => {
    setTelegramAuthLoading(true);
    try {
      // Initialize Telegram Auth (you'll need to provide actual bot credentials)
      TelegramAuth.initialize('YOUR_BOT_TOKEN', 'YOUR_BOT_USERNAME');
      
      // Create user data for payload
      const userData = {
        uid: user?.uid || 'demo_uid',
        mid: user?.id?.toString() || 'demo_mid',
        fid: user?.firebaseId || 'demo_fid',
        uuid: user?.uuid || TelegramAuth.generateUUID()
      };
      
      console.log('Initiating Telegram sign-in with URL...');
      
      // Generate auth URL and open in new tab
      const result = TelegramAuth.authenticateWithUrl(userData);
      
      if (result.success) {
        setTelegramLinked(true);
        setTelegramAuthModalVisible(false);
        
        console.log('Telegram auth URL opened:', result.url);
        alert(`Telegram authentication initiated! Check the new tab to complete the connection.`);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error: any) {
      console.error('Telegram sign-in error:', error);
      alert(error.message || 'Failed to initiate Telegram authentication. Please try again.');
    } finally {
      setTelegramAuthLoading(false);
    }
  };

  const openTelegramAuthModal = () => {
    setTelegramAuthModalVisible(true);
  };

  // Deriv Auth Functions
  const handleDerivSignIn = async () => {
    setDerivAuthLoading(true);
    try {
      // Initialize Deriv Auth with app ID 111480
      DerivAuth.initialize('111480', window.location.origin + '/deriv/callback');
      
      // Create user data for payload
      const userData = {
        uid: user?.uid || 'demo_uid',
        mid: user?.id?.toString() || 'demo_mid',
        fid: user?.firebaseId || 'demo_fid',
        uuid: user?.uuid || DerivAuth.generateUUID()
      };
      
      console.log('Initiating Deriv sign-in with URL...');
      
      // Generate auth URL and open in new tab
      const result = DerivAuth.authenticateWithUrl(userData);
      
      if (result.success) {
        // Update connected accounts state
        const newAccount = {
          id: 'DRV1234567',
          type: 'Real Money',
          balance: 1000.50,
          status: 'active',
          connectedDate: new Date().toISOString()
        };
        setConnectedAccounts([...connectedAccounts, newAccount]);
        setDerivAuthModalVisible(false);
        
        console.log('Deriv auth URL opened:', result.url);
        alert(`Deriv authentication initiated! Check the new tab to complete the connection.`);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error: any) {
      console.error('Deriv sign-in error:', error);
      alert(error.message || 'Failed to initiate Deriv authentication. Please try again.');
    } finally {
      setDerivAuthLoading(false);
    }
  };

  const openDerivAuthModal = () => {
    setDerivAuthModalVisible(true);
  };

  const handleLinkDeriv = (checked: boolean) => {
    // TODO: Implement Deriv OAuth flow
    console.log('Linking Deriv account:', checked);
    if (checked) {
      // In a real implementation, this would open Deriv OAuth
      // For now, we'll just show a placeholder
      alert('Deriv OAuth integration coming soon!');
    }
  };

  const handleDisconnectAccount = (accountId: string) => {
    setConnectedAccounts(prev => prev.filter(account => account.id !== accountId));
    console.log('Disconnected account:', accountId);
  };

  const getActiveAccountsCount = () => {
    return connectedAccounts.filter(account => account.status === 'active').length;
  };

  const formatBalance = (balance: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(balance);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Drawer
      title="Linked Accounts"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="profile-settings-drawer"
    >
      <div className="tokens-content">
                <div className="tokens-grid">
                  {/* Telegram Account Card */}
                  <Card
                    className="tokens-card"
                    hoverable
                  >
                    <div className="account-card-header">
                      <div className="account-icon-container">
                        <div className="account-icon telegram-icon">
                          <MessageOutlined />
                        </div>
                        <div className="account-badge">
                          <Badge status={telegramLinked ? 'success' : 'default'} />
                        </div>
                      </div>
                      <div className="account-status">
                        <Tooltip title={telegramLinked ? 'Disconnect Telegram' : 'Connect Telegram'}>
                          <Switch
                            checked={telegramLinked}
                            onChange={handleLinkTelegram}
                            size="small"
                          />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="account-card-body">
                      <Title level={5} className="account-title">Telegram</Title>
                      <Text className="account-description">
                        Connect your Telegram account to receive notifications and manage your trading bots through chat
                      </Text>
                      
                      {/* Telegram Login Button - Only show when not linked */}
                      {!telegramLinked && (
                        <Button
                          type="primary"
                          size="large"
                          icon={<MessageOutlined />}
                          onClick={openTelegramAuthModal}
                          loading={telegramAuthLoading}
                          style={{
                            width: '100%',
                            height: 40,
                            backgroundColor: '#0088cc',
                            borderColor: '#0088cc',
                            marginTop: 12,
                            fontSize: 14,
                            fontWeight: 500
                          }}
                        >
                          Connect with Telegram
                        </Button>
                      )}
                      
                      {telegramLinked && (
                        <div className="account-details">
                          <Divider className="details-divider" />
                          <div className="token-info">
                            <Text strong>Username:</Text>
                            <Text>@your_telegram_user</Text>
                          </div>
                          <div className="token-info">
                            <Text strong>Connected:</Text>
                            <Text>2 days ago</Text>
                          </div>
                          <div className="token-info">
                            <Text strong>Features:</Text>
                            <div className="feature-tags">
                              <Badge count="Notifications" style={{ backgroundColor: '#0088cc' }} />
                              <Badge count="Bot Control" style={{ backgroundColor: '#52c41a' }} />
                              <Badge count="Alerts" style={{ backgroundColor: '#fa8c16' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Google Account Card */}
                  <Card
                    className="tokens-card"
                    hoverable
                  >
                    <div className="account-card-header">
                      <div className="account-icon-container">
                        <div className="account-icon google-icon">
                          <GoogleOutlined />
                        </div>
                        <div className="account-badge">
                          <Badge status={googleLinked ? 'success' : 'default'} />
                        </div>
                      </div>
                      <div className="account-status">
                        <Tooltip title={googleLinked ? 'Disconnect Google' : 'Connect Google'}>
                          <Switch
                            checked={googleLinked}
                            onChange={handleLinkGoogle}
                            size="small"
                          />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="account-card-body">
                      <Title level={5} className="account-title">Google</Title>
                      <Text className="account-description">
                        Link your Google account for seamless authentication and data synchronization across devices
                      </Text>
                      
                      {/* Google Login Button - Only show when not linked */}
                      {!googleLinked && (
                        <Button
                          type="primary"
                          size="large"
                          icon={<GoogleOutlined />}
                          onClick={openGoogleAuthModal}
                          loading={googleAuthLoading}
                          style={{
                            width: '100%',
                            height: 40,
                            backgroundColor: '#4285f4',
                            borderColor: '#4285f4',
                            marginTop: 12,
                            fontSize: 14,
                            fontWeight: 500
                          }}
                        >
                          Sign in with Google
                        </Button>
                      )}
                      
                      {googleLinked && (
                        <div className="account-details">
                          <Divider className="details-divider" />
                          <div className="token-info">
                            <Text strong>Email:</Text>
                            <Text>user@gmail.com</Text>
                          </div>
                          <div className="token-info">
                            <Text strong>Connected:</Text>
                            <Text>1 week ago</Text>
                          </div>
                          <div className="token-info">
                            <Text strong>Features:</Text>
                            <div className="feature-tags">
                              <Badge count="SSO Login" style={{ backgroundColor: '#4285f4' }} />
                              <Badge count="Cloud Sync" style={{ backgroundColor: '#34a853' }} />
                              <Badge count="Calendar" style={{ backgroundColor: '#ea4335' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Connected Accounts Card */}
                  <Card
                    className="tokens-card"
                    hoverable
                  >
                    <div className="account-card-header">
                      <div className="account-icon-container">
                        <div className="account-icon deriv-logo-container">
                          <img 
                            src={derivLogo} 
                            alt="Deriv" 
                            style={{ 
                              width: 48, 
                              height: 27,
                              objectFit: 'contain'
                            }} 
                          />
                        </div>
                        <div className="account-badge">
                          <Badge 
                            count={getActiveAccountsCount()} 
                            style={{ 
                              backgroundColor: '#52c41a',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              minWidth: '24px',
                              height: '24px',
                              lineHeight: '24px'
                            }} 
                          />
                        </div>
                      </div>
                      <div className="account-status">
                        <Tooltip title="Connect new trading account">
                          <Switch
                            checked={false}
                            onChange={handleLinkDeriv}
                            size="small"
                          />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="account-card-body">
                      <Title level={5} className="account-title">Connected Accounts</Title>
                      <Text className="account-description">
                        Manage your connected trading accounts and monitor their performance
                      </Text>
                      
                      {/* Summary Stats - Clickable to open drawer */}
                      {connectedAccounts.length > 0 && (
                        <div 
                          style={{ 
                            marginTop: 16, 
                            padding: 16, 
                            backgroundColor: '#f0f9ff', 
                            borderRadius: 8,
                            border: '1px solid #bae7ff',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => setAccountsDrawerVisible(true)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e6f7ff';
                            e.currentTarget.style.borderColor = '#91d5ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f9ff';
                            e.currentTarget.style.borderColor = '#bae7ff';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <Text strong style={{ fontSize: 12, color: '#1890ff' }}>
                                Total Balance
                              </Text>
                              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                                {formatBalance(
                                  connectedAccounts
                                    .filter(acc => acc.status === 'active')
                                    .reduce((sum, acc) => sum + acc.balance, 0),
                                  'USD'
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <Text strong style={{ fontSize: 12, color: '#52c41a' }}>
                                Active Accounts
                              </Text>
                              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
                                {getActiveAccountsCount()}/{connectedAccounts.length}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'center', marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Click to view all accounts →
                            </Text>
                          </div>
                        </div>
                      )}
                      
                      {connectedAccounts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <img 
                            src={derivLogo} 
                            alt="Deriv" 
                            style={{ 
                              width: 72, 
                              height: 40,
                              objectFit: 'contain',
                              opacity: 0.3,
                              marginBottom: 16
                            }} 
                          />
                          <Text type="secondary">
                            No connected accounts yet. Connect your first trading account to get started.
                          </Text>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Add Deriv Account Button */}
                  <Button
                    type="primary"
                    size="large"
                    icon={<WalletOutlined />}
                    onClick={openDerivAuthModal}
                    loading={derivAuthLoading}
                    style={{
                      width: '100%',
                      height: 48,
                      backgroundColor: '#ff6600',
                      borderColor: '#ff6600',
                      fontSize: 16,
                      fontWeight: 500,
                      marginTop: 16
                    }}
                  >
                    {derivAuthLoading ? 'Connecting...' : 'Add Deriv Account'}
                  </Button>
                </div>
              </div>
      {/* Connected Accounts Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img 
              src={derivLogo} 
              alt="Deriv" 
              style={{ 
                width: 48, 
                height: 27,
                objectFit: 'contain'
              }} 
            />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Connected Accounts
              </Title>
              <Text type="secondary">
                Manage your trading accounts
              </Text>
            </div>
          </div>
        }
        placement="right"
        onClose={() => setAccountsDrawerVisible(false)}
        open={accountsDrawerVisible}
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          {/* Account Summary */}
          <div style={{ 
            padding: 16, 
            backgroundColor: '#f0f9ff', 
            borderRadius: 8,
            border: '1px solid #bae7ff',
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong style={{ fontSize: 12, color: '#1890ff' }}>
                  Total Balance
                </Text>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                  {formatBalance(
                    connectedAccounts
                      .filter(acc => acc.status === 'active')
                      .reduce((sum, acc) => sum + acc.balance, 0),
                    'USD'
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text strong style={{ fontSize: 12, color: '#52c41a' }}>
                  Active Accounts
                </Text>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
                  {getActiveAccountsCount()}/{connectedAccounts.length}
                </div>
              </div>
            </div>
          </div>

          {/* Account List */}
          <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            {connectedAccounts.map((account) => (
              <Card
                key={account.id}
                size="small"
                style={{ 
                  marginBottom: 12,
                  border: account.status === 'active' ? '1px solid #52c41a' : '1px solid #d9d9d9',
                  backgroundColor: account.status === 'active' ? '#f6ffed' : '#fafafa'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 16 }}>
                        {account.name}
                      </Text>
                      <Badge
                        status={account.status === 'active' ? 'success' : 'default'}
                        text={account.status === 'active' ? 'Active' : 'Inactive'}
                        style={{ fontSize: 12 }}
                      />
                    </div>
                    
                    <div style={{ fontSize: 13, color: '#595959', marginBottom: 12 }}>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>Account ID:</Text> {account.accountId}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>Type:</Text> {account.accountType}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>Balance:</Text> {formatBalance(account.balance, account.currency)}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>Connected:</Text> {formatDate(account.connectedAt)}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      <Badge count="Trading" style={{ backgroundColor: '#1890ff', fontSize: 11 }} />
                      <Badge count="Analytics" style={{ backgroundColor: '#52c41a', fontSize: 11 }} />
                      <Badge count="API Access" style={{ backgroundColor: '#722ed1', fontSize: 11 }} />
                      {account.accountType === 'Real Money' && (
                        <Badge count="Live Trading" style={{ backgroundColor: '#ff4d4f', fontSize: 11 }} />
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    <Button
                      size="small"
                      danger
                      onClick={() => {
                        handleDisconnectAccount(account.id);
                        if (connectedAccounts.length === 1) {
                          setAccountsDrawerVisible(false);
                        }
                      }}
                    >
                      Disconnect
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <img 
                        src={derivLogo} 
                        alt="Deriv" 
                        style={{ 
                          width: 32, 
                          height: 18,
                          objectFit: 'contain'
                        }} 
                      />
                      <Text style={{ fontSize: 12, color: '#1890ff' }}>
                        Deriv
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Add Account Button */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Button 
              type="primary" 
              size="large"
              icon={<LinkOutlined />}
              onClick={() => {
                handleLinkDeriv(true);
                setAccountsDrawerVisible(false);
              }}
              style={{ width: '100%' }}
            >
              Add New Account
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Google Auth Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <GoogleOutlined style={{ fontSize: 24, color: '#4285f4' }} />
            <span>Google Authentication</span>
          </div>
        }
        open={googleAuthModalVisible}
        onCancel={() => setGoogleAuthModalVisible(false)}
        footer={null}
        width={400}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 24 }}>
            <GoogleOutlined style={{ fontSize: 64, color: '#4285f4', marginBottom: 16 }} />
            <Title level={4} style={{ margin: 0, color: '#4285f4' }}>
              Connect Your Google Account
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              Sign in to enable seamless authentication and data synchronization
            </Text>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Alert
              message="Secure Authentication"
              description="We use Firebase Auth to securely connect your Google account. Your credentials are never stored on our servers."
              type="info"
              showIcon
              style={{ textAlign: 'left' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Single Sign-On (SSO)</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Cloud Data Sync</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Calendar Integration</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Secure & Encrypted</Text>
              </div>
            </Space>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<GoogleOutlined />}
            onClick={handleGoogleSignIn}
            loading={googleAuthLoading}
            style={{
              width: '100%',
              height: 48,
              backgroundColor: '#4285f4',
              borderColor: '#4285f4',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            {googleAuthLoading ? 'Connecting...' : 'Sign in with Google'}
          </Button>

          <div style={{ marginTop: 16 }}>
            <Button
              type="link"
              onClick={() => setGoogleAuthModalVisible(false)}
              style={{ width: '100%' }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Telegram Auth Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MessageOutlined style={{ fontSize: 24, color: '#0088cc' }} />
            <span>Telegram Authentication</span>
          </div>
        }
        open={telegramAuthModalVisible}
        onCancel={() => setTelegramAuthModalVisible(false)}
        footer={null}
        width={400}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 24 }}>
            <MessageOutlined style={{ fontSize: 64, color: '#0088cc', marginBottom: 16 }} />
            <Title level={4} style={{ margin: 0, color: '#0088cc' }}>
              Connect Your Telegram Account
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              We'll generate a secure authentication link to connect your Telegram account
            </Text>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Alert
              message="Secure URL Authentication"
              description="We'll create a unique authentication URL with your user data encoded in base64 and open it in a new tab for secure Telegram connection."
              type="info"
              showIcon
              style={{ textAlign: 'left' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Base64 Encoded Payload</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Unique Authorization Code</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Secure URL Generation</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>New Tab Authentication</Text>
              </div>
            </Space>
          </div>

          <div style={{ marginBottom: 24, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Authentication Payload:</Text>
            <Space direction="vertical" size="small" style={{ width: '100%', textAlign: 'left' }}>
              <Text code style={{ fontSize: 11 }}>uid: {user?.uid || 'demo_uid'}</Text>
              <Text code style={{ fontSize: 11 }}>mid: {user?.id?.toString() || 'demo_mid'}</Text>
              <Text code style={{ fontSize: 11 }}>fid: {user?.firebaseId || 'demo_fid'}</Text>
              <Text code style={{ fontSize: 11 }}>uuid: {user?.uuid || 'generated_uuid'}</Text>
              <Text code style={{ fontSize: 11 }}>authorizationCode: 32_char_random_string</Text>
            </Space>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<MessageOutlined />}
            onClick={handleTelegramSignIn}
            loading={telegramAuthLoading}
            style={{
              width: '100%',
              height: 48,
              backgroundColor: '#0088cc',
              borderColor: '#0088cc',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            {telegramAuthLoading ? 'Generating URL...' : 'Connect with Telegram'}
          </Button>

          <div style={{ marginTop: 16 }}>
            <Button
              type="link"
              onClick={() => setTelegramAuthModalVisible(false)}
              style={{ width: '100%' }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deriv Auth Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <WalletOutlined style={{ fontSize: 24, color: '#ff6600' }} />
            <span>Deriv Authentication</span>
          </div>
        }
        open={derivAuthModalVisible}
        onCancel={() => setDerivAuthModalVisible(false)}
        footer={null}
        width={400}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 24 }}>
            <WalletOutlined style={{ fontSize: 64, color: '#ff6600', marginBottom: 16 }} />
            <Title level={4} style={{ margin: 0, color: '#ff6600' }}>
              Connect Your Deriv Account
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              We'll generate a secure authentication link to connect your Deriv trading account
            </Text>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Alert
              message="Secure OAuth Authentication"
              description="We'll create a unique authentication URL with your user data encoded in base64 and open it in a new tab for secure Deriv OAuth connection."
              type="info"
              showIcon
              style={{ textAlign: 'left' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Base64 Encoded Payload</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Unique Authorization Code</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Deriv OAuth2 Integration</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>New Tab Authentication</Text>
              </div>
            </Space>
          </div>

          <div style={{ marginBottom: 24, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Authentication Payload:</Text>
            <Space direction="vertical" size="small" style={{ width: '100%', textAlign: 'left' }}>
              <Text code style={{ fontSize: 11 }}>uid: {user?.uid || 'demo_uid'}</Text>
              <Text code style={{ fontSize: 11 }}>mid: {user?.id?.toString() || 'demo_mid'}</Text>
              <Text code style={{ fontSize: 11 }}>fid: {user?.firebaseId || 'demo_fid'}</Text>
              <Text code style={{ fontSize: 11 }}>uuid: {user?.uuid || 'generated_uuid'}</Text>
              <Text code style={{ fontSize: 11 }}>authorizationCode: 32_char_random_string</Text>
              <Text code style={{ fontSize: 11 }}>appId: 111480</Text>
            </Space>
          </div>

          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 8, border: '1px solid #ffd591' }}>
            <Text strong style={{ color: '#fa8c16', display: 'block', marginBottom: 4 }}>OAuth Endpoint:</Text>
            <Text code style={{ fontSize: 10, color: '#fa8c16' }}>https://oauth.deriv.com/oauth2/authorize?app_id=111480</Text>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<WalletOutlined />}
            onClick={handleDerivSignIn}
            loading={derivAuthLoading}
            style={{
              width: '100%',
              height: 48,
              backgroundColor: '#ff6600',
              borderColor: '#ff6600',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            {derivAuthLoading ? 'Generating URL...' : 'Connect with Deriv'}
          </Button>

          <div style={{ marginTop: 16 }}>
            <Button
              type="link"
              onClick={() => setDerivAuthModalVisible(false)}
              style={{ width: '100%' }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

    </Drawer>
  );
}
