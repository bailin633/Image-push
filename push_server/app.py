import os
from datetime import datetime
import threading
import tkinter as tk
from tkinter import ttk, messagebox
from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
from PIL import Image
import pystray
from pystray import MenuItem as item
from werkzeug.utils import secure_filename

# 创建 Flask 应用
app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 全局变量用于控制服务器状态
server_thread = None
stop_event = threading.Event()
server_running = False  # 添加变量来跟踪服务器状态

# 获取用户文档目录
document_path = os.path.expanduser("~/Documents")
CONFIG_FILE_PATH = os.path.join(document_path, "config_image_push.txt")  # 自定义文件路径

@app.route('/upload', methods=['POST'])
def upload_file():
    server_uuid, _ = load_config()  # 加载服务器端存储的 UUID

    # 验证客户端 UUID
    client_uuid = request.form.get('uuid')

    print(f"Server UUID: {server_uuid}")
    print(f"Client UUID: {client_uuid}")

    if not client_uuid or client_uuid != server_uuid:
        return jsonify({'error': 'Unauthorized UUID'}), 403

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
            continue

        filename = secure_filename(file.filename)
        file_path = os.path.join(target_path, filename)

        # 写入文件内容（分片追加）
        with open(file_path, 'ab') as f:
            f.write(file.read())

    # 记录上传信息
    upload_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"Uploaded files: {[file.filename for file in files]} at {upload_time}")

    return jsonify({'message': 'Files uploaded successfully'}), 200

@app.route('/status', methods=['GET'])
def status():
    if server_running:
        return jsonify({'status': 'Server is running'}), 200
    else:
        return jsonify({'status': 'Server is not running'}), 500

def run_flask_server(port):
    global server_running

    try:
        app.run(host='0.0.0.0', port=port, use_reloader=False, debug=False)
    except Exception as e:
        print(f"Error running server: {e}")
    finally:
        server_running = False  # 设置服务器运行状态为停止

def start_flask_server(port):
    global server_thread
    global stop_event
    global server_running

    if server_running:
        return  # 如果服务器已经在运行，则不启动新的线程

    stop_event.clear()  # 清除停止事件
    server_thread = threading.Thread(target=run_flask_server, args=(port,), daemon=True)
    server_thread.start()
    server_running = True

def stop_flask_server():
    global stop_event
    global server_running

    stop_event.set()
    server_running = False  # 设置服务器运行状态为停止
    print("Server stopped")

def resource_path(relative_path):
    """获取资源文件的绝对路径"""
    try:
        # PyInstaller 创建临时文件夹
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.dirname(__file__)
    return os.path.join(base_path, relative_path)

def load_config():
    """从文件加载 UUID 和端口号"""
    if os.path.exists(CONFIG_FILE_PATH):
        with open(CONFIG_FILE_PATH, "r") as file:
            lines = file.readlines()
            if len(lines) >= 2:
                uuid = lines[0].strip()
                port = lines[1].strip()
                return uuid, port
    return "未设置", "3000"  # 文件不存在时设置默认值

def save_config(uuid, port):
    """将 UUID 和端口号保存到文件"""
    try:
        with open(CONFIG_FILE_PATH, "w") as file:
            file.write(f"{uuid}\n")
            file.write(port + "\n")  # 确保端口号后面有换行符
    except IOError as e:
        print(f"Error saving config: {e}")

def show_tray_icon():
    image = Image.open(resource_path("other/main.ico"))  # 替换为你托盘图标的路径
    menu = (item('Show', restore_window), item('Quit', on_quit))
    icon = pystray.Icon("server_icon", image, menu=menu)
    icon.run_detached()

def restore_window(icon, item):
    root.deiconify()  # 重新显示主窗口
    icon.stop()

def on_quit(icon, item):
    icon.stop()  # 停止托盘图标
    root.destroy()  # 销毁主窗口

