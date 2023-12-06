# // const express = require('express');
# // const authController = require('../controller/controller');

# // const router = express.Router();

# // //user routes
# // router.post('/users/signin', authController.signIn);
# // router.post('/users/signup', authController.signUp);
# // router.get('/users', authController.getAllUsers);
# // router.delete('/users/:id', authController.deleteUser);
# // router.patch('/users/:id', authController.updateUser);
# // router.post('/OLS', authController.OLSPrediction);


# // module.exports = router;


from flask import Blueprint
from controller.controller import signUp, signIn, getAllUsers, updateUser, deleteUser
from controller.OLS import run_ols_model  

routes = Blueprint('routes', __name__)

# Define your routes using the imported functions
routes.route('/users/signup', methods=['POST'])(signUp)
routes.route('/users/signin', methods=['POST'])(signIn)
routes.route('/users', methods=['GET'])(getAllUsers)
routes.route('/users/<int:id>', methods=['PATCH'])(updateUser)
routes.route('/users/<int:id>', methods=['DELETE'])(deleteUser)
routes.route('/OLS', methods=['POST'])(run_ols_model)
