// Background script for BlackOCR extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('BlackOCR extension installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'capture-request') {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const tab = tabs[0];
            if (!tab) {
                sendResponse({ error: 'No active tab found' });
                return;
            }

            try {
                // Use browser.tabs.captureTab for Firefox
                if (typeof browser !== 'undefined') {
                    const dataUrl = await browser.tabs.captureTab(tab.id, { format: 'png' });
                    sendResponse({ success: true, dataUrl: dataUrl });
                } else {
                    // Fallback for Chrome
                    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
                        if (chrome.runtime.lastError) {
                            sendResponse({ error: chrome.runtime.lastError.message });
                            return;
                        }
                        sendResponse({ success: true, dataUrl: dataUrl });
                    });
                }
            } catch (error) {
                sendResponse({ error: error.message });
            }
        });
        return true; // Keep the message channel open for async response
    }
});
