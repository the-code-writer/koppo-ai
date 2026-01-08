import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Avatar,
  Box,
  Grid,
} from '@mui/material';
// Or for Bootstrap:
// import { Container, Card, Button, Image } from 'react-bootstrap';

const Dashboard = ({ user, onLogout }) => {
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 5 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            You are successfully authenticated!
          </Typography>
        </Box>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Avatar
              src={user.picture}
              alt={user.name}
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            />
            <Typography variant="h6">{user.name}</Typography>
            <Typography variant="body2" color="textSecondary">
              {user.email}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                User Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Full Name
                </Typography>
                <Typography variant="body1">{user.name}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Email Address
                </Typography>
                <Typography variant="body1">{user.email}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Email Verified
                </Typography>
                <Typography variant="body1">
                  {user.email_verified ? 'Yes' : 'No'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  User ID
                </Typography>
                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                  {user.sub}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            onClick={onLogout}
            size="large"
          >
            Sign Out
          </Button>
        </Box>
        
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            <strong>Note:</strong> This is a client-side only implementation.
            For production, you should validate tokens on your backend server.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard;