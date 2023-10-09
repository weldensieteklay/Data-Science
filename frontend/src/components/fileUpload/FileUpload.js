import React, { useState, useRef } from 'react';
import { Box, Typography, Button, FormControl, InputLabel, Select, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import Papa from 'papaparse';
import CustomButton from '../common/ButtonComponent'; // Adjust the import path accordingly

const StyledTitle = styled(Typography)(({ theme }) => ({
    color: 'white',
    margin: 0,
    padding: '16px',
    backgroundColor: 'darkblue',
    fontWeight: 'bold',
    textAlign: 'center',
    boxShadow: theme.shadows[8],
    width: '95%',
    marginBottom: '26px', 
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
    boxShadow: theme.shadows[8], 

}));

const ButtonContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    marginTop: '16px',
}));

const ButtonSpacer = styled(Box)(({ theme }) => ({
    marginLeft: '16px',
}));

const res = [
    {     
    mean: 0.34,
    standard_error: 0.024,

}]
const FileUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [machineLearningMethod, setMachineLearningMethod] = useState('');
    const [dependentVariable, setDependentVariable] = useState('');
    const [independentVariables, setIndependentVariables] = useState([]);
    const [predictionResult, setPredictionResult] = useState([])
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        saveFileToIndexedDB(file);
        parseCSVFile(file);
    };

    const saveFileToIndexedDB = (file) => {
        const request = window.indexedDB.open('FileDatabase', 1);

        request.onerror = (event) => {
            console.error('Database error: ', event.target.errorCode);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;

            const transaction = db.transaction(['files'], 'readwrite');

            const objectStore = transaction.objectStore('files');

            const fileReader = new FileReader();

            fileReader.onload = (event) => {
                const fileData = event.target.result;

                const addRequest = objectStore.add({ data: fileData, fileName: file.name });

                addRequest.onsuccess = () => {
                    console.log('File added to IndexedDB.');
                };

                addRequest.onerror = () => {
                    console.error('Error adding file to IndexedDB.');
                };
            };

            fileReader.readAsArrayBuffer(file);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const objectStore = db.createObjectStore('files', { keyPath: 'fileName' });
            console.log('Database setup complete.');
        };
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
        // Code to send selected data to the backend (e.g., using fetch)
        // Example: Sending a POST request to a backend endpoint
        fetch('your_backend_endpoint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: machineLearningMethod,
                dependentVariable,
                independentVariables,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                // Handle the response from the backend
                console.log('Prediction response:', data);
                setPredictionResult(data)
            })
            .catch((error) => {
                console.error('Error predicting:', error);
            });
    };

    const handleClear = () => {
        // Code to clear selected data
        setMachineLearningMethod('');
        setDependentVariable('');
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
                            {/* Add your machine learning methods here */}
                        </Select>
                    </FormControl>
                    <FormControl style={{ marginLeft: '16px' }}>
                        <InputLabel>Dependent Variable</InputLabel>
                        <Select
                            value={dependentVariable}
                            onChange={(e) => setDependentVariable(e.target.value)}
                            style={{ minWidth: '200px' }}
                        >
                        </Select>
                    </FormControl>
                    <FormControl style={{ marginLeft: '16px' }}>
                        <InputLabel>Independent Variables</InputLabel>
                        <Select
                            multiple
                            value={independentVariables}
                            onChange={(e) => setIndependentVariables(e.target.value)}
                            style={{ minWidth: '200px' }}
                        >
                        </Select>
                    </FormControl>
                </Box>
                <ButtonContainer>
                    <CustomButton
                        label="Predict"
                        onClick={handlePredict}
                        width="150px"
                    />
                    <ButtonSpacer />
                    <CustomButton
                        label="Clear"
                        onClick={handleClear}
                        width="150px"
                        backgroundColor="secondary.main"

                    />
                </ButtonContainer>
            </ContentWrapper>
        </Box>
    );
};

export default FileUpload;
