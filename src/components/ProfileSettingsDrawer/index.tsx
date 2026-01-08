import { useState, useEffect } from "react";
import { Drawer, Form, Input, Button, Avatar, Upload, Space, Typography, Switch, Tabs, Divider, Card, Badge, Tooltip, Alert, List, Tag, Select, Collapse, Modal } from "antd";
import { UserOutlined, LinkOutlined, GoogleOutlined, MessageOutlined, AlertFilled, WarningTwoTone, WarningFilled, CheckCircleFilled, CaretRightOutlined, WalletOutlined, WarningOutlined, MailOutlined, PhoneOutlined, SafetyOutlined, MobileOutlined, QrcodeOutlined } from "@ant-design/icons";
import { User, authAPI } from '../../services/api';
import { FileHandler } from '../../utils/FileHandler';
import { AuthenticatorApp, QRCodeGenerator } from '../../utils/AuthenticatorApp';
import { SMSAuthenticator, SMSVerificationSession } from '../../utils/SMSAuthenticator';
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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageData, setProfileImageData] = useState<{
    base64: string;
    fileName: string;
    fileType: string;
  } | null>(null);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  
  // SMS 2FA State
  const [smsCode, setSmsCode] = useState(['', '', '', '', '', '']);
  const [smsSetupStep, setSmsSetupStep] = useState<'setup' | 'verify'>('setup');
  const [smsSessionId, setSmsSessionId] = useState<string | null>(null);
  const [smsCodeExpiresAt, setSmsCodeExpiresAt] = useState<number | null>(null);
  const [smsResendAvailable, setSmsResendAvailable] = useState(true);
  const [smsResendCountdown, setSmsResendCountdown] = useState(0);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsVerificationCode, setSmsVerificationCode] = useState('');
  
  // Authenticator 2FA State
  const [authenticatorCode, setAuthenticatorCode] = useState('');
  const [authenticatorSecret, setAuthenticatorSecret] = useState('');
  const [authenticatorQRCode, setAuthenticatorQRCode] = useState('');
  const [authenticatorSetupStep, setAuthenticatorSetupStep] = useState<'setup' | 'verify'>('setup');
  const [authenticatorLoading, setAuthenticatorLoading] = useState(false);
  const [authenticatorVerificationCode, setAuthenticatorVerificationCode] = useState('');
  
  // Backup Codes State
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodesGenerated, setBackupCodesGenerated] = useState(false);
  const [backupCodesLoading, setBackupCodesLoading] = useState(false);
  
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
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'authenticator' | null>(null);
  const [active2FAKey, setActive2FAKey] = useState<string | string[]>([]);
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
      form.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber
      });
      
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
      
      // Update resend countdown
      if (smsResendCountdown > 0) {
        setSmsResendCountdown(prev => prev - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [smsCodeExpiresAt, smsResendCountdown]);

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
        // You could show an error message to the user here
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
      const session = new SMSVerificationSession();
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
        
        console.log('SMS sent successfully to:', SMSAuthenticator.maskPhoneNumber(user.phoneNumber));
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
    if (!smsVerificationCode || !smsSessionId) {
      console.error('Missing verification code or session');
      return;
    }

    // Check if code has expired
    if (smsCodeExpiresAt && Date.now() > smsCodeExpiresAt) {
      alert('Verification code has expired. Please request a new code.');
      return;
    }

    setSmsLoading(true);
    try {
      const session = new SMSVerificationSession();
      const isValid = session.verifyCode(smsSessionId, smsVerificationCode);

      if (isValid) {
        // TODO: Save to backend
        console.log('SMS authentication setup successful!');
        setTwoFactorMethod('sms');
        setTwoFactorEnabled(true);
        setSmsSetupStep('setup');
        setSmsVerificationCode('');
        setSmsSessionId('');
        setSmsCodeExpiresAt(0);
        setSmsResendAvailable(true);
        setSmsResendCountdown(0);
      } else {
        console.error('Invalid verification code');
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Failed to verify SMS:', error);
      alert('Failed to verify SMS code. Please try again.');
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
      const session = new SMSVerificationSession();
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

  // Backup Codes Functions
  const handleGenerateBackupCodes = async () => {
    setBackupCodesLoading(true);
    try {
      // Generate 10 backup codes
      const codes = AuthenticatorApp.generateBackupCodes(10);
      setBackupCodes(codes);
      setBackupCodesGenerated(true);
      setShowBackupCodes(true);
      
      console.log('Backup codes generated successfully');
      alert('Backup codes generated! Please save them in a secure location.');
    } catch (error) {
      console.error('Failed to generate backup codes:', error);
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
      setShowBackupCodes(false);
      setBackupCodesGenerated(false);
      handleGenerateBackupCodes();
    }
  };

  return (
    <Drawer
      title="My Profile Settings"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="profile-settings-drawer"
    >
      <Tabs
        defaultActiveKey="profile"
        items={[
          {
            key: 'profile',
            label: 'Profile',
            children: (
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
                      />
                    </Input.Group>
                  </Form.Item>

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
            ),
          },
          {
            key: 'linked',
            label: 'Accounts',
            children: (
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
            ),
          },
          {
            key: 'security',
            label: 'Security',
            children: (
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
            ),
          },
          {
            key: '2fa',
            label: '2FA',
            children: (
              <div className="twofa-content">
                {/* 2FA Status Card */}
                <Card className="twofa-card" title="Two-Factor Authentication" size="small">
                  <div className="twofa-status">
                    <Alert
                      message={twoFactorEnabled ? "2FA is Enabled" : "2FA is Disabled"}
                      description={twoFactorEnabled 
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
                            padding: '12px 0',
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

                            {/* SMS Setup Modal */}
                            {twoFactorMethod === 'sms' && smsSetupStep === 'verify' && (
                              <Card size="small" style={{ marginTop: 16 }}>
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                  <div style={{ 
                                    backgroundColor: '#e6f7ff', 
                                    border: '1px solid #91d5ff',
                                    borderRadius: 8,
                                    padding: 20,
                                    marginBottom: 24
                                  }}>
                                    <MobileOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 12 }} />
                                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>
                                      Verification Code Sent
                                    </div>
                                    <div style={{ fontSize: 14, color: '#595959' }}>
                                      We've sent a 6-digit verification code to:
                                    </div>
                                    <div style={{ 
                                      marginTop: 8,
                                      fontSize: 16,
                                      fontWeight: 'bold',
                                      color: '#1890ff'
                                    }}>
                                      {user?.phoneNumber ? SMSAuthenticator.maskPhoneNumber(user.phoneNumber) : 'Your phone number'}
                                    </div>
                                  </div>

                                  <div style={{ marginBottom: 20 }}>
                                    <Text strong style={{ fontSize: 16 }}>Enter verification code:</Text>
                                    <div style={{ 
                                      display: 'flex', 
                                      gap: 8, 
                                      justifyContent: 'center',
                                      marginTop: 16,
                                      maxWidth: 320,
                                      margin: '16px auto 0'
                                    }}>
                                      {[0, 1, 2, 3, 4, 5].map((index) => (
                                        <Input
                                          key={index}
                                          size="large"
                                          maxLength={1}
                                          value={smsVerificationCode[index] || ''}
                                          onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            const newCode = smsVerificationCode.split('');
                                            newCode[index] = value;
                                            const updatedCode = newCode.join('');
                                            setSmsVerificationCode(updatedCode);
                                            
                                            // Auto-focus next input
                                            if (value && index < 5) {
                                              const nextInput = document.getElementById(`sms-input-${index + 1}`);
                                              if (nextInput) {
                                                (nextInput as HTMLInputElement).focus();
                                              }
                                            }
                                          }}
                                          onKeyDown={(e) => {
                                            // Handle backspace to go to previous input
                                            if (e.key === 'Backspace' && !smsVerificationCode[index] && index > 0) {
                                              const prevInput = document.getElementById(`sms-input-${index - 1}`);
                                              if (prevInput) {
                                                (prevInput as HTMLInputElement).focus();
                                              }
                                            }
                                          }}
                                          id={`sms-input-${index}`}
                                          style={{ 
                                            width: 40, 
                                            height: 48,
                                            textAlign: 'center',
                                            fontSize: 18,
                                            fontWeight: 'bold'
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  <div style={{ marginBottom: 20 }}>
                                    <Text type="secondary" style={{ fontSize: 14 }}>
                                      Code expires in: {smsCodeExpiresAt ? SMSAuthenticator.formatRemainingTime(smsCodeExpiresAt) : 'Loading...'}
                                    </Text>
                                  </div>

                                  <div style={{ marginBottom: 20 }}>
                                    <Space size="large">
                                      <Button 
                                        type="primary" 
                                        size="large"
                                        onClick={handleVerifySMS}
                                        loading={smsLoading}
                                        disabled={smsVerificationCode.length !== 6}
                                        style={{ minWidth: 100 }}
                                      >
                                        Verify
                                      </Button>
                                      <Button 
                                        size="large"
                                        onClick={handleResendSMS}
                                        loading={smsLoading}
                                        disabled={!smsResendAvailable}
                                        style={{ minWidth: 100 }}
                                      >
                                        {smsResendAvailable ? 'Resend Code' : `Resend (${smsResendCountdown}s)`}
                                      </Button>
                                      <Button 
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
                              </Card>
                            )}
                          </div>
                        )
                      },
                      {
                        key: 'authenticator',
                        label: (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 12,
                            padding: '12px 0',
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

                            {/* Authenticator Setup Modal */}
                            {twoFactorMethod === 'authenticator' && authenticatorSetupStep === 'verify' && (
                              <Card size="small" style={{ marginTop: 16 }}>
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                  <Alert
                                    message="Setup Authenticator App"
                                    description="Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)"
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 20 }}
                                  />
                                  
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

                                  <div style={{ marginBottom: 16 }}>
                                    <Text strong>Or enter this code manually:</Text>
                                    <div style={{ 
                                      marginTop: 8,
                                      padding: 8,
                                      backgroundColor: '#f5f5f5',
                                      borderRadius: 4,
                                      fontFamily: 'monospace',
                                      fontSize: 14,
                                      wordBreak: 'break-all'
                                    }}>
                                      {authenticatorSecret}
                                    </div>
                                  </div>

                                  <Divider />

                                  <div>
                                    <Text strong>Enter verification code:</Text>
                                    <Input
                                      size="large"
                                      placeholder="000000"
                                      maxLength={6}
                                      value={authenticatorVerificationCode}
                                      onChange={(e) => setAuthenticatorVerificationCode(e.target.value.replace(/\D/g, ''))}
                                      style={{ marginTop: 8, maxWidth: 200, margin: '8px auto', display: 'block' }}
                                    />
                                  </div>

                                  <div style={{ marginTop: 20 }}>
                                    <Space>
                                      <Button 
                                        type="primary" 
                                        size="large"
                                        onClick={handleVerifyAuthenticator}
                                        loading={authenticatorLoading}
                                        disabled={authenticatorVerificationCode.length !== 6}
                                      >
                                        Verify
                                      </Button>
                                      <Button 
                                        size="large"
                                        onClick={handleRefreshAuthenticator}
                                        loading={authenticatorLoading}
                                      >
                                        Refresh QR Code
                                      </Button>
                                      <Button 
                                        size="large"
                                        onClick={handleCancelAuthenticatorSetup}
                                      >
                                        Cancel
                                      </Button>
                                    </Space>
                                  </div>

                                  <div style={{ marginTop: 16, fontSize: 12, color: '#8c8c8c' }}>
                                    <Text type="secondary">
                                      Current TOTP code: {authenticatorSecret ? AuthenticatorApp.generateTOTP(authenticatorSecret) : '------'} (changes every 30 seconds)
                                    </Text>
                                  </div>
                                </div>
                              </Card>
                            )}
                          </div>
                        )
                      },
                      {
                        key: 'backup',
                        label: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <SafetyOutlined style={{ fontSize: 18 }} />
                            <Text strong>Backup Codes</Text>
                          </div>
                        ),
                        children: (
                          <div>
                            <Alert
                              message="Backup Codes"
                              description="Generate backup codes to access your account if you lose your authentication device."
                              type="info"
                              showIcon
                              style={{ marginBottom: 16 }}
                            />
                            
                            {!backupCodesGenerated ? (
                              <Button 
                                type="default" 
                                size="large" 
                                icon={<SafetyOutlined />}
                                onClick={handleGenerateBackupCodes}
                                loading={backupCodesLoading}
                              >
                                Generate Backup Codes
                              </Button>
                            ) : (
                              <div>
                                {showBackupCodes && (
                                  <div style={{ marginBottom: 16 }}>
                                    <Alert
                                      message="Important!"
                                      description="Save these backup codes in a secure location. Each code can only be used once."
                                      type="warning"
                                      showIcon
                                      style={{ marginBottom: 16 }}
                                    />
                                    
                                    <div style={{ 
                                      backgroundColor: '#f5f5f5', 
                                      padding: 16, 
                                      borderRadius: 8,
                                      fontFamily: 'monospace',
                                      fontSize: 14,
                                      maxHeight: 200,
                                      overflowY: 'auto'
                                    }}>
                                      {backupCodes.map((code, index) => (
                                        <div key={index} style={{ 
                                          display: 'flex', 
                                          justifyContent: 'space-between', 
                                          alignItems: 'center',
                                          padding: '4px 0',
                                          borderBottom: index < backupCodes.length - 1 ? '1px solid #e0e0e0' : 'none'
                                        }}>
                                          <span>{index + 1}. {code}</span>
                                          <Button 
                                            size="small" 
                                            type="link"
                                            onClick={() => {
                                              navigator.clipboard.writeText(code);
                                              alert('Code copied to clipboard!');
                                            }}
                                          >
                                            Copy
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <Space>
                                  {!showBackupCodes && (
                                    <Button 
                                      type="primary" 
                                      size="large"
                                      onClick={() => setShowBackupCodes(true)}
                                    >
                                      Show Backup Codes
                                    </Button>
                                  )}
                                  
                                  {showBackupCodes && (
                                    <>
                                      <Button 
                                        size="large"
                                        onClick={handleCopyBackupCodes}
                                      >
                                        Copy All
                                      </Button>
                                      <Button 
                                        size="large"
                                        onClick={handleDownloadBackupCodes}
                                      >
                                        Download
                                      </Button>
                                    </>
                                  )}
                                  
                                  <Button 
                                    size="large"
                                    onClick={handleRegenerateBackupCodes}
                                    danger
                                  >
                                    Regenerate
                                  </Button>
                                </Space>
                                
                                {showBackupCodes && (
                                  <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
                                    <Text type="secondary">
                                      Generated: {new Date().toLocaleString()} | Keep these codes safe and secure
                                    </Text>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      }
                    ]}
                  />
                )}
              </div>
            ),
          },
          {
            key: 'tokens',
            label: 'Tokens',
            children: (
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
              </div>
            ),
          },
        ]}
      />
      
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
