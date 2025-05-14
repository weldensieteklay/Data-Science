from flask import jsonify, request
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller
import numpy as np

def is_valid_date(date_str):
    try:
        pd.to_datetime(date_str)
        return True
    except ValueError:
        return False

def test_stationarity(data):
    result = adfuller(data)
    p_value = result[1]
    
    if p_value < 0.05:
        stationary = True
    else:
        stationary = False
        
    return {'test_statistic': result[0], 'p_value': p_value, 'critical_values': result[4], 'stationary': stationary}

def predict_price():
    try:
        data = request.get_json()
        actual_datas = data.get('data')
        
        actual_data = [entry for entry in actual_datas if all(value not in ['', '0'] for value in entry.values())]
        
        if not actual_data:
            return jsonify({'error': 'No valid data provided'}), 400

        first_object = actual_data[0]
        keys = list(first_object.keys())

        date_column = None
        endogenous_variable = None

        for key in keys:
            value = first_object[key] 
            if is_valid_date(value):
                date_column = key
            else:
                endogenous_variable = key

        if date_column is None:
            return jsonify({'error': 'Could not find suitable column name for the date variable'}), 400

        if endogenous_variable is None:
            return jsonify({'error': 'Could not find suitable column name for the endogenous variable'}), 400

        df = pd.DataFrame(actual_data)

        df[date_column] = pd.to_datetime(df[date_column])
        df[endogenous_variable] = pd.to_numeric(df[endogenous_variable], errors='coerce')

        df.sort_values(by=date_column, inplace=True)

        lagged_variable_names = [f"{endogenous_variable}_{i}" for i in range(1, 4)]
        for lag, lagged_variable_name in enumerate(lagged_variable_names, start=1):
            df[lagged_variable_name] = df[endogenous_variable].shift(lag)

        df.dropna(inplace=True)

        time_series = df.set_index(date_column)

        split_index = int(len(time_series) * 0.8)
        train_data, test_data = time_series.iloc[:split_index], time_series.iloc[split_index:]

        # Test for stationarity
        stationary_results = test_stationarity(train_data[endogenous_variable])

        # Fit ARIMA model
        arima_order = (3, 0, 0) if stationary_results['stationary'] else (3, 1, 0)
        trend = 'c' if stationary_results['stationary'] else None
        arima_model = ARIMA(train_data[endogenous_variable], order=arima_order, trend=trend)
        arima_results = arima_model.fit()

        # Get model coefficients
        coefficients = arima_results.params

        # Extract lagged coefficients if available
        lagged_coefficients = [coefficients.get(f'ar.L{i}', np.nan) for i in range(1, 4)]

        # Extract standard errors and p-values if available
        standard_errors = arima_results.bse
        p_values = arima_results.pvalues

        # Construct results dictionary
        results_dict = []
        if 'const' in coefficients.index:  # Check if constant term exists
            constant_coefficient = coefficients['const']
            results_dict.append({'field_name': 'constant', 'mean': f"{constant_coefficient:.3f}", 
                                 'standard_error': f"{standard_errors['const']:.3f}" if 'const' in standard_errors.index else 'N/A', 
                                 'p_value': f"{p_values['const']:.3f}" if 'const' in p_values.index else 'N/A'})
        for i, (coefficient, std_error, p_value) in enumerate(zip(lagged_coefficients, standard_errors[1:], p_values[1:]), start=1):
            results_dict.append({'field_name': f'{endogenous_variable}_{i}', 'mean': f"{coefficient:.3f}", 
                                 'standard_error': f"{std_error:.3f}" if not np.isnan(std_error) else 'N/A', 
                                 'p_value': f"{p_value:.3f}" if not np.isnan(p_value) else 'N/A'})

        # Calculate MSE
        forecast_values = arima_results.forecast(steps=len(test_data))
        mse = int(np.round(np.mean((test_data[endogenous_variable] - forecast_values) ** 2)))

        # Get model statistics
        aic = arima_results.aic
        bic = arima_results.bic

        # Construct response object
        response = {
            'mse': mse,
            'aic': aic,
            'bic': bic,
            'data': results_dict,
            'stationary': stationary_results['stationary'],
            'adfuller': np.round(stationary_results['p_value'], 3)
        }

        # Add without_diff object if data is non-stationary
        if not stationary_results['stationary']:
            arima_order_without_diff = (3, 0, 0)
            trend_without_diff = 'c'
            arima_model_without_diff = ARIMA(train_data[endogenous_variable], order=arima_order_without_diff, trend=trend_without_diff)
            arima_results_without_diff = arima_model_without_diff.fit()

            # Get model coefficients for undifferenced series
            coefficients_without_diff = arima_results_without_diff.params

            # Extract lagged coefficients if available for undifferenced series
            lagged_coefficients_without_diff = [coefficients_without_diff.get(f'ar.L{i}', np.nan) for i in range(1, 4)]

            # Extract standard errors and p-values if available for undifferenced series
            standard_errors_without_diff = arima_results_without_diff.bse
            p_values_without_diff = arima_results_without_diff.pvalues

            # Calculate MSE for undifferenced series
            forecast_values_without_diff = arima_results_without_diff.forecast(steps=len(test_data))
            mse_without_diff = int(np.round(np.mean((test_data[endogenous_variable] - forecast_values_without_diff) ** 2)))

            # Get model statistics for undifferenced series
            aic_without_diff = arima_results_without_diff.aic
            bic_without_diff = arima_results_without_diff.bic

            # Construct results dictionary for undifferenced series
            results_dict_without_diff = []
            if 'const' in coefficients_without_diff.index:  # Check if constant term exists
                constant_coefficient_without_diff = coefficients_without_diff['const']
                results_dict_without_diff.append({'field_name': 'constant', 'mean': f"{constant_coefficient_without_diff:.3f}", 
                                         'standard_error': f"{standard_errors_without_diff['const']:.3f}" if 'const' in standard_errors_without_diff.index else 'N/A', 
                                         'p_value': f"{p_values_without_diff['const']:.3f}" if 'const' in p_values_without_diff.index else 'N/A'})
            for i, (coefficient, std_error, p_value) in enumerate(zip(lagged_coefficients_without_diff, standard_errors_without_diff[1:], p_values_without_diff[1:]), start=1):
                results_dict_without_diff.append({'field_name': f'{endogenous_variable}_{i}', 'mean': f"{coefficient:.3f}", 
                                         'standard_error': f"{std_error:.3f}" if not np.isnan(std_error) else 'N/A', 
                                         'p_value': f"{p_value:.3f}" if not np.isnan(p_value) else 'N/A'})

            # Add results for undifferenced series to response
            response['without_diff'] = {
                'mse': mse_without_diff,
                'aic': aic_without_diff,
                'bic': bic_without_diff,
                'data': results_dict_without_diff
            }

        return jsonify(response)

    except Exception as e:
        return jsonify({'error': repr(e)}), 500



