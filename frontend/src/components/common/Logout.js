import React from 'react';
import { Typography } from '@mui/material';

const Logout = () => {
  const handleLogout = () => {
    // Implement logout logic here
    console.log('Logging out...');
  };

  return (
    <Typography variant="body1" onClick={handleLogout} sx={{ cursor: 'pointer', marginLeft: '10px' }}>
      Logout
    </Typography>
  );
};

export default Logout;
