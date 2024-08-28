window.onload = function() {
    // 处理上传按钮点击事件
    document.getElementById('uploadBtn').addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });

    // 处理文件选择并上传
    document.getElementById('fileInput').addEventListener('change', function(event) {
        const files = event.target.files;
        const formData = new FormData();
        const targetPath = localStorage.getItem('targetPath') || '';

        // 添加文件到 FormData
        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i]);
        }

        formData.append('targetPath', targetPath);

        // 从 localStorage 获取服务器地址和端口
        const serverAddress = localStorage.getItem('serverAddress');
        const port = localStorage.getItem('port');
        const apiUrl = `http://${serverAddress}:${port}/upload`;

        console.log(`Uploading to: ${apiUrl}`);  // 调试输出 URL

        // 发送上传请求
        fetch(apiUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(result => {
            alert('Upload successful!');
            console.log(result);
            location.reload();  // 上传成功后刷新页面
        })
        .catch(error => {
            alert('Upload failed!');
            console.error(error);
        });
    });

    // 处理设置按钮点击事件
    document.getElementById('setting').addEventListener("click", function() {
        window.location.href = './setting.html';
    });
};