# from flask import jsonify, request
# import pandas as pd
# from statsmodels.tsa.arima.model import ARIMA
# from statsmodels.tsa.statespace.sarimax import SARIMAX

# from statsmodels.tsa.stattools import adfuller
# import numpy as np

# def is_valid_date(date_str):
#     try:
#         pd.to_datetime(date_str)
#         return True
#     except ValueError:
#         return False

# def test_stationarity(data):
#     result = adfuller(data)
#     p_value = result[1]
#     stationary = p_value < 0.05
#     return {'test_statistic': result[0], 'p_value': p_value, 'critical_values': result[4], 'stationary': stationary}

# def get_variable_type(data, variable):
#     unique_values = data[variable].unique()
#     return 'categorical' if len(unique_values) <= 10 else 'continuous'

# def predict_price():
#     try:
#         data = request.get_json()
#         actual_datas = data.get('data')
#         exogenous_variables = data.get('exogenous', [])        
#         actual_data = [entry for entry in actual_datas if all(value not in ['', 'null'] for value in entry.values())]
        
#         if not actual_data:
#             return jsonify({'error': 'No valid data provided'}), 400

#         first_object = actual_data[0]
#         keys = list(first_object.keys())

#         date_column = None
#         endogenous_variable = None
#         categorical_exogenous_variables = []
#         continuous_exogenous_variables = []

