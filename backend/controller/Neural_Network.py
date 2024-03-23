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

        if type == 'time-serious':
            return run_time_series_lstm_model(data)
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

def run_time_series_lstm_model(data):
    try:
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

        scaler = MinMaxScaler()
        train_data_scaled = scaler.fit_transform(train_data)
        test_data_scaled = scaler.transform(test_data)

        def create_dataset(X, y, time_steps=1):
            Xs, ys = [], []
            for i in range(len(X) - time_steps):
                v = X[i:(i + time_steps)]
                Xs.append(v)
                ys.append(y[i + time_steps])
            return np.array(Xs), np.array(ys)

        TIME_STEPS = 3
        X_train, y_train = create_dataset(train_data_scaled, train_data_scaled[:, 0], TIME_STEPS)
        X_test, y_test = create_dataset(test_data_scaled, test_data_scaled[:, 0], TIME_STEPS)
        model = Sequential()
        model.add(LSTM(units=64, input_shape=(X_train.shape[1], X_train.shape[2])))
        model.add(Dense(units=1))
        model.compile(optimizer='adam', loss='mean_squared_error')

        history = model.fit(
            X_train, y_train,
            epochs=100,
            batch_size=16,
            validation_split=0.1,
            verbose=0,
            shuffle=False
        )

        mse = round(model.evaluate(X_test, y_test, verbose=0), 3)

        feature_names = time_series.drop(endogenous_variable, axis=1).columns.tolist()  # Exclude endogenous variable
        feature_importance = extract_feature_importance(model, feature_names)  # Pass feature names to extract_feature_importance

        sorted_feature_importance = convert_to_json_serializable(feature_importance)
        new_feature_importance = [{"feature": feature, "importance": np.round(importance, 3)} for feature, importance in sorted_feature_importance]

        # Make predictions
        y_pred = model.predict(X_test).flatten()
        
        # Reshape y_test and y_pred separately for inverse transformation
        y_test_reshaped = y_test.reshape(-1, 1)
        y_pred_reshaped = y_pred.reshape(-1, 1)
        y_test_reshaped = y_test_reshaped.flatten()
        y_pred_reshaped = y_pred_reshaped.flatten()

        # Inverse transform manually
        y_test_reshaped = np.reshape(y_test_reshaped, (-1, 1))
        y_pred_reshaped = np.reshape(y_pred_reshaped, (-1, 1))

    #    # Inverse transform using scaler
    #     actual_values = scaler.inverse_transform(y_test_reshaped)
    #     predicted_values = scaler.inverse_transform(y_pred_reshaped)



        # Calculate MSE for each observation
        mse_per_observation = (y_test_reshaped - y_pred_reshaped) ** 2

        # Get corresponding dates for test data
        test_dates = test_data.index[TIME_STEPS:]  # Skip initial TIME_STEPS due to lagged variables

        # # Combine actual, predicted values, MSE, and dates
        # actual_vs_pred = pd.DataFrame({'Date': test_dates, 'Actual': actual_values, 'Prediction': predicted_values, 'MSE': mse_per_observation})

        # Sort DataFrame based on MSE values in increasing order
        # actual_vs_pred_sorted = actual_vs_pred.sort_values(by='MSE')
       
        return jsonify({
            "mse": mse,
            "feature_importance": new_feature_importance,
            "history": history.history

        })

    except Exception as e:
        return jsonify({'error': repr(e)}), 500

