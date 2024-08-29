import os
from datetime import datetime
import threading
import tkinter as tk
from tkinter import ttk
from flask import Flask, request, jsonify
from flask_cors import CORS

# 创建 Flask 应用
app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 全局变量用于控制服务器状态
server_thread = None
stop_event = threading.Event()


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

    file_names = []
    for file in files:
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filename = file.filename
        file.save(os.path.join(target_path, filename))
        file_names.append(filename)

    # 记录上传信息
    upload_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"Uploaded files: {file_names} at {upload_time}")

    return jsonify({'message': 'Files uploaded successfully'}), 200


def run_flask_server(port):
    while not stop_event.is_set():
        try:
            app.run(host='0.0.0.0', port=port, use_reloader=False, debug=False)
        except Exception as e:
            print(f"Error running server: {e}")
            break


def start_flask_server(port):
    global server_thread
    global stop_event

    stop_event.clear()  # 清除停止事件
    server_thread = threading.Thread(target=run_flask_server, args=(port,), daemon=True)
    server_thread.start()


def stop_flask_server():
    global stop_event
    # 设置停止事件
    stop_event.set()
    # 停止 Flask 服务器
    print("Server stopped")


# 创建一个美化的 GUI 界面
def create_gui():
    root = tk.Tk()
    root.title("服务端")  # 修改窗口标题
    root.geometry("400x250")  # 设置窗口尺寸

    # 设置窗口图标
    root.iconbitmap("./other/main.ico")  # 指定图标文件路径

    # 使用 ttk 的样式
    style = ttk.Style()
    style.configure("TButton", padding=6, relief="flat", background="#007bff")
    style.configure("TLabel", padding=6, font=("Arial", 10))

    # 创建标题标签
    title_label = ttk.Label(root, text="服务器启动面板", font=("Arial", 14, "bold"))
    title_label.pack(pady=10)  # 添加顶部间距

    # 创建框架并设置居中
    frame = ttk.Frame(root, padding="10")
    frame.pack(expand=True)  # 使用 pack 来居中框架

    # 显示端口输入框
    ttk.Label(frame, text="Port:").grid(row=0, column=0, sticky=tk.W)
    port_entry = ttk.Entry(frame)
    port_entry.grid(row=0, column=1, padx=5, pady=5, sticky=(tk.W, tk.E))
    port_entry.insert(0, "3000")  # 默认端口

    def start_server():
        port = int(port_entry.get())
        start_flask_server(port)
        status_label.config(text=f"Server running on port {port}", foreground="green")

    def stop_server():
        stop_flask_server()
        status_label.config(text="Server stopped", foreground="red")

    # 启动按钮
    start_button = ttk.Button(frame, text="Start Server", command=start_server)
    start_button.grid(row=1, column=0, padx=5, pady=5)

    # 停止按钮
    stop_button = ttk.Button(frame, text="Stop Server", command=stop_server)
    stop_button.grid(row=1, column=1, padx=5, pady=5)

    # 显示服务器状态
    status_label = ttk.Label(frame, text="Server not running")
    status_label.grid(row=2, column=0, columnspan=2, pady=10)

    # 运行 GUI 主循环
    root.mainloop()


if __name__ == '__main__':
    create_gui()
