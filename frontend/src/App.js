import React, { useState } from 'react';
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { Menu } from '@mui/icons-material';
import SearchInput from './components/common/SearchInput';
import Profile from './components/common/Profile';
import ErrorBoundary from './components/common/ErrorBoundary';
import MobileMenu from './routes/MobileMenu';
import HomePage from './components/HomePage';

const App = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [state, setState] = useState({});

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    setState({});
  };

  const authHandler = (data) => {
    setState(prev=>({...prev, ...data}));
  };
  return (
    <>
      <CssBaseline />
      <ErrorBoundary>
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            overflowX: 'hidden',
          }}
        >
          <AppBar position="static">
            <Toolbar
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <a href="/">
                  <HomeIcon style={{ cursor: 'pointer', color: 'white' }} />
                </a>
                {state?.token && (
                  <Menu onClick={toggleMobileMenu} style={{ cursor: 'pointer', marginLeft: '16px' }} />
                )}

              </Box>
              {state?.token && (
                <>
                  {/* <SearchInput /> */}
                  <Typography variant="body2" style={{ color: 'white', marginLeft: '16px' }}>
                    Balance: ${state.balance}
                  </Typography>
                  <Box style={{ cursor: 'pointer' }}>
                    <Profile fullName={state.first_name + ' ' + state.last_name} onLogout={handleLogout} />
                  </Box>
                </>
              )}
            </Toolbar>
          </AppBar>
          {state?.token && <MobileMenu open={mobileMenuOpen} onClose={toggleMobileMenu} data={state} />}

          {!state?.token ? (
            <Box style={{ flex: 1, overflow: 'auto' }}>
              <HomePage authHandler={authHandler} />
            </Box>
          ) : (
            <Box style={{ flex: 1, overflow: 'auto' }} />
          )}

          <AppBar position="static">
            <Toolbar>
              <Typography variant="body2" align="center">
                © 2023 My App. All rights reserved.
              </Typography>
            </Toolbar>
          </AppBar>
        </Box>
      </ErrorBoundary>
    </>
  );
};

export default App;
