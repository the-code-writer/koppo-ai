import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { BottomActionSheet } from "../BottomActionSheet";
import { ProfileSettingsDrawer } from "../ProfileSettingsDrawer";
import { PasswordSettingsDrawer } from "../PasswordSettingsDrawer";
import { LinkedAccountsSettingsDrawer } from "../LinkedAccountsSettingsDrawer";
import TwoFASettingsDrawer from "../2FASettingsDrawer";
import TokensSettingsDrawer from "../TokensSettingsDrawer";

import {
  LegacyOpenLink2pxIcon,
  StandaloneSunBrightBoldIcon,
  StandaloneMoonBoldIcon,
  StandaloneLanguageBoldIcon,
  StandaloneLifeRingBoldIcon,
  StandaloneRightFromBracketBoldIcon,
  StandaloneGearBoldIcon,
} from "@deriv/quill-icons";
import "./styles.scss";
import { DollarOutlined, HomeOutlined, LockOutlined, QrcodeOutlined, SafetyOutlined, TeamOutlined } from "@ant-design/icons";
import { Avatar, Flex } from "antd";

// Setting types
type SettingType = "theme" | "language" | "help" | "profile" | "passwords" | "accounts" | "2fa" | "tokens" | "cashier" | null;

// Language options with icons
const languages = [
  { label: "English", value: "en", icon: "🇺🇸" },
  { label: "中文", value: "zh", icon: "🇨🇳" },
  { label: "Español", value: "es", icon: "🇪🇸" },
  { label: "Français", value: "fr", icon: "🇫🇷" },
];

