import React, { useState } from 'react';
import { Avatar, Typography, Box, Menu, MenuItem, Modal } from '@mui/material';
import ConfirmationModal from './ConfirmationModal';

const Profile = ({ fullName, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutConfirmation = () => {
    setProfileModalOpen(false);
    setLogoutConfirmationOpen(true);
    handleMenuClose();
  };

  const handleLogout = () => {
    onLogout();
    setLogoutConfirmationOpen(false);
  };

  const openProfileModal = () => {
    setProfileModalOpen(true);
    handleMenuClose();
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-end">
      <Avatar alt={fullName} src="/path/to/profile-image.jpg" sx={{ width: 32, height: 32, cursor: 'pointer' }} onClick={openProfileModal} />
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleLogoutConfirmation}>Logout</MenuItem>
      </Menu>
      <ConfirmationModal
        message="Are you sure you want to logout?"
        open={logoutConfirmationOpen}
        onClose={() => setLogoutConfirmationOpen(false)}
        onConfirm={handleLogout}
      />
      <Modal open={profileModalOpen} onClose={closeProfileModal} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', padding: '16px', paddingRight: '64px', paddingTop: '32px' }}>
        <Box sx={{ backgroundColor: 'white', padding: '16px', minWidth: '200px' }}>
          <Avatar alt={fullName} src="/path/to/profile-image.jpg" sx={{ width: 64, height: 64, margin: '0 auto' }} />
          <Typography variant="body2" align="center" sx={{ fontSize: '1rem', lineHeight: 1, marginTop: '8px' }}>
            {fullName}
          </Typography>
          <MenuItem onClick={handleLogoutConfirmation} sx={{ marginTop: '16px', cursor: 'pointer' }}>Logout</MenuItem>
        </Box>
      </Modal>
    </Box>
  );
};

export default Profile;
