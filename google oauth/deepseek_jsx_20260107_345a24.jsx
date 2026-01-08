import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { useState } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (response) => {
    console.log('Login Success:', response);
    // Decode the JWT token to get user info
    const userObject = parseJwt(response.credential);
    setUser(userObject);
  };

  const handleLogout = () => {
    setUser(null);
    // Clear any stored tokens
    localStorage.removeItem('google_token');
  };

  // Helper function to parse JWT
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error parsing JWT:', e);
      return null;
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="App">
        <header className="App-header">
          <h1>Google Authentication App</h1>
        </header>
        <main>
          {user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <Login onSuccess={handleLoginSuccess} />
          )}
        </main>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;