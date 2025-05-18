from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/route', methods=['POST'])
def get_route():
    data = request.json
    start = data['start']  # [lng, lat]
    end = data['end']

    url = f"http://router.project-osrm.org/route/v1/driving/{start[0]},{start[1]};{end[0]},{end[1]}?overview=full&geometries=geojson"
    res = requests.get(url)
    result = res.json()

    if "routes" in result:
        return jsonify(result['routes'][0]['geometry'])
    else:
        return jsonify({'error': 'Route not found'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
