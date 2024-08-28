from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # 允许跨域请求

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files or 'targetPath' not in request.form:
        return jsonify({'error': 'Missing file or target path'}), 400

    files = request.files.getlist('file')
    target_path = request.form['targetPath']

    # 验证并创建目标路径
    if not os.path.exists(target_path):
        os.makedirs(target_path)

    if not files:
        return jsonify({'error': 'No selected file'}), 400

    for file in files:
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filename = file.filename
        file.save(os.path.join(target_path, filename))

    return jsonify({'message': 'Files uploaded successfully'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)  # 使用 0.0.0.0 来允许外部访问
