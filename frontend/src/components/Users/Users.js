import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomTable from '../../components/common/CustomTable';
import EditModal from '../common/EditModal';
import ConfirmationModal from '../common/ConfirmationModal';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null); // State to track the item ID for deletion


  const filterData = ['_id', 'createdAt', 'updatedAt', 'password', '__v'];
  useEffect(() => {
    axios.get('http://localhost:5000/users')
      .then(response => {
        setUsers(response.data.data);
      })
      .catch(error => {
        console.error('Error fetching user list:', error);
      });
  }, []);

  const handleEdit = (itemId) => {
    const objectToEdit = users.find(user => user._id === itemId);
    setSelectedObject(objectToEdit);
  };

  const handleDelete = (itemId) => {
    axios.delete(`http://localhost:5000/users/${itemId}`)
      .then(response => {
        console.log(response.data.message);
        setUsers(prevData => prevData.filter(dataItem => dataItem._id !== itemId));
      })
      .catch(error => {
        console.error('Error deleting user:', error);
      });
    setDeleteItem(null);
  };

  const onDelete = (itemId) => {
    const userToEdit = users.find(user => user._id === itemId);
    setDeleteItem(userToEdit);
  };

  const handleUpdate = (editedObject) => {
    setUsers(prevUsers =>
      prevUsers.map(user => {
        if (user._id === editedObject._id) {
          return editedObject;
        }
        return user;
      })
    );
  };

  return (
    <>
      <CustomTable
        data={users}
        filterData={filterData}
        title={'User List'}
        onEdit={handleEdit}
        onDelete={onDelete}
      />
      {selectedObject && EditModal && (
        <EditModal
          dataType="users"
          object={selectedObject}
          onClose={() => setSelectedObject(null)}
          onUpdate={handleUpdate}
          hiddenInputs={filterData}
        />
      )}
      {deleteItem && (
        <ConfirmationModal
          open={true}
          message={`Are you sure you want to delete ${deleteItem.first_name + ' ' + deleteItem.last_name}?`}
          onClose={() => setDeleteItem(null)}
          onConfirm={() => handleDelete(deleteItem._id)}
        />
      )}
    </>
  );
};

export default UsersList;
