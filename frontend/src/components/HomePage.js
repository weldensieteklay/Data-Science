import React, { useEffect, useState } from 'react';

import { Container, Typography, Box, Link } from '@mui/material';
import { NavLink } from 'react-router-dom';
import axios from 'axios';

import userFormData from '../constants/userFormsData';
import AuthForm from './common/AuthForm';
const signInHandler = () => {

}

const signUpLinkStyle = {
  color: '#1976d2',
  textDecoration: 'underline', // Add underline to the text
  cursor: 'pointer',
};

const HomePage = ({authHandler}) => {

  const [isSignedUp, setIsSignedUp] = useState(false);


  const handleSignUpClick = () => {
    setIsSignedUp(true);

  };


  const handleSubmit = (formData) => {
    authHandler(formData)
};

  return (
    <Container maxWidth="md" sx={{ paddingTop: 8, paddingBottom: 8, textAlign: 'center' }}>

      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to Our Website
      </Typography>
      {!isSignedUp ? <AuthForm modeConfig={userFormData.signInConfig} handleSubmitProp={handleSubmit} /> : <AuthForm modeConfig={userFormData.signUpConfig} handleSubmitProp={handleSubmit}/>}
      <Box component='div' style={{ margin: '16px 0' }} />
      {!isSignedUp && <Typography variant="body2" color="textSecondary" style={{ marginTop: '8px' }}>
        Don't have an account?{' '}
        <span onClick={handleSignUpClick} style={signUpLinkStyle}>
            Sign up
        </span>
      </Typography>}
    </Container>
  );
}

export default HomePage;
