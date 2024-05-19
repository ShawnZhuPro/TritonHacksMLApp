from flask import Flask, render_template, request, jsonify
import numpy as np
import cv2
import random
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)

# Load YOLO model
model_config = 'yolo/yolov3.cfg'
model_weights = 'yolo/yolov3.weights'
net = cv2.dnn.readNetFromDarknet(model_config, model_weights)

# Load class labels
with open('yolo/coco.names', 'r') as f:
    classes = f.read().strip().split('\n')  

@app.route('/detect', methods=['POST'])
def detect_plastic_bottles():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    image_file = request.files['image']
    image = np.array(bytearray(image_file.read()), dtype=np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    boxes, confidences, class_ids, idxs = detect_plastic_bottle(image)

    bottle_class_id = 39  # class ID for plastic bottles in COCO dataset (0 index)
    if len(idxs) > 0:
        bottle_count = sum(1 for i in idxs.flatten() if class_ids[i] == bottle_class_id)
    else:
        bottle_count = 0

    return jsonify({'bottle_count': bottle_count})

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
    (H, W) = image.shape[:2]
    ln = net.getLayerNames()
    ln = [ln[i - 1] for i in net.getUnconnectedOutLayers()]

    blob = cv2.dnn.blobFromImage(image, 1 / 255.0, (416, 416), swapRB=True, crop=False)
    net.setInput(blob)
    layer_outputs = net.forward(ln)

    boxes = []
    confidences = []
    class_ids = []
    for output in layer_outputs:
        for detection in output:
            scores = detection[5:]
            class_id = np.argmax(scores)
            confidence = scores[class_id]
            if confidence > 0.5:
                box = detection[0:4] * np.array([W, H, W, H])
                (centerX, centerY, width, height) = box.astype("int")
                x = int(centerX - (width / 2))
                y = int(centerY - (height / 2))
                boxes.append([x, y, int(width), int(height)])
                confidences.append(float(confidence))
                class_ids.append(class_id)

    idxs = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.3)

    return boxes, confidences, class_ids, idxs

if __name__ == '__main__':
    app.run(debug=True)
