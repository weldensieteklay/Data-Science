import React, { useState, useEffect } from 'react';
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
import FileUpload from './components/fileUpload/FileUpload';

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
    setState(prev => ({ ...prev, ...data }));
  };

  return (
    <Box>
      <CssBaseline />
      <ErrorBoundary>
        <Box
          id="app-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
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
                  <Box style={{ cursor: 'pointer' }}>
                    <Profile fullName={state.first_name + ' ' + state.last_name} onLogout={handleLogout} />
                  </Box>
                </>
              )}
            </Toolbar>
          </AppBar>
          {state?.token && <MobileMenu open={mobileMenuOpen} onClose={toggleMobileMenu} data={state} />}

          {/* {!state?.token ? (
            <Box style={{ flex: 1, overflow: 'auto' }}>
              <HomePage authHandler={authHandler} />
            </Box>
          ) : (
            <Box style={{ flex: 1, overflow: 'auto' }} />
          )} */}
          <Box>
            {!state?.token && (
              <FileUpload />
            )}
          </Box >

        </Box>
        {/* <AppBar position="fixed"
          sx={{
            top: 'auto',
            bottom: 0,
          }}
        >
          <Toolbar>
            <Typography variant="body2" align="center">
              © 2023 My App. All rights reserved.
            </Typography>
          </Toolbar>
        </AppBar> */}
        
      </ErrorBoundary>
    </Box>
  );
};

export default App;
