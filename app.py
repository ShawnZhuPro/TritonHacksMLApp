from flask import Flask, request, jsonify, send_from_directory
import numpy as np
import cv2
import os

app = Flask(__name__)

# Load YOLO model
model_config = 'yolo/yolov3.cfg'
model_weights = 'yolo/yolov3.weights'
net = cv2.dnn.readNetFromDarknet(model_config, model_weights)

# Load class labels
with open('yolo/coco.names', 'r') as f:
    classes = f.read().strip().split('\n')

# Function to perform detection
def detect_objects(image):
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

@app.route('/detect', methods=['POST'])
def detect_plastic_bottles():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    image_file = request.files['image']
    image = np.array(bytearray(image_file.read()), dtype=np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    boxes, confidences, class_ids, idxs = detect_objects(image)

    bottle_class_id = 39  # class ID for plastic bottles in COCO dataset (0 index)
    if len(idxs) > 0:
        bottle_count = sum(1 for i in idxs.flatten() if class_ids[i] == bottle_class_id)
    else:
        bottle_count = 0

    return jsonify({'bottle_count': bottle_count})


@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True)
