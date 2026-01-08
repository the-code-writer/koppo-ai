import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleLogin } from '@react-oauth/google';
import { Button, Container, Typography, Box, Paper } from '@mui/material';
// Or for Bootstrap:
// import { Container, Button, Card } from 'react-bootstrap';

const Login = ({ onSuccess }) => {
  const login = useGoogleLogin({
    onSuccess: (response) => {
      console.log('Login Success:', response);
      onSuccess(response);
    },
    onError: (error) => {
      console.log('Login Failed:', error);
    },
    flow: 'implicit', // or 'auth-code' for server-side
  });

  // Alternative: Using GoogleLogin component (renders Google's button)
  const handleSuccess = (response) => {
    console.log('Login Success:', response);
    onSuccess(response);
  };

  const handleError = () => {
    console.log('Login Failed');
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 5 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Welcome
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Please sign in with your Google account to continue
          </Typography>
          
          {/* Option 1: Custom button with useGoogleLogin hook */}
          <Button
            variant="contained"
            onClick={() => login()}
            sx={{
              backgroundColor: '#4285F4',
              color: 'white',
              '&:hover': {
                backgroundColor: '#357AE8',
              },
              mb: 2,
            }}
          >
            Sign in with Google
          </Button>
          
          <Typography variant="body2" sx={{ mb: 2 }}>OR</Typography>
          
          {/* Option 2: Google's official button */}
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
            theme="filled_blue"
            size="large"
            shape="rectangular"
          />
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="textSecondary">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;