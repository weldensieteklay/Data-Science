from sklearn.model_selection import train_test_split
from flask import jsonify, request
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from sklearn.preprocessing import MinMaxScaler


def is_valid_date(date_str):
    try:
        pd.to_datetime(date_str)
        return True
    except ValueError:
        return False
    
def remove_outliers(df, columns, z_threshold=3):
    before_outliers = len(df)
    df = df[(np.abs(df[columns]) < z_threshold).all(axis=1)]
    after_outliers = len(df)
    return df, before_outliers - after_outliers

    
def extract_feature_importance(model, input_features):
    layer_weights = model.layers[0].get_weights()[0]
    feature_importance = np.abs(layer_weights).sum(axis=1) / np.sum(np.abs(layer_weights))
    return list(zip(input_features, feature_importance))

def run_neural_network_model():
    try:
        data = request.get_json()
        if not data or 'data' not in data:
            return jsonify({'error': 'Invalid or missing data in the request'}), 400 

        type = data.get('type')

        if type == 'time-series':
            return run_time_series_ANN_model(data)
        else:
            return non_time_series_neural_network__model(data)

    except Exception as e:
        return jsonify({'error': repr(e)}), 500
    

def convert_to_json_serializable(data):
    if isinstance(data, (np.ndarray, np.float32, np.float64)):
        return data.tolist()
    elif isinstance(data, tuple):
        return tuple(convert_to_json_serializable(item) for item in data)
    elif isinstance(data, dict):
        return {key: convert_to_json_serializable(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_to_json_serializable(item) for item in data]
    else:
        return data


def non_time_series_neural_network__model(data):
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

            scaler = StandardScaler()
            df[variables_to_check] = scaler.fit_transform(df[variables_to_check])

        y = np.array(df[dependent_variable_name])
        X = df.drop([id, dependent_variable_name], axis=1)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)

        # Build a simple feedforward neural network
        model = Sequential()
        model.add(Dense(64, input_dim=X_train.shape[1], activation='relu'))
        model.add(Dense(1))  # Output layer with 1 neuron for regression
        model.compile(optimizer='adam', loss='mean_squared_error')

        # Train the neural network
        model.fit(X_train, y_train, epochs=10, batch_size=32, validation_split=0.2)

        # Evaluate the model on the test set
        mse = model.evaluate(X_test, y_test)

        # Make predictions
        y_pred = model.predict(X_test).flatten()

        squared_diff = (y_test - y_pred) ** 2
        mse = int(np.round(np.mean(squared_diff)))

        # Extract feature importance based on the absolute weights of the connections in the first layer
        feature_importance = extract_feature_importance(model, X.columns)
        sorted_feature_importance = convert_to_json_serializable(feature_importance)
        result = {
            "mse": mse,
            "feature_importance": [{"feature": feature, "importance": importance} for feature, importance in sorted_feature_importance],
            "outliers_count": 0 if not remove_outliers_flag else len(df) - len(X_train),
        }

        return jsonify(result)

    except Exception as e:
        print(f"An error occurred: {repr(e)}")
        return jsonify({'error': repr(e)}), 500

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense

def preprocess_data(data):
    # Your preprocessing steps here
    X_train, X_test, y_train, y_test = train_test_split(data['X'], data['y'], test_size=0.2, random_state=42)
    feature_names = data['feature_names']
    return X_train, X_test, y_train, y_test, feature_names

def extract_feature_importance(model, feature_names):
    # Retrieve the weights of the connections between input and LSTM units
    weights_input_to_lstm = model.layers[0].get_weights()[0]  # Assuming the first layer is LSTM
    
    # Ensure that the weights are converted to float64 to avoid data type mismatch
    weights_input_to_lstm = weights_input_to_lstm.astype('float64')
    
    # Calculate the mean absolute value of these weights along the input dimension to represent the importance of each feature
    feature_importance = np.mean(np.abs(weights_input_to_lstm), axis=0)
    
    return dict(zip(feature_names, feature_importance))



def convert_to_json_serializable(feature_importance):
    # Your conversion code here
    sorted_feature_importance = sorted(feature_importance.items(), key=lambda item: item[1], reverse=True)
    return [{"feature": feature, "importance": importance} for feature, importance in sorted_feature_importance]

def get_variable_type(df, variable_name):
    unique_values = df[variable_name].unique()
    if len(unique_values) <= 10: 
        return 'categorical'
    else:
        return 'continuous'


def run_time_series_ANN_model(data):
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

        for exogenous_var in categorical_exogenous_variables:
            df[exogenous_var] = df[exogenous_var].astype('category')

        for exogenous_var in continuous_exogenous_variables:
            df[exogenous_var] = pd.to_numeric(df[exogenous_var], errors='coerce')

        df.dropna(inplace=True)

        time_series = df.set_index(date_column)

        split_index = int(len(time_series) * 0.8)
        train_data, test_data = time_series.iloc[:split_index], time_series.iloc[split_index:]

        X_train = train_data.drop(columns=[endogenous_variable])
        y_train = train_data[endogenous_variable]

        X_test = test_data.drop(columns=[endogenous_variable])
        y_test = test_data[endogenous_variable]

        for exog_var in categorical_exogenous_variables[:-1]: 
            X_train[exog_var] = train_data[exog_var]
            X_test[exog_var] = test_data[exog_var]
        
        for exog_var in continuous_exogenous_variables[:-1]:
            train_data = train_data.drop(columns=[exog_var])
            test_data = test_data.drop(columns=[exog_var])

        X_train_array = X_train.values
        X_test_array = X_test.values

        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train_array)
        X_test_scaled = scaler.transform(X_test_array)

        model = Sequential()
        model.add(Dense(64, activation='relu', input_shape=(X_train_scaled.shape[1],)))
        model.add(Dense(32, activation='relu'))
        model.add(Dense(1))  

        model.compile(optimizer='adam', loss='mean_squared_error')

        # Train the model
        model.fit(X_train_scaled, y_train, epochs=100, batch_size=32, verbose=0)

        # Evaluate the model
        mse = np.round(mean_squared_error(y_test, model.predict(X_test_scaled)), decimals=2)
        # mse = np.round(np.mean((model.predict(X_test) - y_test)**2), decimals=2)


        # Extracting feature importance based on weights
        weights_input_hidden = model.layers[0].get_weights()[0]
        feature_importance = np.abs(weights_input_hidden).mean(axis=0)

        sorted_feature_importance = sorted(zip(X_train.columns, feature_importance), key=lambda item: item[1], reverse=True)

        sorted_feature_importance = [{"feature": feature, "importance": "{:.3f}".format(float(importance))} for feature, importance in sorted_feature_importance]

        return jsonify({
            "mse": mse,
            "feature_importance": sorted_feature_importance,
        })
   
        
    except Exception as e:
        return jsonify({'error': repr(e)}), 500

   