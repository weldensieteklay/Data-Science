import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import Papa from 'papaparse';
import axios from 'axios';
import CustomTable from '../common/CustomTable';

const StyledTitle = styled(Typography)(({ theme }) => ({
  color: 'white',
  margin: 0,
  padding: '16px',
  backgroundColor: 'darkblue',
  fontWeight: 'bold',
  textAlign: 'center',
  width: '95%',
  marginBottom: '26px',
  boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.6)',
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '95%',
  padding: '20px',
  boxSizing: 'border-box',
  marginTop: '10px',
  boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.3)',
}));

const ButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginTop: '16px',
}));

const ButtonSpacer = styled(Box)(({ theme }) => ({
  marginLeft: '16px',
}));

const mlMethods = ['OLS', 'LASSO', 'RIDGE'];
const depVars = ['Variable 1', 'Variable 2', 'Variable 3'];
const independentVars = ['IndepVar 1', 'IndepVar 2', 'IndepVar 3'];

const predictionResults = [
  { id: 1, mean: 0.34, standard_error: 0.024, p_value: 0.05 },
  { id: 2, mean: 0.42, standard_error: 0.032, p_value: 0.03 },
  { id: 3, mean: 0.28, standard_error: 0.018, p_value: 0.08 },
  { id: 4, mean: 0.38, standard_error: 0.028, p_value: 0.07 },
  { id: 5, mean: 0.34, standard_error: 0.024, p_value: 0.05 },
  { id: 6, mean: 0.42, standard_error: 0.032, p_value: 0.03 },
  { id: 7, mean: 0.28, standard_error: 0.018, p_value: 0.08 },
  { id: 8, mean: 0.38, standard_error: 0.028, p_value: 0.07 },
  { id: 9, mean: 0.34, standard_error: 0.024, p_value: 0.05 },
  { id: 10, mean: 0.42, standard_error: 0.032, p_value: 0.03 },
  { id: 11, mean: 0.28, standard_error: 0.018, p_value: 0.08 },
  { id: 12, mean: 0.38, standard_error: 0.028, p_value: 0.07 },
  { id: 13, mean: 0.34, standard_error: 0.024, p_value: 0.05 },
  { id: 14, mean: 0.42, standard_error: 0.032, p_value: 0.03 },
  { id: 15, mean: 0.28, standard_error: 0.018, p_value: 0.08 },
  { id: 16, mean: 0.38, standard_error: 0.028, p_value: 0.07 },
  { id: 17, mean: 0.34, standard_error: 0.024, p_value: 0.05 },
  { id: 18, mean: 0.42, standard_error: 0.032, p_value: 0.03 },
  { id: 19, mean: 0.28, standard_error: 0.018, p_value: 0.08 },
  { id: 20, mean: 0.38, standard_error: 0.028, p_value: 0.07 },
  { id: 21, mean: 0.34, standard_error: 0.024, p_value: 0.05 },
  { id: 22, mean: 0.42, standard_error: 0.032, p_value: 0.03 },
  { id: 23, mean: 0.28, standard_error: 0.018, p_value: 0.08 },
  { id: 24, mean: 0.38, standard_error: 0.028, p_value: 0.07 },
  { id: 25, mean: 0.34, standard_error: 0.024, p_value: 0.05 },
  { id: 26, mean: 0.42, standard_error: 0.032, p_value: 0.03 },
  { id: 27, mean: 0.28, standard_error: 0.018, p_value: 0.08 },
];

const initialState = {
  data: [],
  machineLearningMethod: '',
  dependentVariable: [],
  independentVariables: [],
  predictionResult: [],
  showPredictResult: false,
  id: '',
  y: '',
  x: [],
  c: []
};


