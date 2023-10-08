import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemText, Collapse, Box, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import routesConfig from './routesConfig';

const MobileMenu = ({ data, open, onClose }) => {

  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupName) => {
    setExpandedGroups((prevExpandedGroups) => ({
      ...prevExpandedGroups,
      [groupName]: !prevExpandedGroups[groupName],
    }));
  };

  const groupedRoutes = routesConfig.reduce((acc, route) => {
    const groupName =
      route.group[0].charAt(0).toUpperCase() +
      route.group[0].slice(1).toLowerCase();
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(route);
    return acc;
  }, {});
  return (
<>
{data?.token && 
    <Router>

      <Drawer anchor="left" open={open} onClose={onClose}>
      <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              textAlign: 'center',
              padding: '16px',
              borderBottom: '1px solid #ddd',
            }}
          >
            List of pages
          </Typography>

        <List>
          {Object.keys(groupedRoutes).map((groupName, index) => (
            <Box key={index}>
              <ListItem
                onClick={() => toggleGroup(groupName)}
                sx={{
                  paddingTop: 0.1,
                  paddingBottom: 0.1,
                }}>
                {expandedGroups[groupName] ? (
                  <ExpandLessIcon color="primary" />
                ) : (
                  <ChevronRightIcon color="primary" />
                )}
                <ListItemText primary={groupName} primaryTypographyProps={{ style: { fontWeight: 'normal'} }}
               
                />
              </ListItem>
              <Collapse in={expandedGroups[groupName]}>
                <List sx={{
                      marginLeft: '35px', // Indentation for subgroups
                    }}>
                  {groupedRoutes[groupName].map((subGroup, subIndex) => (
                    <ListItem
                      key={subIndex}
                      component={Link}
                      to={subGroup.path}
                      onClick={onClose} 
                      sx={{
                        paddingTop: 0.1, 
                        paddingBottom: 0.1,
                      }}
                    >
                      <ListItemText primary={subGroup.label} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          ))}
        </List>
        </Box>

      </Drawer>

      <Routes>
        {routesConfig.map((route, index) => (
          <Route key={index} path={route.path} element={<route.component />} />
        ))}
      </Routes>
    </Router>}
</>
  );
};

export default MobileMenu;
