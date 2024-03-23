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
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const CustomTable = ({ data = [], filterData, title, itemsPerPage, headers, mse, R2, multicollinearity, heteroscedasticity, outliers_count, adf }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const slicedData = data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const capitalizeWords = (str) => {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  
  const exportToPDF = () => {
    const doc = new jsPDF();
    const fontSize = 10;
    const titleFontSize = 10;
    const footerFontSize = 8;
    const footerPadding = 5;
    const titlePadding = 4;

    const titleWidth = doc.getStringUnitWidth(title) * titleFontSize / doc.internal.scaleFactor;
    const titleXPos = (doc.internal.pageSize.width - titleWidth) / 2;

    let yPosition = 10;
    doc.setFontSize(titleFontSize).setFont('helvetica', 'bold').text(title, titleXPos, yPosition, { color: '#000000' });
    yPosition += titlePadding;

    doc.autoTable({
        head: [headers.map(header => capitalizeWords(header.split('_').join(' ')))],
        body: data.map(row => headers.map(header => row[header])),
        startY: yPosition,
        margin: { top: yPosition + 5 },
        styles: { overflow: 'linebreak', fontSize: fontSize, cellPadding: 3, halign: 'center', valign: 'middle', fillColor: '#ffffff', textColor: '#000000' },
    });

    const footerText = [
        adf !== undefined ? `Dickey-Fuller P-Value: ${adf}` : '',
        adf !== undefined ? `Stationarity: ${adf < 0.05 ? 'Stationary' : 'Non-Stationary'}` : '',
        R2 > 0 ? `R Square: ${R2}` : '',
        multicollinearity ? `Multicollinearity: ${multicollinearity}` : '',
        multicollinearity ? `Heteroscedasticity: ${heteroscedasticity}` : '',
        outliers_count > 0 ? `Number of Removed Outliers: ${outliers_count}` : '',
    ].filter(Boolean).join(' , ');

    const footerXPos = doc.internal.pageSize.getWidth() / 2;
    const footerYPos = doc.autoTable.previous.finalY + footerPadding;

    doc.setFontSize(footerFontSize).setFont('helvetica', 'italic').text(footerText, footerXPos, footerYPos, { align: 'center', color: '#000000' });

    doc.save('report.pdf');
};



  
  
  
  
  
  
  
  
  
  
  
  

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px', width: '100%' }}>
      <Paper elevation={6} style={{ width: '95%', textAlign: 'center', marginBottom: '8px', padding: '16px' }}>

        <Typography variant="h6" gutterBottom style={{ fontWeight: 'bold', marginBottom: 10, marginTop:6 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'right' }}>
          <Button onClick={exportToPDF} variant="contained" color="primary">Download</Button>
        </Box>
        <Box>
          {mse && <span style={{ marginRight: 20 }}><strong>Mean Square Error</strong>: {mse}</span>}
          {adf && <span style={{ marginRight: 20 }}><strong>Dickey-Fuller P_Value</strong>: {adf}</span>}
          {adf && <span style={{ marginRight: 20 }}><strong>Stationarity</strong>: {adf<0.05?'Stationary':'Non-Stationary'}</span>}
          {R2 > 0 && <span style={{ marginRight: 20 }}><strong>R Square</strong>: {R2}</span>}
          {multicollinearity && (<span>
            <span style={{ marginRight: 20 }}><strong>Multicollinearity</strong>: {multicollinearity}</span>
            <span style={{ marginRight: 20 }}><strong>Heteroscedasticity</strong>:{heteroscedasticity}</span>
          </span>)}
          {outliers_count > 0 && <span><strong>Number of Removed Outliers</strong>: {outliers_count}</span>}
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
              {slicedData?.length > 0 ? (
                slicedData?.map((item, index) => (
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
