(async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    // Capture visible tab
    const imageUri = await new Promise((resolve) =>
      chrome.runtime.sendMessage({ type: "capture" }, resolve)
    );
  
    const image = new Image();
    image.src = imageUri;
    await image.decode();
  
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
  
    const { TesseractWorker } = Tesseract;
    const worker = new TesseractWorker();
    const result = await worker.recognize(canvas.toDataURL(), 'eng');
  
    alert("Extracted Text:\n\n" + result.text);
  })();
  