#         for key in keys:
#             value = first_object[key] 
#             if is_valid_date(value):
#                 date_column = key
#             elif key not in exogenous_variables:
#                 endogenous_variable = key
#             elif key in exogenous_variables:
#                 variable_type = get_variable_type(pd.DataFrame(actual_data), key)
#                 if variable_type == 'categorical':
#                     categorical_exogenous_variables.append(key)
#                 else:
#                     continuous_exogenous_variables.append(key)

#         if date_column is None:
#             return jsonify({'error': 'Could not find suitable column name for the date variable'}), 400

#         df = pd.DataFrame(actual_data)

#         df[date_column] = pd.to_datetime(df[date_column])
#         df[endogenous_variable] = pd.to_numeric(df[endogenous_variable], errors='coerce')

#         df.sort_values(by=date_column, inplace=True)

#         lagged_variable_names = [f"{endogenous_variable}_{i}" for i in range(1, 4)]
#         for lag, lagged_variable_name in enumerate(lagged_variable_names, start=1):
#             if lagged_variable_name not in exogenous_variables:
#                 df[lagged_variable_name] = df[endogenous_variable].shift(lag)

#         df.dropna(inplace=True)

#         time_series = df.set_index(date_column)
#         split_index = int(len(time_series) * 0.8)
#         train_data, test_data = time_series.iloc[:split_index], time_series.iloc[split_index:]

#         # Test for stationarity
#         stationary_results = test_stationarity(train_data[endogenous_variable])

#         # Prepare exogenous variables
#         exog_train_data = {}
#         exog_test_data = {}
        
#         # For categorical exogenous variables
#         for var in categorical_exogenous_variables:
#             dummy_df_train = pd.get_dummies(train_data[var], prefix=var, drop_first=True)
#             dummy_df_train.columns = [var]
#             dummy_df_test = pd.get_dummies(test_data[var], prefix=var, drop_first=True)
#             dummy_df_test.columns = [var]
#             exog_train_data.update(dummy_df_train)
#             exog_test_data.update(dummy_df_test)

#         # For continuous exogenous variables
#         for var in continuous_exogenous_variables:
#             exog_train_data[var] = train_data[var].values.reshape(-1, 1)
#             exog_test_data[var] = test_data[var].values.reshape(-1, 1)

#         # Fill missing values with a default value (e.g., 0)
#         for exog_data in [exog_train_data, exog_test_data]:
#             for var in exog_data:
#                 exog_data[var].fillna(0, inplace=True)

#         # Convert categorical variables to integer type
#         for exog_data in [exog_train_data, exog_test_data]:
#             for var in categorical_exogenous_variables:
#                 exog_data[var] = exog_data[var].astype(int)
#         # Fit SARIMAX model
#         if stationary_results['stationary']:
#            arima_order = (3, 0, 0)
#         else:
#           arima_order = (3, 1, 0)

#         exog_train_df = pd.DataFrame.from_dict(exog_train_data)
#         exog_test_data = pd.DataFrame.from_dict(exog_test_data)
#         exog_test_data.index = test_data.index

#         exog_train_df.index = train_data.index
#           # Assuming train_data is a DataFrame with a suitable index
#         sarimax_model = SARIMAX(endog=train_data[endogenous_variable], order=arima_order, exog=exog_train_df)
#         sarimax_results = sarimax_model.fit()

#         # Get model coefficients, calculate MSE, and other statistics...
#         coefficients = sarimax_results.params
#         lagged_coefficients = [coefficients.get(f'ar.L{i}', np.nan) for i in range(1, 4)]
#         standard_errors = sarimax_results.bse
#         p_values = sarimax_results.pvalues

#         results_dict = []
#         # Extract coefficients, standard errors, and p-values of the exogenous variables
#         exog_coefficients = sarimax_results.params.loc[exogenous_variables]
#         exog_standard_errors = sarimax_results.bse.loc[exogenous_variables]
#         exog_p_values = sarimax_results.pvalues.loc[exogenous_variables]

# # Append exogenous variable information to results_dict
#         for exog_var in exogenous_variables:
#             mean_value = exog_coefficients[exog_var]
#             std_error_value = exog_standard_errors[exog_var]
#             p_value_value = exog_p_values[exog_var]
    
#             results_dict.append({'field_name': exog_var, 
#                          'mean': f"{mean_value:.3f}", 
#                          'standard_error': f"{std_error_value:.3f}" if not np.isnan(std_error_value) else 'N/A', 
#                          'p_value': f"{p_value_value:.3f}" if not np.isnan(p_value_value) else 'N/A'})

