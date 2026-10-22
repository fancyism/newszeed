/**
 * Newszeed Cover Generator - Background Service Worker
 * Handles message passing between popup and content script
 */

// ============================================
// Message Handlers
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Background] Received message:', message.type);

    switch (message.type) {
        case 'GENERATE_COVER':
            handleGenerateCover(message, sendResponse);
            return true; // Keep channel open for async response

        case 'DOWNLOAD_IMAGE':
            handleDownloadImage(message, sendResponse);
            return true;

        default:
            sendResponse({ error: 'Unknown message type' });
    }
});

/**
 * Handle cover generation request
 */
async function handleGenerateCover(message, sendResponse) {
    try {
        // Find Gemini tab
        const tabs = await chrome.tabs.query({ url: 'https://gemini.google.com/*' });

        if (tabs.length === 0) {
            // Open Gemini in new tab
            const tab = await chrome.tabs.create({
                url: 'https://gemini.google.com/app',
                active: false
            });

            // Wait for tab to load
            await waitForTabLoad(tab.id);

            // Inject content script if needed
            await injectContentScriptIfNeeded(tab.id);

            // Send message to content script
            const response = await chrome.tabs.sendMessage(tab.id, {
                type: 'INJECT_PROMPT',
                payload: message.payload,
                jobId: message.jobId
            });

            sendResponse(response);
        } else {
            // Use existing Gemini tab
            const tabId = tabs[0].id;

            // Make sure content script is injected
            await injectContentScriptIfNeeded(tabId);

            const response = await chrome.tabs.sendMessage(tabId, {
                type: 'INJECT_PROMPT',
                payload: message.payload,
                jobId: message.jobId
            });

            sendResponse(response);
        }
    } catch (error) {
        console.error('[Background] Generate error:', error);
        sendResponse({ error: error.message });
    }
}

/**
 * Handle image download request
 */
async function handleDownloadImage(message, sendResponse) {
    try {
        const { imageUrl, filename } = message;

        await chrome.downloads.download({
            url: imageUrl,
            filename: filename || `newszeed-cover-${Date.now()}.png`,
            saveAs: false
        });

        sendResponse({ success: true });
    } catch (error) {
        console.error('[Background] Download error:', error);
        sendResponse({ error: error.message });
    }
}

/**
 * Wait for tab to finish loading
 */
function waitForTabLoad(tabId) {
    return new Promise((resolve) => {
        const listener = (updatedTabId, changeInfo) => {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                // Give extra time for page scripts to initialize
                setTimeout(resolve, 1500);
            }
        };
        chrome.tabs.onUpdated.addListener(listener);
    });
}

/**
 * Inject content script if not already present
 */
async function injectContentScriptIfNeeded(tabId) {
    try {
        // Try to ping existing content script
        await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    } catch (e) {
        // Content script not present, inject it
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content/gemini-injector.js']
        });

        await chrome.scripting.insertCSS({
            target: { tabId },
            files: ['content/gemini-injector.css']
        });

        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// ============================================
// Extension Install/Update
// ============================================

chrome.runtime.onInstalled.addListener((details) => {
    console.log('[Background] Extension installed:', details.reason);

    if (details.reason === 'install') {
        // First install - set default settings
        chrome.storage.local.set({
            newszeedState: {
                category: 'politics',
                showText: true,
                textPosition: 'bottom',
                fontStyles: ['3d'],
                aspectRatio: '1:1',
                mood: 'none',
                autoDownload: true,
                presets: []
            }
        });
    }
});

// ============================================
// Context Menu (Optional - for quick access)
// ============================================

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'newszeed-generate',
        title: 'Generate Cover with Newszeed',
        contexts: ['image']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'newszeed-generate') {
        // Open popup with the image URL pre-loaded
        // This is a potential future feature
        console.log('[Background] Context menu clicked for image:', info.srcUrl);
    }
});

console.log('[Background] Service worker initialized');
