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