#         if 'const' in coefficients.index:  
#             constant_coefficient = coefficients['const']
#             results_dict.append({'field_name': 'constant', 'mean': f"{constant_coefficient:.3f}", 
#                                  'standard_error': f"{standard_errors['const']:.3f}" if 'const' in standard_errors.index else 'N/A', 
#                                  'p_value': f"{p_values['const']:.3f}" if 'const' in p_values.index else 'N/A'})
#         for i, (coefficient, std_error, p_value) in enumerate(zip(lagged_coefficients, standard_errors[1:], p_values[1:]), start=1):
#             results_dict.append({'field_name': f'{endogenous_variable}_{i}', 'mean': f"{coefficient:.3f}", 
#                                  'standard_error': f"{std_error:.3f}" if not np.isnan(std_error) else 'N/A', 
#                                  'p_value': f"{p_value:.3f}" if not np.isnan(p_value) else 'N/A'})

#         # Make forecast
#         forecast_values = sarimax_results.forecast(steps=len(test_data), exog=exog_test_data)
#         mse = int(np.round(np.mean((test_data[endogenous_variable] - forecast_values) ** 2)))
#         aic = sarimax_results.aic
#         bic = sarimax_results.bic

#         response = {
#             'mse': mse,
#             'aic': aic,
#             'bic': bic,
#             'data': results_dict,
#             'stationary': stationary_results['stationary'],
#             'adfuller': np.round(stationary_results['p_value'], 3)
#         }
#         response['stationary'] = int(stationary_results['stationary'])

#         return jsonify(response)

#     except Exception as e:
#         return jsonify({'error': repr(e)}), 500

# from flask import jsonify, request
# import pandas as pd
# from statsmodels.tsa.statespace.sarimax import SARIMAX
# from statsmodels.tsa.stattools import adfuller
# import numpy as np

# def is_valid_date(date_str):
#     try:
#         pd.to_datetime(date_str)
#         return True
#     except ValueError:
#         return False

# def test_stationarity(data):
#     result = adfuller(data)
#     p_value = result[1]
#     stationary = p_value < 0.05
#     return {'test_statistic': result[0], 'p_value': p_value, 'critical_values': result[4], 'stationary': stationary}

# def get_variable_type(data, variable):
#     unique_values = data[variable].unique()
#     return 'categorical' if len(unique_values) <= 10 else 'continuous'

# def predict_price():
#     try:
#         data = request.get_json()
#         actual_datas = data.get('data')
#         exogenous_variables = data.get('exogenous', [])        
#         actual_data = [entry for entry in actual_datas if all(value not in ['', 'null'] for value in entry.values())]
        
#         if not actual_data:
#             return jsonify({'error': 'No valid data provided'}), 400

#         first_object = actual_data[0]
#         keys = list(first_object.keys())

#         date_column = None
#         endogenous_variable = None
#         categorical_exogenous_variables = []
#         continuous_exogenous_variables = []

#         for key in keys:
#             value = first_object[key] 
#             if is_valid_date(value):
#                 date_column = key
#             elif key not in exogenous_variables:
#                 endogenous_variable = key
#             elif key in exogenous_variables:
#                 variable_type = get_variable_type(pd.DataFrame(actual_data), key)
#                 if variable_type == 'categorical':
#                     categorical_exogenous_variables.append(key)
#                 else:
#                     continuous_exogenous_variables.append(key)

#         if date_column is None:
#             return jsonify({'error': 'Could not find suitable column name for the date variable'}), 400

#         df = pd.DataFrame(actual_data)

#         df[date_column] = pd.to_datetime(df[date_column])
#         df[endogenous_variable] = pd.to_numeric(df[endogenous_variable], errors='coerce')

#         df.sort_values(by=date_column, inplace=True)

#         lagged_variable_names = [f"{endogenous_variable}_{i}" for i in range(1, 4)]
#         for lag, lagged_variable_name in enumerate(lagged_variable_names, start=1):
#             if lagged_variable_name not in exogenous_variables:
#                 df[lagged_variable_name] = df[endogenous_variable].shift(lag)

#         df.dropna(inplace=True)