def open_settings():
    settings_window = tk.Toplevel()
    settings_window.title("设置")
    settings_window.geometry("300x240")

    # 设置设置窗口的图标
    icon_path = resource_path("other/main.ico")  # 替换为你图标的路径
    settings_window.iconbitmap(icon_path)

    # 获取屏幕宽度和高度
    screen_width = settings_window.winfo_screenwidth()
    screen_height = settings_window.winfo_screenheight()

    # 获取设置窗口的宽度和高度
    window_width = 300
    window_height = 240

    # 计算窗口位置，使其居中
    x = (screen_width - window_width) // 2
    y = (screen_height - window_height) // 2

    # 设置窗口位置和大小
    settings_window.geometry(f"{window_width}x{window_height}+{x}+{y}")

    def save_settings():
        uuid = uuid_entry.get()
        port = port_entry.get()
        save_config(uuid, port)  # 保存 UUID 和端口号到文件
        current_uuid.set(uuid)  # 更新当前 UUID 标签
        settings_window.destroy()

    # 使用 grid 布局
    ttk.Label(settings_window, text="Enter UUID:").grid(row=0, column=0, padx=10, pady=5, sticky=tk.W)
    uuid_entry = ttk.Entry(settings_window)
    uuid_entry.grid(row=0, column=1, padx=10, pady=5, sticky=tk.EW)

    ttk.Label(settings_window, text="Enter Port:").grid(row=1, column=0, padx=10, pady=5, sticky=tk.W)
    port_entry = ttk.Entry(settings_window)
    port_entry.grid(row=1, column=1, padx=10, pady=5, sticky=tk.EW)

    save_button = ttk.Button(settings_window, text="Save Settings", command=save_settings)
    save_button.grid(row=2, column=0, columnspan=2, pady=10)

    # 显示当前 UUID
    ttk.Label(settings_window, text="Current UUID:").grid(row=3, column=0, padx=10, pady=5, sticky=tk.W)
    current_uuid_label = ttk.Label(settings_window, textvariable=current_uuid)
    current_uuid_label.grid(row=3, column=1, padx=10, pady=5, sticky=tk.W)

def create_gui():
    global current_uuid
    global root
    root = tk.Tk()
    root.title("服务端")
    # 设置窗口大小为固定
    root.resizable(False, False)

    # 获取屏幕宽度和高度
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()

    # 获取窗口的宽度和高度
    window_width = 400
    window_height = 250

    # 计算窗口位置，使其居中
    x = (screen_width - window_width) // 2
    y = (screen_height - window_height) // 2

    # 设置窗口位置和大小
    root.geometry(f"{window_width}x{window_height}+{x}+{y}")

    # 设置窗口图标
    icon_path = resource_path("other/main.ico")
    root.iconbitmap(icon_path)

    # 使用 ttk 的样式
    style = ttk.Style()
    style.configure("TButton", padding=6, relief="flat", background="#007bff")
    style.configure("TLabel", padding=6, font=("Arial", 10))

    # 创建 StringVar 实例
    current_uuid = tk.StringVar()
    uuid, port = load_config()  # 从文件加载 UUID 和端口号
    current_uuid.set(uuid)  # 设置当前 UUID
    initial_port = port  # 初始端口

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
    port_entry.insert(0, initial_port)  # 默认端口

    def update_buttons_state():
        """ 更新按钮状态 """
        if server_running:
            start_button.config(state=tk.DISABLED)
            stop_button.config(state=tk.NORMAL)
        else:
            start_button.config(state=tk.NORMAL)
            stop_button.config(state=tk.DISABLED)

    def start_server():
        port = int(port_entry.get())
        start_flask_server(port)
        status_label.config(text=f"Server running on port {port}", foreground="green")
        update_buttons_state()

    def stop_server():
        stop_flask_server()
        status_label.config(text="Server not running", foreground="red")
        update_buttons_state()

    # 启动按钮
    start_button = ttk.Button(frame, text="Start Server", command=start_server)
    start_button.grid(row=1, column=0, padx=5, pady=5)

    # 停止按钮
    stop_button = ttk.Button(frame, text="Stop Server", command=stop_server, state=tk.DISABLED)
    stop_button.grid(row=1, column=1, padx=5, pady=5)

    # 显示服务器状态
    status_label = ttk.Label(frame, text="Server not running")
    status_label.grid(row=2, column=0, columnspan=2, pady=10)

    # 添加设置按钮
    settings_button = ttk.Button(root, text="设置", command=open_settings)
    settings_button.pack(side=tk.TOP, pady=5)

    def on_window_close():
        if messagebox.askyesno("Confirm", "是否需要将程序挂机到托盘?"):
            hide_to_tray()
        else:
            root.destroy()

    def hide_to_tray():
        root.withdraw()  # 隐藏主窗口
        show_tray_icon()  # 显示托盘图标

    root.protocol("WM_DELETE_WINDOW", on_window_close)

    # 运行 GUI 主循环
    root.mainloop()

if __name__ == '__main__':
    create_gui()
