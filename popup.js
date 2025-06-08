// sidebar.js
let myWindowId;

// Get current window info
browser.windows.getCurrent({ populate: true }).then((windowInfo) => {
  myWindowId = windowInfo.id;
  console.log('Sidebar loaded for window:', myWindowId);
});

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Sidebar DOM loaded');
  
  // Initialize sidebar UI
  initializeSidebar();
});

function initializeSidebar() {
  // Create main container if it doesn't exist
  if (!document.getElementById('sidebar-content')) {
    const container = document.createElement('div');
    container.id = 'sidebar-content';
    container.innerHTML = `
      <div class="sidebar-header">
        <h2>BlackOCR</h2>
        <p>Screen capture and OCR tool</p>
      </div>
      
      <div class="sidebar-main">
        <!-- Capture Options -->
        <section class="capture-section">
          <h3>Screen Capture</h3>
          <button id="captureBtn" class="btn-primary">
            <span class="icon">📷</span>
            <span class="text">Capture Region</span>
          </button>
          
          <div class="capture-history">
            <h4>Recent Captures</h4>
            <div id="captureList" class="capture-list"></div>
          </div>
        </section>

        <!-- OCR Options -->
        <section class="ocr-section">
          <h3>OCR Settings</h3>
          <div class="ocr-options">
            <select id="languageSelect" class="language-select">
              <option value="eng">English</option>
              <option value="spa">Spanish</option>
              <option value="fra">French</option>
              <option value="deu">German</option>
            </select>
            
            <button id="runOCR" class="btn-secondary" disabled>
              <span class="icon">🔍</span>
              <span class="text">Extract Text</span>
            </button>
          </div>
        </section>

        <!-- Result Section -->
        <section class="result-section">
          <h3>Extracted Text</h3>
          <div class="result-actions">
            <button id="copyText" class="btn-icon" title="Copy to Clipboard">
              <span class="icon">📋</span>
            </button>
            <button id="saveText" class="btn-icon" title="Save as File">
              <span class="icon">💾</span>
            </button>
          </div>
          <textarea id="extractedText" class="result-text" readonly 
            placeholder="Captured text will appear here..."></textarea>
        </section>
      </div>
      
      <div class="sidebar-footer">
        <div id="status" class="status-text">Ready to capture</div>
      </div>
    `;
    
    document.body.appendChild(container);
  }
  
  // Add event listeners
  addEventListeners();
  
  // Add basic styling
  addStyles();
}

function addEventListeners() {
  // Capture button
  const captureBtn = document.getElementById('captureBtn');
  if (captureBtn) {
    captureBtn.addEventListener('click', handleCapture);
  }
  
  // Get current tab button
  const getCurrentTab = document.getElementById('getCurrentTab');
  if (getCurrentTab) {
    getCurrentTab.addEventListener('click', handleGetCurrentTab);
  }
  
  // Test button
  const testBtn = document.getElementById('testBtn');
  if (testBtn) {
    testBtn.addEventListener('click', handleTest);
  }
}

