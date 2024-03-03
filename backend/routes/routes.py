from flask import Blueprint
from controller.controller import signUp, signIn, getAllUsers, updateUser, deleteUser
from controller.OLS import run_ols_model  
from controller.GLS import run_gls_model  
from controller.LASSO import run_lasso_model  
from controller.RIDGE import run_ridge_model  
from controller.BAGGING import run_bagging_model
from controller.FOREST import run_random_forest_model
from controller.BOOSTING import run_xgboost_model
from controller.Neural_Network import run_neural_network_model
from controller.ARIMA import predict_price

routes = Blueprint('routes', __name__)

# Define your routes using the imported functions
routes.route('/users/signup', methods=['POST'])(signUp)
routes.route('/users/signin', methods=['POST'])(signIn)
routes.route('/users', methods=['GET'])(getAllUsers)
routes.route('/users/<int:id>', methods=['PATCH'])(updateUser)
routes.route('/users/<int:id>', methods=['DELETE'])(deleteUser)
routes.route('/OLS', methods=['POST'])(run_ols_model)
routes.route('/GLS', methods=['POST'])(run_gls_model)
routes.route('/RIDGE', methods=['POST'])(run_ridge_model)
routes.route('/LASSO', methods=['POST'])(run_lasso_model)
routes.route('/RANDOM-FOREST', methods=['POST'])(run_random_forest_model)
routes.route('/BAGGING', methods=['POST'])(run_bagging_model)
routes.route('/BOOSTING', methods=['POST'])(run_xgboost_model)
routes.route('/NEURAL_NETWORK', methods=['POST'])(run_neural_network_model)
routes.route('/ARIMA', methods=['POST'])(predict_price)
