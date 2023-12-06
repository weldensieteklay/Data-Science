from flask import jsonify, request
import numpy as np
import pandas as pd
import statsmodels.api as sm
from sklearn.model_selection import train_test_split
import sys

def run_ols_model():
    try:
        data = request.get_json()
        if not data or 'data' not in data or 'categorical' not in data:
            return jsonify({'error': 'Invalid or missing data in the request'}), 400 

        actual_data = data['data']
        categorical_variables = data['categorical']

        if len(actual_data) == 0 or not categorical_variables:
            return jsonify({'error': 'Invalid categorical variable list or empty data'}), 400

        variable_names = list(actual_data[0].keys())
        dependent_variable_name = variable_names[1]
        id = variable_names[0]

        df = pd.DataFrame(actual_data)
        for var in categorical_variables:
            if var in df.columns and df[var].dtype == 'object':  # Check if the variable is present and is categorical
                dummy_df = pd.get_dummies(df[var], prefix=var, drop_first=True)
                df = pd.concat([df, dummy_df], axis=1)
                df.drop(var, axis=1, inplace=True)

        df = df.apply(pd.to_numeric, errors='coerce')

        df = df.dropna()

        if len(df) < 2:  
            return jsonify({'error': 'Insufficient data after handling missing values'}), 400

        y = np.array(df[dependent_variable_name])
        X = df.drop([id, dependent_variable_name], axis=1)

        X_with_intercept = sm.add_constant(X)

        X_train, X_test, y_train, y_test = train_test_split(X_with_intercept, y, test_size=0.1, random_state=42)

        model = sm.OLS(y_train, X_train.astype(float))
        results = model.fit()

        y_pred = results.predict(X_test)

        comparison = np.column_stack((y_test, y_pred))
        print("Actual vs Predicted Values on Test Data:")
        print(comparison)

        print("Regression Results on Test Data:")
        print(results.summary())

        mean = results.params[1:]  
        standard_error = results.bse[1:]  
        p_value = results.pvalues[1:]  
        intercept = results.params[0]

        results_dict = [
            {'field_name': 'intercept', 'mean': f"{intercept:.3f}", 'standard_error': f"{results.bse[0]:.3f}", 'p_value': f"{results.pvalues[0]:.3f}"},
        ] + [
            {'field_name': name, 'mean': f"{coef:.3f}", 'standard_error': f"{se:.3f}", 'p_value': f"{pv:.3f}"}
            for name, coef, se, pv in zip(X.columns, mean, standard_error, p_value)
        ]

        return jsonify(results_dict)

    except Exception as e:
        print(f"An error occurred: {repr(e)}", file=sys.stderr)
        return jsonify({'error': repr(e)}), 500
