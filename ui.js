// ui.js - TextSnatch OCR Extension UI with Screen Capture Integration
class TextSnatchUI {
    constructor(container) {
        this.container = container;
        this.extractedText = '';
        this.explanationText = '';
        this.currentImage = null;
        this.croppedImageData = null;
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.setupScreenCaptureListener();
    }

    render() {
        this.container.innerHTML = `
            <div class="textsnatch-container">
                <header class="textsnatch-header">
                    <span class="header-icon">📸</span>
                    <h1 class="header-title">TextSnatch OCR</h1>
                </header>
                
                <div class="textsnatch-content">
                    <!-- Image Source Section -->
                    <section class="input-section">
                        <div class="section-header">
                            <span class="section-icon">🖼️</span>
                            <label class="section-title">Image Source:</label>
                            <select class="dropdown" id="imageSource">
                                <option value="upload">Upload Image</option>
                                <option value="capture">Capture Screen</option>
                                <option value="clipboard">From Clipboard</option>
                            </select>
                        </div>
                        
                        <div class="input-options">
                            <div class="option-item">
                                <input type="checkbox" id="captureScreen" class="option-checkbox">
                                <label for="captureScreen">Capture selected screen area</label>
                            </div>
                            <div class="option-item">
                                <input type="checkbox" id="useClipboard" class="option-checkbox">
                                <label for="useClipboard">Use clipboard image</label>
                            </div>
                        </div>
                        
                        <input type="file" id="imageUpload" accept="image/*" style="display: none;">
                        <button class="upload-btn" id="uploadBtn">
                            <span>📁</span> Choose Image File
                        </button>
                        
                        <button class="capture-btn" id="captureBtn" style="display: none;">
                            <span>📷</span> Start Screen Capture
                        </button>
                    </section>

                    <!-- Captured Image Preview Section -->
                    <section class="image-preview-section" id="imagePreviewSection" style="display: none;">
                        <div class="section-header">
                            <span class="section-icon">🖼️</span>
                            <span class="section-title">Captured Image:</span>
                            <button class="icon-btn" id="clearImage" title="Clear image">🗑️</button>
                        </div>
                        <div class="image-preview-container">
                            <img id="previewImage" class="preview-image" alt="Captured image preview">
                            <div class="image-info">
                                <span id="imageInfo">No image selected</span>
                            </div>
                        </div>
                        <div class="image-actions">
                            <button class="action-btn" id="recapture">
                                <span>🔄</span> Recapture
                            </button>
                            <button class="action-btn" id="cropAgain" style="display: none;">
                                <span>✂️</span> Crop Again
                            </button>
                        </div>
                    </section>

                    <!-- Language Selection -->
                    <section class="language-section">
                        <div class="section-header">
                            <span class="section-icon">🔤</span>
                            <label class="section-title">Language:</label>
                            <select class="dropdown" id="languageSelect">
                                <option value="eng">English</option>
                                <option value="spa">Spanish</option>
                                <option value="fra">French</option>
                                <option value="deu">German</option>
                                <option value="chi_sim">Chinese (Simplified)</option>
                                <option value="jpn">Japanese</option>
                                <option value="kor">Korean</option>
                                <option value="ara">Arabic</option>
                                <option value="rus">Russian</option>
                                <option value="por">Portuguese</option>
                            </select>
                        </div>
                    </section>

                    <!-- OCR Button -->
                    <section class="ocr-section">
                        <button class="ocr-btn" id="runOCR" disabled>
                            <span class="btn-icon">🧠</span>
                            <span class="btn-text">Run OCR</span>
                            <div class="loading-spinner" id="ocrSpinner"></div>
                        </button>
                    </section>

                    <!-- Extracted Text -->
                    <section class="text-section">
                        <div class="section-header">
                            <span class="section-icon">📋</span>
                            <span class="section-title">Extracted Text:</span>
                            <button class="icon-btn" id="editText" title="Edit text">📝</button>
                        </div>
                        <textarea 
                            class="text-output" 
                            id="extractedText" 
                            placeholder="Extracted text will appear here..."
                            readonly
                        ></textarea>
                        
                        <div class="text-actions">
                            <button class="action-btn" id="copyText">
                                <span>📄</span> Copy
                            </button>
                            <button class="action-btn" id="saveText">
                                <span>💾</span> Save as TXT
                            </button>
                        </div>
                    </section>

                    <!-- LLM Explanation Section -->
                    <section class="llm-section">
                        <div class="section-header">
                            <span class="section-icon">🤖</span>
                            <span class="section-title">Explain Text with LLM:</span>
                        </div>
                        
                        <div class="llm-options">
                            <div class="option-item">
                                <input type="checkbox" id="enableExplanation" class="option-checkbox">
                                <label for="enableExplanation">Enable explanation</label>
                            </div>
                            
                            <div class="model-selection" id="modelSelection" style="display: none;">
                                <label class="model-label">Model:</label>
                                <select class="dropdown" id="modelSelect">
                                    <option value="openai">OpenAI</option>
                                    <option value="anthropic">Anthropic</option>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="local">Local Model</option>
                                </select>
                                
                                <button class="explain-btn" id="getExplanation">
                                    <span>💬</span> Get Explanation
                                    <div class="loading-spinner" id="explainSpinner"></div>
                                </button>
                            </div>
                        </div>

                        <!-- Explanation Output -->
                        <div class="explanation-output" id="explanationOutput" style="display: none;">
                            <div class="section-header">
                                <span class="section-icon">📝</span>
                                <span class="section-title">Output:</span>
                                <button class="icon-btn" id="editExplanation" title="Edit explanation">📘</button>
                            </div>
                            
                            <textarea 
                                class="text-output explanation-text" 
                                id="explanationText" 
                                placeholder="Explanation will appear here..."
                                readonly
                            ></textarea>
                            
                            <div class="explanation-actions">
                                <button class="action-btn" id="copyExplanation">
                                    <span>📋</span> Copy Explanation
                                </button>
                            </div>
                        </div>
                    </section>

                    <!-- Status Bar -->
                    <div class="status-bar" id="statusBar">
                        <span class="status-text" id="statusText">Ready</span>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Image source dropdown
        const imageSource = document.getElementById('imageSource');
        imageSource.addEventListener('change', (e) => {
            this.handleImageSourceChange(e.target.value);
        });

        // Upload button
        const uploadBtn = document.getElementById('uploadBtn');
        const imageUpload = document.getElementById('imageUpload');
        uploadBtn.addEventListener('click', () => imageUpload.click());
        imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));

        // Enhanced screen capture checkbox handler
        const captureScreen = document.getElementById('captureScreen');
        captureScreen.addEventListener('change', (e) => {
            if (e.target.checked) {
                useClipboard.checked = false;
                this.showCaptureButton(true);
                this.updateStatus('Screen capture mode enabled');
            } else {
                this.showCaptureButton(false);
                this.updateStatus('Screen capture mode disabled');
            }
        });

        // Enhanced capture button handler
        const captureBtn = document.getElementById('captureBtn');
        captureBtn.addEventListener('click', async () => {
            try {
                this.updateStatus('Starting screen capture...');
                const success = await this.initiateScreenCapture();
                if (!success) {
                    this.updateStatus('Screen capture was cancelled');
                }
            } catch (error) {
                this.updateStatus('Error: Failed to start screen capture');
                console.error('Capture button error:', error);
            }
        });

        // Checkbox options
        const useClipboard = document.getElementById('useClipboard');
        
        useClipboard.addEventListener('change', (e) => {
            if (e.target.checked) {
                captureScreen.checked = false;
                this.showCaptureButton(false);
                this.handleClipboardImage();
            }
        });

        // Image preview actions
        document.getElementById('clearImage').addEventListener('click', () => this.clearImage());
        document.getElementById('recapture').addEventListener('click', () => this.initiateScreenCapture());
        document.getElementById('cropAgain').addEventListener('click', () => this.cropAgain());

        // OCR button
        const runOCRBtn = document.getElementById('runOCR');
        runOCRBtn.addEventListener('click', () => this.runOCR());

        // Text actions
        document.getElementById('copyText').addEventListener('click', () => this.copyText());
        document.getElementById('saveText').addEventListener('click', () => this.saveTextFile());
        document.getElementById('editText').addEventListener('click', () => this.toggleTextEdit());

        // LLM options
        const enableExplanation = document.getElementById('enableExplanation');
        enableExplanation.addEventListener('change', (e) => {
            this.toggleExplanationSection(e.target.checked);
        });

        document.getElementById('getExplanation').addEventListener('click', () => this.getExplanation());
        document.getElementById('copyExplanation').addEventListener('click', () => this.copyExplanation());
        document.getElementById('editExplanation').addEventListener('click', () => this.toggleExplanationEdit());
    }

    setupScreenCaptureListener() {
        // Listen for cropped image from screen capture manager
        document.addEventListener('croppedImageReady', (event) => {
            this.handleCroppedImage(event.detail.imageData);
        });
    }

    showCaptureButton(show) {
        const captureBtn = document.getElementById('captureBtn');
        const uploadBtn = document.getElementById('uploadBtn');
        
        if (show) {
            captureBtn.style.display = 'inline-block';
            uploadBtn.style.display = 'none';
        } else {
            captureBtn.style.display = 'none';
            uploadBtn.style.display = 'inline-block';
        }
    }

    async initiateScreenCapture() {
        try {
            this.updateStatus('Preparing screen capture...');
            
            // Use the global screen capture manager
            if (window.screenCaptureManager) {
                const success = await window.screenCaptureManager.initiateScreenCapture();
                if (success) {
                    this.updateStatus('Select area to capture and crop...');
                } else {
                    this.updateStatus('Screen capture failed');
                }
            } else {
                this.updateStatus('Screen capture not available');
            }
        } catch (error) {
            this.updateStatus('Error: Screen capture failed');
            console.error('Screen capture error:', error);
        }
    }

    handleCroppedImage(imageData) {
        this.croppedImageData = imageData;
        this.currentImage = this.dataURLtoBlob(imageData);
        
        // Show image preview
        this.showImagePreview(imageData);
        
        // Enable OCR button
        document.getElementById('runOCR').disabled = false;
        
        this.updateStatus('Image captured and cropped successfully');
    }

    dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    showImagePreview(imageData) {
        const previewSection = document.getElementById('imagePreviewSection');
        const previewImage = document.getElementById('previewImage');
        const imageInfo = document.getElementById('imageInfo');
        const cropAgainBtn = document.getElementById('cropAgain');
        
        previewImage.src = imageData;
        previewSection.style.display = 'block';
        cropAgainBtn.style.display = 'inline-block';
        
        // Update image info
        const img = new Image();
        img.onload = () => {
            imageInfo.textContent = `${img.width} × ${img.height} pixels`;
        };
        img.src = imageData;
    }

    clearImage() {
        const previewSection = document.getElementById('imagePreviewSection');
        const runOCRBtn = document.getElementById('runOCR');
        
        previewSection.style.display = 'none';
        runOCRBtn.disabled = true;
        
        this.currentImage = null;
        this.croppedImageData = null;
        
        // Reset checkboxes and buttons
        document.getElementById('captureScreen').checked = false;
        document.getElementById('useClipboard').checked = false;
        this.showCaptureButton(false);
        
        this.updateStatus('Image cleared');
    }

    cropAgain() {
        if (this.croppedImageData && window.screenCaptureManager) {
            // Show crop interface with current image
            window.screenCaptureManager.showCropInterface(this.croppedImageData);
        }
    }

    handleImageSourceChange(source) {
        const captureScreen = document.getElementById('captureScreen');
        const useClipboard = document.getElementById('useClipboard');
        
        // Reset checkboxes
        captureScreen.checked = false;
        useClipboard.checked = false;
        this.showCaptureButton(false);
        
        switch(source) {
            case 'capture':
                captureScreen.checked = true;
                this.showCaptureButton(true);
                break;
            case 'clipboard':
                useClipboard.checked = true;
                this.handleClipboardImage();
                break;
            case 'upload':
                document.getElementById('imageUpload').click();
                break;
        }
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.currentImage = file;
            
            // Show preview for uploaded image
            const reader = new FileReader();
            reader.onload = (e) => {
                this.showImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
            
            // Enable OCR button
            document.getElementById('runOCR').disabled = false;
            
            this.updateStatus(`Loaded image: ${file.name}`);
        }
    }

    async handleClipboardImage() {
        try {
            this.updateStatus('Reading clipboard...');
            if (navigator.clipboard && navigator.clipboard.read) {
                const clipboardItems = await navigator.clipboard.read();
                for (const clipboardItem of clipboardItems) {
                    for (const type of clipboardItem.types) {
                        if (type.startsWith('image/')) {
                            const blob = await clipboardItem.getType(type);
                            this.currentImage = blob;
                            
                            // Show preview for clipboard image
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                this.showImagePreview(e.target.result);
                            };
                            reader.readAsDataURL(blob);
                            
                            // Enable OCR button
                            document.getElementById('runOCR').disabled = false;
                            
                            this.updateStatus('Image loaded from clipboard');
                            return;
                        }
                    }
                }
                this.updateStatus('No image found in clipboard');
            } else {
                this.updateStatus('Clipboard access not available');
            }
        } catch (error) {
            this.updateStatus('Error: Could not access clipboard');
            console.error('Clipboard error:', error);
        }
    }

    async runOCR() {
        if (!this.currentImage) {
            this.updateStatus('Please select an image first');
            return;
        }

        const runOCRBtn = document.getElementById('runOCR');
        const spinner = document.getElementById('ocrSpinner');
        const language = document.getElementById('languageSelect').value;
        
        try {
            // Show loading state
            runOCRBtn.disabled = true;
            spinner.style.display = 'block';
            this.updateStatus('Running OCR...');

            // Initialize Tesseract (assuming it's loaded)
            if (typeof Tesseract !== 'undefined') {
                const worker = await Tesseract.createWorker(language);
                
                // Process image
                const { data: { text } } = await worker.recognize(this.currentImage);
                
                // Update UI with results
                this.extractedText = text;
                document.getElementById('extractedText').value = text;
                this.updateStatus(`OCR completed. Found ${text.length} characters.`);
                
                await worker.terminate();
            } else {
                // Mock OCR for demonstration
                const mockText = this.generateMockOCRText();
                this.extractedText = mockText;
                document.getElementById('extractedText').value = mockText;
                this.updateStatus(`OCR completed (mock). Found ${mockText.length} characters.`);
            }
            
        } catch (error) {
            this.updateStatus('Error: OCR processing failed');
            console.error('OCR error:', error);
        } finally {
            // Hide loading state
            runOCRBtn.disabled = false;
            spinner.style.display = 'none';
        }
    }

    generateMockOCRText() {
        return "This is sample extracted text from the OCR process. The actual implementation would use Tesseract.js or another OCR library to extract text from the captured image. The cropped image functionality allows users to select specific portions of their screen for more accurate text extraction.";
    }

    async copyText() {
        const text = document.getElementById('extractedText').value;
        if (text) {
            try {
                await navigator.clipboard.writeText(text);
                this.updateStatus('Text copied to clipboard');
            } catch (error) {
                this.updateStatus('Error: Could not copy text');
            }
        }
    }

    saveTextFile() {
        const text = document.getElementById('extractedText').value;
        if (text) {
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `extracted_text_${new Date().getTime()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            this.updateStatus('Text file saved');
        }
    }

