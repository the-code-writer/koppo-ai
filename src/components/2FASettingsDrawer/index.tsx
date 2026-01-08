import { useState, useEffect, useRef } from "react";
import { Drawer, Input, Button, Space, Typography, Switch, Card, Alert, Collapse } from "antd";
import { User } from '../../services/api';
import { AuthenticatorApp, QRCodeGenerator } from '../../utils/AuthenticatorApp';
import { SMSAuthenticator, SMSVerificationSession, WhatsAppAuthenticator, WhatsAppVerificationSession } from '../../utils/SMSAuthenticator';
import { MobileOutlined, WhatsAppOutlined, QrcodeOutlined, CheckCircleFilled, CaretRightOutlined } from "@ant-design/icons";
import "./styles.scss";

const { Title, Text } = Typography;

interface ProfileSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export function TwoFASettingsDrawer({ visible, onClose, user }: ProfileSettingsDrawerProps) {
  console.log('2FASettingsDrawer - User data:', user);
  console.log('2FASettingsDrawer - Phone number:', user?.phoneNumber);
  // SMS State
  const [smsCode, setSmsCode] = useState(['', '', '', '', '', '']);
  const [smsSetupStep, setSmsSetupStep] = useState<'setup' | 'verify'>('setup');
  const [smsSessionId, setSmsSessionId] = useState<string | null>(null);
  const [smsCodeExpiresAt, setSmsCodeExpiresAt] = useState<number | null>(null);
  const [smsResendAvailable, setSmsResendAvailable] = useState(true);
  const [smsResendCountdown, setSmsResendCountdown] = useState(0);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsShake, setSmsShake] = useState(false);

  // WhatsApp State
  const [whatsappCode, setWhatsappCode] = useState(['', '', '', '', '', '']);
  const [whatsappSetupStep, setWhatsappSetupStep] = useState<'setup' | 'verify'>('setup');
  const [whatsappSessionId, setWhatsappSessionId] = useState<string | null>(null);
  const [whatsappCodeExpiresAt, setWhatsappCodeExpiresAt] = useState<number | null>(null);
  const [whatsappResendAvailable, setWhatsappResendAvailable] = useState(true);
  const [whatsappResendCountdown, setWhatsappResendCountdown] = useState(0);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappShake, setWhatsappShake] = useState(false);

  // WhatsApp Input Refs
  const whatsappInputRef = useRef<any>(null);

  // Authenticator 2FA State
    const [authenticatorSecret, setAuthenticatorSecret] = useState('');
  const [authenticatorQRCode, setAuthenticatorQRCode] = useState('');
  const [authenticatorSetupStep, setAuthenticatorSetupStep] = useState<'setup' | 'verify'>('setup');
  const [authenticatorLoading, setAuthenticatorLoading] = useState(false);
  const [authenticatorVerificationCode, setAuthenticatorVerificationCode] = useState('');
  const [authenticatorShake, setAuthenticatorShake] = useState(false);
  
  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'whatsapp' | 'authenticator' | null>(null);
  const [active2FAKey, setActive2FAKey] = useState<string | string[]>([]);
  
  // SMS Input Refs
  const smsInputRef = useRef<any>(null);
  
  // SMS Code Handlers
  const handleSMSCodeChange = (index: number, value: string) => {
    const newCode = [...smsCode];
    const previousValue = newCode[index];
    newCode[index] = value.replace(/\D/g, '');
    setSmsCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`sms-input-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
    
    // Auto-verify only when:
    // 1. User is typing in the last box (index 5)
    // 2. The value is not empty
    // 3. This is a new entry (not an edit of existing value)
    if (index === 5 && value && !previousValue) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        const fullCode = newCode.join('');
        if (fullCode.length === 6) {
          handleVerifySMS();
        }
      }, 100);
    }
  };
  
  const handleSMSCodeKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !smsCode[index] && index > 0) {
      const prevInput = document.getElementById(`sms-input-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  // WhatsApp Code Handlers
  const handleWhatsAppCodeChange = (index: number, value: string) => {
    const newCode = [...whatsappCode];
    const previousValue = newCode[index];
    newCode[index] = value.replace(/\D/g, '');
    setWhatsappCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`whatsapp-input-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
    
    // Auto-verify only when:
    // 1. User is typing in the last box (index 5)
    // 2. The value is not empty
    // 3. This is a new entry (not an edit of existing value)
    if (index === 5 && value && !previousValue) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        const fullCode = newCode.join('');
        if (fullCode.length === 6) {
          handleVerifyWhatsApp();
        }
      }, 100);
    }
  };
  
  const handleWhatsAppCodeKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !whatsappCode[index] && index > 0) {
      const prevInput = document.getElementById(`whatsapp-input-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };
  // Helper function to start resend countdown
  const startResendCountdown = () => {
    setSmsResendCountdown(60); // 60 seconds countdown
    setSmsResendAvailable(false);
  };

  // Helper function to start WhatsApp resend countdown
  const startWhatsAppResendCountdown = () => {
    setWhatsappResendCountdown(60); // 60 seconds countdown
    setWhatsappResendAvailable(false);
  };

  // Real-time countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      // Check if SMS code has expired
      if (smsCodeExpiresAt && smsCodeExpiresAt > 0 && Date.now() > smsCodeExpiresAt) {
        setSmsResendAvailable(true);
        setSmsResendCountdown(0);
      }
      
      // Update SMS resend countdown
      if (smsResendCountdown > 0) {
        setSmsResendCountdown(prev => prev - 1);
      }

      // Check if WhatsApp code has expired
      if (whatsappCodeExpiresAt && whatsappCodeExpiresAt > 0 && Date.now() > whatsappCodeExpiresAt) {
        setWhatsappResendAvailable(true);
        setWhatsappResendCountdown(0);
      }
      
      // Update WhatsApp resend countdown
      if (whatsappResendCountdown > 0) {
        setWhatsappResendCountdown(prev => prev - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [smsCodeExpiresAt, smsResendCountdown, whatsappCodeExpiresAt, whatsappResendCountdown]);

  // SMS Authentication Functions
  const handleSetupSMS = async () => {
    if (!user?.phoneNumber) {
      console.error('No phone number available');
      return;
    }

    setSmsLoading(true);
    try {
      // Validate phone number
      if (!SMSAuthenticator.validatePhoneNumber(user.phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Create SMS session
      const sessionId = `sms_${user.id}_${Date.now()}`;
      const session = SMSVerificationSession.getInstance();
      const { code, expiresAt } = session.createSession(sessionId, user.phoneNumber);

      // Send SMS
      const message = SMSAuthenticator.generateSMSMessage(code, 'Koppo App');
      const smsSent = await SMSAuthenticator.sendSMS(user.phoneNumber, message);

      if (smsSent) {
        setSmsSessionId(sessionId);
        setSmsCodeExpiresAt(expiresAt);
        setSmsSetupStep('verify');
        setSmsResendAvailable(false);
        setTwoFactorMethod('sms');
        
        // Start countdown timer
        startResendCountdown();
        
        // Reset SMS code inputs
        setSmsCode(['', '', '', '', '', '']);
                
        // Log the code to console for testing
        console.log('🔢 SMS Verification Code:', code);
        console.log('⏰ Code expires at:', new Date(expiresAt).toLocaleTimeString());
        console.log('📱 Phone:', SMSAuthenticator.maskPhoneNumber(user.phoneNumber));
        console.log('✅ SMS code sent successfully');
      } else {
        throw new Error('Failed to send SMS');
      }
    } catch (error) {
      console.error('Failed to setup SMS:', error);
      alert('Failed to send SMS. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleVerifySMS = async () => {
    // Combine the 6-digit code from input fields
    const enteredCode = smsCode.join('');
    
    console.log('🔍 DEBUG - Verification Attempt:');
    console.log('📝 Entered code:', enteredCode);
    console.log('🆔 Session ID:', smsSessionId);
    console.log('⏰ Current time:', new Date().toLocaleTimeString());
    console.log('⏰ Expires at:', smsCodeExpiresAt ? new Date(smsCodeExpiresAt).toLocaleTimeString() : 'Not set');
    
    if (!enteredCode || !smsSessionId) {
      console.error('❌ Missing verification code or session');
      return;
    }

    // Check if code has expired
    if (smsCodeExpiresAt && Date.now() > smsCodeExpiresAt) {
      console.log('⏰ Code expired at:', new Date(smsCodeExpiresAt).toLocaleTimeString());
      console.log('🕐 Current time:', new Date().toLocaleTimeString());
      alert('Verification code has expired. Please request a new code.');
      return;
    }

    setSmsLoading(true);
    try {
      const session = SMSVerificationSession.getInstance();
      
      // Debug: Check if session exists
      console.log('🔍 DEBUG - Using SMSVerificationSession singleton instance');
      console.log('🔍 DEBUG - Session Map size before verification:', (session as any).sessions?.size || 'N/A');
      
      const isValid = session.verifyCode(smsSessionId, enteredCode);

      console.log('🔍 DEBUG - Verification result:', isValid);
      console.log('🔍 DEBUG - Session Map size after verification:', (session as any).sessions?.size || 'N/A');

      if (isValid) {
        // TODO: Save to backend
        console.log('🎉 SMS authentication setup successful!');
        setTwoFactorMethod('sms');
        setTwoFactorEnabled(true);
        setSmsSetupStep('setup');
        setSmsCode(['', '', '', '', '', '']);
                setSmsSessionId('');
        setSmsCodeExpiresAt(0);
        setSmsResendAvailable(true);
        setSmsResendCountdown(0);
        
        alert('SMS authentication enabled successfully!');
      } else {
        console.log('❌ Invalid verification code');
        // Trigger shake effect
        setSmsShake(true);
        setTimeout(() => setSmsShake(false), 500);
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying SMS code:', error);
      alert('Failed to verify code. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleResendSMS = async () => {
    if (!smsSessionId || !smsResendAvailable) {
      console.error('Cannot resend SMS: session not available or resend not allowed');
      return;
    }

    setSmsLoading(true);
    try {
      const session = SMSVerificationSession.getInstance();
      const result = session.resendCode(smsSessionId);

      if (result) {
        // Send new SMS
        const message = SMSAuthenticator.generateSMSMessage(result.code, 'Koppo App');
        const smsSent = await SMSAuthenticator.sendSMS(user?.phoneNumber || '', message);

        if (smsSent) {
          setSmsCodeExpiresAt(result.expiresAt);
          setSmsResendAvailable(false);
          // Clear previous code
          startResendCountdown();
          
          console.log('SMS resent successfully to:', SMSAuthenticator.maskPhoneNumber(user?.phoneNumber || ''));
          alert('New verification code sent successfully!');
        } else {
          throw new Error('Failed to resend SMS');
        }
      }
    } catch (error) {
      console.error('Failed to resend SMS:', error);
      alert('Failed to resend verification code. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleCancelSMSSetup = () => {
    setSmsSetupStep('setup');
        setSmsSessionId('');
    setSmsCodeExpiresAt(0);
    setSmsResendAvailable(true);
    setSmsResendCountdown(0);
    setTwoFactorMethod(null);
  };

  // WhatsApp Authentication Functions
  const handleSetupWhatsApp = async () => {
    if (!user?.phoneNumber) {
      console.error('No phone number available');
      return;
    }

    setWhatsappLoading(true);
    try {
      // Validate phone number
      if (!WhatsAppAuthenticator.validatePhoneNumber(user.phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Create WhatsApp session
      const sessionId = `whatsapp_${user.id}_${Date.now()}`;
      const session = WhatsAppVerificationSession.getInstance();
      const { code, expiresAt } = session.createSession(sessionId, user.phoneNumber);

      // Send WhatsApp
      const message = WhatsAppAuthenticator.generateWhatsAppMessage(code, 'Koppo App');
      const whatsappSent = await WhatsAppAuthenticator.sendWhatsApp(user.phoneNumber, message);

      if (whatsappSent) {
        setWhatsappSessionId(sessionId);
        setWhatsappCodeExpiresAt(expiresAt);
        setWhatsappSetupStep('verify');
        setWhatsappResendAvailable(false);
        setTwoFactorMethod('whatsapp');
        
        // Start countdown timer
        startWhatsAppResendCountdown();
        
        // Reset WhatsApp code inputs
        setWhatsappCode(['', '', '', '', '', '']);
                
        // Log the code to console for testing
        console.log('🔢 WhatsApp Verification Code:', code);
        console.log('⏰ Code expires at:', new Date(expiresAt).toLocaleTimeString());
        console.log('📱 Phone:', WhatsAppAuthenticator.maskPhoneNumber(user.phoneNumber));
        console.log('✅ WhatsApp code sent successfully');
      } else {
        throw new Error('Failed to send WhatsApp');
      }
    } catch (error) {
      console.error('Failed to setup WhatsApp:', error);
      alert('Failed to send WhatsApp. Please try again.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleVerifyWhatsApp = async () => {
    // Combine the 6-digit code from input fields
    const enteredCode = whatsappCode.join('');
    
    console.log('🔍 DEBUG - WhatsApp Verification Attempt:');
    console.log('📝 Entered code:', enteredCode);
    console.log('🆔 Session ID:', whatsappSessionId);
    console.log('⏰ Current time:', new Date().toLocaleTimeString());
    console.log('⏰ Expires at:', whatsappCodeExpiresAt ? new Date(whatsappCodeExpiresAt).toLocaleTimeString() : 'Not set');
    
    if (!enteredCode || !whatsappSessionId) {
      console.error('❌ Missing verification code or session');
      return;
    }

    // Check if code has expired
    if (whatsappCodeExpiresAt && Date.now() > whatsappCodeExpiresAt) {
      console.log('⏰ Code expired at:', new Date(whatsappCodeExpiresAt).toLocaleTimeString());
      console.log('🕐 Current time:', new Date().toLocaleTimeString());
      alert('Verification code has expired. Please request a new code.');
      return;
    }

    setWhatsappLoading(true);
    try {
      const session = WhatsAppVerificationSession.getInstance();
      
      // Debug: Check if session exists
      console.log('🔍 DEBUG - Using WhatsAppVerificationSession singleton instance');
      console.log('🔍 DEBUG - Session Map size before verification:', (session as any).sessions?.size || 'N/A');
      
      const isValid = session.verifyCode(whatsappSessionId, enteredCode);

      console.log('🔍 DEBUG - Verification result:', isValid);
      console.log('🔍 DEBUG - Session Map size after verification:', (session as any).sessions?.size || 'N/A');

      if (isValid) {
        // TODO: Save to backend
        console.log('🎉 WhatsApp authentication setup successful!');
        setTwoFactorMethod('whatsapp');
        setTwoFactorEnabled(true);
        setWhatsappSetupStep('setup');
        setWhatsappCode(['', '', '', '', '', '']);
                setWhatsappSessionId('');
        setWhatsappCodeExpiresAt(0);
        setWhatsappResendAvailable(true);
        setWhatsappResendCountdown(0);
        
        alert('WhatsApp authentication enabled successfully!');
      } else {
        console.log('❌ Invalid verification code');
        // Trigger shake effect
        setWhatsappShake(true);
        setTimeout(() => setWhatsappShake(false), 500);
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying WhatsApp code:', error);
      alert('Failed to verify code. Please try again.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleResendWhatsApp = async () => {
    if (!whatsappSessionId || !whatsappResendAvailable) {
      console.error('Cannot resend WhatsApp: session not available or resend not allowed');
      return;
    }

    setWhatsappLoading(true);
    try {
      const session = WhatsAppVerificationSession.getInstance();
      const result = session.resendCode(whatsappSessionId);

      if (result) {
        // Send new WhatsApp
        const message = WhatsAppAuthenticator.generateWhatsAppMessage(result.code, 'Koppo App');
        const whatsappSent = await WhatsAppAuthenticator.sendWhatsApp(user?.phoneNumber || '', message);

        if (whatsappSent) {
          setWhatsappCodeExpiresAt(result.expiresAt);
          setWhatsappResendAvailable(false);
          // Clear previous code
          startWhatsAppResendCountdown();
          
          console.log('WhatsApp resent successfully to:', WhatsAppAuthenticator.maskPhoneNumber(user?.phoneNumber || ''));
          alert('New verification code sent successfully!');
        } else {
          throw new Error('Failed to resend WhatsApp');
        }
      }
    } catch (error) {
      console.error('Failed to resend WhatsApp:', error);
      alert('Failed to resend verification code. Please try again.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleCancelWhatsAppSetup = () => {
    setWhatsappSetupStep('setup');
        setWhatsappSessionId('');
    setWhatsappCodeExpiresAt(0);
    setWhatsappResendAvailable(true);
    setWhatsappResendCountdown(0);
    setTwoFactorMethod(null);
  };

  // Authenticator Functions
  const handleSetupAuthenticator = async () => {
    setAuthenticatorLoading(true);
    try {
      // Generate secret key
      const secret = AuthenticatorApp.generateSecret();
      setAuthenticatorSecret(secret);

      // Generate QR code data
      const qrData = AuthenticatorApp.generateQRCodeData(
        secret,
        user?.email || 'user@example.com',
        'Koppo App'
      );

      // Generate QR code image
      const qrImage = await QRCodeGenerator.generateQRCode(qrData);
      setAuthenticatorQRCode(qrImage);

      // Move to verify step and set method
      setAuthenticatorSetupStep('verify');
      setTwoFactorMethod('authenticator');
    } catch (error) {
      console.error('Failed to setup authenticator:', error);
      alert('Failed to setup authenticator. Please try again.');
    } finally {
      setAuthenticatorLoading(false);
    }
  };

  const handleVerifyAuthenticator = async () => {
    if (!authenticatorVerificationCode || !authenticatorSecret) {
      console.error('Missing verification code or secret');
      return;
    }

    setAuthenticatorLoading(true);
    try {
      const isValid = AuthenticatorApp.verifyTOTP(
        authenticatorSecret,
        authenticatorVerificationCode
      );

      if (isValid) {
        // TODO: Save to backend
        console.log('Authenticator setup successful!');
        setTwoFactorMethod('authenticator');
        setTwoFactorEnabled(true);
        setAuthenticatorSetupStep('setup');
        setAuthenticatorVerificationCode('');
        setAuthenticatorSecret('');
        setAuthenticatorQRCode('');
      } else {
        console.error('Invalid verification code');
        // Trigger shake effect
        setAuthenticatorShake(true);
        setTimeout(() => setAuthenticatorShake(false), 500);
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Failed to verify authenticator:', error);
      alert('Failed to verify authenticator. Please try again.');
    } finally {
      setAuthenticatorLoading(false);
    }
  };

  const handleCancelAuthenticatorSetup = () => {
    setAuthenticatorSetupStep('setup');
    setAuthenticatorVerificationCode('');
    setAuthenticatorSecret('');
    setAuthenticatorQRCode('');
    setTwoFactorMethod(null);
  };

  
  return (
    <Drawer
      title="Two-Factor Authentication"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="profile-settings-drawer"
    >
      <div className="twofa-content">
        <Card
          style={{
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f0f0f0'
          }}
        >
          <div style={{ padding: '24px' }}>
            <Alert
              message={twoFactorEnabled 
                ? "Your account is protected with two-factor authentication."
                : "Enable two-factor authentication to add an extra layer of security to your account."
              }
              type={twoFactorEnabled ? "success" : "warning"}
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text strong>Enable Two-Factor Authentication</Text>
              <Switch
                checked={twoFactorEnabled}
                onChange={setTwoFactorEnabled}
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />
            </div>
          </div>
        </Card>

        {/* 2FA Methods Accordion */}
        {twoFactorEnabled && (
          <Collapse 
            style={{ 
              marginTop: 16,
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#fafafa'
            }}
            activeKey={active2FAKey}
            onChange={(keys) => {
              // Only allow one panel to be open at a time
              const newKeys = Array.isArray(keys) ? keys : [keys];
              setActive2FAKey(newKeys.length > 0 ? [newKeys[newKeys.length - 1]] : []);
            }}
            expandIcon={({ isActive }) => (
              <CaretRightOutlined 
                rotate={isActive ? 90 : 0} 
                style={{ 
                  fontSize: '14px',
                  color: '#1890ff',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }} 
              />
            )}
            expandIconPosition="right"
            ghost={false}
            size="middle"
            items={[
              {
                key: 'sms',
                label: (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    transition: 'all 0.3s ease'
                  }}>
                    <MobileOutlined style={{ 
                      fontSize: 18, 
                      color: twoFactorMethod === 'sms' ? '#52c41a' : '#8c8c8c',
                      transition: 'color 0.3s ease'
                    }} />
                    <Text strong style={{ 
                      color: twoFactorMethod === 'sms' ? '#52c41a' : '#262626',
                      transition: 'color 0.3s ease'
                    }}>
                      SMS Authentication
                    </Text>
                    {twoFactorMethod === 'sms' && (
                      <CheckCircleFilled 
                        style={{ 
                          color: '#52c41a', 
                          fontSize: 16,
                          animation: 'fadeIn 0.5s ease'
                        }} 
                      />
                    )}
                  </div>
                ),
                children: (
                  <div>
                    {/* Default State */}
                    <div 
                      style={{
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: smsSetupStep === 'setup' ? 1 : 0,
                        transform: smsSetupStep === 'setup' ? 'translateY(0)' : 'translateY(-20px)',
                        pointerEvents: smsSetupStep === 'setup' ? 'auto' : 'none',
                        position: smsSetupStep === 'setup' ? 'relative' : 'absolute',
                        width: '100%'
                      }}
                    >
                      <Alert
                        message="SMS Authentication"
                        description="Receive verification codes via SMS to secure your account."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />

                      <div style={{ marginBottom: 16 }}>
                        <Text strong>Phone Number:</Text>
                        <div style={{ marginTop: 8, fontSize: 16, color: '#1890ff' }}>
                          {user?.phoneNumber ? SMSAuthenticator.maskPhoneNumber(user.phoneNumber) : 'No phone number set'}
                        </div>
                      </div>

                      {!twoFactorMethod || twoFactorMethod !== 'sms' ? (
                        <Button 
                          type="primary" 
                          size="large"
                          onClick={handleSetupSMS}
                          loading={smsLoading}
                          disabled={!user?.phoneNumber}
                        >
                          Setup SMS Authentication
                        </Button>
                      ) : (
                        <div>
                          <Alert
                            message="SMS Authentication Enabled"
                            description="Your account is protected with SMS verification codes."
                            type="success"
                            showIcon
                            style={{ marginBottom: 16 }}
                          />
                          <Space>
                            <Button 
                              type="default" 
                              size="large"
                              onClick={handleCancelSMSSetup}
                            >
                              Disable SMS
                            </Button>
                          </Space>
                        </div>
                      )}
                    </div>

                    {/* Verification State */}
                    <div 
                      style={{
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: smsSetupStep === 'verify' ? 1 : 0,
                        transform: smsSetupStep === 'verify' ? 'translateY(0)' : 'translateY(20px)',
                        pointerEvents: smsSetupStep === 'verify' ? 'auto' : 'none',
                        position: smsSetupStep === 'verify' ? 'relative' : 'absolute',
                        width: '100%',
                        minHeight: '300px'
                      }}
                    >
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ 
                          marginBottom: 20,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: '#e6f7ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 8
                          }}>
                            <MobileOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                          </div>
                        </div>

                        <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                          Verification Code Sent
                        </Title>
                        
                        <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 16 }}>
                          We've sent a 6-digit verification code to your phone number
                        </Text>
                        
                        <Text strong style={{ fontSize: 16, color: '#1890ff', display: 'block', marginBottom: 20 }}>
                          {user?.phoneNumber ? SMSAuthenticator.maskPhoneNumber(user.phoneNumber) : 'Your phone'}
                        </Text>

                        <div style={{ marginBottom: 20 }}>
                          <Space size={8} className={smsShake ? 'shake' : ''}>
                            {smsCode.map((digit, index) => (
                              <Input
                                key={index}
                                id={`sms-input-${index}`}
                                ref={index === 0 ? smsInputRef : null}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleSMSCodeChange(index, e.target.value)}
                                onKeyDown={(e) => handleSMSCodeKeyDown(index, e.key)}
                                style={{
                                  width: 45,
                                  height: 45,
                                  textAlign: 'center',
                                  fontSize: 18,
                                  fontWeight: 'bold',
                                  borderRadius: '8px',
                                  border: '2px solid #d9d9d9',
                                  transition: 'all 0.3s ease'
                                }}
                              />
                            ))}
                          </Space>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                          <Text type="secondary" style={{ fontSize: 14 }}>
                            Code expires in: {smsCodeExpiresAt ? SMSAuthenticator.formatRemainingTime(smsCodeExpiresAt) : 'Loading...'}
                          </Text>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                          <Space size="large">
                            {smsCodeExpiresAt && Date.now() > smsCodeExpiresAt ? (
                              <Button 
                                type="primary" 
                                size="large"
                                onClick={handleSetupSMS}
                                loading={smsLoading}
                                style={{ minWidth: 120 }}
                              >
                                Resend Code
                              </Button>
                            ) : (
                              <Button 
                                type="primary" 
                                size="large"
                                onClick={handleVerifySMS}
                                loading={smsLoading}
                                style={{ minWidth: 120 }}
                              >
                                Verify
                              </Button>
                            )}
                            <Button 
                              type="default" 
                              size="large"
                              onClick={handleCancelSMSSetup}
                              style={{ minWidth: 100 }}
                            >
                              Cancel
                            </Button>
                          </Space>
                        </div>

                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          <Text type="secondary">
                            Didn't receive the code? Check your spam folder or make sure your phone number is correct.
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'whatsapp',
                label: (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    transition: 'all 0.3s ease'
                  }}>
                    <WhatsAppOutlined style={{ 
                      fontSize: 18, 
                      color: twoFactorMethod === 'whatsapp' ? '#52c41a' : '#8c8c8c',
                      transition: 'color 0.3s ease'
                    }} />
                    <Text strong style={{ 
                      color: twoFactorMethod === 'whatsapp' ? '#52c41a' : '#262626',
                      transition: 'color 0.3s ease'
                    }}>
                      WhatsApp Authentication
                    </Text>
                    {twoFactorMethod === 'whatsapp' && (
                      <CheckCircleFilled 
                        style={{ 
                          color: '#52c41a', 
                          fontSize: 16,
                          animation: 'fadeIn 0.5s ease'
                        }} 
                      />
                    )}
                  </div>
                ),
                children: (
                  <div>
                    {/* Default State */}
                    <div 
                      style={{
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: whatsappSetupStep === 'setup' ? 1 : 0,
                        transform: whatsappSetupStep === 'setup' ? 'translateY(0)' : 'translateY(-20px)',
                        pointerEvents: whatsappSetupStep === 'setup' ? 'auto' : 'none',
                        position: whatsappSetupStep === 'setup' ? 'relative' : 'absolute',
                        width: '100%'
                      }}
                    >
                      <Alert
                        message="WhatsApp Authentication"
                        description="Receive verification codes via WhatsApp to secure your account."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />

                      <div style={{ marginBottom: 16 }}>
                        <Text strong>Phone Number:</Text>
                        <div style={{ marginTop: 8, fontSize: 16, color: '#1890ff' }}>
                          {user?.phoneNumber ? WhatsAppAuthenticator.maskPhoneNumber(user.phoneNumber) : 'No phone number set'}
                        </div>
                      </div>

                      {!twoFactorMethod || twoFactorMethod !== 'whatsapp' ? (
                        <Button 
                          type="primary" 
                          size="large"
                          onClick={handleSetupWhatsApp}
                          loading={whatsappLoading}
                          disabled={!user?.phoneNumber}
                        >
                          Setup WhatsApp Authentication
                        </Button>
                      ) : (
                        <div>
                          <Alert
                            message="WhatsApp Authentication Enabled"
                            description="Your account is protected with WhatsApp verification codes."
                            type="success"
                            showIcon
                            style={{ marginBottom: 16 }}
                          />
                          <Space>
                            <Button 
                              type="default" 
                              size="large"
                              onClick={handleCancelWhatsAppSetup}
                            >
                              Disable WhatsApp
                            </Button>
                          </Space>
                        </div>
                      )}
                    </div>

                    {/* Verification State */}
                    <div 
                      style={{
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: whatsappSetupStep === 'verify' ? 1 : 0,
                        transform: whatsappSetupStep === 'verify' ? 'translateY(0)' : 'translateY(20px)',
                        pointerEvents: whatsappSetupStep === 'verify' ? 'auto' : 'none',
                        position: whatsappSetupStep === 'verify' ? 'relative' : 'absolute',
                        width: '100%',
                        minHeight: '300px'
                      }}
                    >
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ 
                          marginBottom: 20,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: '#25D366',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 8
                          }}>
                            <WhatsAppOutlined style={{ fontSize: 24, color: '#ffffff' }} />
                          </div>
                        </div>

                        <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                          Verification Code Sent
                        </Title>
                        
                        <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 16 }}>
                          We've sent a 6-digit verification code to your WhatsApp
                        </Text>
                        
                        <Text strong style={{ fontSize: 16, color: '#1890ff', display: 'block', marginBottom: 20 }}>
                          {user?.phoneNumber ? WhatsAppAuthenticator.maskPhoneNumber(user.phoneNumber) : 'Your phone'}
                        </Text>

                        <div style={{ marginBottom: 20 }}>
                          <Space size={8} className={whatsappShake ? 'shake' : ''}>
                            {whatsappCode.map((digit, index) => (
                              <Input
                                key={index}
                                id={`whatsapp-input-${index}`}
                                ref={index === 0 ? whatsappInputRef : null}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleWhatsAppCodeChange(index, e.target.value)}
                                onKeyDown={(e) => handleWhatsAppCodeKeyDown(index, e.key)}
                                style={{
                                  width: 45,
                                  height: 45,
                                  textAlign: 'center',
                                  fontSize: 18,
                                  fontWeight: 'bold',
                                  borderRadius: '8px',
                                  border: '2px solid #d9d9d9',
                                  transition: 'all 0.3s ease'
                                }}
                              />
                            ))}
                          </Space>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                          <Text type="secondary" style={{ fontSize: 14 }}>
                            Code expires in: {whatsappCodeExpiresAt ? WhatsAppAuthenticator.formatRemainingTime(whatsappCodeExpiresAt) : 'Loading...'}
                          </Text>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                          <Space size="large">
                            {whatsappCodeExpiresAt && Date.now() > whatsappCodeExpiresAt ? (
                              <Button 
                                type="primary" 
                                size="large"
                                onClick={handleSetupWhatsApp}
                                loading={whatsappLoading}
                                style={{ minWidth: 120 }}
                              >
                                Resend Code
                              </Button>
                            ) : (
                              <Button 
                                type="primary" 
                                size="large"
                                onClick={handleVerifyWhatsApp}
                                loading={whatsappLoading}
                                style={{ minWidth: 120 }}
                              >
                                Verify
                              </Button>
                            )}
                            <Button 
                              type="default" 
                              size="large"
                              onClick={handleCancelWhatsAppSetup}
                              style={{ minWidth: 100 }}
                            >
                              Cancel
                            </Button>
                          </Space>
                        </div>

                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          <Text type="secondary">
                            Didn't receive the code? Check your WhatsApp messages or make sure your phone number is correct.
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'authenticator',
                label: (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    transition: 'all 0.3s ease'
                  }}>
                    <QrcodeOutlined style={{ 
                      fontSize: 18, 
                      color: twoFactorMethod === 'authenticator' ? '#52c41a' : '#8c8c8c',
                      transition: 'color 0.3s ease'
                    }} />
                    <Text strong style={{ 
                      color: twoFactorMethod === 'authenticator' ? '#52c41a' : '#262626',
                      transition: 'color 0.3s ease'
                    }}>
                      Authenticator App
                    </Text>
                    {twoFactorMethod === 'authenticator' && (
                      <CheckCircleFilled 
                        style={{ 
                          color: '#52c41a', 
                          fontSize: 16,
                          animation: 'fadeIn 0.5s ease'
                        }} 
                      />
                    )}
                  </div>
                ),
                children: (
                  <div>
                    {/* Default State */}
                    <div 
                      style={{
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: authenticatorSetupStep === 'setup' ? 1 : 0,
                        transform: authenticatorSetupStep === 'setup' ? 'translateY(0)' : 'translateY(-20px)',
                        pointerEvents: authenticatorSetupStep === 'setup' ? 'auto' : 'none',
                        position: authenticatorSetupStep === 'setup' ? 'relative' : 'absolute',
                        width: '100%'
                      }}
                    >
                      <Alert
                        message="Authenticator App"
                        description="Use Google Authenticator, Authy, or similar apps to generate verification codes."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />

                      {!twoFactorMethod || twoFactorMethod !== 'authenticator' ? (
                        <Button 
                          type="primary" 
                          size="large"
                          onClick={handleSetupAuthenticator}
                          loading={authenticatorLoading}
                        >
                          Setup Authenticator App
                        </Button>
                      ) : (
                        <div>
                          <Alert
                            message="Authenticator App Enabled"
                            description="Your account is protected with authenticator app verification codes."
                            type="success"
                            showIcon
                            style={{ marginBottom: 16 }}
                          />
                          <Space>
                            <Button 
                              type="default" 
                              size="large"
                              onClick={handleCancelAuthenticatorSetup}
                            >
                              Disable Authenticator
                            </Button>
                          </Space>
                        </div>
                      )}
                    </div>

                    {/* Verification State */}
                    <div 
                      style={{
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: authenticatorSetupStep === 'verify' ? 1 : 0,
                        transform: authenticatorSetupStep === 'verify' ? 'translateY(0)' : 'translateY(20px)',
                        pointerEvents: authenticatorSetupStep === 'verify' ? 'auto' : 'none',
                        position: authenticatorSetupStep === 'verify' ? 'relative' : 'absolute',
                        width: '100%',
                        minHeight: '400px'
                      }}
                    >
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ 
                          marginBottom: 20,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: '#f0f8ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 8
                          }}>
                            <QrcodeOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                          </div>
                        </div>

                        <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                          Setup Authenticator App
                        </Title>
                        
                        <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 16 }}>
                          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                        </Text>
                        
                        {authenticatorQRCode && (
                          <div style={{ marginBottom: 20 }}>
                            <img 
                              src={authenticatorQRCode} 
                              alt="Authenticator QR Code" 
                              style={{ 
                                maxWidth: 200, 
                                maxHeight: 200,
                                border: '1px solid #d9d9d9',
                                borderRadius: 8
                              }} 
                            />
                          </div>
                        )}

                        <div style={{ marginBottom: 20 }}>
                          <Input
                            placeholder="Enter 6-digit code"
                            value={authenticatorVerificationCode}
                            onChange={(e) => setAuthenticatorVerificationCode(e.target.value.replace(/\D/g, ''))}
                            maxLength={6}
                            size="large"
                            style={{ 
                              width: 200, 
                              textAlign: 'center',
                              fontSize: 16,
                              fontWeight: 'bold',
                              letterSpacing: '2px'
                            }}
                            className={authenticatorShake ? 'shake' : ''}
                          />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                          <Space size="large">
                            <Button 
                              type="primary" 
                              size="large"
                              onClick={handleVerifyAuthenticator}
                              loading={authenticatorLoading}
                              style={{ minWidth: 120 }}
                            >
                              Verify
                            </Button>
                            <Button 
                              type="default" 
                              size="large"
                              onClick={handleCancelAuthenticatorSetup}
                              style={{ minWidth: 100 }}
                            >
                              Cancel
                            </Button>
                          </Space>
                        </div>

                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          <Text type="secondary">
                            Enter the 6-digit code from your authenticator app to complete the setup.
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              }
            ]}
          />
        )}
      </div>
    </Drawer>
  );
}
