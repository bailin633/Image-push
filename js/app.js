window.onload = function() {
    // 处理上传按钮点击事件
    document.getElementById('uploadBtn').addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });

    // 处理文件选择并上传
    document.getElementById('fileInput').addEventListener('change', function(event) {
        const files = event.target.files;
        const targetPath = localStorage.getItem('targetPath') || '';
        const uuid = localStorage.getItem('uuid'); // 从 localStorage 获取 UUID

        // 从 localStorage 获取服务器地址和端口
        const serverAddress = localStorage.getItem('serverAddress');
        const port = localStorage.getItem('port');
        const apiUrl = `http://${serverAddress}:${port}/upload`;

        // 清除终端内容
        const terminal = document.getElementById('terminal');
        terminal.innerHTML = '';

        // 文件分片大小（1MB）
        const chunkSize = 1024 * 1024;
        
        // 允许的 MIME 类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];

        // 从 localStorage 读取复选框状态
        const allowAnyFile = localStorage.getItem('allowAnyFile') === 'true';
        console.log('允许任何文件:', allowAnyFile);

        // 遍历文件进行上传
        Array.from(files).forEach(file => {
            if (!allowAnyFile && !allowedTypes.includes(file.type)) {
                const errorEntry = document.createElement('div');
                errorEntry.className = 'file-entry';
                errorEntry.innerHTML = `<strong>${file.name}</strong>: 文件类型不允许!`;
                errorEntry.classList.add('upload-failed'); // 添加失败样式
                terminal.appendChild(errorEntry);
                return; // 跳过该文件
            }

            const fileEntry = document.createElement('div');
            fileEntry.className = 'file-entry';
            fileEntry.innerHTML = `<strong>${file.name}</strong>: 上传中...<br><progress value="0" max="100"></progress>`;
            terminal.appendChild(fileEntry);

            uploadFileInChunks(file, apiUrl, targetPath, uuid, fileEntry);
        });

        // 分片上传函数
        function uploadFileInChunks(file, url, targetPath, uuid, fileEntry) {
            const chunkSize = 1024 * 1024; // 1 MB
            let start = 0;
            let end = chunkSize;

            function uploadChunk() {
                const chunk = file.slice(start, end);
                const formData = new FormData();
                formData.append('file', chunk, file.name);
                formData.append('fileName', file.name);
                formData.append('start', start);
                formData.append('targetPath', targetPath);
                formData.append('uuid', uuid);  // 将 UUID 添加到 FormData 中

                fetch(url, {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        // 如果响应状态码不是2xx，认为上传失败
                        throw new Error('Upload failed with status ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Upload response:', data); // 调试信息
                    start = end;
                    end = start + chunkSize;
                    if (start < file.size) {
                        // 更新进度条
                        const progress = fileEntry.querySelector('progress');
                        progress.value = Math.min(100, (start / file.size) * 100);
                        uploadChunk(); // 上传下一个分片
                    } else {
                        // 上传完成
                        fileEntry.innerHTML = `<strong>${file.name}</strong>: 上传成功!`;
                        fileEntry.classList.remove('upload-failed'); // 移除失败样式
                        checkForCompletion();
                    }
                })
                .catch(error => {
                    console.error('Upload error:', error); // 调试信息
                    fileEntry.innerHTML = `<strong>${file.name}</strong>: 上传失败!`;
                    fileEntry.classList.add('upload-failed'); // 添加失败样式
                    checkForCompletion();
                });
            }

            uploadChunk();
        }

        // 检查是否所有文件上传完成
        function checkForCompletion() {
            const fileEntries = document.querySelectorAll('.file-entry');
            const allCompleted = Array.from(fileEntries).every(entry => 
                entry.innerHTML.includes('上传成功!') || entry.innerHTML.includes('上传失败!')
            );

            if (allCompleted) {
                let noUploadText = document.querySelector('.no-upload-text');
                if (!noUploadText) {
                    noUploadText = document.createElement('p');
                    noUploadText.textContent = '目前没有文件正在上传';
                    noUploadText.className = 'no-upload-text'; // 添加类
                    terminal.appendChild(noUploadText);
                }
                // 动态调整文本位置
                noUploadText.style.marginTop = '10px';
            }
        }
    });

    // 更新时间显示框
    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timeString = `${hours}:${minutes}:${seconds}`;
        document.getElementById('time-info').textContent = timeString;
    }

    // 每秒更新时间
    setInterval(updateTime, 1000);

    // 检查服务器状态
    function checkServerStatus() {
        const serverAddress = localStorage.getItem('serverAddress');
        const port = localStorage.getItem('port');

        if (!serverAddress || !port) {
            document.getElementById('server-status').textContent = "未设置服务器地址";
            return;
        }

        const apiUrl = `http://${serverAddress}:${port}/status`;

        fetch(apiUrl)
            .then(response => {
                if (response.ok) {
                    document.getElementById('server-status').textContent = "服务器连接正常";
                    document.getElementById('server-status').style.color = '#66fb75'; // 绿色
                } else {
                    document.getElementById('server-status').textContent = "服务器连接错误";
                    document.getElementById('server-status').style.color = '#ff2700'; // 红色
                }
            })
            .catch(error => {
                console.error('Error checking server status:', error);
                document.getElementById('server-status').textContent = "服务器连接错误";
                document.getElementById('server-status').style.color = '#ff2700'; // 红色
            });
    }

    // 初始化检查服务器状态
    checkServerStatus();

    // 处理设置按钮点击事件
    document.getElementById('setting').addEventListener("click", function() {
        window.location.href = './setting.html';  
    });

    // 切换终端显示状态
    document.getElementById('toggleTerminal').addEventListener('click', function() {
        const terminal = document.getElementById('terminal');
        terminal.classList.toggle('collapsed');
    });
};
