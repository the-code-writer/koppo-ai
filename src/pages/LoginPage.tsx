/**
 * @file: LoginPage.tsx
 * @description: Simple login page component that accepts any credentials
 *               and sets the authentication state without external validation.
 *
 * @components: LoginPage - Form with username and password fields
 * @dependencies:
 *   - React: useState for form state
 *   - antd: Form, Input, Button components for UI
 *   - useAuth: For authentication state management
 *   - useNavigate: For redirection after login
 * @usage:
 *   // In router configuration
 *   <Route path="/login" element={<LoginPage />} />
 *
 * @architecture: Presentational component with local form state
 * @relationships:
 *   - Used by: Router
 *   - Uses: AuthContext for authentication state
 * @dataFlow: Captures form input, updates auth state, redirects user
 */
import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
  ConfigProvider,
  theme as antdTheme,
  Checkbox,
  Space,
  Card,
  Select,
  Row,
  Col,
  Radio,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { UserOutlined, LockOutlined, MailOutlined, ArrowLeftOutlined, PhoneOutlined, UserAddOutlined, GoogleOutlined } from "@ant-design/icons";
import { authAPI, RegisterData, LoginData, ForgotPasswordData } from "../services/api";
import logoSvg from "../assets/logo.png";
import "../styles/login.scss";

const { Title } = Typography;

