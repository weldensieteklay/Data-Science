import React, { useState } from 'react';
import { TextField, Button, FormControlLabel, Radio, RadioGroup, FormControl, FormLabel } from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const FormContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '300px',
    margin: '0 auto',
    alignItems: 'center', 
    width: '100%', 
});

const AuthForm = ({ modeConfig, handleSubmitProp }) => {
    const [formData, setFormData] = useState({});

    const handleInputChange = (name, value) => {
        if(name=='phone')value= '+' + value
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const { buttonText } = modeConfig;
        const apiEndPoint = buttonText === 'Sign In' ? 'signin' : 'signup';
        axios.post(`http://localhost:5000/users/${apiEndPoint}`, formData)
            .then(response => {
                handleSubmitProp(response.data); 
                alert('Successfully logged in');
            })
            .catch(err => {
                alert(err.message || 'An error occurred');
                console.log(err, 'Error from Sign In');
            });
    };
    
    return (
        <>
            <form onSubmit={handleSubmit}>
                <FormContainer>
                    {modeConfig.inputs.map((input, index) => (
                        <div key={index}>
                            {input.type === 'radio' ? (
                                <FormControl component="fieldset">
                                    <FormLabel component="legend">{input.label}</FormLabel>
                                    <RadioGroup
                                        name={input.name}
                                        value={formData[input.name] || ''}
                                        onChange={(e) => handleInputChange(input.name, e.target.value)}
                                    >
                                        {input.options.map((option, optionIndex) => (
                                            <FormControlLabel
                                                key={optionIndex}
                                                value={option.value}
                                                control={<Radio />}
                                                label={option.label}
                                            />
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                            ) : input.type === 'phone' ? (
                                <PhoneInput
                                    country={'us'}
                                    value={formData[input.name] || ''}
                                    onChange={(value) => handleInputChange(input.name, value)}
                                    inputStyle={{ height: '47px', width: '100%' }}
                                    containerStyle={{ width: '100%' }}
                                />
                            ) : (
                                <TextField
                                    type={input.type}
                                    name={input.name}
                                    label={input.label}
                                    placeholder={input.placeholder}
                                    value={formData[input.name] || ''}
                                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                                    InputProps={{ style: { height: '47px', width: '100%' } }}
                                    variant="outlined"
                                />
                            )}
                        </div>
                    ))}
                    <Button type="submit" variant="contained" sx={{ width: '230px' }}>
                        {modeConfig.buttonText}
                    </Button>
                </FormContainer>
            </form>
        </>
    );
};

export default AuthForm;
