import React, { useState, useRef } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import Papa from 'papaparse';

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

const mlMethods = ['Method A', 'Method B', 'Method C'];
const depVars = ['Variable 1', 'Variable 2', 'Variable 3'];
const independentVars = ['IndepVar 1', 'IndepVar 2', 'IndepVar 3'];

const FileUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [machineLearningMethod, setMachineLearningMethod] = useState('');
    const [dependentVariable, setDependentVariable] = useState('');
    const [independentVariables, setIndependentVariables] = useState([]);
    const [predictionResult, setPredictionResult] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        parseCSVFile(file);
    };

    const parseCSVFile = (file) => {
        Papa.parse(file, {
            complete: (result) => {
                const headers = result.data[0];
                const mlMethods = result.data[1];
                const dependentVars = result.data[2];
                const independentVars = result.data[3];
                setMachineLearningMethod(mlMethods);
                setDependentVariable(dependentVars);
                setIndependentVariables(independentVars);
            },
            header: true,
        });
    };

    const handlePredict = () => {
        console.log(machineLearningMethod, dependentVariable, independentVariables, 'model inputs')
    };

    const handleClear = () => {
        setMachineLearningMethod([]);
        setDependentVariable([]);
        setIndependentVariables([]);
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-start"
            height="80vh"
            padding="20px"
            boxSizing="border-box"
        >
            <StyledTitle variant="h6">
                Data Analysis and Prediction
            </StyledTitle>

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
                            value={machineLearningMethod}
                            onChange={(e) => setMachineLearningMethod(e.target.value)}
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
                            value={dependentVariable}
                            onChange={(e) => setDependentVariable(e.target.value)}
                            style={{ minWidth: '200px' }}
                        >
                            {depVars.map((variable) => (
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
                            value={independentVariables}
                            onChange={(e) => setIndependentVariables(e.target.value)}
                            style={{ minWidth: '200px' }}
                            renderValue={(selected) => selected.join(', ')}
                        >
                            {independentVars.map((variable) => (
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
        </Box>
    );
};

export default FileUpload;
