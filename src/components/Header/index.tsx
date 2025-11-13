/**
 * @file: Header/index.tsx
 * @description: Application header component that displays authentication state,
 *               account information, and provides login/deposit functionality.
 *
 * @components: Header - Main header component with conditional rendering based on auth state
 * @dependencies:
 *   - antd: Button, Space, Dropdown components
 *   - assets/logo.png: Logo image
 *   - styles.scss: Component styling
 * @usage:
 *   <Header
 *     isLoggedIn={true}
 *     accountType="Real"
 *     balance="1000.00"
 *     currency="USD"
 *     onDepositClick={() => {}}
 *   />
 *
 * @architecture: Presentational component with conditional rendering
 * @relationships:
 *   - Used by: App.tsx
 *   - Related to: AccountHeader component
 * @dataFlow: Receives auth state and account data as props, triggers login/deposit actions
 *
 * @ai-hints: This component uses conditional rendering based on isLoggedIn prop
 *            to display different UI states. The component is purely presentational
 *            and doesn't manage its own state.
 */
import { Button, Space, Dropdown } from "antd";
import type { MenuProps } from "antd";
import DerivLogo from "../../assets/logo.png";
import "./styles.scss";
import { useEffect, useState, useCallback } from "react";

interface Account {
  account: string;
  token: string;
  currency: string;
}

interface HeaderProps {
  isLoggedIn?: boolean;
  onLogin?: () => void;
  accountType?: string;
  balance?: string;
  currency?: string;
  onDepositClick?: () => void;
  onSelectedAccount?: (account: Account) => void;
}

export function Header({
  isLoggedIn = false,
  onLogin,
  accountType,
  balance,
  currency,
  onDepositClick,
  onSelectedAccount,
}: HeaderProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authorizedAccounts, setAuthorizedAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Memoized account selection handler to prevent infinite re-renders
  const handleAccountSelection = useCallback(
    (account: Account) => {
      console.log("ACCOUNT", account);
      localStorage.setItem("app_selected_account", JSON.stringify(account));
      setSelectedAccount(account);
      onSelectedAccount?.(account);
    },
    [onSelectedAccount]
  );

  // Memoized URL parsing function
  const parseUrlAccounts = useCallback((url: string): Account[] => {
    const accounts: Account[] = [];

    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      // Extract all account parameters
      let index = 1;
      while (true) {
        const acct = params.get(`acct${index}`);
        const token = params.get(`token${index}`);
        const cur = params.get(`cur${index}`);

        // Break if any required parameter is missing
        if (!acct || !token || !cur) break;

        accounts.push({
          account: acct,
          token: token,
          currency: cur,
        });

        index++;
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
    }

    return accounts;
  }, []);

  // Memoized accounts handler
  const setAccountsHandler = useCallback(
    (accounts: Account[]) => {
      if (accounts.length > 0) {
        setAuthorizedAccounts(accounts);
        setIsAuthorized(true);
        handleAccountSelection(accounts[0]);
      }
    },
    [handleAccountSelection]
  );

  // Memoized URL change handler
  const handleUrlChange = useCallback(() => {
    const currentUrl = window.location.href;

    if (
      (currentUrl.includes("koppo-ai.vercel.app") ||
        currentUrl.includes("localhost")) &&
      currentUrl.includes("acct1")
    ) {
      try {
        const accounts = parseUrlAccounts(currentUrl);
        if (accounts.length > 0) {
          setAccountsHandler(accounts);
        }
      } catch (error) {
        console.error("Error parsing URL accounts:", error);
      }
    }
  }, [parseUrlAccounts, setAccountsHandler]);

  useEffect(() => {
    // Initial URL check
    handleUrlChange();

    // For SPAs, listen to navigation events
    window.addEventListener("popstate", handleUrlChange);

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, [handleUrlChange]);

  // Memoized account display name function
  const getAccountDisplayName = useCallback(
    (account: Account): string => {
      return `${account.account} ⚪ ${account.currency}`;
    },
    []
  );

    const AccountDisplayWithIcon = ({ account }: { account: Account }) => {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{account.account}</span>
          <img
            src={`https://cryptofonts.com/img/icons/${account.currency.toLowerCase()}.svg`}
            alt={account.currency}
            width={16}
            height={16}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span>{account.currency}</span>
          <code>
            <strong>{balance}</strong>
          </code>
        </div>
      );
    };

  // Memoized dropdown menu items
  const accountMenuItems: MenuProps["items"] = authorizedAccounts.map(
    (account, index) => ({
      key: index.toString(),
      label: (
        <div onClick={() => handleAccountSelection(account)}>
          {getAccountDisplayName(account)}
        </div>
      ),
    })
  );

  return (
    <header className="app-header">
      {!isLoggedIn ? (
        // Not logged in - show logo and login button
        <>
          <div className="app-header__logo-section">
            <img
              src={DerivLogo}
              alt="Deriv Logo"
              className="app-header__logo"
            />
          </div>
          <Space>
            {onLogin && (
              <Button
                type="default"
                onClick={onLogin}
                className="app-header__deposit-btn"
              >
                Log in
              </Button>
            )}
          </Space>
        </>
      ) : (
        // Logged in - show account info and actions
        <>
          <div className="app-header__user-section">
            <div className="app-header__logo-section">
              <img
                src={DerivLogo}
                alt="Deriv Logo"
                className="app-header__logo"
              />
            </div>
          </div>
          <Space>
            {/* Conditional rendering: Dropdown when authorized, Button when not */}
            {isAuthorized && authorizedAccounts.length > 0 ? (
              <Dropdown
                menu={{ items: accountMenuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button type="default" className="app-header__deposit-btn">
                  {selectedAccount ? (
                    <AccountDisplayWithIcon account={selectedAccount} />
                      
                    
                  ) : (
                    "Select Account"
                  )}
                </Button>
              </Dropdown>
            ) : (
              onDepositClick && (
                <Button
                  type="default"
                  className="app-header__deposit-btn"
                  onClick={onDepositClick}
                >
                  Authorize App
                </Button>
              )
            )}
          </Space>
        </>
      )}
    </header>
  );
}
