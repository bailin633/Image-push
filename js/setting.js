window.onload = function() {
    // 加载存储的路径（如果有）
    const storedPath = localStorage.getItem('targetPath');
    if (storedPath) {
        document.getElementById('pathInput').value = storedPath;
    }

    // 加载存储的服务器地址和端口（如果有）
    const storedServerAddress = localStorage.getItem('serverAddress');
    const storedPort = localStorage.getItem('port');
    if (storedServerAddress) {
        document.getElementById('serverAddressInput').value = storedServerAddress;
    }
    if (storedPort) {
        document.getElementById('portInput').value = storedPort;
    }
    
    // 加载UUID的路径（如果有）
    const uuidpath = localStorage.getItem('uuid');
    if (uuidpath) {
        document.getElementById('uuid_input').value = uuidpath;
    }

    // 点击“保存路径”按钮时保存路径
    document.getElementById('savePathBtn').addEventListener('click', function() {
        const targetPath = document.getElementById('pathInput').value;
        localStorage.setItem('targetPath', targetPath);
        alert('路径已保存');
    });

    // 点击“保存地址”按钮时保存服务器地址和端口
    document.getElementById('saveServerBtn').addEventListener('click', function() {
        const serverAddress = document.getElementById('serverAddressInput').value;
        const port = document.getElementById('portInput').value;
        localStorage.setItem('serverAddress', serverAddress);
        localStorage.setItem('port', port); // 保存端口
        alert('地址和端口已保存');
    });

    // 点击“保存UUID”按钮时保存UUID
    document.getElementById('saveuuidbtn').addEventListener('click', function() {
        const uuid = document.getElementById('uuid_input').value;
        localStorage.setItem('uuid', uuid);
        alert('UUID已保存');
    });

    // 处理复选框状态
    const allowAnyFileCheckbox = document.getElementById('allowAnyFile');

    // 页面加载时读取 localStorage 的值并设置复选框状态
    const savedAllowAnyFile = localStorage.getItem('allowAnyFile');
    if (savedAllowAnyFile !== null) {
        allowAnyFileCheckbox.checked = savedAllowAnyFile === 'true';
    }

    // 添加事件监听器，监听复选框的改变事件
    allowAnyFileCheckbox.addEventListener('change', function() {
        const isChecked = allowAnyFileCheckbox.checked;
        localStorage.setItem('allowAnyFile', isChecked);

        // 输出日志用于调试
        console.log('复选框状态已改变:', isChecked);
    });
};
