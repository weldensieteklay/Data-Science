import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import Papa from 'papaparse';
import axios from 'axios';
import CustomTable from '../common/CustomTable';
import TreeCustomTable from '../common/TreeCustomTable';

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

const mlMethods1 = ['OLS', 'GLS', 'LASSO', 'RIDGE'];
const mlMethods2 = ['BOOSTING', 'BAGGING', 'RANDOM-FOREST', 'NEURAL_NETWORK'];
const mlMethods = [...mlMethods1, ...mlMethods2];

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
  c: [],
  mse: '',
  multicollinearity: 0,
  heteroscedasticity: 0,
  outliers: 'No',
  outliers_count: 0,
  R2: null,
  treeResponse: null,
  summaryStatistics: [],
  showSummaryStat: false
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
    const isValidCategoricals = state.c.every(catVar => state.x.includes(catVar)) || state.c===state.y;
    if (!isValidCategoricals) {
      alert('Not selected categorical variables are among the dependent or independent variables');
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

    const data = { data: nonEmptySelectedData, categorical: state.c, outliers: state.outliers };
    setState((prevState) => ({
      ...prevState,
      showPredictResult: false,
      showSummaryStat: false
    }));
    axios.post(`http://127.0.0.1:5000/${state.machineLearningMethod}`, data)
      .then(response => {
        if (mlMethods2.includes(state.machineLearningMethod)) {
          setState((prevState) => ({
            ...prevState,
            treeResponse: response.data,
            showPredictResult: true,
            showSummaryStat: false
          }));
        } else {
          setState((prevState) => ({
            ...prevState,
            predictionResult: response.data.data,
            showPredictResult: true,
            mse: response.data.mse,
            multicollinearity: response.data.multicollinearity,
            heteroscedasticity: response.data.heteroscedasticity,
            outliers_count: response.data.outliers_count,
            R2: response.data.R2,
            showSummaryStat: false
          }));
        }
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
      showSummaryStat: false
    }));
  };

  const handleSummary = () => {
    const isValidCategoricals = state.c.every(catVar => state.x.includes(catVar)) || state.c===state.y;
    if (!isValidCategoricals) {
      alert('Not selected categorical variables are among the dependent or independent variables');
      return;
    }
    const selectedData = state.data.map((row) => {
      const rowData = {
        [state.id]: row[state.id],
        [state.y]: parseFloat(row[state.y]),
      };
      state.x.forEach((variable) => {
        rowData[variable] = parseFloat(row[variable]);
      });
      return rowData;
    });
  
    const summaryStatistics = [];
    
    if (state.y && !state.c.includes(state.y)) {
      const yValues = selectedData.map((row) => row[state.y]);
      summaryStatistics.push({
        field_name: state.y,
        mean_or_percentages: calculateMean(yValues),
        standard_deviation: calculateStd(yValues),
      });
    }
  
    state.x
    .filter((variable) => !state.c.includes(variable)) 
    .forEach((variable) => {
      const variableValues = selectedData.map((row) => row[variable]);
      summaryStatistics.push({
        field_name: variable,
        mean_or_percentages: calculateMean(variableValues),
        standard_deviation: calculateStd(variableValues),
      });
    });
  
    state.c.forEach((variable) => {
      const variableValues = selectedData.map((row) => row[variable]);
      const percentages = calculatePercentages(variableValues);
      const categories = Object.keys(percentages);
      categories.forEach((category) => {
        summaryStatistics.push({
          field_name: `${variable} - ${category}`,
          mean_or_percentages: percentages[category]+"%",
        });
      });
    });
  
    console.log('Summary Statistics:', summaryStatistics);
    setState((prevState) => ({
      ...prevState,
      summaryStatistics: summaryStatistics,
      showSummaryStat: true,
    }));
  };
  
  
  const calculateCounts = (values) => {
    const counts = {};
    values.forEach((value) => {
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  };
  
  const calculatePercentages = (values) => {
    const counts = calculateCounts(values);
    const total = values.length;
    const percentages = {};
    Object.entries(counts).forEach(([category, count]) => {
      percentages[category] = ((count / total) * 100).toFixed(3);
    });
    return percentages;
  };
  
  const calculateMean = (values) => {
    const validValues = values.filter((value) => !isNaN(value));
    if (validValues.length === 0) {
      return NaN; 
    }
    const sum = validValues.reduce((acc, val) => acc + val, 0);
    const mean = sum / validValues.length;
    return parseFloat(mean.toFixed(3)); // Limit to three decimal places
  };
  
  const calculateStd = (values) => {
    const validValues = values.filter((value) => !isNaN(value));
    if (validValues.length <= 1) {
      return NaN; 
    }
    const mean = calculateMean(validValues);
    const squaredDiffs = validValues.map((val) => (val - mean) ** 2);
    const variance = calculateMean(squaredDiffs);
    const stdDev = Math.sqrt(variance);
    return parseFloat(stdDev.toFixed(3)); // Limit to three decimal places
  };
  

  
  const filterData = ['actions', 'regions', 'regions - NaN'];
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
            style={{ width: '250px' }}
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
              style={{ minWidth: '150px' }}
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
          <FormControl style={{ marginLeft: '16px' }}>
            <InputLabel>Outliers</InputLabel>
            <Select
              value={state.outliers}
              onChange={(e) => setState({ ...state, outliers: e.target.value })}
              style={{ minWidth: '150px' }}
            >
              <MenuItem value='Yes'>
                Remove Outliers
              </MenuItem>
              <MenuItem value='No'>
                Keep Outliers
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
        <ButtonContainer>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSummary}
          style={{ width: '150px' }}
        >
          Summary Statistics
        </Button>
        <ButtonSpacer />
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
      {state.showPredictResult && mlMethods1.includes(state.machineLearningMethod) && (
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
            mse={state.mse}
            filterData={filterData}
            title={state.machineLearningMethod + ' Results'}
            itemsPerPage={25}
            headers={['field_name', 'mean', 'standard_error', 'p_value']}
            heteroscedasticity={state.heteroscedasticity}
            multicollinearity={state.multicollinearity}
            outliers_count={state.outliers_count}
            R2={state.R2}
          />
        </Box>
      )}
      {state.showSummaryStat && (
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
            data={state.summaryStatistics}
            filterData={filterData}
            title={'Summary Statistics'}
            itemsPerPage={25}
            headers={['field_name', 'mean_or_percentages', 'standard_deviation']}
          />
        </Box>
      )}
      {
        state.showPredictResult && mlMethods2.includes(state.machineLearningMethod) && (
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
          <TreeCustomTable
            response={state.treeResponse}
            title={state.machineLearningMethod}
          />
          </Box>
        )
      }
    </Box>
  );
};

export default FileUpload;
