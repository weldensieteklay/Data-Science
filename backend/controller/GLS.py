from flask import jsonify, request
import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.regression.linear_model import GLS
from statsmodels.stats.outliers_influence import variance_inflation_factor
import sys
from sklearn.model_selection import train_test_split
from scipy.stats import zscore

def custom_round(number, decimal_places=3):
    formatted_number = '{:.{prec}g}'.format(number, prec=decimal_places)
    return formatted_number.rstrip('0') if '.' in formatted_number else formatted_number

def calculate_vif(X):
    vif_data = pd.DataFrame()
    vif_data["Variable"] = X.columns
    vif_data["VIF"] = [variance_inflation_factor(X.values, i) for i in range(X.shape[1])]
    return vif_data

def remove_outliers(df, columns, z_threshold=3):
    before_outliers = len(df)
    df = df[(np.abs(zscore(df[columns])) < z_threshold).all(axis=1)]
    after_outliers = len(df)
    return df, before_outliers - after_outliers

def run_gls_model():
    try:
        data = request.get_json()
        if not data or 'data' not in data or 'outliers' not in data:
            return jsonify({'error': 'Invalid or missing data in the request'}), 400 

        actual_data = data['data']
        categorical_variables = data.get('categorical', [])  # Using get to handle missing key gracefully
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

        # Check if outliers should be removed
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

        # Use GLS instead of OLS
        model = GLS(y_train, X_train.astype(float))
        
        results = model.fit()
        X_response = X_with_intercept.copy()

        y_pred = results.predict(X_test)

        squared_diff = (y_test - y_pred) ** 2

        mse = int(np.round(np.mean(squared_diff)))

        print("Regression Results on Test Data:")
        print(results.summary())

        mean = results.params[1:]  
        standard_error = results.bse[1:]  
        p_value = results.pvalues[1:]  
        const = results.params[0]
        rsquared = custom_round(results.rsquared, 3)

        results_dict = [
            {'field_name': 'constant', 'mean': f"{const:.3f}", 'standard_error': f"{results.bse[0]:.3f}", 'p_value': f"{results.pvalues[0]:.3f}"}
        ] + [
            {'field_name': name, 'mean': f"{coef:.3f}", 'standard_error': f"{se:.3f}", 'p_value': f"{pv:.3f}"}
            for name, coef, se, pv in zip(X_response.columns[1:], mean, standard_error, p_value)
        ]

        return jsonify({
            "data": results_dict,
            "mse": mse,
            "outliers_count": removed_objects_count,
            "R2": rsquared
        })

    except Exception as e:
        print(f"An error occurred: {repr(e)}", file=sys.stderr)
        return jsonify({'error': repr(e)}), 500
