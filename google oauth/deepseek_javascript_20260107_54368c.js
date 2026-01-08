// In your Login component or App.js
const validateTokenWithBackend = async (token) => {
  try {
    const response = await fetch('http://localhost:5000/api/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    const data = await response.json();
    if (data.success) {
      setUser(data.user);
    } else {
      console.error('Token validation failed');
    }
  } catch (error) {
    console.error('Error validating token:', error);
  }
};