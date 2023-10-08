import React from 'react';
import { Button, Box } from '@mui/material';

const CustomButton = ({ label, onClick, width }) => {
  const buttonStyle = {
    width: width || 'auto', // Use provided width or 'auto' as default
  };

  return (
    <>
    <Box component='div' style={{ margin: '1px 0' }} />
    <Button variant="contained" color="primary" onClick={onClick} sx={buttonStyle}>
      {label}
    </Button>
    </>
  );
}

export default CustomButton;