#         time_series = df.set_index(date_column)
#         split_index = int(len(time_series) * 0.8)
#         train_data, test_data = time_series.iloc[:split_index], time_series.iloc[split_index:]

#         # Test for stationarity
#         stationary_results = test_stationarity(train_data[endogenous_variable])

#         # Prepare exogenous variables
#         exog_train_data = {}
#         exog_test_data = {}
        
#         # For categorical exogenous variables
#         for var in categorical_exogenous_variables:
#             dummy_df_train = pd.get_dummies(train_data[var], prefix=var, drop_first=True)
#             dummy_df_train.columns = [var]
#             dummy_df_test = pd.get_dummies(test_data[var], prefix=var, drop_first=True)
#             dummy_df_test.columns = [var]
#             exog_train_data.update(dummy_df_train)
#             exog_test_data.update(dummy_df_test)

#         # For continuous exogenous variables
#         for var in continuous_exogenous_variables:
#             exog_train_data[var] = train_data[var].values.reshape(-1, 1)
#             exog_test_data[var] = test_data[var].values.reshape(-1, 1)

#         # Fill missing values with a default value (e.g., 0)
#         for exog_data in [exog_train_data, exog_test_data]:
#             for var in exog_data:
#                 exog_data[var].fillna(0, inplace=True)

#         # Convert categorical variables to integer type
#         for exog_data in [exog_train_data, exog_test_data]:
#             for var in categorical_exogenous_variables:
#                 exog_data[var] = exog_data[var].astype(int)
                
#         # Fit SARIMAX model
#         if stationary_results['stationary']:
#             arima_order = (3, 0, 0)
#         else:
#             arima_order = (3, 1, 0)

#         exog_train_df = pd.DataFrame.from_dict(exog_train_data)
#         exog_test_data = pd.DataFrame.from_dict(exog_test_data)
#         exog_test_data.index = test_data.index
#         exog_train_df.index = train_data.index

#         sarimax_model = SARIMAX(endog=train_data[endogenous_variable], order=arima_order, exog=exog_train_df)
#         sarimax_results = sarimax_model.fit()

#         # Get model coefficients, calculate MSE, and other statistics...
#         coefficients = sarimax_results.params
#         lagged_coefficients = [coefficients.get(f'ar.L{i}', np.nan) for i in range(1, 4)]
#         standard_errors = sarimax_results.bse
#         p_values = sarimax_results.pvalues

#         results_dict = []
#         # Extract coefficients, standard errors, and p-values of the exogenous variables
#         exog_coefficients = sarimax_results.params.loc[exogenous_variables]
#         exog_standard_errors = sarimax_results.bse.loc[exogenous_variables]
#         exog_p_values = sarimax_results.pvalues.loc[exogenous_variables]

#         # Append exogenous variable information to results_dict
#         for exog_var in exogenous_variables:
#             mean_value = exog_coefficients[exog_var]
#             std_error_value = exog_standard_errors[exog_var]
#             p_value_value = exog_p_values[exog_var]
    
#             results_dict.append({'field_name': exog_var, 
#                          'mean': f"{mean_value:.3f}", 
#                          'standard_error': f"{std_error_value:.3f}" if not np.isnan(std_error_value) else 'N/A', 
#                          'p_value': f"{p_value_value:.3f}" if not np.isnan(p_value_value) else 'N/A'})

#         if 'const' in coefficients.index:  
#             constant_coefficient = coefficients['const']
#             results_dict.append({'field_name': 'constant', 'mean': f"{constant_coefficient:.3f}", 
#                                  'standard_error': f"{standard_errors['const']:.3f}" if 'const' in standard_errors.index else 'N/A', 
#                                  'p_value': f"{p_values['const']:.3f}" if 'const' in p_values.index else 'N/A'})
#         for i, (coefficient, std_error, p_value) in enumerate(zip(lagged_coefficients, standard_errors[1:], p_values[1:]), start=1):
#             results_dict.append({'field_name': f'{endogenous_variable}_{i}', 'mean': f"{coefficient:.3f}", 
#                                  'standard_error': f"{std_error:.3f}" if not np.isnan(std_error) else 'N/A', 
#                                  'p_value': f"{p_value:.3f}" if not np.isnan(p_value) else 'N/A'})

