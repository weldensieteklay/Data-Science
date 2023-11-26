const express = require('express');
const authController = require('../controller/controller');

const router = express.Router();

//user routes
router.post('/users/signin', authController.signIn);
router.post('/users/signup', authController.signUp);
router.get('/users', authController.getAllUsers);
router.delete('/users/:id', authController.deleteUser);
router.patch('/users/:id', authController.updateUser);
router.post('/OLS', authController.OLSPrediction);


module.exports = router;