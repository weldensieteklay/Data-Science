from flask import jsonify, request
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
import numpy as np

def is_valid_date(date_str):
    try:
        pd.to_datetime(date_str)
        return True
    except ValueError:
        return False

def predict_price():
    try:
        data = request.get_json()
        actual_data = data.get('data')
        date_column = data.get('date_column', 'Date')  # Default to 'Date' if not provided
        endogenous_variable = data.get('endogenous_variable', 'india')  # Default to 'india' if not provided
        
        df = pd.DataFrame(actual_data)

        # Convert data types
        df[date_column] = pd.to_datetime(df[date_column])
        df[endogenous_variable] = pd.to_numeric(df[endogenous_variable], errors='coerce')

        # Sort DataFrame by date
        df.sort_values(by=date_column, inplace=True)

        # Create lagged variables
        lagged_variable_names = [f"{endogenous_variable}_{i}" for i in range(1, 4)]
        for lag, lagged_variable_name in enumerate(lagged_variable_names, start=1):
            df[lagged_variable_name] = df[endogenous_variable].shift(lag)

        # Drop rows with NaN values
        df.dropna(inplace=True)

        # Prepare the time series data
        time_series = df.set_index(date_column)

        # Split the data into training and testing sets
        split_index = int(len(time_series) * 0.8)
        train_data, test_data = time_series.iloc[:split_index], time_series.iloc[split_index:]

        # Configure and fit the ARIMA model
        arima_model = ARIMA(train_data[endogenous_variable], order=(5, 1, 0))
        arima_results = arima_model.fit()

        # Forecast using the ARIMA model
        forecast_values = arima_results.forecast(steps=len(test_data))

        # Calculate Mean Squared Error (MSE)
        mse = int(np.round(np.mean((test_data[endogenous_variable] - forecast_values) ** 2)))

        # Calculate AIC and BIC
        aic = arima_results.aic
        bic = arima_results.bic

        # Extract coefficients, standard errors, and p-values
        mean = arima_results.params
        standard_error = arima_results.bse
        p_value = arima_results.pvalues

        # Construct results dictionary
        results_dict = [
            {'field_name': 'constant', 'mean': f"{mean[0]:.3f}", 'standard_error': f"{standard_error[0]:.3f}",
             'p_value': f"{p_value[0]:.3f}"}
        ] + [
            {'field_name': f'{column}', 'mean': f"{mean[i]:.3f}", 'standard_error': f"{standard_error[i]:.3f}",
             'p_value': f"{p_value[i]:.3f}"}
            for i, column in enumerate(train_data.columns[1:])
        ]

        return jsonify({'mse': mse, 'aic': aic, 'bic': bic, 'data': results_dict})

    except Exception as e:
        return jsonify({'error': repr(e)}), 500