#         # Make forecast
#         forecast_values = sarimax_results.forecast(steps=len(test_data), exog=exog_test_data)
#         mse = int(np.round(np.mean((test_data[endogenous_variable] - forecast_values) ** 2)))
#         aic = sarimax_results.aic
#         bic = sarimax_results.bic

#         response = {
#             'mse': mse,
#             'aic': aic,
#             'bic': bic,
#             'data': results_dict,
#             'stationary': stationary_results['stationary'],
#             'adfuller': np.round(stationary_results['p_value'], 3)
#         }
#         response['stationary'] = int(stationary_results['stationary'])

#         # If the series is non-stationary, perform the same analysis without differencing
#         if not stationary_results['stationary']:
#             arima_order_without_diff = (3, 0, 0)
#             exog_train_df_without_diff = pd.DataFrame.from_dict(exog_train_data)
#             exog_train_df_without_diff.index = train_data.index

#             sarimax_model_without_diff = SARIMAX(endog=train_data[endogenous_variable], order=arima_order_without_diff, exog=exog_train_df_without_diff)
#             sarimax_results_without_diff = sarimax_model_without_diff.fit()

#             # Get model coefficients, calculate MSE, and other statistics for undifferenced series
#             coefficients_without_diff = sarimax_results_without_diff.params
#             lagged_coefficients_without_diff = [coefficients_without_diff.get(f'ar.L{i}', np.nan) for i in range(1, 4)]
#             standard_errors_without_diff = sarimax_results_without_diff.bse
#             p_values_without_diff = sarimax_results_without_diff.pvalues

#             results_dict_without_diff = []

#             # Append exogenous variable information to results_dict_without_diff
#             for exog_var in exogenous_variables:
#                 mean_value = coefficients_without_diff.get(exog_var, np.nan)
#                 std_error_value = standard_errors_without_diff.get(exog_var, np.nan)
#                 p_value_value = p_values_without_diff.get(exog_var, np.nan)

#                 results_dict_without_diff.append({'field_name': exog_var, 
#                                                   'mean': f"{mean_value:.3f}", 
#                                                   'standard_error': f"{std_error_value:.3f}" if not np.isnan(std_error_value) else 'N/A', 
#                                                   'p_value': f"{p_value_value:.3f}" if not np.isnan(p_value_value) else 'N/A'})

#             # Append constant coefficient information if available
#             if 'const' in coefficients_without_diff.index:
#                 constant_coefficient_without_diff = coefficients_without_diff['const']
#                 results_dict_without_diff.append({'field_name': 'constant', 'mean': f"{constant_coefficient_without_diff:.3f}", 
#                                                    'standard_error': f"{standard_errors_without_diff.get('const', 'N/A'):.3f}", 
#                                                    'p_value': f"{p_values_without_diff.get('const', 'N/A'):.3f}"})

#             # Append lagged coefficients information if available
#             for i, (coefficient, std_error, p_value) in enumerate(zip(lagged_coefficients_without_diff, standard_errors_without_diff[1:], p_values_without_diff[1:]), start=1):
#                 results_dict_without_diff.append({'field_name': f'{endogenous_variable}_{i}', 'mean': f"{coefficient:.3f}", 
#                                                   'standard_error': f"{std_error:.3f}" if not np.isnan(std_error) else 'N/A', 
#                                                   'p_value': f"{p_value:.3f}" if not np.isnan(p_value) else 'N/A'})

#             # Make forecast for undifferenced series
#             forecast_values_without_diff = sarimax_results_without_diff.forecast(steps=len(test_data), exog=exog_test_data)
#             mse_without_diff = int(np.round(np.mean((test_data[endogenous_variable] - forecast_values_without_diff) ** 2)))
#             aic_without_diff = sarimax_results_without_diff.aic
#             bic_without_diff = sarimax_results_without_diff.bic

#             # Add undifferenced series information to response
#             response['without_diff'] = {
#                 'mse': mse_without_diff,
#                 'aic': aic_without_diff,
#                 'bic': bic_without_diff,
#                 'data': results_dict_without_diff
#             }

#         return jsonify(response)

#     except Exception as e:
#         return jsonify({'error': repr(e)}), 500

from flask import jsonify, request
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.stattools import adfuller
import numpy as np

def is_valid_date(date_str):
    try:
        pd.to_datetime(date_str)
        return True
    except ValueError:
        return False

