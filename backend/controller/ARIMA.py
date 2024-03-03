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

        arima_model = ARIMA(train_data[endogenous_variable], order=(5, 1, 0))
        arima_results = arima_model.fit()

        forecast_values = arima_results.forecast(steps=len(test_data))

        mse = int(np.round(np.mean((test_data[endogenous_variable] - forecast_values) ** 2)))

        aic = arima_results.aic
        bic = arima_results.bic

        mean = arima_results.params
        standard_error = arima_results.bse
        p_value = arima_results.pvalues

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
