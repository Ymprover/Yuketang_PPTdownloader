(async function () {

    console.log('燕麦片可爱喵');

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = () => reject(new Error('脚本加载失败: ' + url));
            document.head.appendChild(script);
        });
    }

    console.log('正在加载依赖库...');
    try {
        if (typeof jQuery === 'undefined') {
            await loadScript('https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js');
        }
        if (typeof jsPDF === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.2/jspdf.debug.js');
        }
    } catch (e) {
        console.error('依赖库加载失败，请检查网络后重试：', e);
        return;
    }
    console.log('依赖加载完成，开始处理课件...');

    function loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.setAttribute("crossOrigin", "Anonymous");
            img.src = url;
            img.onerror = () => reject(new Error('图片加载失败: ' + url));
            img.onload = function () {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                
                const data = atob(
                    canvas.toDataURL("image/jpeg").slice("data:image/jpeg;base64,".length)
                );
                resolve(data);
            };
        });
    }

    async function download() {
        const imgList = [];
        $("img.pptimg").each(function () {
            imgList.push($(this).attr("src"));
        });

        if (imgList.length === 0) {
            console.error('未找到课件图片，请确保页面已完全加载后再执行');
            return;
        }
        console.log(`共识别到 ${imgList.length} 张课件，开始逐张处理...`);

        const imgData = [];
        for (let i = 0; i < imgList.length; i++) {
            try {
                const data = await loadImage(imgList[i]);
                imgData.push(data);
            } catch (e) {
                console.error('处理图片时出错，已终止：', e);
                return;
            }
        }

        const firstImg = $("img.pptimg")[0];
        const width = firstImg.width;
        const height = firstImg.height;
        console.log('正在生成 PDF 文件...');

        const doc = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [width, height],
        });

        const fileName = document.title + ".pdf";
        imgData.forEach((data, index) => {
            doc.addImage(data, "JPG", 0, 0, width, height);
            if (index < imgData.length - 1) {
                doc.addPage();
            }
        });

        doc.save(fileName);
        console.log('导出完成，文件已开始下载：' + fileName);
    }

    download();

})();