// Theme Selector Component
const ThemeSelector = ({
  currentTheme,
  onThemeSelect,
}: {
  currentTheme: string;
  onThemeSelect: (theme: "light" | "dark" | "system") => void;
}) => {
  const themeOptions = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    { label: "System", value: "system" },
  ];

  return (
    <div className="settings__action-sheet">
      <div className="settings__action-sheet-header">
        <h3>Theme</h3>
      </div>
      <div className="settings__action-sheet-list">
        {themeOptions.map((option) => (
          <div
            key={option.value}
            className={`settings__action-sheet-list-item ${currentTheme === option.value
                ? "settings__action-sheet-list-item--active"
                : ""
              }`}
            onClick={() => {
              if (currentTheme !== option.value) {
                onThemeSelect(option.value as "light" | "dark" | "system");
              }
            }}
          >
            <span className="settings__action-sheet-list-item-label">
              {option.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Language Selector Component
const LanguageSelector = ({
  currentLanguage,
  onLanguageChange,
  languages,
}: {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  languages: Array<{ label: string; value: string; icon: string }>;
}) => {
  return (
    <div className="settings__action-sheet">
      <div className="settings__action-sheet-header">
        <h3>Language</h3>
      </div>
      <div className="settings__action-sheet-list">
        {languages.map((lang) => (
          <div
            key={lang.value}
            className={`settings__action-sheet-list-item ${currentLanguage === lang.value
                ? "settings__action-sheet-list-item--active"
                : ""
              }`}
            onClick={() => onLanguageChange(lang.value)}
          >
            <span className="settings__action-sheet-list-item-icon">
              {lang.icon}
            </span>
            <span className="settings__action-sheet-list-item-label">
              {lang.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Help Center Component
const HelpCenter = () => {
  const helpOptions = [
    { label: "FAQ", value: "faq", url: "https://champion.trade/faq" },
    {
      label: "WhatsApp",
      value: "whatsapp",
      url: "https://wa.me/message/KPQFKKQZXEYPM1",
    },
    {
      label: "Live chat",
      value: "livechat",
      url: "https://champion.trade/livechat",
    },
  ];

  const handleHelpOptionClick = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="settings__action-sheet">
      <div className="settings__action-sheet-header">
        <h3>Help Centre</h3>
      </div>
      <div className="settings__action-sheet-list">
        {helpOptions.map((option) => (
          <div
            key={option.value}
            className="settings__action-sheet-list-item"
            onClick={() => handleHelpOptionClick(option.url)}
          >
            <span className="settings__action-sheet-list-item-label">
              {option.label}
            </span>
            <div className="settings__action-sheet-list-item-right">
              <LegacyOpenLink2pxIcon
                className="settings__menu-arrow"
                iconSize="xs"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function Settings() {
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [currentSetting, setCurrentSetting] = useState<SettingType>(null);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [profileDrawerVisible, setProfileDrawerVisible] = useState(false);
  const [passwordDrawerVisible, setPasswordDrawerVisible] = useState(false);
  const [accountsDrawerVisible, setAccountsDrawerVisible] = useState(false);
  const [twoFADrawerVisible, setTwoFADrawerVisible] = useState(false);
  const [tokensDrawerVisible, setTokensDrawerVisible] = useState(false);
  const [cashierDrawerVisible, setCashierDrawerVisible] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleGoHome = () => {
    window.open("https://champion.trade/", "_blank");
  };

  // Open action sheet for a specific setting
  const openActionSheet = (setting: SettingType) => {
    console.log(setting)
    switch (setting) {
      case "profile":
        setProfileDrawerVisible(true);
        setIsActionSheetOpen(false);
        break;
      case "passwords":
        setPasswordDrawerVisible(true);
        setIsActionSheetOpen(false);
        break;
      case "accounts":
        setAccountsDrawerVisible(true);
        setIsActionSheetOpen(false);
        break;
      case "2fa":
        setTwoFADrawerVisible(true);
        setIsActionSheetOpen(false);
        break;
      case "tokens":
        setTokensDrawerVisible(true);
        setIsActionSheetOpen(false);
        break;
      case "cashier":
        setCashierDrawerVisible(true);
        setIsActionSheetOpen(false);
        break;
      default:
        setCurrentSetting(setting);
        setIsActionSheetOpen(true);
        break;
    }
  };

  // Close action sheet
  const closeActionSheet = () => {
    setIsActionSheetOpen(false);
  };

  // Handle language change
  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
    // Here you would implement actual language change logic
    closeActionSheet();
  };

  // Handle theme change
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    closeActionSheet();
  };

  // Render content based on selected setting
  const renderActionSheetContent = () => {
    switch (currentSetting) {
      case "theme":
        return (
          <ThemeSelector
            currentTheme={theme}
            onThemeSelect={handleThemeChange}
          />
        );
      case "language":
        return (
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            languages={languages}
          />
        );
      case "help":
        return <HelpCenter />;
      case "profile":
        // Open profile drawer instead of showing action sheet content
        setProfileDrawerVisible(true);
        closeActionSheet();
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="settings">
      <div className="settings__container">
        <div className="settings__menu">

          {/* Profile Settings */}
          <div
            className="settings__menu-item"
            onClick={() => openActionSheet("profile")}
          >
            
          <Flex gap={20} style={{ width: "100%", backgroundColor: "rgba(128, 128, 128, 0.1)", border: "1px solid rgba(128, 128, 128, 0.3)", borderRadius: "8px", padding: "16px", margin: 0,marginBottom: 8}}>
            <Avatar size={48} src={user?.photoURL}></Avatar>
            <div><h2>{user?.displayName}</h2>
            <span>Account ID: <code>{user?.uuid.split('-')[0].toLocaleUpperCase()}</code></span></div>
          </Flex>
          </div>

          {/* Go to Home */}
          <div className="settings__menu-item" onClick={handleGoHome}>
            <div className="settings__menu-item-left">
              <HomeOutlined className="settings__menu-icon" style={{fontSize: 20}} />
              <span className="settings__menu-label">Go to Home</span>
            </div>
            <LegacyOpenLink2pxIcon
              className="settings__menu-arrow"
              iconSize="xs"
            />
          </div>

          {/* Password Settings */}
          <div
            className="settings__menu-item"
            onClick={() => openActionSheet("passwords")}
          >
            <div className="settings__menu-item-left">
              <LockOutlined className="settings__menu-icon" style={{fontSize: 20}} />
              <span className="settings__menu-label">My Passwords </span>
            </div>
          </div>

          {/* Linked Accounts Settings */}
          <div
            className="settings__menu-item"
            onClick={() => openActionSheet("accounts")}
          >
            <div className="settings__menu-item-left">
              <TeamOutlined className="settings__menu-icon" style={{fontSize: 20}} />
              <span className="settings__menu-label">Linked Accounts</span>
            </div>
          </div>

          {/* 2FA Settings */}
          <div
            className="settings__menu-item"
            onClick={() => openActionSheet("2fa")}
          >
            <div className="settings__menu-item-left">
              <QrcodeOutlined className="settings__menu-icon" style={{fontSize: 20}} />
              <span className="settings__menu-label">2 Factor Authentication (2FA)</span>
            </div>
          </div>

          {/* Sessions & Tokens Settings */}
          <div
            className="settings__menu-item"
            onClick={() => openActionSheet("tokens")}
          >
            <div className="settings__menu-item-left">
              <SafetyOutlined className="settings__menu-icon" style={{fontSize: 20}} />
              <span className="settings__menu-label">Sessions & Tokens</span>
            </div>
          </div>

          {/* Cashier Settings */}
          <div
            className="settings__menu-item"
            onClick={() => openActionSheet("cashier")}
          >
            <div className="settings__menu-item-left">
              <DollarOutlined className="settings__menu-icon" style={{fontSize: 20}} />
              <span className="settings__menu-label">Deposits & Withdrawals</span>
            </div>
          </div>

          {/* Theme */}
          <div
            className="settings__menu-item"
            onClick={() => openActionSheet("theme")}
          >
            <div className="settings__menu-item-left">
              <span className="settings__menu-icon">
                {theme === "dark" ? (
                  <StandaloneMoonBoldIcon />
                ) : theme === "light" ? (
                  <StandaloneSunBrightBoldIcon />
                ) : (
                  <StandaloneGearBoldIcon />
                )}
              </span>
              <span className="settings__menu-label">Theme</span>
            </div>
          </div>

          {/* Language */}
          <div
            className="settings__menu-item"
            onClick={() => openActionSheet("language")}
          >
            <div className="settings__menu-item-left">
              <StandaloneLanguageBoldIcon className="settings__menu-icon" />
              <span className="settings__menu-label">Language</span>
            </div>
          </div>

          {/* Help Center */}
          <div
            className="settings__menu-item"
            onClick={() => openActionSheet("help")}
          >
            <div className="settings__menu-item-left">
              <StandaloneLifeRingBoldIcon className="settings__menu-icon" />
              <span className="settings__menu-label">Help Center</span>
            </div>
          </div>


          {/* Log out */}
          {user && (
            <div
              className="settings__menu-item settings__menu-item--logout"
              onClick={handleLogout}
            >
              <div className="settings__menu-item-left">
                <StandaloneRightFromBracketBoldIcon
                  className="settings__menu-icon"
                  iconSize="xs"
                />
                <span className="settings__menu-label">Log out</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Sheet */}
      <BottomActionSheet
        isOpen={isActionSheetOpen}
        onClose={closeActionSheet}
        height="auto"
      >
        {renderActionSheetContent()}
      </BottomActionSheet>

      {/* Profile Settings Drawer */}
      <ProfileSettingsDrawer
        visible={profileDrawerVisible}
        onClose={() => setProfileDrawerVisible(false)}
        user={user}
      />

      {/* Password Settings Drawer */}
      <PasswordSettingsDrawer
        visible={passwordDrawerVisible}
        onClose={() => setPasswordDrawerVisible(false)}
        user={user}
      />

      {/* Linked Accounts Settings Drawer */}
      <LinkedAccountsSettingsDrawer
        visible={accountsDrawerVisible}
        onClose={() => setAccountsDrawerVisible(false)}
        user={user}
      />

      {/* 2FA Settings Drawer */}
      <TwoFASettingsDrawer
        visible={twoFADrawerVisible}
        onClose={() => setTwoFADrawerVisible(false)}
      />

      {/* Tokens Settings Drawer */}
      <TokensSettingsDrawer
        visible={tokensDrawerVisible}
        onClose={() => setTokensDrawerVisible(false)}
      />
    </div>
  );
}
