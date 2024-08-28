window.onload = function() {
    // Set up event listeners only for remaining functionality
    document.getElementById('uploadBtn').addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', function(event) {
        const files = event.target.files;
        const formData = new FormData();
        const targetPath = localStorage.getItem('targetPath') || ''; // Keep this line if targetPath is needed

        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i]);
        }

        formData.append('targetPath', targetPath); // Keep this line if targetPath is needed

        // Get the server address and port from localStorage
        const serverAddress = localStorage.getItem('serverAddress');
        const port = localStorage.getItem('port');
        const apiUrl = `http://${serverAddress}:${port}/upload`;

        fetch(apiUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(result => {
            alert('Upload successful!');
            console.log(result);
        })
        .catch(error => {
            alert('Upload failed!');
            console.error(error);
        });
    });

    document.getElementById('setting').addEventListener("click", function() {
        window.location.href = './setting.html';
    });


};