const countries = [
  { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: '+265', flag: '🇲🇼', name: 'Malawi' },
  { code: '+266', flag: '🇱🇸', name: 'Lesotho' },
  { code: '+267', flag: '🇧🇼', name: 'Botswana' },
  { code: '+268', flag: '🇸🇿', name: 'Eswatini' },
  { code: '+290', flag: '🇸🇭', name: 'Saint Helena' },
  { code: '+247', flag: '🇦🇨', name: 'Ascension Island' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuthData, isAuthenticated, isLoading: authLoading } = useAuth();
  const { effectiveTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER'
  });
  const [selectedCountry, setSelectedCountry] = useState({
    code: '+263',
    flag: '🇿🇼',
    name: 'Zimbabwe'
  });

  // Initialize auth state and redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
    // Trigger form animation
    setFormVisible(true);
  }, [isAuthenticated, navigate]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  const handleForgotPassword = async () => {
    setForgotPasswordLoading(true);
    setForgotPasswordError(null);
    setForgotPasswordSuccess(false);

    try {
      // Validate email
      if (!forgotPasswordEmail) {
        setForgotPasswordError("Please enter your email address");
        return;
      }

      // Prepare forgot password data
      const forgotPasswordData: ForgotPasswordData = {
        email: forgotPasswordEmail
      };

      // Call forgot password API
      const response = await authAPI.forgotPassword(forgotPasswordData);
      
      if (response.success) {
        // Forgot password successful - show success message
        console.log('Password reset token sent:', response.data);
        setForgotPasswordSuccess(true);
        setForgotPasswordEmail("");
      } else {
        setForgotPasswordError(response.message || 'Failed to send reset token. Please try again.');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Failed to send reset token. Please try again.';
        setForgotPasswordError(errorMessage);
      } else if (error.request) {
        // Network error
        setForgotPasswordError('Network error. Please check your connection and try again.');
      } else {
        // Other error
        setForgotPasswordError('Failed to send reset token. Please try again.');
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Real-time form handlers
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const firstName = e.target.value;
    const lastName = formData.lastName;
    const displayName = `${firstName} ${lastName}`.trim();
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '.');
    
    setFormData(prev => ({
      ...prev,
      firstName,
      displayName,
      username
    }));
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lastName = e.target.value;
    const firstName = formData.firstName;
    const displayName = `${firstName} ${lastName}`.trim();
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '.');
    
    setFormData(prev => ({
      ...prev,
      lastName,
      displayName,
      username
    }));
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const displayName = e.target.value;
    const username = displayName.toLowerCase().replace(/\s+/g, '.');
    
    setFormData(prev => ({
      ...prev,
      displayName,
      username
    }));
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      username: e.target.value.toLowerCase()
    }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      email: e.target.value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      password: e.target.value
    }));
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      phoneNumber: e.target.value
    }));
  };

  const handleGenderChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      gender: e.target.value
    }));
  };

  const handleCountryChange = (country: any) => {
    setSelectedCountry(country);
  };

  const handleRegister = async () => {
    setRegisterLoading(true);
    setRegisterError(null);

    try {
      // Validate form
      if (!formData.firstName || !formData.lastName || !formData.displayName || 
          !formData.username || !formData.email || !formData.password || 
          !formData.phoneNumber) {
        setRegisterError("Please fill in all required fields");
        return;
      }

      // Prepare registration data
      const registerData: RegisterData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: formData.displayName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phoneNumber: `${selectedCountry.code}${formData.phoneNumber}`,
        gender: formData.gender
      };

      // Call registration API
      const response = await authAPI.register(registerData);
      
      if (response.user && response.tokens) {
        // Registration successful - store auth data and redirect
        setAuthData(response.user, response.tokens);
        
        // Store credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            username: response.user.username,
            timestamp: Date.now()
          }));
        }
        
        console.log('Registration successful:', response.user);
        
        // Redirect to home page directly after successful registration
        navigate("/");
      } else {
        setRegisterError('Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Registration failed. Please try again.';
        setRegisterError(errorMessage);
      } else if (error.request) {
        // Network error
        setRegisterError('Network error. Please check your connection and try again.');
      } else {
        // Other error
        setRegisterError('Registration failed. Please try again.');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordError(null);
    setForgotPasswordSuccess(false);
    setForgotPasswordEmail("");
  };

  const handleBackToLoginFromRegister = () => {
    setShowRegister(false);
    setRegisterError(null);
    setFormData({
      firstName: '',
      lastName: '',
      displayName: '',
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      gender: 'MALE'
    });
  };

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      // Prepare login data
      const loginData: LoginData = {
        email: values.email,
        password: values.password
      };

      // Call login API
      const response = await authAPI.login(loginData);
      
      if (response.user && response.tokens) {
        // Login successful - store auth data
        setAuthData(response.user, response.tokens);
        
        // Store credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            email: values.email,
            timestamp: Date.now()
          }));
        } else {
          localStorage.removeItem('rememberedCredentials');
        }

        // Redirect to home page
        navigate("/");
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Login failed. Please check your credentials.';
        setError(errorMessage);
      } else if (error.request) {
        // Network error
        setError('Network error. Please check your connection and try again.');
      } else {
        // Other error
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth login
    console.log('Google login clicked');
    // This would typically open Google OAuth flow
  };

  return (
    <ConfigProvider
      theme={{
        algorithm:
          effectiveTheme === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#00a877" as string,
          borderRadius: 6,
        } as any,
      }}
    >
      <div className={`login-page ${effectiveTheme}`}>
        <div
          className="login-container"
          style={{
            opacity: formVisible ? 1 : 0,
            transform: formVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease-in-out",
          }}
        >
          <div className="login-logo">
            <img src={logoSvg} alt="Champion Trading Logo" />
          </div>

          {showForgotPassword ? (
            <Card className="forgot-password-card">
              <Title level={3} className="forgot-password-title">
                🔐 Reset Password
              </Title>
              
              {forgotPasswordSuccess ? (
                <Alert
                  message="Reset Token Sent"
                  description="A password reset token has been sent to your email address. Please check your inbox."
                  type="success"
                  showIcon
                  className="forgot-password-success"
                />
              ) : (
                <>
                  {forgotPasswordError && (
                    <Alert
                      message="Reset Error"
                      description={forgotPasswordError}
                      type="error"
                      showIcon
                      className="forgot-password-error"
                    />
                  )}
                  
                  <Form
                    layout="vertical"
                    onFinish={handleForgotPassword}
                    className="forgot-password-form"
                    size="large"
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: "Please enter your email address" },
                        { type: 'email', message: 'Please enter a valid email address' }
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="Enter your email address"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        autoFocus
                      />
                    </Form.Item>

                    <Form.Item>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={forgotPasswordLoading}
                          className="forgot-password-button"
                          block
                        >
                          {forgotPasswordLoading ? "Sending..." : "Send Reset Token"}
                        </Button>
                        
                        <Button
                          type="link"
                          onClick={handleBackToLogin}
                          icon={<ArrowLeftOutlined />}
                          style={{ padding: 0, height: 'auto' }}
                        >
                          Back to login
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </>
              )}
            </Card>
          ) : showRegister ? (
            <Card className="register-card">
              <Title level={3} className="register-title">
                <UserAddOutlined /> Create Account
              </Title>
              
              {registerError && (
                <Alert
                  message="Registration Error"
                  description={registerError}
                  type="error"
                  showIcon
                  className="register-error"
                />
              )}
              
              <Form
                layout="vertical"
                className="register-form"
                size="large"
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="First Name"
                      rules={[{ required: true, message: "Please enter your first name" }]}
                    >
                      <Input
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleFirstNameChange}
                        autoFocus
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Last Name"
                      rules={[{ required: true, message: "Please enter your last name" }]}
                    >
                      <Input
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleLastNameChange}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="Display Name"
                  rules={[{ required: true, message: "Please enter your display name" }]}
                >
                  <Input
                    placeholder="John Doe"
                    value={formData.displayName}
                    onChange={handleDisplayNameChange}
                  />
                </Form.Item>

                <Form.Item
                  label="Username"
                  rules={[{ required: true, message: "Please enter your username" }]}
                >
                  <Input
                    placeholder="john.doe"
                    value={formData.username}
                    onChange={handleUsernameChange}
                    prefix={<UserOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  label="Email"
                  rules={[
                    { required: true, message: "Please enter your email address" },
                    { type: 'email', message: 'Please enter a valid email address' }
                  ]}
                >
                  <Input
                    placeholder="john.doe@domain.com"
                    value={formData.email}
                    onChange={handleEmailChange}
                    prefix={<MailOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  label="Password"
                  rules={[{ required: true, message: "Please enter your password" }]}
                >
                  <Input.Password
                    placeholder="pass123!"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    prefix={<LockOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  label="Phone Number"
                  rules={[{ required: true, message: "Please enter your phone number" }]}
                >
                  <Input.Group compact>
                    <Select
                      value={`${selectedCountry.flag} ${selectedCountry.code}`}
                      onChange={(value) => {
                        const country = countries.find(c => `${c.flag} ${c.code}` === value);
                        if (country) handleCountryChange(country);
                      }}
                      style={{ width: '30%' }}
                      showSearch
                      filterOption={(input, option) =>
                        option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {countries.map(country => (
                        <Select.Option key={country.code} value={`${country.flag} ${country.code}`}>
                          {country.flag} {country.code}
                        </Select.Option>
                      ))}
                    </Select>
                    <Input
                      style={{ width: '70%' }}
                      placeholder="772890123"
                      value={formData.phoneNumber}
                      onChange={handlePhoneNumberChange}
                      prefix={<PhoneOutlined />}
                    />
                  </Input.Group>
                </Form.Item>

                <Form.Item
                  label="Gender"
                  rules={[{ required: true, message: "Please select your gender" }]}
                >
                  <Radio.Group
                    value={formData.gender}
                    onChange={handleGenderChange}
                  >
                    <Radio value="MALE">Male</Radio>
                    <Radio value="FEMALE">Female</Radio>
                    <Radio value="OTHER">Other</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      htmlType="button"
                      loading={registerLoading}
                      className="register-submit-button"
                      block
                      onClick={handleRegister}
                    >
                      {registerLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                    
                    <Button
                      type="link"
                      onClick={handleBackToLoginFromRegister}
                      icon={<ArrowLeftOutlined />}
                      style={{ padding: 0, height: 'auto' }}
                    >
                      Back to login
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          ) : (
            <Card className="login-card">
              <Title level={2} className="login-title">
                🔒 Login
              </Title>

              {error && (
                <Alert
                  message="Login Error"
                  description={error}
                  type="error"
                  showIcon
                  className="login-error"
                />
              )}

              <Form
                name="login"
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
                className="login-form"
                size="large"
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: "Please enter your email" },
                    { type: 'email', message: 'Please enter a valid email address' }
                  ]}
                >
                  <Input size="large"
                    prefix={<MailOutlined />}
                    placeholder="Email"
                    autoFocus
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: "Please enter your password" },
                  ]}
                >
                  <Input.Password size="large"
                    prefix={<LockOutlined />}
                    placeholder="Password"
                  />
                </Form.Item>

                <Form.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      >
                        Remember me
                      </Checkbox>
                    </Form.Item>
                    
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      className="login-button"
                      block
                    >
                      {loading ? "Logging in..." : "Log in"}
                    </Button>
                    
                    <Button
                      type="default"
                      className="register-button"
                      block
                      onClick={handleGoogleLogin}
                      icon={<GoogleOutlined />} 
                    >
                      Continue with Google
                    </Button>
                    
                    <Button
                      type="default"
                      className="register-button"
                      block
                      onClick={() => setShowRegister(true)}
                    >
                      Register
                    </Button>
                    
                    <div style={{ textAlign: 'center' }}>
                      <Button
                        type="text"
                        block
                        onClick={() => setShowForgotPassword(true)} 
                      >
                        Forgot password?
                      </Button>
                    </div>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}
        </div>
      </div>
    </ConfigProvider>
  );
}
