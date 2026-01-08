import { useState, useEffect, useRef } from "react";
import { Drawer, Form, Input, Button, Avatar, Upload, Space, Typography, Switch, Tabs, Divider, Card, Badge, Tooltip, Alert, List, Tag, Select, Collapse, Modal, Spin } from "antd";
import { UserOutlined, LinkOutlined, GoogleOutlined, MessageOutlined, AlertFilled, WarningTwoTone, WarningFilled, CheckCircleFilled, CaretRightOutlined, WalletOutlined, WarningOutlined, MailOutlined, PhoneOutlined, SafetyOutlined, MobileOutlined, QrcodeOutlined, WhatsAppOutlined, CopyOutlined } from "@ant-design/icons";
import { User, authAPI } from '../../services/api';
import { FileHandler } from '../../utils/FileHandler';
import { AuthenticatorApp, QRCodeGenerator } from '../../utils/AuthenticatorApp';
import { SMSAuthenticator, SMSVerificationSession, WhatsAppAuthenticator, WhatsAppVerificationSession } from '../../utils/SMSAuthenticator';
import { GoogleAuth } from '../../utils/GoogleAuth';
import { TelegramAuth } from '../../utils/TelegramAuth';
import { DerivAuth } from '../../utils/DerivAuth';
import { useDeriv } from '../../hooks/useDeriv.tsx';
import derivLogo from '../../assets/deriv-logo.svg';
import "./styles.scss";

const { Title, Text } = Typography;

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

