import React, { useState, useRef, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { Box, Typography, Button, FormControl, Input, InputLabel, Select, MenuItem, TextField, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import Papa from 'papaparse';
import axios from 'axios';
import CustomTable from '../common/CustomTable';
import TreeCustomTable from '../common/TreeCustomTable';
import TimeSeriesChart from '../graph/LineGraph';

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

const mlMethods1 = ['OLS', 'GLS', 'LASSO', 'RIDGE', 'ARIMA'];
const mlMethods2 = ['BOOSTING', 'BAGGING', 'RANDOM-FOREST', 'NEURAL_NETWORK'];
const mlMethods = [...mlMethods1, ...mlMethods2];
const types = ['time-serious', 'cross-sectional', 'panel']

const initialState = {
  data: [],
  machineLearningMethod: 'OLS',
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
  showSummaryStat: false,
  showGraph: false,
  dataGraph: [],
  startDate: '',
  endDate: '',
  dateName: '',
  type: '',
  stationary: [],
  adf: null,
  predictionResult_withoutDiff:[],
  mse_withoutDiff: ''
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
  const [isLoading, setIsLoading] = useState(false);

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
    csvFileStore.clear();
    csvFileStore.add({ data });
  };


  const determineStationaryValue = (state, response) => {
    if (state.type === 'time-serious'
      && response.data.hasOwnProperty('stationary')
      && !response.data.stationary) {
      if (!state.stationary.includes(state.x[0])) {
        return state.stationary.concat(state.x[0]);
      }
    }
    return state.stationary;
  };
  
  const handlePredict = () => {
    setIsLoading(true);
    const isValidCategoricals = state.c.every(catVar => state.x.includes(catVar)) || state.c === state.y;
    if (!isValidCategoricals) {
      alert('Not selected categorical variables are among the dependent or independent variables');
      setIsLoading(false);
      return;
    }
    if (state.type !== 'time-serious' && !state.id) {
      alert('Select an ID. It is required field for non-time serious prediction');
      setIsLoading(false);
      return;
    }
    const startDateObj = new Date(state.startDate);
    const endDateObj = new Date(state.endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      alert("Please provide valid start and end dates.");
      return;
    }

    const filteredData = state.data.filter(item => {
      const currentDate = new Date(item[state.dateName]);
      return currentDate >= startDateObj && currentDate <= endDateObj;
    });
    const selectedData = filteredData.map((row) => {
      let rowData = {};
      if (state.type === 'time-serious') {
        rowData[state.dateName] = row[state.dateName]
      } else {
        rowData[state.id] = row[state.id]
        rowData[state.y] = row[state.y]

      }
      state.x.forEach((variable) => {
        rowData[variable] = row[variable];
      });
      return rowData;
    });

    const nonEmptySelectedData = selectedData.filter((rowData) => {
      return Object.values(rowData).every(value => value !== undefined && value !== null && value !== '');
    });

    const data = { data: nonEmptySelectedData, categorical: state.c, outliers: state.outliers, type: state.type };
    setState((prevState) => ({
      ...prevState,
      showPredictResult: false,
      showSummaryStat: false,
      showGraph: false
    }));

    if (state.type === 'time-serious') {
      const firstRowDate = new Date(data.data[0][state.dateName]);
      if (isNaN(firstRowDate.getTime())) {
        alert('The Date variable must be in a valid date format for ARIMA model');
        setIsLoading(false);
        return;
      }
      if (state.x.length !== 1) {
        alert('For time serious model, endogonous variable must be with exactly one variable');
        setIsLoading(false);
        return;
      }
    }
    axios.post(`http://127.0.0.1:5000/${state.machineLearningMethod}`, data)
      .then(response => {
        setIsLoading(false);
        const stationaryValue = determineStationaryValue(state, response);
        if (mlMethods2.includes(state.machineLearningMethod)) {
          setState((prevState) => ({
            ...prevState,
            treeResponse: response.data,
            showPredictResult: true,
            showSummaryStat: false,
            showGraph: false
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
            showSummaryStat: false,
            stationary: stationaryValue,
            adf: response.data.adfuller,
            predictionResult_withoutDiff: response.data.without_diff?.data || [],
            mse_withoutDiff: response.data.without_diff?.mse || []
          }));
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.log(err, 'Error in predict');
      });
  };
  const handleInputChange = (name, value) => {
    setState((prevData) => ({
      ...prevData,
      [name]: value,
      showSummaryStat: false,
      showPredictResult: false,
      showGraph: false,
    }));
  };
  const handleClear = () => {
    setState((prevState) => ({
      ...prevState,
      y: '',
      x: [],
      showSummaryStat: false,
      showPredictResult: false,
      showGraph: false,
      type: '',
      dateName: '',
      stationary: [],
    }));
  };

  const removeVariable = (variable, v) => {
    const updatedX = state[v].filter((x) => x !== variable);
    setState((prevState) => ({
      ...prevState,
      [v]: updatedX,
      showSummaryStat: false,
      showPredictResult: false,
      showGraph: false
    }));
  };

  const calculatePercentages = (values) => {
    if (typeof values[0] === 'string') {
      return calculateCountsCategorical(values);
    }
    const counts = calculateCounts(values);
    const total = values.length;
    const percentages = {};
    Object.entries(counts).forEach(([category, count]) => {
      percentages[category] = ((count / total) * 100).toFixed(2);
    });

    return percentages;
  };

  const calculateCountsCategorical = (values) => {
    const counts = {};
    values.forEach((value) => {
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  };

  const handleSummary = () => {
    const isValidCategoricals =
      state.c.every((catVar) => state.x.includes(catVar)) || state.c === state.y;
    if (!isValidCategoricals) {
      alert(
        'Not selected categorical variables are among the dependent or independent variables'
      );
      return;
    }

    const selectedData = state.data.map((row) => {
      const rowData = {
        [state.id]: row[state.id],
        [state.y]: parseFloat(row[state.y]),
      };

      state.x.forEach((variable) => {
        // Ignore if value is empty, undefined, or null
        if (row[variable] !== '' && row[variable] !== undefined && row[variable] !== null) {
          rowData[variable] = isNaN(parseFloat(row[variable])) ? row[variable] : parseFloat(row[variable]);
        }
      });

      return rowData;
    }).filter(row => Object.values(row).every(value => value !== '' && value !== undefined && value !== null));

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
      if (typeof variableValues[0] === 'string') {
        const counts = calculateCountsCategorical(variableValues);
        const total = variableValues.length;
        const percentages = {};
        Object.entries(counts).forEach(([category, count]) => {
          percentages[category] = ((count / total) * 100).toFixed(3);
        });
        const categories = Object.keys(percentages);
        categories.forEach((category) => {
          summaryStatistics.push({
            field_name: `${variable} - ${category}`,
            mean_or_percentages: percentages[category] + '%',
          });
        });
      } else {
        const percentages = calculatePercentages(variableValues);
        const categories = Object.keys(percentages);
        categories.forEach((category) => {
          summaryStatistics.push({
            field_name: `${variable} - ${category}`,
            mean_or_percentages: percentages[category] + '%',
          });
        });
      }
    });

    console.log('Summary Statistics:', summaryStatistics);

    setState((prevState) => ({
      ...prevState,
      summaryStatistics: summaryStatistics,
      showSummaryStat: true,
      showPredictResult: false,
      showGraph: false
    }));
  };

  // const handleSummary = () => {
  //   const isValidCategoricals =
  //     state.c.every((catVar) => state.x.includes(catVar)) || state.c === state.y;
  //   if (!isValidCategoricals) {
  //     alert(
  //       'Not selected categorical variables are among the dependent or independent variables'
  //     );
  //     return;
  //   }

  //   const selectedData = state.data.map((row) => {
  //     const rowData = {
  //       [state.id]: row[state.id],
  //       [state.y]: parseFloat(row[state.y]),
  //     };

  //     state.x.forEach((variable) => {
  //       rowData[variable] = isNaN(parseFloat(row[variable])) ? row[variable] : parseFloat(row[variable]);
  //     });

  //     return rowData;
  //   });

  //   const summaryStatistics = [];
  //   if (state.y && !state.c.includes(state.y)) {
  //     const yValues = selectedData.map((row) => row[state.y]);
  //     summaryStatistics.push({
  //       field_name: state.y,
  //       mean_or_percentages: calculateMean(yValues),
  //       standard_deviation: calculateStd(yValues),
  //     });
  //   }

  //   state.x
  //     .filter((variable) => !state.c.includes(variable))
  //     .forEach((variable) => {
  //       const variableValues = selectedData.map((row) => row[variable]);
  //       summaryStatistics.push({
  //         field_name: variable,
  //         mean_or_percentages: calculateMean(variableValues),
  //         standard_deviation: calculateStd(variableValues),
  //       });
  //     });

  //   state.c.forEach((variable) => {
  //     const variableValues = selectedData.map((row) => row[variable]);
  //     if (typeof variableValues[0] === 'string') {
  //       const counts = calculateCountsCategorical(variableValues);
  //       const total = variableValues.length;
  //       const percentages = {};
  //       Object.entries(counts).forEach(([category, count]) => {
  //         percentages[category] = ((count / total) * 100).toFixed(3);
  //       });
  //       const categories = Object.keys(percentages);
  //       categories.forEach((category) => {
  //         summaryStatistics.push({
  //           field_name: `${variable} - ${category}`,
  //           mean_or_percentages: percentages[category] + '%',
  //         });
  //       });
  //     } else {
  //       const percentages = calculatePercentages(variableValues);
  //       const categories = Object.keys(percentages);
  //       categories.forEach((category) => {
  //         summaryStatistics.push({
  //           field_name: `${variable} - ${category}`,
  //           mean_or_percentages: percentages[category] + '%',
  //         });
  //       });
  //     }
  //   });

  //   console.log('Summary Statistics:', summaryStatistics);

  //   setState((prevState) => ({
  //     ...prevState,
  //     summaryStatistics: summaryStatistics,
  //     showSummaryStat: true,
  //     showPredictResult: false,
  //     showGraph: false
  //   }));
  // };


  const calculateCounts = (values) => {
    const counts = {};
    values.forEach((value) => {
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  };

  const calculateMean = (values) => {
    const validValues = values.filter((value) => !isNaN(value));
    if (validValues.length === 0) {
      return NaN;
    }
    const sum = validValues.reduce((acc, val) => acc + val, 0);
    const mean = sum / validValues.length;
    return parseFloat(mean.toFixed(3));
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
  const showGraph = () => {
    if (!state.startDate || !state.endDate) {
      alert("Please provide valid start and end dates.");
      return;
    }

    const startDateObj = new Date(state.startDate);
    const endDateObj = new Date(state.endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      alert("Please provide valid start and end dates.");
      return;
    }

    const filteredData = state.data.filter(item => {
      const currentDate = new Date(item[state.dateName]);
      return currentDate >= startDateObj && currentDate <= endDateObj;
    });

    setState((prevState) => ({
      ...prevState,
      showPredictResult: false,
      showSummaryStat: false,
      showGraph: true,
      dataGraph: filteredData
    }));
  }

  const filterData = ['actions', 'regions', 'regions - NaN', state.dateName];
  const dependentField = state.type === 'time-serious'? state.x[0] || '': state.y || ''
  console.log(dependentField, 'gggggggggggggggggggg', state)
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
          flexWrap="wrap"
        >
          <TextField
            type="file"
            variant="outlined"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            inputRef={fileInputRef}
            onChange={handleFileChange}
            style={{ width: '250px', marginTop: "16px" }}
          />

          <FormControl style={{ marginLeft: '16px', marginTop: "16px" }}>
            <InputLabel>Type of Data</InputLabel>
            <Select
              value={state.type}
              onChange={(e) => setState({ ...state, type: e.target.value })}
              style={{ minWidth: '200px' }}
            >
              {types.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {state.type ?
            <>

              <FormControl style={{ marginLeft: '16px', marginTop: "16px" }}>
                <InputLabel>Method</InputLabel>
                <Select
                  value={state.machineLearningMethod}
                  onChange={(e) => setState({ ...state, machineLearningMethod: e.target.value, showPredictResult: false })}
                  style={{ minWidth: '200px' }}
                >
                  {state.type === 'time-serious' ? [...mlMethods.slice(2)].map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  )) : mlMethods.filter(elem => elem !== 'ARIMA').map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {state.type !== 'time-serious' ?
                <FormControl style={{ marginLeft: '16px', marginTop: "16px" }}>
                  <InputLabel>ID of the Data</InputLabel>
                  <Select
                    value={state.id}
                    onChange={(e) => handleInputChange('id', e.target.value)}
                    style={{ minWidth: '200px' }}
                  >
                    {state.dependentVariable.map((variable) => (
                      <MenuItem key={variable} value={variable}>
                        {variable}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl> : null}

              <FormControl style={{ marginLeft: '16px', marginTop: "16px" }}>
                <InputLabel>{state.type === 'time-serious' ? 'Select Date Variable' : 'dependent Variable'}</InputLabel>
                <Select
                  value={state.type === 'time-serious' ? state.dateName : state.y}
                  onChange={(e) => handleInputChange(state.type === 'time-serious' ? 'dateName' : 'y', e.target.value)}
                  style={{ minWidth: '200px' }}
                >
                  {state.dependentVariable.map((variable) => (
                    <MenuItem key={variable} value={variable}>
                      {variable}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>



              {state.type === 'time-serious' && (
                <>
                  <FormControl style={{ marginLeft: '16px', marginTop: "16px" }}>
                    <InputLabel>Start Date</InputLabel>
                    <Select
                      value={state.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      style={{ minWidth: '200px' }}
                    >
                      {state.data.map(item => (
                        <MenuItem key={item[state.dateName || "Date"]} value={item[state.dateName || "Date"]}>
                          {item[state.dateName || "Date"]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl style={{ marginLeft: '16px', marginTop: "16px" }}>
                    <InputLabel>End Date</InputLabel>
                    <Select
                      value={state.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      style={{ minWidth: '200px' }}
                    >
                      {state.data.map(item => (
                        <MenuItem key={item[state.dateName || "Date"]} value={item[state.dateName || "Date"]}>
                          {item[state.dateName || "Date"]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}

              <FormControl style={{ marginLeft: '16px', marginTop: "16px" }}>
                <InputLabel>{state.type === 'time-serious' ? 'Endogenous Variables' : 'Independent Variables'}</InputLabel>
                <div style={{ overflowX: 'auto' }}>
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
                </div>
              </FormControl>

              {state.type !== 'time-serious' &&
                <>
                  <FormControl style={{ marginLeft: '16px', marginTop: "16px" }}>
                    <InputLabel>Categorical Variables</InputLabel>
                    <div style={{ overflowX: 'auto' }}>
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
                    </div>
                  </FormControl>
                  <FormControl style={{ marginLeft: '16px', marginRight: '16px', marginTop: "16px" }}>
                    <InputLabel>Outliers</InputLabel>
                    <Select
                      value={state.outliers}
                      onChange={(e) => setState({ ...state, outliers: e.target.value })}
                      style={{ minWidth: '200px' }}
                    >
                      <MenuItem value='Yes'>
                        Remove Outliers
                      </MenuItem>
                      <MenuItem value='No'>
                        Keep Outliers
                      </MenuItem>
                    </Select>
                  </FormControl>
                </>
              }
            </> : null}
        </Box>



        <ButtonContainer>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSummary}
            style={{ width: '150px' }}
            disabled={state.data.length === 0 || state.dateName === ''}
          >
            Summary Statistics
          </Button>
          <ButtonSpacer />
          {state.type === 'time-serious' &&
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={showGraph}
                style={{ width: '150px' }}
                disabled={state.type === '' || state.data.length === 0 || state.dateName === ''}
              >
                Line Graph
              </Button>
              <ButtonSpacer />
            </>
          }
          <Button
            variant="contained"
            color="primary"
            onClick={handlePredict}
            style={{ width: '150px' }}
            disabled={state.type === '' || state.data.length === 0 || state.dateName === ''}
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
      <Box>
        {isLoading && <CircularProgress />}
      </Box>
      {state.showGraph && !state.showPredictResult && !state.showSummaryStat && (
        <Box
          style={{
            alignItems: 'center',
            marginTop: '16px',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <TimeSeriesChart
            data={state.dataGraph}
            dateName={state.dateName}
            targetVariables={state.x}
            stationary={state.stationary}
          />
        </Box>
      )}
      {state.showPredictResult && mlMethods1.includes(state.machineLearningMethod) && !state.showGraph && (
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
            title={state.predictionResult_withoutDiff.length>0 ? dependentField + ' ' + state.machineLearningMethod + ' Results By Making a Difference': dependentField + ' ' +  state.machineLearningMethod + ' Results'}
            itemsPerPage={25}
            headers={!['LASSO', 'RIDGE'].includes(state.machineLearningMethod) ? ['field_name', 'mean', 'standard_error', 'p_value'] : ['field_name', 'mean']}
            heteroscedasticity={state.heteroscedasticity}
            multicollinearity={state.multicollinearity}
            outliers_count={state.outliers_count}
            R2={state.R2}
          />
        </Box>
      )}
      {state.showPredictResult && state.predictionResult_withoutDiff.length>0
        && mlMethods1.includes(state.machineLearningMethod) && !state.showGraph && (
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
            data={state.predictionResult_withoutDiff}
            mse={state.mse_withoutDiff}
            filterData={filterData}
            title={dependentField + ' ' + state.machineLearningMethod + ' Results Without Making a Difference'}
            itemsPerPage={25}
            headers={!['LASSO', 'RIDGE'].includes(state.machineLearningMethod) ? ['field_name', 'mean', 'standard_error', 'p_value'] : ['field_name', 'mean']}
            heteroscedasticity={state.heteroscedasticity}
            multicollinearity={state.multicollinearity}
            outliers_count={state.outliers_count}
            R2={state.R2}
            adf={state.adf}
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
              title={dependentField + ' ' + state.machineLearningMethod + " Results"}
              type={state.type}
            />
          </Box>
        )
      }
    </Box>
  );
};

export default FileUpload;