    toggleTextEdit() {
        const textarea = document.getElementById('extractedText');
        const editBtn = document.getElementById('editText');
        
        if (textarea.readOnly) {
            textarea.readOnly = false;
            textarea.focus();
            editBtn.innerHTML = '💾';
            editBtn.title = 'Save changes';
            this.updateStatus('Text editing enabled');
        } else {
            textarea.readOnly = true;
            editBtn.innerHTML = '📝';
            editBtn.title = 'Edit text';
            this.extractedText = textarea.value;
            this.updateStatus('Text changes saved');
        }
    }

    toggleExplanationSection(enabled) {
        const modelSelection = document.getElementById('modelSelection');
        const explanationOutput = document.getElementById('explanationOutput');
        
        if (enabled) {
            modelSelection.style.display = 'block';
            if (this.explanationText) {
                explanationOutput.style.display = 'block';
            }
        } else {
            modelSelection.style.display = 'none';
            explanationOutput.style.display = 'none';
        }
    }

    async getExplanation() {
        const text = document.getElementById('extractedText').value;
        if (!text.trim()) {
            this.updateStatus('Please extract some text first');
            return;
        }

        const explainBtn = document.getElementById('getExplanation');
        const spinner = document.getElementById('explainSpinner');
        const model = document.getElementById('modelSelect').value;
        
        try {
            explainBtn.disabled = true;
            spinner.style.display = 'block';
            this.updateStatus('Getting explanation...');

            // Mock API call - replace with actual LLM API integration
            const explanation = await this.callLLMAPI(text, model);
            
            this.explanationText = explanation;
            document.getElementById('explanationText').value = explanation;
            document.getElementById('explanationOutput').style.display = 'block';
            
            this.updateStatus('Explanation generated');
            
        } catch (error) {
            this.updateStatus('Error: Could not generate explanation');
            console.error('LLM API error:', error);
        } finally {
            explainBtn.disabled = false;
            spinner.style.display = 'none';
        }
    }