function addStyles() {
  if (!document.getElementById('sidebar-styles')) {
    const style = document.createElement('style');
    style.id = 'sidebar-styles';
    style.textContent = `
      body {
        width: 300px;
        height: 500px;
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background-color: #ffffff;
        color: #333;
      }
      
      #sidebar-content {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .sidebar-header {
        background: linear-gradient(135deg, #1a73e8 0%, #185abc 100%);
        color: white;
        padding: 16px;
        text-align: center;
      }
      
      .sidebar-header h2 {
        margin: 0 0 4px 0;
        font-size: 18px;
      }
      
      .sidebar-header p {
        margin: 0;
        font-size: 12px;
        opacity: 0.9;
      }
      
      .sidebar-main {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
      }
      
      section {
        margin-bottom: 20px;
      }
      
      h3 {
        font-size: 14px;
        color: #5f6368;
        margin: 0 0 12px 0;
      }
      
      h4 {
        font-size: 12px;
        color: #5f6368;
        margin: 12px 0 8px 0;
      }
      
      .btn-primary {
        width: 100%;
        padding: 12px;
        background: #1a73e8;
        color: white;
        border: none;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background-color 0.2s;
      }
      
      .btn-primary:hover {
        background: #185abc;
      }
      
      .capture-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .language-select {
        width: 100%;
        padding: 8px;
        margin-bottom: 8px;
        border: 1px solid #dadce0;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .result-text {
        width: 100%;
        height: 120px;
        padding: 8px;
        border: 1px solid #dadce0;
        border-radius: 4px;
        font-size: 13px;
        resize: vertical;
        margin-top: 8px;
      }
      
      .result-actions {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }
      
      .btn-icon {
        padding: 6px;
        background: none;
        border: 1px solid #dadce0;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .btn-icon:hover {
        background: #f1f3f4;
      }
      
      .sidebar-footer {
        padding: 12px 16px;
        background: #f8f9fa;
        border-top: 1px solid #dadce0;
      }
      
      .status-text {
        font-size: 12px;
        color: #5f6368;
      }
      
      .sidebar-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
      }
      
      .btn-primary, .btn-secondary {
        padding: 12px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .btn-primary {
        background-color: #3498db;
        color: white;
      }
      
      .btn-primary:hover {
        background-color: #2980b9;
      }
      
      .btn-secondary {
        background-color: #ecf0f1;
        color: #2c3e50;
      }
      
      .btn-secondary:hover {
        background-color: #d5dbdb;
      }
      
      .output-area {
        background-color: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 16px;
        min-height: 100px;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .success {
        color: #27ae60;
      }
      
      .error {
        color: #e74c3c;
      }
      
      .info {
        color: #3498db;
      }
    `;
    document.head.appendChild(style);
  }
}

// Event handlers
async function handleCapture() {
  updateStatus('Starting screen capture...');
  
  try {
    // Request tab capture permission
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) throw new Error('No active tab found');
    
    // Minimize popup
    window.close();
    
    // Send capture request to content script
    await browser.tabs.sendMessage(tabs[0].id, {
      action: 'startCapture',
      captureType: 'region'
    });
    
  } catch (error) {
    updateStatus('Error: ' + error.message);
    console.error('Capture error:', error);
  }
}

function updateStatus(message) {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
  }
}

function handleGetCurrentTab() {
  updateOutput('🔄 Getting current tab info...', 'info');
  
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    if (tabs[0]) {
      const tab = tabs[0];
      const info = `
        <strong>Current Tab Info:</strong><br>
        Title: ${tab.title}<br>
        URL: ${tab.url}<br>
        ID: ${tab.id}<br>
        Status: ${tab.status}
      `;
      updateOutput(info, 'success');
    }
  }).catch((error) => {
    updateOutput('❌ Error: ' + error.message, 'error');
  });
}

function handleTest() {
  updateOutput('🔄 Testing sidebar functionality...', 'info');
  
  // Test basic browser API access
  Promise.all([
    browser.windows.getCurrent(),
    browser.tabs.query({ active: true, currentWindow: true })
  ]).then(([window, tabs]) => {
    const info = `
      <strong>✅ Sidebar Test Results:</strong><br>
      Window ID: ${window.id}<br>
      Active tabs: ${tabs.length}<br>
      Current time: ${new Date().toLocaleTimeString()}<br>
      Extension APIs: Working ✅
    `;
    updateOutput(info, 'success');
  }).catch((error) => {
    updateOutput('❌ Test failed: ' + error.message, 'error');
  });
}

function updateOutput(message, type = 'info') {
  const output = document.getElementById('output');
  if (output) {
    output.innerHTML = `<div class="${type}">${message}</div>`;
  }
}

// Listen for messages from other parts of the extension
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Sidebar received message:', message);
  
  if (message.action === 'updateSidebar') {
    updateOutput(message.content, message.type || 'info');
  }
  
  sendResponse({ received: true });
});

console.log('BlackOCR Sidebar script loaded');