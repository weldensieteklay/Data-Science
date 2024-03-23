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
  Button
} from '@mui/material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const TreeCustomTable = ({ response, title, type }) => {
  const { feature_importance, mse, outliers_count } = response;


  const exportToPDF = () => {
    const doc = new jsPDF();
    const fontSize = 10;
    const titleFontSize = 10;
    const titlePadding = 4;

    const titleWidth = doc.getStringUnitWidth(title) * titleFontSize / doc.internal.scaleFactor;
    const titleXPos = (doc.internal.pageSize.width - titleWidth) / 2;

    let yPosition = 10;
    doc.setFontSize(titleFontSize).setFont('helvetica', 'bold').text(title, titleXPos, yPosition, { color: '#000000' });
    yPosition += titlePadding;
    const headersData = [["Feature", "Importance"]];
    const tableData = feature_importance.map(row => [row.feature, row.importance]);

    doc.autoTable({
        head: headersData,
        body: tableData,
        startY: yPosition,
        margin: { top: yPosition + 5 },
        styles: { overflow: 'linebreak', fontSize: fontSize, cellPadding: 3, halign: 'center', valign: 'middle', fillColor: '#ffffff', textColor: '#000000' },
        didDrawPage: function (data) {
            const tableHorizontalPos = (doc.internal.pageSize.width - data.table.width) / 2;
            doc.autoTable.previous.finalY = data.cursor.y;
            data.table.x = tableHorizontalPos;
        }
    });

    doc.save('report.pdf');
};




  return (
    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px', width: '95%' }}>
      <Paper elevation={6} style={{ width: '95%', textAlign: 'center', marginBottom: '8px', padding: '16px' }}>
        <Typography variant="h6" gutterBottom style={{ fontWeight: 'bold', marginBottom: 25 }}>
          {title && capitalizeFirstLetter(title)}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'right' }}>
        <Button onClick={exportToPDF} variant="contained" color="primary">Download</Button>
      </Box>
        <Box>
          <span style={{ marginRight: 20 }}><strong>MSE</strong>: {mse}</span>
         { type !== "time-serious"? <span><strong>Outliers Count</strong>: {outliers_count}</span>:null}
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
