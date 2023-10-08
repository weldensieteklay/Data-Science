import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { Container, Paper, Typography, Box } from '@mui/material';

const StyledWrapper = styled(Box)(({ theme }) => ({
  width: '80%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
  color: 'white',
  margin: 0,
  padding: '16px',
  backgroundColor: 'darkblue',
  fontWeight: 'bold',
  textAlign: 'center',
  boxShadow: theme.shadows[8],
  width: '100%',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  width: '100%',
  maxWidth: '100%',
}));

const ValuePaper = styled(Paper)(({ theme, selected }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  textAlign: 'center',
  width: '140px',
  cursor: 'pointer',
  border: selected ? '2px solid darkblue' : '2px solid transparent',
  backgroundColor: selected ? 'lightgray' : 'white',
  elevation: selected ? 3 : 1,
  '&:hover': {
    backgroundColor: 'lightgray',
  },
}));

const BalanceList = ({ balanceValues = { title: 'Add Balance', values: [3, 5, 10, 15, 20, 40, 100] } }) => {
  const [selectedValue, setSelectedValue] = useState(null);

  const handleValueClick = (value) => {
    setSelectedValue(value);
  };

  return (
    <Container sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      height: '100vh',
      marginTop: '20px',
      marginBottom: '70px',
    }}>
      <StyledWrapper>
        <StyledTitle variant="h6" elevation={8}>
          {balanceValues.title}
        </StyledTitle>
        <StyledPaper elevation={3}>
          <Box display="flex" flexWrap="wrap" justifyContent="center" gap="16px">
            {balanceValues.values.map((value, index) => (
              <ValuePaper
                key={index}
                elevation={2}
                selected={value === selectedValue}
                onClick={() => handleValueClick(value)}
              >
                ${value}
              </ValuePaper>
            ))}
          </Box>
        </StyledPaper>
      </StyledWrapper>
    </Container>
  );
};

export default BalanceList;