    async callLLMAPI(text, model) {
        // Mock implementation - replace with actual API calls
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`This text appears to be ${this.analyzeTextType(text)}. The content discusses various topics and contains approximately ${text.split(' ').length} words. ${model} model analysis suggests this is ${this.getTextComplexity(text)} complexity level.`);
            }, 2000);
        });
    }

    analyzeTextType(text) {
        if (text.includes('@') && text.includes('.')) return 'an email or contact information';
        if (text.match(/\d{4}-\d{2}-\d{2}/)) return 'a document with dates';
        if (text.includes('$') || text.includes('€') || text.includes('£')) return 'financial information';
        return 'general text content';
    }

    getTextComplexity(text) {
        const wordCount = text.split(' ').length;
        const avgWordLength = text.replace(/\s/g, '').length / wordCount;
        
        if (avgWordLength > 6 && wordCount > 100) return 'high';
        if (avgWordLength > 4 && wordCount > 50) return 'medium';
        return 'low';
    }

    async copyExplanation() {
        const explanation = document.getElementById('explanationText').value;
        if (explanation) {
            try {
                await navigator.clipboard.writeText(explanation);
                this.updateStatus('Explanation copied to clipboard');
            } catch (error) {
                this.updateStatus('Error: Could not copy explanation');
            }
        }
    }

    toggleExplanationEdit() {
        const textarea = document.getElementById('explanationText');
        const editBtn = document.getElementById('editExplanation');
        
        if (textarea.readOnly) {
            textarea.readOnly = false;
            textarea.focus();
            editBtn.innerHTML = '💾';
            editBtn.title = 'Save changes';
            this.updateStatus('Explanation editing enabled');
        } else {
            textarea.readOnly = true;
            editBtn.innerHTML = '📘';
            editBtn.title = 'Edit explanation';
            this.explanationText = textarea.value;
            this.updateStatus('Explanation changes saved');
        }
    }

    updateStatus(message) {
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = message;
            
            // Auto-clear status after 5 seconds
            setTimeout(() => {
                if (statusText.textContent === message) {
                    statusText.textContent = 'Ready';
                }
            }, 5000);
        }
    }
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.ui');
    if (container) {
        new TextSnatchUI(container);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextSnatchUI;
}