interface ProfileSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export function ProfileSettingsDrawer({ visible, onClose, user }: ProfileSettingsDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modificationRequestStatus, setModificationRequestStatus] = useState<'idle' | 'loading' | 'pending'>('idle');
  
  const handleRequestModification = () => {
    setModificationRequestStatus('loading');
    
    // Simulate API call for 3 seconds
    setTimeout(() => {
      setModificationRequestStatus('pending');
    }, 3000);
  };
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageData, setProfileImageData] = useState<{
    base64: string;
    fileName: string;
    fileType: string;
  } | null>(null);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);

  // SMS State
  const [smsCode, setSmsCode] = useState(['', '', '', '', '', '']);
  const [smsSetupStep, setSmsSetupStep] = useState<'setup' | 'verify'>('setup');
  const [smsSessionId, setSmsSessionId] = useState<string | null>(null);
  const [smsCodeExpiresAt, setSmsCodeExpiresAt] = useState<number | null>(null);
  const [smsResendAvailable, setSmsResendAvailable] = useState(true);
  const [smsResendCountdown, setSmsResendCountdown] = useState(0);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsVerificationCode, setSmsVerificationCode] = useState('');
  const [smsShake, setSmsShake] = useState(false);

  // WhatsApp State
  const [whatsappCode, setWhatsappCode] = useState(['', '', '', '', '', '']);
  const [whatsappSetupStep, setWhatsappSetupStep] = useState<'setup' | 'verify'>('setup');
  const [whatsappSessionId, setWhatsappSessionId] = useState<string | null>(null);
  const [whatsappCodeExpiresAt, setWhatsappCodeExpiresAt] = useState<number | null>(null);
  const [whatsappResendAvailable, setWhatsappResendAvailable] = useState(true);
  const [whatsappResendCountdown, setWhatsappResendCountdown] = useState(0);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappVerificationCode, setWhatsappVerificationCode] = useState('');
  const [whatsappShake, setWhatsappShake] = useState(false);

  // WhatsApp Input Refs
  const whatsappInputRef = useRef<any>(null);

  // Authenticator 2FA State
  const [authenticatorCode, setAuthenticatorCode] = useState('');
  const [authenticatorSecret, setAuthenticatorSecret] = useState('');
  const [authenticatorQRCode, setAuthenticatorQRCode] = useState('');
  const [authenticatorSetupStep, setAuthenticatorSetupStep] = useState<'setup' | 'verify'>('setup');
  const [authenticatorLoading, setAuthenticatorLoading] = useState(false);
  const [authenticatorVerificationCode, setAuthenticatorVerificationCode] = useState('');
  const [authenticatorShake, setAuthenticatorShake] = useState(false);
  
  // Backup Codes State
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodesGenerated, setBackupCodesGenerated] = useState(false);
  const [backupCodesLoading, setBackupCodesLoading] = useState(false);
  const [backupCodesSetupStep, setBackupCodesSetupStep] = useState<'setup' | 'view'>('setup');
  const [backupCodesShake, setBackupCodesShake] = useState(false);
  
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

  // Local state for UI controls
  const [passwordForm] = Form.useForm();
  const [resetLoading, setResetLoading] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    code: '+263',
    flag: '🇿🇼',
    name: 'Zimbabwe'
  });
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

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      console.log('ProfileSettingsDrawer - User data:', user);
      console.log('ProfileSettingsDrawer - Phone number:', user.phoneNumber);
      form.setFieldsValue(user);
      
      // Set profile image from user's photoURL if available
      if (user.accounts?.firebase?.photoURL) {
        setProfileImage(user.accounts.firebase.photoURL);
      }
    }
  }, [user, form]);

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

  // Helper function to start resend countdown
  const startResendCountdown = () => {
    setSmsResendCountdown(60); // 60 seconds countdown
    setSmsResendAvailable(false);
  };

  const handleProfileImageUpload = async (file: File) => {
    try {
      // Validate the file
      if (!FileHandler.validateImageFile(file)) {
        throw new Error('Invalid file type or size. Please upload a valid image (JPEG, PNG, GIF, WebP) under 5MB.');
      }

      // Handle file upload and convert to base64
      const fileData = await FileHandler.handleFileUpload(file);
      
      // Create data URL for display
      const dataUrl = FileHandler.createDataUrl(fileData.base64, fileData.fileType);
      
      // Update state
      setProfileImage(dataUrl);
      setProfileImageData(fileData);
      
      console.log('Profile image uploaded successfully:', {
        fileName: fileData.fileName,
        fileType: fileData.fileType,
        base64Length: fileData.base64.length,
        profileImageData
      });
      
    } catch (error) {
      console.error('Profile image upload failed:', error);
      // You could show an error message to the user here
      throw error;
    }
  };

  const handleCustomUpload = async (options: any) => {
    const { file } = options;
    
    try {
      await handleProfileImageUpload(file);
      options.onSuccess('Upload successful');
    } catch (error) {
      console.error('Upload failed:', error);
      options.onError(error);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      // Prepare profile data including image if updated
      const profileData = {
        ...values,
        ...(profileImageData && {
          profileImage: {
            base64: profileImageData.base64,
            fileName: profileImageData.fileName,
            fileType: profileImageData.fileType
          }
        })
      };

      // TODO: Implement API call to update profile
      console.log('Updating profile:', profileData);
      
      // If there's a profile image, log its details
      if (profileImageData) {
        console.log('Profile image to upload:', {
          fileName: profileImageData.fileName,
          fileType: profileImageData.fileType,
          base64Size: profileImageData.base64.length
        });
      }
      
      // await authAPI.updateProfile(profileData);
      
      // Show success message
      // You can use antd message here
      console.log('Profile updated successfully');
      
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error message
      console.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

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

  const sendEmailVerificationLink = async () => {
    const response = await authAPI.sendVerificationEmail();
    console.log("EMAIL VERIFICATION LINK SENT RESPONSE", response);
  }

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
      setTwoFactorMethod('authenticator'); // This is the key fix!
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

  const handleRefreshAuthenticator = async () => {
    setAuthenticatorLoading(true);
    try {
      // Generate new secret key
      const secret = AuthenticatorApp.generateSecret();
      setAuthenticatorSecret(secret);

      // Generate new QR code data
      const qrData = AuthenticatorApp.generateQRCodeData(
        secret,
        user?.email || 'user@example.com',
        'Koppo App'
      );

      // Generate new QR code image
      const qrImage = await QRCodeGenerator.generateQRCode(qrData);
      setAuthenticatorQRCode(qrImage);

      // Clear verification code
      setAuthenticatorVerificationCode('');
      
      console.log('Authenticator QR code refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh authenticator:', error);
      alert('Failed to refresh authenticator. Please try again.');
    } finally {
      setAuthenticatorLoading(false);
    }
  };

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
        setTwoFactorMethod('sms'); // This is the key fix!
        
        // Start countdown timer
        startResendCountdown();
        
        // Reset SMS code inputs
        setSmsCode(['', '', '', '', '', '']);
        setSmsVerificationCode('');
        
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
        setSmsVerificationCode('');
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
          setSmsVerificationCode(''); // Clear previous code
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
    setSmsVerificationCode('');
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
        setWhatsappVerificationCode('');
        
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
        setWhatsappVerificationCode('');
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
          setWhatsappVerificationCode(''); // Clear previous code
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
    setWhatsappVerificationCode('');
    setWhatsappSessionId('');
    setWhatsappCodeExpiresAt(0);
    setWhatsappResendAvailable(true);
    setWhatsappResendCountdown(0);
    setTwoFactorMethod(null);
  };

  // Helper function to start WhatsApp resend countdown
  const startWhatsAppResendCountdown = () => {
    setWhatsappResendCountdown(60); // 60 seconds countdown
    setWhatsappResendAvailable(false);
  };

  // Backup Codes Functions
  const handleGenerateBackupCodes = async () => {
    setBackupCodesLoading(true);
    try {
      // Generate 10 backup codes
      const codes = AuthenticatorApp.generateBackupCodes(10);
      setBackupCodes(codes);
      setBackupCodesGenerated(true);
      setBackupCodesSetupStep('view');
      
      console.log('Backup codes generated successfully');
      alert('Backup codes generated! Please save them in a secure location.');
    } catch (error) {
      console.error('Failed to generate backup codes:', error);
      // Trigger shake effect
      setBackupCodesShake(true);
      setTimeout(() => setBackupCodesShake(false), 500);
      alert('Failed to generate backup codes. Please try again.');
    } finally {
      setBackupCodesLoading(false);
    }
  };

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;

    const codesText = `Koppo App Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nKeep these codes in a safe location. Each code can only be used once.`;
    
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `koppo-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Backup codes downloaded successfully');
  };

  const handleCopyBackupCodes = () => {
    if (backupCodes.length === 0) return;

    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText).then(() => {
      console.log('Backup codes copied to clipboard');
      alert('Backup codes copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy backup codes:', err);
      alert('Failed to copy backup codes. Please try again.');
    });
  };

  const handleRegenerateBackupCodes = () => {
    if (confirm('This will invalidate your previous backup codes. Are you sure you want to generate new ones?')) {
      setBackupCodes([]);
      setBackupCodesGenerated(false);
      setBackupCodesSetupStep('setup');
      handleGenerateBackupCodes();
    }
  };

  return (
    <Drawer
      title="My Profile"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="profile-settings-drawer"
    >
      
              <div className="profile-settings-content">
                {/* Profile Picture Section */}
                <div className="profile-picture-section">
                  <div className="profile-picture-upload">
                    <Upload
                      name="avatar"
                      listType="picture-card"
                      className="avatar-uploader"
                      showUploadList={false}
                      customRequest={handleCustomUpload}
                      accept="image/*"
                    >
                      {profileImage ? (
                        <Avatar src={profileImage} size={80} />
                      ) : (
                        <Avatar icon={<UserOutlined />} size={80} />
                      )}
                    </Upload>
                    <Title level={4} style={{fontSize: 24, margin: 0}}>{user?.displayName}</Title>
                    <Text style={{fontSize: 16, margin: 0}}><code>Koppo ID: {user?.uuid.split('-')[0].toUpperCase()}</code></Text>
                  </div>
                </div>

                <Divider />

                {/* Profile Information Form */}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  className="profile-form"
                >
                  <Form.Item
                    label="First Name"
                    name="firstName"
                    rules={[{ required: true, message: 'Please enter your first name' }]}
                  >
                    <Input size="large" />
                  </Form.Item>

                  <Form.Item
                    label="Last Name"
                    name="lastName"
                    rules={[{ required: true, message: 'Please enter your last name' }]}
                  >
                    <Input size="large" />
                  </Form.Item>

                  <Form.Item
                    label="Display Name"
                    name="displayName"
                    rules={[{ required: true, message: 'Please enter your display name' }]}
                  >
                    <Input size="large" />
                  </Form.Item>

                  <Form.Item
                    label="Username"
                    name="username"
                    rules={[{ required: true, message: 'Please enter your username' }]}
                  >
                    <Input size="large" disabled={true} prefix={<UserOutlined />} />
                  </Form.Item>

                  <Form.Item
                    label="Email Address"
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter your email' },
                      { type: 'email', message: 'Please enter a valid email' }
                    ]}
                  >
                    <Input 
                      size="large" 
                      disabled={user?.isEmailVerified}
                      prefix={<MailOutlined />}
                      suffix={
                        !user?.isEmailVerified ? (
                          <Button 
                            type="link" 
                            onClick={()=>sendEmailVerificationLink()} 
                            size="small" 
                            style={{color: "#fa8c16", padding: 0, height: 'auto'}}
                          >
                            <WarningOutlined style={{color: "#fa8c16"}} /> Verify
                          </Button>
                        ) : (
                          <Tooltip title="Email Verified">
                            <CheckCircleFilled style={{color: "#00df6fff"}} />
                          </Tooltip>
                        )
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    label={<>Phone Number</>}
                    name="phoneNumber"
                    rules={[{ required: true, message: 'Please enter your phone number' }]}
                  >
                    <Input.Group compact>
                      <Select
                        size="large"
                        value={`${selectedCountry.flag} ${selectedCountry.code}`}
                        onChange={(value) => {
                          const country = countries.find(c => `${c.flag} ${c.code}` === value);
                          if (country) setSelectedCountry(country);
                        }}
                        style={{ width: '30%' }}
                        showSearch
                        filterOption={(input, option) =>
                          option?.children?.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {countries.map(country => (
                          <Select.Option key={country.code} value={`${country.flag} ${country.code}`}>
                            {country.flag} {country.code}
                          </Select.Option>
                        ))}
                      </Select>
                      <Input
                        size="large"
                        style={{ width: '70%' }}
                        placeholder="772890123"
                        prefix={<PhoneOutlined />}
                        disabled={true}
                        value={form.getFieldValue('phoneNumber')}
                      />
                    </Input.Group>
                  </Form.Item>

                  <Alert
                    message={
                      modificationRequestStatus === 'pending' 
                        ? "Request Pending Authorization"
                        : "Request Profile Modifications"
                    }
                    description={
                      <div>
                        {modificationRequestStatus === 'idle' && (
                          <>
                            <p>To modify your email address, username, or phone number, you need to submit a request for approval.</p>
                            <Button 
                              block
                              type="primary"
                              style={{ 
                                backgroundColor: '#fa8c16',
                                borderColor: '#fa8c16',
                                marginTop: '12px'
                              }}
                              onClick={handleRequestModification}
                            >
                              Request Modification
                            </Button>
                          </>
                        )}
                        {modificationRequestStatus === 'loading' && (
                          <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <Spin size="large" />
                            <p style={{ marginTop: '16px', marginBottom: 0 }}>Submitting your request...</p>
                          </div>
                        )}
                        {modificationRequestStatus === 'pending' && (
                          <p>Your modification request has been submitted and is pending authorization. You will be notified once it's approved.</p>
                        )}
                      </div>
                    }
                    type={modificationRequestStatus === 'pending' ? 'info' : 'warning'}
                    showIcon
                    style={{ marginBottom: '24px' }}
                  />

                  <Form.Item style={{ marginTop: '32px' }}>
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading} 
                        size="large"
                        style={{ flex: 1, width: '50%' }}
                      >
                        Update Profile
                      </Button>
                      <Button 
                        onClick={onClose} 
                        size="large"
                        style={{ flex: 1, width: '50%' }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form.Item>
                </Form>
              </div>
    </Drawer>
  );
}
