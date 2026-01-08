import { useState } from "react";
import { Drawer, Form, Input, Button, Space, Card, Alert } from "antd";
import { User } from '../../services/api';
import "./styles.scss";


interface PasswordSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export function PasswordSettingsDrawer({ visible, onClose, user }: PasswordSettingsDrawerProps) {
  const [passwordForm] = Form.useForm();
  const [resetLoading, setResetLoading] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const handleSendPasswordReset = async () => {
    setResetLoading(true);
    try {
      // TODO: Implement API call to send password reset link
      console.log('Sending password reset link');
      // Show success message
    } catch (error) {
      console.error('Error sending password reset:', error);
    } finally {
      setResetLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    setChangePasswordLoading(true);
    try {
      // TODO: Implement API call to change password
      console.log('Changing password:', {values, currentPassword: '***', newPassword: '***' });
      passwordForm.resetFields();
      // Show success message
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <Drawer
      title="My Passwords"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="profile-settings-drawer"
    >
              <div className="security-content">
                {/* Password Reset Section */}
                <Card className="security-card" title="Password Reset" size="small">
                  <div className="password-reset-section">
                    <Alert
                      message="Password Reset"
                      description="Send a password reset link to your email address to reset your password."
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    <Button 
                      type="primary" 
                      onClick={handleSendPasswordReset}
                      loading={resetLoading}
                      block
                    >
                      Send Password Reset Link
                    </Button>
                  </div>
                </Card>

                {/* Change Password Section */}
                <Card className="security-card" title="Change Password" size="small">
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                    className="password-form"
                  >
                    <Form.Item
                      label="Current Password"
                      name="currentPassword"
                      rules={[
                        { required: true, message: 'Please enter your current password' },
                        { min: 8, message: 'Password must be at least 8 characters' }
                      ]}
                    >
                      <Input.Password placeholder="Enter current password" />
                    </Form.Item>

                    <Form.Item
                      label="New Password"
                      name="newPassword"
                      rules={[
                        { required: true, message: 'Please enter your new password' },
                        { min: 8, message: 'Password must be at least 8 characters' },
                        { 
                          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Password must contain uppercase, lowercase, and number'
                        }
                      ]}
                    >
                      <Input.Password placeholder="Enter new password" />
                    </Form.Item>

                    <Form.Item
                      label="Confirm New Password"
                      name="confirmPassword"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Please confirm your new password' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Passwords do not match'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password placeholder="Confirm new password" />
                    </Form.Item>

                    <Form.Item>
                      <Space>
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          loading={changePasswordLoading}
                        >
                          Change Password
                        </Button>
                        <Button onClick={() => passwordForm.resetFields()}>
                          Clear
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Card>
              </div>

    </Drawer>
  );
}
