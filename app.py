from flask import Flask, render_template, request, jsonify
import pickle
import pandas as pd
import mysql.connector

# ==========================================
# 1. INITIALIZE FLASK APP
# ==========================================
# Serve static files and HTML directly from current folder
app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')

# ==========================================
# 2. LOAD TRAINED MACHINE LEARNING MODEL
# ==========================================
# Load the pre-trained Linear Regression model from the pickle file
model = pickle.load(open('LinearRegressionModel.pkl', 'rb'))

# ==========================================
# 3. MYSQL DATABASE CONFIGURATION
# ==========================================
# Replace password with your MySQL root password if you set one
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'rishu25'  # Enter your MySQL password here (e.g. 'root' or '1234')
}
DB_NAME = 'car_price_db'
TABLE_NAME = 'car_predictions'


def setup_database():
    """Create the database and predictions table if they do not exist."""
    try:
        # Connect to MySQL server
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Create database
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        cursor.execute(f"USE {DB_NAME}")

        # Create table matching CSV features + predicted_price
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company VARCHAR(100),
                name VARCHAR(150),
                year INT,
                kms_driven INT,
                fuel_type VARCHAR(50),
                predicted_price FLOAT
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("MySQL: Database and table are ready.")
    except Exception as error:
        print("MySQL Setup Warning (Check MySQL service & password):", error)


# Run database setup at startup
setup_database()


def save_to_mysql(company, name, year, kms, fuel, price):
    """Save user inputs and predicted price into MySQL table."""
    try:
        # Connect to the specific database
        conn = mysql.connector.connect(**DB_CONFIG, database=DB_NAME)
        cursor = conn.cursor()

        # Insert SQL query
        sql = f"""
            INSERT INTO {TABLE_NAME} (company, name, year, kms_driven, fuel_type, predicted_price)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (company, name, int(year), int(kms), fuel, float(price))

        cursor.execute(sql, values)
        conn.commit()
        record_id = cursor.lastrowid

        cursor.close()
        conn.close()
        return True, record_id, None
    except Exception as error:
        return False, None, str(error)


# ==========================================
# 4. ROUTE: HOME PAGE
# ==========================================
@app.route('/')
def home():
    """Render and display the car price prediction web page."""
    return render_template('index.html')


# ==========================================
# 5. ROUTE: PREDICTION API
# ==========================================
@app.route('/predict', methods=['POST'])
def predict():
    """Receive car details, predict price, and save results to MySQL."""
    try:
        # Handle both JSON (AJAX fetch from script.js) and standard Form POST
        if request.is_json:
            data = request.get_json()
            company = data.get('company')
            name = data.get('model')  # car model selected
            year = int(data.get('year'))
            fuel = data.get('fuel')
            kms = int(data.get('kms'))
        else:
            company = request.form.get('company')
            name = request.form.get('model')
            year = int(request.form.get('year'))
            fuel = request.form.get('fuel')
            kms = int(request.form.get('kms'))

        # Prepare inputs as a pandas DataFrame matching model features
        # Features used during model training: ['name', 'company', 'year', 'kms_driven', 'fuel_type']
        input_data = pd.DataFrame(
            columns=['name', 'company', 'year', 'kms_driven', 'fuel_type'],
            data=[[name, company, year, kms, fuel]]
        )

        # Run prediction using the loaded model
        predicted_value = model.predict(input_data)[0]

        # Keep price realistic (cannot be negative) and round to 2 decimals
        predicted_price = round(max(0.0, float(predicted_value)), 2)
        formatted_price = f"₹ {int(predicted_price):,}"

        # Save to MySQL Database
        db_saved, record_id, db_error = save_to_mysql(
            company, name, year, kms, fuel, predicted_price
        )

        # Response back to frontend
        if request.is_json:
            return jsonify({
                'success': True,
                'prediction': predicted_price,
                'formatted_price': formatted_price,
                'db_saved': db_saved,
                'db_record_id': record_id,
                'db_error': db_error
            })
        else:
            return render_template(
                'index.html',
                prediction=formatted_price
            )

    except Exception as error:
        print("Prediction Error:", error)
        if request.is_json:
            return jsonify({
                'success': False,
                'error': str(error)
            }), 400
        else:
            return f"Error occurred: {error}", 400


# ==========================================
# 6. START SERVER
# ==========================================
if __name__ == '__main__':
    # Runs local development server on http://127.0.0.1:5000
    app.run(debug=True, port=5000)
