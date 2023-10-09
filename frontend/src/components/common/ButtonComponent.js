import React from 'react';
import { Button, Box } from '@mui/material';

const CustomButton = ({ label, onClick, width, backgroundColor }) => {
  const buttonStyle = {
    width: width || 'auto',
    backgroundColor: backgroundColor || 'primary.main', // Use provided background color or default to primary color
  };

  return (
    <>
      <Box component='div' style={{ margin: '1px 0' }} />
      <Button variant="contained" color="primary" onClick={onClick} sx={buttonStyle}>
        {label}
      </Button>
    </>
  );
};

export default CustomButton;
