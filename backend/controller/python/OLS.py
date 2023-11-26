import sys
import json
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
import statsmodels.api as sm

print("Before reading data from stdin")
data_string = sys.stdin.read()
print("Data received:", data_string)

data = json.loads(data_string)

# Extract variable names from the first item
variable_names = list(data[0].keys())

# Determine positions of 'id', 'dependent', and other variables
id_position = 0  # Assuming the first variable is always 'id'
dependent_position = 1  # Assuming the second variable is always 'dependent'
independent_positions = [i for i in range(len(variable_names)) if i not in [id_position, dependent_position]]

# Extract 'id', 'dependent', and 'independent' variables
id_variable = variable_names[id_position]
dependent_variable = variable_names[dependent_position]
independent_variables = [{k: item[k] for k in variable_names if k != id_variable and k != dependent_variable} for item in data]

# Splitting data into training and test sets
train_data, test_data = train_test_split(independent_variables, test_size=0.1, random_state=42)

# Extracting dependent variable
y_train = [item[dependent_variable] for item in train_data]

# Extracting independent variables
X_train = sm.add_constant([[item[k] for k in independent_variables[0]] for item in train_data])

# Fitting the OLS model
model = sm.OLS(y_train, X_train).fit()

# Getting the summary of the model
summary = model.summary()

# Extracting relevant information from the summary
coef_data = summary.tables[1].data[1:]  # Skipping the header row
coefficients = [float(row[1]) for row in coef_data]
standard_errors = [float(row[2]) for row in coef_data]
p_values = [float(row[4]) for row in coef_data]

# Extracting intercept
intercept = float(summary.tables[1].data[0][1])

# Collecting results
result = {
    'independent_variables': independent_variables,
    'intercept': intercept,
    'coefficients': coefficients,
    'standard_errors': standard_errors,
    'p_values': p_values,
}

print(json.dumps(result))
