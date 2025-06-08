// Content script for screen capture handling
(() => {
    let isSelecting = false;
    let startX = 0;
    let startY = 0;
    let overlay = null;
    let selectionBox = null;
    let dimensionsLabel = null;

    // Listen for messages from the popup
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'startCapture') {
            startRegionCapture();
        }
    });

    function startRegionCapture() {
        // Create overlay
        overlay = document.createElement('div');
        overlay.className = 'screen-capture-overlay';
        document.body.appendChild(overlay);

        // Create selection box
        selectionBox = document.createElement('div');
        selectionBox.className = 'selection-box';
        selectionBox.style.display = 'none';
        document.body.appendChild(selectionBox);

        // Create dimensions label
        dimensionsLabel = document.createElement('div');
        dimensionsLabel.className = 'selection-dimensions';
        dimensionsLabel.style.display = 'none';
        document.body.appendChild(dimensionsLabel);

        // Add mouse event listeners
        overlay.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('keydown', handleKeyDown);
    }

    function handleMouseDown(e) {
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;
        selectionBox.style.display = 'block';
        dimensionsLabel.style.display = 'block';
        updateSelection(e);
    }

    function handleMouseMove(e) {
        if (!isSelecting) return;
        updateSelection(e);
    }

    function handleMouseUp(e) {
        if (!isSelecting) return;
        isSelecting = false;
        
        // Get final selection
        const rect = selectionBox.getBoundingClientRect();
        if (rect.width > 5 && rect.height > 5) {
            captureRegion(rect);
        }
        
        cleanup();
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            cleanup();
        }
    }

    function updateSelection(e) {
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';

        // Update dimensions label
        dimensionsLabel.textContent = `${width} × ${height}`;
        dimensionsLabel.style.left = (left + width / 2) + 'px';
        dimensionsLabel.style.top = (top - 30) + 'px';
    }

    async function captureRegion(rect) {
        try {
            const tab = await browser.tabs.captureTab(null, {
                format: 'png'
            });

            // Create canvas to crop image
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const dpr = window.devicePixelRatio;
                
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                
                ctx.drawImage(img,
                    rect.left * dpr, rect.top * dpr,
                    rect.width * dpr, rect.height * dpr,
                    0, 0,
                    rect.width * dpr, rect.height * dpr
                );

                const croppedImage = canvas.toDataURL('image/png');
                
                // Send back to popup
                browser.runtime.sendMessage({
                    action: 'regionCaptured',
                    imageData: croppedImage,
                    dimensions: {
                        width: rect.width,
                        height: rect.height
                    }
                });
            };
            img.src = tab;
        } catch (error) {
            console.error('Capture error:', error);
        }
    }

    function cleanup() {
        if (overlay) overlay.remove();
        if (selectionBox) selectionBox.remove();
        if (dimensionsLabel) dimensionsLabel.remove();
        
        overlay = null;
        selectionBox = null;
        dimensionsLabel = null;
        isSelecting = false;
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
    }
})();