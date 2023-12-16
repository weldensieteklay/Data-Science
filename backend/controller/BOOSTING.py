import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from flask import jsonify, request
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor

def remove_outliers(df, columns, z_threshold=3):
    before_outliers = len(df)
    df = df[(np.abs(df[columns]) < z_threshold).all(axis=1)]
    after_outliers = len(df)
    return df, before_outliers - after_outliers

def run_xgboost_model():
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

        # Use XGBRegressor for boosting
        model = XGBRegressor(n_estimators=100, random_state=42)
        results = model.fit(X_train, y_train)

        y_pred = results.predict(X_test)

        squared_diff = (y_test - y_pred) ** 2

        mse = int(np.round(np.mean(squared_diff)))

        # XGBoost provides feature importance directly
        feature_importance = results.feature_importances_
        sorted_feature_importance = sorted(zip(X.columns, feature_importance), key=lambda item: item[1], reverse=True)

        # Convert float32 to float for JSON serialization
        sorted_feature_importance = [{"feature": feature, "importance": float(importance)} for feature, importance in sorted_feature_importance]

        return jsonify({
            "mse": mse,
            "feature_importance": sorted_feature_importance,
            "outliers_count": 0 if not remove_outliers_flag else len(df) - len(X_train),
        })

    except Exception as e:
        print(f"An error occurred: {repr(e)}")  
        return jsonify({'error': repr(e)}), 500
