from flask import jsonify, request
import pandas as pd
import numpy as np
from sklearn.linear_model import Lasso
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from scipy.stats import zscore
import statsmodels.api as sm
from flask import jsonify, request
from sklearn.linear_model import Lasso

def is_valid_date(date_str):
    try:
        pd.to_datetime(date_str)
        return True
    except ValueError:
        return False

def remove_outliers(df, columns, z_threshold=3):
    before_outliers = len(df)
    df = df[(np.abs(zscore(df[columns])) < z_threshold).all(axis=1)]
    after_outliers = len(df)
    return df, before_outliers - after_outliers

def get_variable_type(data, variable):
    unique_values = data[variable].unique()
    return 'categorical' if len(unique_values) <= 10 else 'continuous'

def run_lasso_model():
    try:
        data = request.get_json()
        if not data or 'data' not in data:
            return jsonify({'error': 'Invalid or missing data in the request'}), 400 

        type = data.get('type')

        if type == 'time-series':
            return run_time_series_lasso_model(data)
        else:
            return run_non_time_series_lasso_model(data)

    except Exception as e:
        return jsonify({'error': repr(e)}), 500

def run_non_time_series_lasso_model(data):
    try:
    
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

# def run_time_series_lasso_model(data):
#     try:
#         actual_datas = data.get('data')
#         exogenous_variables = data.get('exogenous', [])        
        
#         actual_data = [entry for entry in actual_datas if all(value not in ['', '0'] for value in entry.values())]
        
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

#         if endogenous_variable is None:
#             return jsonify({'error': 'Could not find suitable column name for the endogenous variable'}), 400

#         df = pd.DataFrame(actual_data)

#         df[date_column] = pd.to_datetime(df[date_column])
#         df[endogenous_variable] = pd.to_numeric(df[endogenous_variable], errors='coerce')

#         df.sort_values(by=date_column, inplace=True)

#         lagged_variable_names = [f"{endogenous_variable}_{i}" for i in range(1, 4)]
#         for lag, lagged_variable_name in enumerate(lagged_variable_names, start=1):
#             df[lagged_variable_name] = df[endogenous_variable].shift(lag)

#         df.dropna(inplace=True)

#         time_series = df.set_index(date_column)

#         split_index = int(len(time_series) * 0.8)
#         train_data, test_data = time_series.iloc[:split_index], time_series.iloc[split_index:]

#         X_train = train_data.drop(columns=[endogenous_variable])
#         y_train = train_data[endogenous_variable]
#         lasso_model = Lasso()
#         lasso_model.fit(X_train, y_train)
#         mse = int(np.round(np.mean((lasso_model.predict(test_data.drop(columns=[endogenous_variable])) - test_data[endogenous_variable])**2)))

#         mean = lasso_model.coef_

#         results_dict = [
#             {"field_name": "constant", "mean": f"{lasso_model.intercept_:.3f}"}
#         ] + [
#             {"field_name": f'{column}', 'mean': f"{mean[i]:.3f}"}
#             for i, column in enumerate(X_train.columns)
#         ]

#         return jsonify({"mse": mse, "data": results_dict})
    

#     except Exception as e:
#         return jsonify({'error': repr(e)}), 500
def run_time_series_lasso_model(data):
    try:
        actual_datas = data.get('data')
        exogenous_variables = data.get('exogenous', [])        
        
        actual_data = [entry for entry in actual_datas if all(value not in [''] for value in entry.values())]
        
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

        if endogenous_variable is None:
            return jsonify({'error': 'Could not find suitable column name for the endogenous variable'}), 400

        df = pd.DataFrame(actual_data)

        df[date_column] = pd.to_datetime(df[date_column])
        df[endogenous_variable] = pd.to_numeric(df[endogenous_variable], errors='coerce')

        df.sort_values(by=date_column, inplace=True)

        lagged_variable_names = [f"{endogenous_variable}_{i}" for i in range(1, 4)]
        for lag, lagged_variable_name in enumerate(lagged_variable_names, start=1):
            df[lagged_variable_name] = df[endogenous_variable].shift(lag)

        # Include categorical exogenous variables
        for exogenous_var in categorical_exogenous_variables:
            df[exogenous_var] = df[exogenous_var].astype('category')

        # Include continuous exogenous variables
        for exogenous_var in continuous_exogenous_variables:
            df[exogenous_var] = pd.to_numeric(df[exogenous_var], errors='coerce')

        df.dropna(inplace=True)

        time_series = df.set_index(date_column)

        split_index = int(len(time_series) * 0.8)
        train_data, test_data = time_series.iloc[:split_index], time_series.iloc[split_index:]

        # Extracting features and target variables
        X_train = train_data.drop(columns=[endogenous_variable])
        X_test = test_data.drop(columns=[endogenous_variable])
        
        for exog_var in categorical_exogenous_variables[:-1]: 
            X_train[exog_var] = train_data[exog_var]
            X_test[exog_var] = test_data[exog_var]
        
        for exog_var in continuous_exogenous_variables[:-1]:
           train_data = train_data.drop(columns=[exog_var])
           test_data = test_data.drop(columns=[exog_var])

        # Include categorical exogenous variables in train and test data
        for exog_var in categorical_exogenous_variables:
            X_train[exog_var] = train_data[exog_var]
            X_test[exog_var] = test_data[exog_var]

        # Include continuous exogenous variables in train and test data
        for exog_var in continuous_exogenous_variables:
            X_train[exog_var] = train_data[exog_var]
            X_test[exog_var] = test_data[exog_var]

        y_train = train_data[endogenous_variable]
        y_test = test_data[endogenous_variable]

        # Fitting Lasso model
        lasso_model = Lasso()
        lasso_model.fit(X_train, y_train)        
        mean = lasso_model.coef_

        X_test_array = X_test.values

        # Calculating mean squared error
        mse = np.round(np.mean((lasso_model.predict(X_test_array) - y_test)**2), decimals=2)


        mean = lasso_model.coef_
        print(lasso_model.intercept_)

        results_dict = [
            {"field_name": "constant", "mean": f"{lasso_model.intercept_:.3f}"}
        ] + [
            {"field_name": f'{column}', 'mean': f"{mean[i]:.3f}"}
            for i, column in enumerate(X_train.columns)
        ]

        return jsonify({"mse": mse, "data": results_dict})

    except Exception as e:
        return jsonify({'error': repr(e)}), 500
