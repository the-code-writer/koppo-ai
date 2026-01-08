import { useState } from "react";
import { Drawer, Button, Space, Typography, Card, Alert, List, Tag } from "antd";
import { SafetyOutlined, KeyOutlined, GlobalOutlined } from "@ant-design/icons";
import { User } from '../../services/api';
import "./styles.scss";

const { Title, Text } = Typography;


interface TokensSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export function TokensSettingsDrawer({ visible, onClose, user }: TokensSettingsDrawerProps) {
  const [activeTokens, setActiveTokens] = useState([
    {
      id: 'token_1',
      name: 'Web Session - Chrome',
      createdAt: '2024-01-05T10:30:00Z',
      expiresAt: '2024-01-12T10:30:00Z',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      isActive: true,
      lastUsed: '2024-01-06T08:15:00Z'
    },
    {
      id: 'token_2', 
      name: 'Mobile App - iOS',
      createdAt: '2024-01-03T14:20:00Z',
      expiresAt: '2024-01-17T14:20:00Z',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      isActive: true,
      lastUsed: '2024-01-05T22:45:00Z'
    }
  ]);

  const handleRevokeToken = (tokenId: string) => {
    setActiveTokens(prev => prev.filter(token => token.id !== tokenId));
    // TODO: Implement API call to revoke token
    console.log('Revoking token:', tokenId);
  };

  const handleRevokeAllTokens = () => {
    setActiveTokens([]);
    // TODO: Implement API call to revoke all tokens
    console.log('Revoking all tokens');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTokenPreview = (token: string) => {
    if (token.length <= 20) return token;
    return token.substring(0, 10) + '...' + token.substring(token.length - 10);
  };

  return (
    <Drawer
      title="Sessions & Tokens"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="profile-settings-drawer"
    >
      
              <div className="tokens-content">
                <Card 
                  className="tokens-card" 
                  title="Active Sessions & Tokens" 
                  extra={
                    <Button 
                      danger 
                      size="small" 
                      onClick={handleRevokeAllTokens}
                      disabled={activeTokens.length === 0}
                    >
                      Revoke All
                    </Button>
                  }
                >
                  <div className="token-management">
                    {activeTokens.length === 0 ? (
                      <Alert
                        message="No Active Sessions"
                        description="You have no active sessions or tokens."
                        type="info"
                        showIcon
                      />
                    ) : (
                      <List
                        dataSource={activeTokens}
                        renderItem={(token) => (
                          <List.Item
                            actions={[
                              <Button
                                key="revoke"
                                danger
                                size="small"
                                onClick={() => handleRevokeToken(token.id)}
                              >
                                Revoke
                              </Button>
                            ]}
                          >
                            <List.Item.Meta
                              title={
                                <Space>
                                  <span>{token.name}</span>
                                  <Tag color={token.isActive ? 'green' : 'red'}>
                                    {token.isActive ? 'Active' : 'Inactive'}
                                  </Tag>
                                </Space>
                              }
                              description={
                                <div className="token-details">
                                  <div className="token-info">
                                    <Text strong>Token: </Text>
                                    <Text code>{getTokenPreview(token.token)}</Text>
                                  </div>
                                  <div className="token-info">
                                    <Text strong>Created: </Text>
                                    <Text>{formatDate(token.createdAt)}</Text>
                                  </div>
                                  <div className="token-info">
                                    <Text strong>Expires: </Text>
                                    <Text>{formatDate(token.expiresAt)}</Text>
                                  </div>
                                  <div className="token-info">
                                    <Text strong>Last Used: </Text>
                                    <Text>{formatDate(token.lastUsed)}</Text>
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </div>
                </Card>

          {/* Security Tips */}
          <Card title="Security Tips" style={{ marginTop: 32 }}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div>
                <Title level={5}>
                  <SafetyOutlined /> Regular Session Review
                </Title>
                <Text type="secondary">
                  Periodically review your active sessions and revoke any that you don't recognize.
                </Text>
              </div>
              
              <div>
                <Title level={5}>
                  <KeyOutlined /> Token Management
                </Title>
                <Text type="secondary">
                  Create tokens with minimal required permissions and revoke them when no longer needed.
                </Text>
              </div>
              
              <div>
                <Title level={5}>
                  <GlobalOutlined /> Secure Access
                </Title>
                <Text type="secondary">
                  Use secure networks and enable 2FA for additional account protection.
                </Text>
              </div>
            </Space>
          </Card>

              </div>
    </Drawer>
  );
}
