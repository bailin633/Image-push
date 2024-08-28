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
};
