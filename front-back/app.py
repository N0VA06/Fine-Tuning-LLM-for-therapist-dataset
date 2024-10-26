from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
from deepface import DeepFace
import base64
import logging
import io
from PIL import Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static')
CORS(app)

def preprocess_image(frame_data):
    try:
        # Remove the data URL prefix if present
        if ',' in frame_data:
            frame_data = frame_data.split(',')[1]
        
        # Decode base64 image
        image_bytes = base64.b64decode(frame_data)
        image = Image.open(io.BytesIO(image_bytes))
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        return opencv_image
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        raise ValueError("Invalid image data")

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/process-frame', methods=['POST'])
def process_frame():
    try:
        if not request.json or 'frame' not in request.json:
            logger.warning("No frame data received in request")
            return jsonify({
                'success': False,
                'error': 'No frame data received'
            }), 400

        frame = preprocess_image(request.json['frame'])
        
        result = DeepFace.analyze(
            frame,
            actions=['emotion'],
            enforce_detection=False,
            silent=True
        )
        
        if isinstance(result, list) and len(result) > 0:
            result = result[0]
        
        if 'emotion' in result:
            emotion_data = result['emotion']
            dominant_emotion = result['dominant_emotion']
            max_confidence = emotion_data[dominant_emotion]
            
            logger.info(f"Detected emotion: {dominant_emotion} ({max_confidence:.2f}%)")
            
            return jsonify({
                'success': True,
                'emotions': emotion_data,
                'dominant_emotion': dominant_emotion,
                'confidence': max_confidence / 100  # Convert to decimal
            })
        else:
            logger.warning("No emotions detected in the frame")
            return jsonify({
                'success': False,
                'error': 'No emotions detected'
            })

    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        return jsonify({
            'success': False,
            'error': str(ve)
        }), 400
        
    except Exception as e:
        logger.error(f"Error processing frame: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

def main():
    """Main function to run the Flask application."""
    try:
        logger.info("Starting Emotion Detection Server...")
        app.run(host="0.0.0.0",debug=True, port=5000)
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        exit(1)

if __name__ == '__main__':
    main()