import React from 'react';
import {
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Typography,
} from '@mui/material';

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const TreeCustomTable = ({ response, title }) => {
  const { feature_importance, mse, outliers_count } = response;

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px', width: '95%' }}>
      <Paper elevation={6} style={{ width: '95%', textAlign: 'center', marginBottom: '8px', padding: '16px' }}>
        <Typography variant="h6" gutterBottom style={{ fontWeight: 'bold', marginBottom: 25 }}>
          {title && capitalizeFirstLetter(title) + "Results"}
        </Typography>
        <Box>
          <span style={{ marginRight: 20 }}><strong>MSE</strong>: {mse}</span>
          <span><strong>Outliers Count</strong>: {outliers_count}</span>
        </Box>
      </Paper>
      <Paper elevation={3} style={{ width: '95%', overflowX: 'auto', margin: 'auto' }}>
        <TableContainer component={Paper} style={{ minWidth: 300, width: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                {["Feature", "Importance"].map((header, index) => (
                  <TableCell key={index} style={{ fontWeight: 'bold', textAlign: 'center' }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {feature_importance.map(({ feature, importance }, index) => (
                <TableRow key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f3f3f3' }}>
                  <TableCell style={{ textAlign: 'center' }}>{feature}</TableCell>
                  <TableCell style={{ textAlign: 'center' }}>{importance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default TreeCustomTable;
