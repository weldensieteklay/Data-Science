import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const EditModal = ({ dataType, object, hiddenInputs = [], onClose, onUpdate }) => {
  const [editedObject, setEditedObject] = useState(object);
  const [updatedObject, setUpdatedObject] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedObject(prevObject => ({
      ...prevObject,
      [name]: value,
    }));
    setEditedObject(prevObject => ({
      ...prevObject,
      [name]: value,
    }));
  };

  const handleUpdate = () => {
    axios.patch(`http://localhost:5000/${dataType}/${object._id}`, updatedObject)
      .then(response => {
        console.log(response.data.message)
        onUpdate(editedObject); 
        onClose();
      })
      .catch(error => {
        console.error(`Error updating ${dataType}:`, error);
      });
  };

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>Edit {capitalizeFirstLetter(dataType)}</DialogTitle>
      <DialogContent>
        {Object.keys(object).map(key => {
          if (!hiddenInputs.includes(key)) {
            return (
              <TextField
                key={key}
                fullWidth
                margin="dense"
                label={capitalizeFirstLetter(key)}
                name={key}
                value={editedObject[key]}
                onChange={handleInputChange}
              />
            );
          }
          return null;
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleUpdate} color="primary">
          Save
        </Button>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditModal;
