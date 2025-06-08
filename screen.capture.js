// screen.capture.js - Screen Capture with Crop Functionality

class ScreenCaptureManager {
    constructor() {
        this.isCapturing = false;
        this.capturedImage = null;
        this.cropOverlay = null;
        this.cropStartX = 0;
        this.cropStartY = 0;
        this.cropEndX = 0;
        this.cropEndY = 0;
        this.isDragging = false;
        this.resizeHandle = null;
        this.originalImageData = null;
    }

    // Main function to initiate screen capture
    async initiateScreenCapture() {
        try {
            const imageDataUrl = await this.captureVisibleTab();
            
            if (imageDataUrl) {
                this.showCropInterface(imageDataUrl);
                return true;
            } else {
                throw new Error('Failed to capture screen');
            }
        } catch (error) {
            console.error('Screen capture error:', error);
            this.showError('Failed to capture screen: ' + error.message);
            return false;
        }
    }

    // Capture visible tab using browser extension API
    async captureVisibleTab() {
        return new Promise((resolve, reject) => {
            try {
                // Send message to background script to request screen capture
                chrome.runtime.sendMessage({ type: 'capture-request' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error('Failed to connect to extension: ' + chrome.runtime.lastError.message));
                        return;
                    }
                    
                    if (response.error) {
                        reject(new Error(response.error));
                        return;
                    }
                    
                    if (response.success && response.dataUrl) {
                        resolve(response.dataUrl);
                    } else {
                        // Fallback to simulation if capture fails
                        console.warn('Screen capture failed, using simulation');
                        this.simulateScreenshot().then(resolve).catch(reject);
                    }
                });
            } catch (error) {
                console.error('Screen capture error:', error);
                reject(error);
            }
        });
    }

    // Simulate screenshot for testing purposes
    async simulateScreenshot() {
        return new Promise((resolve) => {
            // Create a canvas with sample content
            const canvas = document.createElement('canvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const ctx = canvas.getContext('2d');
            
            // Fill with gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add some sample text
            ctx.fillStyle = 'white';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Sample Screenshot', canvas.width / 2, canvas.height / 2);
            ctx.font = '24px Arial';
            ctx.fillText('Select area to crop for OCR', canvas.width / 2, canvas.height / 2 + 60);
            
            resolve(canvas.toDataURL('image/png'));
        });
    }

    // Show crop interface overlay
    showCropInterface(imageDataUrl) {
        this.originalImageData = imageDataUrl;
        
        // Create overlay container
        this.cropOverlay = document.createElement('div');
        this.cropOverlay.className = 'crop-overlay';
        
        // Add selection message
        const selectionMessage = document.createElement('div');
        selectionMessage.className = 'selection-message';
        selectionMessage.textContent = 'Select Image';
        selectionMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 18px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(selectionMessage);
        
        // Remove message after 2 seconds
        setTimeout(() => selectionMessage.remove(), 2000);
        
        this.cropOverlay.innerHTML = `
            <div class="crop-container">
                <div class="crop-controls">
                    <button class="control-btn cancel-btn" id="cancelCrop">
                        <span>❌</span> Cancel
                    </button>
                    <button class="control-btn save-btn" id="saveCrop">
                        <span>✅</span> Save Selection
                    </button>
                </div>
                <div class="crop-area-container">
                    <img class="crop-image" id="cropImage" src="${imageDataUrl}" alt="Screenshot to crop">
                    <div class="crop-selection" id="cropSelection">
                        <div class="crop-handles">
                            <div class="crop-handle nw-resize" data-handle="nw"></div>
                            <div class="crop-handle ne-resize" data-handle="ne"></div>
                            <div class="crop-handle sw-resize" data-handle="sw"></div>
                            <div class="crop-handle se-resize" data-handle="se"></div>
                            <div class="crop-handle n-resize" data-handle="n"></div>
                            <div class="crop-handle s-resize" data-handle="s"></div>
                            <div class="crop-handle w-resize" data-handle="w"></div>
                            <div class="crop-handle e-resize" data-handle="e"></div>
                        </div>
                        <div class="crop-info">
                            <span id="cropDimensions">Select area to crop</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.cropOverlay);
        
        // Wait for image to load then setup crop functionality
        const cropImage = document.getElementById('cropImage');
        cropImage.onload = () => {
            this.setupCropFunctionality();
        };
        
        // If image is already loaded
        if (cropImage.complete) {
            this.setupCropFunctionality();
        }
    }

    // Setup crop selection functionality
    setupCropFunctionality() {
        const cropImage = document.getElementById('cropImage');
        const cropSelection = document.getElementById('cropSelection');
        const cropContainer = cropImage.parentElement;
        
        // Get image bounds
        const imageRect = cropImage.getBoundingClientRect();
        const containerRect = cropContainer.getBoundingClientRect();
        
        // Initial crop selection (center 50% of image)
        const initialWidth = imageRect.width * 0.5;
        const initialHeight = imageRect.height * 0.5;
        const initialLeft = (imageRect.width - initialWidth) / 2;
        const initialTop = (imageRect.height - initialHeight) / 2;
        
        this.setCropSelection(initialLeft, initialTop, initialWidth, initialHeight);
        
        // Event listeners for crop interaction
        this.setupCropEventListeners();
        
        // Control button listeners
        document.getElementById('cancelCrop').addEventListener('click', () => {
            this.closeCropInterface();
        });
        
        document.getElementById('saveCrop').addEventListener('click', () => {
            this.saveCroppedImage();
        });
    }

    // Setup event listeners for crop selection
    setupCropEventListeners() {
        const cropSelection = document.getElementById('cropSelection');
        const cropImage = document.getElementById('cropImage');
        
        // Mouse down on crop selection (for moving)
        cropSelection.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('crop-handle')) {
                this.startResize(e);
            } else {
                this.startDrag(e);
            }
        });
        
        // Mouse down on image (for creating new selection)
        cropImage.addEventListener('mousedown', (e) => {
            if (!cropSelection.contains(e.target)) {
                this.startNewSelection(e);
            }
        });
        
        // Global mouse events
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.handleDrag(e);
            } else if (this.resizeHandle) {
                this.handleResize(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.stopDragResize();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.cropOverlay) {
                if (e.key === 'Escape') {
                    this.closeCropInterface();
                } else if (e.key === 'Enter') {
                    this.saveCroppedImage();
                }
            }
        });
    }

    // Start dragging crop selection
    startDrag(e) {
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        
        const cropSelection = document.getElementById('cropSelection');
        const rect = cropSelection.getBoundingClientRect();
        this.dragStartLeft = rect.left;
        this.dragStartTop = rect.top;
        
        e.preventDefault();
    }

    // Handle drag movement
    handleDrag(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;
        
        const cropSelection = document.getElementById('cropSelection');
        const cropImage = document.getElementById('cropImage');
        const imageRect = cropImage.getBoundingClientRect();
        const selectionRect = cropSelection.getBoundingClientRect();
        
        let newLeft = this.dragStartLeft + deltaX - imageRect.left;
        let newTop = this.dragStartTop + deltaY - imageRect.top;
        
        // Constrain to image bounds
        newLeft = Math.max(0, Math.min(newLeft, imageRect.width - selectionRect.width));
        newTop = Math.max(0, Math.min(newTop, imageRect.height - selectionRect.height));
        
        cropSelection.style.left = newLeft + 'px';
        cropSelection.style.top = newTop + 'px';
        
        this.updateCropInfo();
    }

    // Start resizing crop selection
    startResize(e) {
        this.resizeHandle = e.target.dataset.handle;
        this.resizeStartX = e.clientX;
        this.resizeStartY = e.clientY;
        
        const cropSelection = document.getElementById('cropSelection');
        const rect = cropSelection.getBoundingClientRect();
        this.resizeStartRect = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        };
        
        e.preventDefault();
        e.stopPropagation();
    }

    // Handle resize movement
    handleResize(e) {
        if (!this.resizeHandle) return;
        
        const deltaX = e.clientX - this.resizeStartX;
        const deltaY = e.clientY - this.resizeStartY;
        
        const cropSelection = document.getElementById('cropSelection');
        const cropImage = document.getElementById('cropImage');
        const imageRect = cropImage.getBoundingClientRect();
        
        let newLeft = this.resizeStartRect.left - imageRect.left;
        let newTop = this.resizeStartRect.top - imageRect.top;
        let newWidth = this.resizeStartRect.width;
        let newHeight = this.resizeStartRect.height;
        
        // Handle different resize directions
        switch (this.resizeHandle) {
            case 'nw':
                newLeft += deltaX;
                newTop += deltaY;
                newWidth -= deltaX;
                newHeight -= deltaY;
                break;
            case 'ne':
                newTop += deltaY;
                newWidth += deltaX;
                newHeight -= deltaY;
                break;
            case 'sw':
                newLeft += deltaX;
                newWidth -= deltaX;
                newHeight += deltaY;
                break;
            case 'se':
                newWidth += deltaX;
                newHeight += deltaY;
                break;
            case 'n':
                newTop += deltaY;
                newHeight -= deltaY;
                break;
            case 's':
                newHeight += deltaY;
                break;
            case 'w':
                newLeft += deltaX;
                newWidth -= deltaX;
                break;
            case 'e':
                newWidth += deltaX;
                break;
        }
        
        // Constrain to minimum size and image bounds
        newWidth = Math.max(50, Math.min(newWidth, imageRect.width - newLeft));
        newHeight = Math.max(50, Math.min(newHeight, imageRect.height - newTop));
        newLeft = Math.max(0, Math.min(newLeft, imageRect.width - newWidth));
        newTop = Math.max(0, Math.min(newTop, imageRect.height - newHeight));
        
        this.setCropSelection(newLeft, newTop, newWidth, newHeight);
    }

    // Stop drag/resize operations
    stopDragResize() {
        this.isDragging = false;
        this.resizeHandle = null;
    }

    // Start new selection
    startNewSelection(e) {
        const cropImage = document.getElementById('cropImage');
        const imageRect = cropImage.getBoundingClientRect();
        
        this.cropStartX = e.clientX - imageRect.left;
        this.cropStartY = e.clientY - imageRect.top;
        
        this.setCropSelection(this.cropStartX, this.cropStartY, 0, 0);
        
        // Start drag to create selection
        this.isCreatingSelection = true;
        
        const handleMouseMove = (e) => {
            if (!this.isCreatingSelection) return;
            
            const currentX = e.clientX - imageRect.left;
            const currentY = e.clientY - imageRect.top;
            
            const left = Math.min(this.cropStartX, currentX);
            const top = Math.min(this.cropStartY, currentY);
            const width = Math.abs(currentX - this.cropStartX);
            const height = Math.abs(currentY - this.cropStartY);
            
            this.setCropSelection(left, top, width, height);
        };
        
        const handleMouseUp = () => {
            this.isCreatingSelection = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    // Set crop selection position and size
    setCropSelection(left, top, width, height) {
        const cropSelection = document.getElementById('cropSelection');
        cropSelection.style.left = left + 'px';
        cropSelection.style.top = top + 'px';
        cropSelection.style.width = width + 'px';
        cropSelection.style.height = height + 'px';
        
        this.updateCropInfo();
    }

    // Update crop info display
    updateCropInfo() {
        const cropSelection = document.getElementById('cropSelection');
        const cropDimensions = document.getElementById('cropDimensions');
        
        const width = Math.round(parseFloat(cropSelection.style.width));
        const height = Math.round(parseFloat(cropSelection.style.height));
        
        cropDimensions.textContent = `${width} × ${height} px`;
    }

    // Save cropped image
    async saveCroppedImage() {
        try {
            const cropSelection = document.getElementById('cropSelection');
            const cropImage = document.getElementById('cropImage');
            
            if (!cropSelection || !cropImage) {
                throw new Error('Crop selection elements not found');
            }
            
            const selectionRect = {
                left: parseFloat(cropSelection.style.left),
                top: parseFloat(cropSelection.style.top),
                width: parseFloat(cropSelection.style.width),
                height: parseFloat(cropSelection.style.height)
            };
            
            // Validate selection dimensions
            if (selectionRect.width < 10 || selectionRect.height < 10) {
                throw new Error('Selection area is too small');
            }
            
            // Create canvas for cropping
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to crop dimensions
            canvas.width = selectionRect.width;
            canvas.height = selectionRect.height;
            
            // Load original image
            const img = new Image();
            img.onload = () => {
                // Calculate scale factor
                const scaleX = img.naturalWidth / cropImage.clientWidth;
                const scaleY = img.naturalHeight / cropImage.clientHeight;
                
                // Draw cropped portion
                ctx.drawImage(
                    img,
                    selectionRect.left * scaleX,
                    selectionRect.top * scaleY,
                    selectionRect.width * scaleX,
                    selectionRect.height * scaleY,
                    0,
                    0,
                    selectionRect.width,
                    selectionRect.height
                );
                
                // Get cropped image data
                const croppedImageData = canvas.toDataURL('image/png');
                
                // Send to UI
                this.sendCroppedImageToUI(croppedImageData);
                
                // Close crop interface
                this.closeCropInterface();
            };
            
            img.src = this.originalImageData;
            
        } catch (error) {
            console.error('Error saving cropped image:', error);
            this.showError('Failed to save cropped image');
        }
    }

    // Send cropped image to main UI
    sendCroppedImageToUI(imageData) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const event = new CustomEvent('croppedImageReady', {
                    detail: {
                        imageData: imageData,
                        dimensions: {
                            width: img.width,
                            height: img.height
                        },
                        timestamp: Date.now()
                    }
                });
                
                document.dispatchEvent(event);
                resolve();
            };
            img.src = imageData;
        });
    }

    // Get image dimensions from data URL
    getImageDimensions(dataUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            img.src = dataUrl;
        });
    }

    // Close crop interface
    closeCropInterface() {
        try {
            if (this.cropOverlay && document.body.contains(this.cropOverlay)) {
                document.body.removeChild(this.cropOverlay);
            }
            
            const selectionMessage = document.querySelector('.selection-message');
            if (selectionMessage && document.body.contains(selectionMessage)) {
                selectionMessage.remove();
            }
            
            this.cropOverlay = null;
            this.isDragging = false;
            this.resizeHandle = null;
            this.isCreatingSelection = false;
            this.originalImageData = null;
            
            return true;
        } catch (error) {
            console.error('Error closing crop interface:', error);
            return false;
        }
    }

    // Show error message
    showError(message) {
        try {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'capture-error';
            
            const errorContent = document.createElement('div');
            errorContent.className = 'error-content';
            
            const errorIcon = document.createElement('span');
            errorIcon.className = 'error-icon';
            errorIcon.textContent = '⚠️';
            
            const errorMessage = document.createElement('span');
            errorMessage.className = 'error-message';
            errorMessage.textContent = message;
            
            const closeButton = document.createElement('button');
            closeButton.className = 'error-close';
            closeButton.textContent = '×';
            closeButton.onclick = () => errorDiv.remove();
            
            errorContent.appendChild(errorIcon);
            errorContent.appendChild(errorMessage);
            errorContent.appendChild(closeButton);
            errorDiv.appendChild(errorContent);
            
            document.body.appendChild(errorDiv);
            
            setTimeout(() => {
                if (document.body.contains(errorDiv)) {
                    errorDiv.remove();
                }
            }, 5000);
        } catch (error) {
            console.error('Error showing error message:', error);
        }
    }
}

// Create global instance
window.screenCaptureManager = new ScreenCaptureManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScreenCaptureManager;
}