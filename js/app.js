// 分片上传函数
function uploadFileInChunks(file, url, targetPath, uuid, fileEntry) {
    const chunkSize = 1024 * 1024; // 1 MB
    let start = 0;
    let end = chunkSize;
    let partNumber = 0; // 初始化分片序号
    const totalParts = Math.ceil(file.size / chunkSize); // 总分片数

    function uploadChunk() {
        const chunk = file.slice(start, end);
        const formData = new FormData();
        formData.append('file', chunk, file.name);
        formData.append('fileName', file.name);
        formData.append('start', start);
        formData.append('targetPath', targetPath);
        formData.append('uuid', uuid);  // 将 UUID 添加到 FormData 中
        formData.append('part_number', partNumber); // 添加分片序号
        formData.append('total_parts', totalParts); // 添加总分片数

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
            partNumber++; // 增加分片序号
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

                // 通知服务器进行文件合并
                mergeFileOnServer(file.name, targetPath, uuid, totalParts);
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

// 通知服务器合并分片
function mergeFileOnServer(fileName, targetPath, uuid, totalParts) {
    const serverAddress = localStorage.getItem('serverAddress');
    const port = localStorage.getItem('port');
    const apiUrl = `http://${serverAddress}:${port}/merge`;

    const formData = new FormData();
    formData.append('fileName', fileName);
    formData.append('targetPath', targetPath);
    formData.append('uuid', uuid);
    formData.append('totalParts', totalParts);

    fetch(apiUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Merge failed with status ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Merge response:', data);
    })
    .catch(error => {
        console.error('Merge error:', error);
    });
}
