import React, { useState } from 'react';
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
  Button,
  ButtonGroup,
} from '@mui/material';

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const CustomTable = ({ data, filterData, title, itemsPerPage, headers, mse, R2, multicollinearity, heteroscedasticity, outliers_count }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const slicedData = data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px', width: '100%' }}>
      <Paper elevation={6} style={{ width: '95%', textAlign: 'center', marginBottom: '8px', padding: '16px' }}>
        <Typography variant="h6" gutterBottom style={{ fontWeight: 'bold', marginBottom: 25 }}>
          {title}
        </Typography>
        <Box>
          {mse && <span style={{ marginRight: 20 }}><strong>Mean Square Error</strong>: {mse}</span>}
          {R2>0 && <span style={{ marginRight: 20 }}><strong>R Square</strong>: {R2}</span>}       
          {multicollinearity && (<span>
            <span style={{ marginRight: 20 }}><strong>Multicollinearity</strong>: {multicollinearity}</span>
            <span style={{ marginRight: 20 }}><strong>Heteroscedasticity</strong>:{heteroscedasticity}</span>
          </span>)}
          {outliers_count >0 && <span><strong>Number of Removed Outliers</strong>: {outliers_count}</span>}
        </Box>
      </Paper>
      <Paper elevation={3} style={{ width: '95%', overflowX: 'auto' }}>
        <TableContainer component={Paper} style={{ minWidth: 300, width: '100%', margin: '0 auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableCell key={header} style={{ fontWeight: 'bold', textAlign: 'center' }}>
                    {capitalizeFirstLetter(header.split('_').join(' '))}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {slicedData.length > 0 ? (
                slicedData.map((item, index) => (
                  <TableRow
                    key={index} 
                    style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f3f3f3' }}
                  >
                    {headers.map((key) => !filterData.includes(key) && (
                      <TableCell key={key} style={{ textAlign: 'center' }}>
                        {item[key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={headers.length - filterData.length + 1}>
                    {data.length > 0 ? 'Loading...' : 'No data available'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {totalPages > 1 && (
        <Box style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          <ButtonGroup variant="contained" color="primary">
            {Array.from({ length: totalPages }).map((_, page) => (
              <Button
                key={page + 1}
                onClick={() => handlePageChange(page + 1)}
                disabled={page + 1 === currentPage}
              >
                {page + 1}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      )}
    </Box>
  );
};

export default CustomTable;
