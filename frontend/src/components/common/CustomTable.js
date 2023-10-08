import React from 'react';
import { Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Box, Typography, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const CustomTable = ({ data, filterData, title, onEdit, onDelete }) => {

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px' }}>
       <Paper elevation={6} sx={{ width: '80%', textAlign: 'center', marginBottom: '8px', padding: '16px', backgroundColor: 'darkblue' }}>
        <Typography variant="h6" gutterBottom style={{ color: 'white' }}>
          {title}
        </Typography>
      </Paper>
      <Paper elevation={3} sx={{ width: '80%', overflowX: 'auto' }}>
        <TableContainer component={Paper} sx={{ minWidth: 300, width: '100%', margin: '0 auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                {data.length > 0 &&
                  Object.keys(data[0]).map(key => !filterData.includes(key) && (
                    <TableCell key={key} sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                      {capitalizeFirstLetter(key.split('_').join(' '))}
                    </TableCell>
                  ))}
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <TableRow
                    key={item._id}
                    sx={{ backgroundColor: index % 2 === 0 ? 'white' : '#f3f3f3' }}
                  >
                    {Object.keys(item).map(key => !filterData.includes(key) && (
                      <TableCell key={key} sx={{ textAlign: 'center' }}>
                        {item[key]}
                      </TableCell>
                    ))}
                    <TableCell sx={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => onEdit(item._id)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => onDelete(item._id)} >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={data.length > 0 ? Object.keys(data[0]).length - filterData.length + 1 : 1}>
                    {data.length > 0 ? 'Loading...' : 'No data available'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default CustomTable;
