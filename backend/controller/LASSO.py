# lasso_model.py
from sklearn.linear_model import Lasso
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
import statsmodels.api as sm
from scipy.stats import zscore
from flask import jsonify, request

def remove_outliers(df, columns, z_threshold=3):
    before_outliers = len(df)
    df = df[(np.abs(zscore(df[columns])) < z_threshold).all(axis=1)]
    after_outliers = len(df)
    return df, before_outliers - after_outliers

def custom_round(number, decimal_places=3):
    formatted_number = '{:.{prec}g}'.format(number, prec=decimal_places)
    return formatted_number.rstrip('0') if '.' in formatted_number else formatted_number

def run_lasso_model():
    try:
        data = request.get_json()
        if not data or 'data' not in data:
            return jsonify({'error': 'Invalid or missing data in the request'}), 400 

        actual_data = data['data']
        categorical_variables = data['categorical']
        remove_outliers_flag = data['outliers'].lower() == 'yes'

        variable_names = list(actual_data[0].keys())
        dependent_variable_name = variable_names[1]
        id = variable_names[0]

        df = pd.DataFrame(actual_data)
        for var in categorical_variables:
            if var in df.columns and df[var].dtype == 'object':  
                dummy_df = pd.get_dummies(df[var], prefix=var, drop_first=True)
                df = pd.concat([df, dummy_df], axis=1)
                df.drop(var, axis=1, inplace=True)

        df = df.apply(pd.to_numeric, errors='coerce')

        df = df.dropna()

        if len(df) < 2:  
            return jsonify({'error': 'Insufficient data after handling missing values'}), 400

        remove_outliers_flag = data.get('outliers', '').lower() == 'yes'
        if remove_outliers_flag:
            variables_to_check = df.columns.difference([id, dependent_variable_name])
            df, removed_objects_count = remove_outliers(df, variables_to_check)
        else:
            removed_objects_count = 0

        y = np.array(df[dependent_variable_name])
        X = df.drop([id, dependent_variable_name], axis=1)

        X_with_intercept = sm.add_constant(X)

        X_train, X_test, y_train, y_test = train_test_split(X_with_intercept, y, test_size=0.1, random_state=42)

        model = Lasso()
        results = model.fit(X_train, y_train)

        y_pred = results.predict(X_test)

        squared_diff = (y_test - y_pred) ** 2

        mse = int(np.round(np.mean(squared_diff)))

        coefficients = results.coef_
        const = results.intercept_

        results_dict = [
            {'field_name': 'constant', 'mean': f"{const:.3f}"}
        ] + [
            {'field_name': name, 'mean': f"{coef:.3f}"}
            for name, coef in zip(X_with_intercept.columns[1:], coefficients)
        ]

        return jsonify({
            "data": results_dict,
            "mse": mse,
            "outliers_count": removed_objects_count,
        })

    except Exception as e:
        print(f"An error occurred: {repr(e)}")  
        return jsonify({'error': repr(e)}), 500  