const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("IndexedDB", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore("csvFiles", { keyPath: "id", autoIncrement: true });
    };

    request.onsuccess = () => {
      const db = request.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const FileUpload = () => {
  const [state, setState] = useState(initialState);
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    const parsedData = await parseCSVFile(file);
    saveToIndexedDB(parsedData);
  };

  const parseCSVFile = (file) => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        complete: (result) => {
          const parsedData = result.data || [];
          const filteredData = parsedData.length > 0 && parsedData
          setState((prevState) => ({
            ...prevState,
            data: filteredData,
            dependentVariable: Object.keys(filteredData[0]) || [],
            independentVariables: Object.keys(filteredData[0]) || [],
          }));

          resolve(filteredData);
        },
        header: true,
      });
    });
  };

  useEffect(() => {
    const fetchDataFromIndexedDB = async () => {
      const db = await openDB();
      const transaction = db.transaction("csvFiles", "readonly");
      const csvFileStore = transaction.objectStore("csvFiles");
      const cursor = csvFileStore.openCursor();
      cursor.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const parsedData = cursor.value.data;
          setState((prevState) => ({
            ...prevState,
            data: parsedData,
            dependentVariable: Object.keys(parsedData[0]) || [],
            independentVariables: Object.keys(parsedData[0]) || [],
          }));
          cursor.continue();
        }
      };
    };
    fetchDataFromIndexedDB();
  }, []);



  const saveToIndexedDB = async (data) => {
    const db = await openDB();
    const transaction = db.transaction("csvFiles", "readwrite");
    const csvFileStore = transaction.objectStore("csvFiles");
    csvFileStore.add({ data });
  };

  const handlePredict = () => {
    const isValidCategoricals = state.c.every(catVar => state.x.includes(catVar));
    if (!isValidCategoricals) {
      alert('Not all selected categorical variables are among the independent variables');
      return;
    }
    const selectedData = state.data.map((row) => {
      const rowData = {
        [state.id]: row[state.id],
        [state.y]: row[state.y],
      };
      state.x.forEach((variable) => {
        rowData[variable] = row[variable];
      });
      return rowData;
    });
    const nonEmptySelectedData = selectedData.filter((rowData) => {
      return Object.values(rowData).every(value => value !== undefined && value !== null && value !== '');
    });

    const data = { data: nonEmptySelectedData, categorical: state.c };
    setState((prevState) => ({
      ...prevState,
      predictionResult: predictionResults,
      showPredictResult: true,
    }));

    axios.post(`http://127.0.0.1:5000/${state.machineLearningMethod}`, data)
      .then(response => {
        console.log(response.data, 'response from api')
        setState((prevState) => ({
          ...prevState,
          predictionResult: response.data,
          showPredictResult: true,
        }));
      })
      .catch(err => {
        console.log(err, 'Error in predict');
      });
  };

  const handleInputChange = (name, value) => {
    setState((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleClear = () => {
    setState((prevState) => ({
      ...prevState,
      y: '',
      x: [],
    }));
  };

  const removeVariable = (variable, v) => {
    const updatedX = state[v].filter((x) => x !== variable);
    setState((prevState) => ({
      ...prevState,
      [v]: updatedX,
    }));
  };

  const filterData = ['actions'];
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      flex={1}
      padding="20px"
      boxSizing="border-box"
    >
      <StyledTitle variant="h6">Data Analysis and Prediction</StyledTitle>

      <ContentWrapper>
        <Box
          display="flex"
          flexDirection={{ xs: 'column', sm: 'row' }}
          alignItems="center"
          justifyContent="flex-start"
          width="100%"
          marginBottom="16px"
        >
          <TextField
            type="file"
            variant="outlined"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            inputRef={fileInputRef}
            onChange={handleFileChange}
          />
          <FormControl style={{ marginLeft: '16px' }}>
            <InputLabel>Method</InputLabel>
            <Select
              value={state.machineLearningMethod}
              onChange={(e) => setState({ ...state, machineLearningMethod: e.target.value })}
              style={{ minWidth: '100px' }}
            >
              {mlMethods.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl style={{ marginLeft: '16px' }}>
            <InputLabel>Dependent Variable</InputLabel>
            <Select
              value={state.y}
              onChange={(e) => handleInputChange('y', e.target.value)}
              style={{ minWidth: '200px' }}
            >
              {state.dependentVariable.map((variable) => (
                <MenuItem key={variable} value={variable}>
                  {variable}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl style={{ marginLeft: '16px' }}>
            <InputLabel>Independent Variables</InputLabel>
            <Select
              multiple
              value={state.x}
              onChange={(e) => handleInputChange('x', e.target.value)}
              style={{ minWidth: '200px' }}
              MenuProps={{
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                getContentAnchorEl: null,
                PaperProps: {
                  style: {
                    maxHeight: '200px',
                  },
                },
              }}
              renderValue={() => (
                <div>
                  {state.x.map((variable) => (
                    <Chip
                      key={variable}
                      label={variable}
                      onDelete={() => removeVariable(variable, 'x')}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  ))}
                </div>
              )}

            >
              {state.independentVariables.map((variable) => (
                <MenuItem key={variable} value={variable}>
                  {variable}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl style={{ marginLeft: '16px' }}>
            <InputLabel>Categorical Variables</InputLabel>
            <Select
              multiple
              value={state.c}
              onChange={(e) => handleInputChange('c', e.target.value)}
              style={{ minWidth: '200px' }}
              MenuProps={{
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                getContentAnchorEl: null,
                PaperProps: {
                  style: {
                    maxHeight: '200px',
                  },
                },
              }}
              renderValue={() => (
                <div>
                  {state.c.map((variable) => (
                    <Chip
                      key={variable}
                      label={variable}
                      onDelete={() => removeVariable(variable, 'c')}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  ))}
                </div>
              )}

            >
              {state.independentVariables.map((variable) => (
                <MenuItem key={variable} value={variable}>
                  {variable}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <ButtonContainer>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePredict}
            style={{ width: '150px' }}
          >
            Predict
          </Button>
          <ButtonSpacer />
          <Button
            variant="contained"
            color="secondary"
            onClick={handleClear}
            style={{ width: '150px' }}
          >
            Clear
          </Button>
        </ButtonContainer>
      </ContentWrapper>
      {state.showPredictResult && state.machineLearningMethod && (
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '16px',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <CustomTable
            data={state.predictionResult}
            filterData={filterData}
            title={state.machineLearningMethod + ' Results'}
            itemsPerPage={25}
            headers={['field_name', 'mean', 'standard_error', 'p_value']}
          />
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