def test_stationarity(data):
    result = adfuller(data)
    p_value = result[1]
    stationary = p_value < 0.05
    return {'test_statistic': result[0], 'p_value': p_value, 'critical_values': result[4], 'stationary': stationary}

def get_variable_type(data, variable):
    unique_values = data[variable].unique()
    return 'categorical' if len(unique_values) <= 10 else 'continuous'

def predict_price():
    try:
        data = request.get_json()
        actual_datas = data.get('data')
        exogenous_variables = data.get('exogenous', [])        
        actual_data = [entry for entry in actual_datas if all(value not in ['', 'null'] for value in entry.values())]
        
        if not actual_data:
            return jsonify({'error': 'No valid data provided'}), 400

        first_object = actual_data[0]
        keys = list(first_object.keys())

        date_column = None
        endogenous_variable = None
        categorical_exogenous_variables = []
        continuous_exogenous_variables = []

        for key in keys:
            value = first_object[key] 
            if is_valid_date(value):
                date_column = key
            elif key not in exogenous_variables:
                endogenous_variable = key
            elif key in exogenous_variables:
                variable_type = get_variable_type(pd.DataFrame(actual_data), key)
                if variable_type == 'categorical':
                    categorical_exogenous_variables.append(key)
                else:
                    continuous_exogenous_variables.append(key)

        if date_column is None:
            return jsonify({'error': 'Could not find suitable column name for the date variable'}), 400

        df = pd.DataFrame(actual_data)

        df[date_column] = pd.to_datetime(df[date_column])
        df[endogenous_variable] = pd.to_numeric(df[endogenous_variable], errors='coerce')

        df.sort_values(by=date_column, inplace=True)

        lagged_variable_names = [f"{endogenous_variable}_{i}" for i in range(1, 4)]
        for lag, lagged_variable_name in enumerate(lagged_variable_names, start=1):
            if lagged_variable_name not in exogenous_variables:
                df[lagged_variable_name] = df[endogenous_variable].shift(lag)

        df.dropna(inplace=True)

        time_series = df.set_index(date_column)
        split_index = int(len(time_series) * 0.8)
        train_data, test_data = time_series.iloc[:split_index], time_series.iloc[split_index:]

        # Test for stationarity
        stationary_results = test_stationarity(train_data[endogenous_variable])

        # Prepare exogenous variables
        exog_train_data = {}
        exog_test_data = {}
        
        # For categorical exogenous variables
        for var in categorical_exogenous_variables:
            dummy_df_train = pd.get_dummies(train_data[var], prefix=var, drop_first=True)
            dummy_df_train.columns = [var]
            dummy_df_test = pd.get_dummies(test_data[var], prefix=var, drop_first=True)
            dummy_df_test.columns = [var]
            exog_train_data.update(dummy_df_train)
            exog_test_data.update(dummy_df_test)

        # For continuous exogenous variables
        for var in continuous_exogenous_variables:
            exog_train_data[var] = train_data[var].values.reshape(-1, 1)
            exog_test_data[var] = test_data[var].values.reshape(-1, 1)

        # Fill missing values with a default value (e.g., 0)
        for exog_data in [exog_train_data, exog_test_data]:
            for var in exog_data:
                exog_data[var].fillna(0, inplace=True)

        # Convert categorical variables to integer type
        for exog_data in [exog_train_data, exog_test_data]:
            for var in categorical_exogenous_variables:
                exog_data[var] = exog_data[var].astype(int)
                
        # Fit SARIMAX model if exogenous variables are provided, otherwise fit ARIMA model
        if exogenous_variables:
            if stationary_results['stationary']:
                arima_order = (3, 0, 0)
            else:
                arima_order = (3, 1, 0)

            exog_train_df = pd.DataFrame.from_dict(exog_train_data)
            exog_test_data = pd.DataFrame.from_dict(exog_test_data)
            exog_test_data.index = test_data.index
            exog_train_df.index = train_data.index

            # sarimax_model = SARIMAX(endog=train_data[endogenous_variable], order=arima_order, exog=exog_train_df)
            sarimax_model = SARIMAX(endog=train_data[endogenous_variable], order=arima_order, exog=exog_train_df, trend='c')

            sarimax_results = sarimax_model.fit()

            coefficients = sarimax_results.params
            lagged_coefficients = [coefficients.get(f'ar.L{i}', np.nan) for i in range(1, 4)]
            standard_errors = sarimax_results.bse
            p_values = sarimax_results.pvalues

            results_dict = []
            # Extract coefficients, standard errors, and p-values of the exogenous variables
            exog_coefficients = sarimax_results.params.loc[exogenous_variables]
            exog_standard_errors = sarimax_results.bse.loc[exogenous_variables]
            exog_p_values = sarimax_results.pvalues.loc[exogenous_variables]

            # Append exogenous variable information to results_dict
            for exog_var in exogenous_variables:
                mean_value = exog_coefficients[exog_var]
                std_error_value = exog_standard_errors[exog_var]
                p_value_value = exog_p_values[exog_var]
        
                results_dict.append({'field_name': exog_var, 
                            'mean': f"{mean_value:.3f}", 
                            'standard_error': f"{std_error_value:.3f}" if not np.isnan(std_error_value) else 'N/A', 
                            'p_value': f"{p_value_value:.3f}" if not np.isnan(p_value_value) else 'N/A'})

            if 'intercept' in coefficients.index:  
                constant_coefficient = coefficients['intercept']
                results_dict.append({'field_name': 'constant', 'mean': f"{constant_coefficient:.3f}", 
                                    'standard_error': f"{standard_errors['intercept']:.3f}" if 'intercept' in standard_errors.index else 'N/A', 
                                    'p_value': f"{p_values['intercept']:.3f}" if 'intercept' in p_values.index else 'N/A'})
            for i, (coefficient, std_error, p_value) in enumerate(zip(lagged_coefficients, standard_errors[1:], p_values[1:]), start=1):
                results_dict.append({'field_name': f'{endogenous_variable}_{i}', 'mean': f"{coefficient:.3f}", 
                                    'standard_error': f"{std_error:.3f}" if not np.isnan(std_error) else 'N/A', 
                                    'p_value': f"{p_value:.3f}" if not np.isnan(p_value) else 'N/A'})

            # Prepare the response in the desired format
            response = {
                'mse': int(np.round(sarimax_results.mse)),
                'aic': int(np.round(sarimax_results.aic)),
                'bic': int(np.round(sarimax_results.bic)),
                'data': results_dict,
                'stationary': int(stationary_results['stationary']),
                'adfuller': np.round(stationary_results['p_value'], 3)
            }

            return jsonify(response), 200
        else:
            # Fit ARIMA model
            if stationary_results['stationary']:
                arima_order = (3, 0, 0)
            else:
                arima_order = (3, 1, 0)

            arima_model = ARIMA(train_data[endogenous_variable], order=arima_order)
            arima_results = arima_model.fit()

            # Get model coefficients, calculate MSE, and other statistics...
            coefficients = arima_results.params
            lagged_coefficients = [coefficients.get(f'ar.L{i}', np.nan) for i in range(1, 4)]
            standard_errors = arima_results.bse
            p_values = arima_results.pvalues

            results_dict = []

            if 'const' in coefficients.index:  
                constant_coefficient = coefficients['const']
                results_dict.append({'field_name': 'constant', 'mean': f"{constant_coefficient:.3f}", 
                                    'standard_error': f"{standard_errors['const']:.3f}" if 'const' in standard_errors.index else 'N/A', 
                                    'p_value': f"{p_values['const']:.3f}" if 'const' in p_values.index else 'N/A'})
            for i, (coefficient, std_error, p_value) in enumerate(zip(lagged_coefficients, standard_errors[1:], p_values[1:]), start=1):
                results_dict.append({'field_name': f'Lagged {i}', 'mean': f"{coefficient:.3f}", 
                                    'standard_error': f"{std_error:.3f}" if not np.isnan(std_error) else 'N/A', 
                                    'p_value': f"{p_value:.3f}" if not np.isnan(p_value) else 'N/A'})

            # Prepare the response in the desired format
            response = {
                'mse': int(np.round(arima_results.mse)),
                'aic': int(np.round(arima_results.aic)),
                'bic': int(np.round(arima_results.bic)),
                'data': results_dict,
                'stationary': int(stationary_results['stationary']),
                'adfuller': np.round(stationary_results['p_value'], 3)
            }

            return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
