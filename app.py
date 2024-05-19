from flask import Flask, render_template, request, jsonify
import numpy as np
import cv2
import random
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)

# Generate 100 points of dummy data around San Diego
def generate_dummy_data():
    base_lat = 32.7157
    base_lng = -117.1611
    dummy_data = []

    for _ in range(100):
        random_lat = base_lat + (random.uniform(-0.05, 0.05))
        random_lng = base_lng + (random.uniform(-0.05, 0.05))
        count = random.randint(1, 20)
        dummy_data.append({"lat": random_lat, "lng": random_lng, "count": count})

    return dummy_data

dummy_data = generate_dummy_data()

@app.route('/')
def index():
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    return render_template('index.html', dummy_data=dummy_data, api_key=api_key)

@app.route('/process_image', methods=['POST'])
def process_image():
    file = request.files['image'].read()
    npimg = np.frombuffer(file, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    if detect_plastic_bottle(img):
        return jsonify({"status": "success", "message": "Plastic bottle detected", "count": 1})
    else:
        return jsonify({"status": "failure", "message": "Not a plastic bottle"})

def detect_plastic_bottle(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return True  # Placeholder for actual detection logic

if __name__ == '__main__':
    app.run(debug=True)
