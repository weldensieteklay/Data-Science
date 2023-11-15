import React, { useState, useRef } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField, Chip} from '@mui/material';
import { styled } from '@mui/material/styles';
import Papa from 'papaparse';
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
  y: '',
  x: [],
};


const FileUpload = () => {
  const [state, setState] = useState(initialState);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    parseCSVFile(file);
  };

  const parseCSVFile = (file) => {
    Papa.parse(file, {
      complete: (result) => {
        const parsedData = result.data || [];
        const filteredData = parsedData.length>0 && parsedData.filter((row) =>
          Object.values(row).every((value) => value !== undefined && value !== null && value !== '')
        );

        setState((prevState) => ({
          ...prevState,
          data: filteredData,
          dependentVariable: Object.keys(filteredData[0]) || [],
          independentVariables: Object.keys(filteredData[0]) || [],
        }));
      },
      header: true,
    });
  };

  const handlePredict = () => {
    setState((prevState) => ({
      ...prevState,
      predictionResult: predictionResults,
      showPredictResult: true,
    }));
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
    }));  };

  const removeVariable = (variable) => {
    const updatedX = state.x.filter((x) => x !== variable); 
    setState((prevState) => ({
      ...prevState,
      x: updatedX,
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
            <InputLabel>Machine Learning Method</InputLabel>
            <Select
              value={state.machineLearningMethod}
              onChange={(e) => setState({ ...state, machineLearningMethod: e.target.value })}
              style={{ minWidth: '200px' }}
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
              // onChange={(e) => setState({ ...state, y: e.target.value })}
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
                      onDelete={() => removeVariable(variable)}
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
          />
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
