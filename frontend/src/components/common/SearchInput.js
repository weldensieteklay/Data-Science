import React, { useState } from 'react';
import { TextField } from '@mui/material';

const SearchInput = ()=> {

  const [focused, setFocused] = useState(false);

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  return (
    <TextField
      id="outlined-basic"
      label={focused ? '' : 'Search'}
      variant="outlined"
      size="small"
      onFocus={handleFocus}
      onBlur={handleBlur}
      InputProps={{
        style: {
          backgroundColor: 'white',
        },
      }}
      InputLabelProps={{
        style: {
          color: focused ? 'white' : 'black',
        },
      }}
      sx={{
        height: 32,
        borderRadius: 16,
      }}
    />
  );
}

export default SearchInput;
