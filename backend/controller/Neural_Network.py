from sklearn.model_selection import train_test_split
from flask import jsonify, request
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
import json

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
