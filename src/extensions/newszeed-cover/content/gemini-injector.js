/**
 * Newszeed Cover Generator - Gemini Injector Content Script
 * Injects prompts into Gemini chat and monitors for generated images
 */

// ============================================
// Constants
// ============================================

const SELECTORS = {
    // Gemini chat input textarea
    INPUT: 'div[contenteditable="true"][data-placeholder]',
    INPUT_ALT: 'textarea[aria-label*="message"]',
    INPUT_RICH: '.ql-editor',

    // Send button
    SEND_BTN: 'button[aria-label*="Send"]',
    SEND_BTN_ALT: 'button[data-test-id="send-button"]',

    // Image upload button
    UPLOAD_BTN: 'button[aria-label*="Upload"]',

    // Generated images in response
    RESPONSE_IMAGE: 'img[src*="googleusercontent"]',
    RESPONSE_CONTAINER: '[data-message-id]',

    // Loading indicator
    LOADING: '[data-loading="true"]',
};

const TIMEOUTS = {
    POLL_INTERVAL: 1000,
    MAX_WAIT: 120000, // 2 minutes max
    INJECT_DELAY: 500,
};

// ============================================
// State
// ============================================

let currentJobId = null;
let isProcessing = false;

// ============================================
// Message Handler
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Gemini Injector] Received message:', message.type);

    switch (message.type) {
        case 'PING':
            sendResponse({ pong: true });
            break;

        case 'INJECT_PROMPT':
            handleInjectPrompt(message, sendResponse);
            return true; // Keep channel open for async

        default:
            sendResponse({ error: 'Unknown message type' });
    }
});

// ============================================
// Main Functions
// ============================================

/**
 * Handle prompt injection and image generation
 */
async function handleInjectPrompt(message, sendResponse) {
    if (isProcessing) {
        sendResponse({ error: 'Already processing another request' });
        return;
    }

    isProcessing = true;
    currentJobId = message.jobId;

    try {
        const { payload } = message;

        // 1. Build the prompt
        const prompt = buildPromptFromPayload(payload);

        // 2. Upload images first (if any)
        if (payload.images && payload.images.length > 0) {
            await uploadImages(payload.images);
        }

        // 3. Inject prompt into input
        await injectPrompt(prompt);

        // 4. Click send button
        await clickSend();

        // 5. Wait for response and image
        const result = await waitForImage();

        // 6. Auto-download if enabled
        if (result.imageUrl) {
            await notifyDownload(result.imageUrl, payload.category);
        }

        sendResponse({ result });

    } catch (error) {
        console.error('[Gemini Injector] Error:', error);
        sendResponse({ error: error.message });
    } finally {
        isProcessing = false;
        currentJobId = null;
    }
}

/**
 * Build prompt text from payload
 */
function buildPromptFromPayload(payload) {
    const { category, headline, aspectRatio, fontStyles, textPosition, mood } = payload;

    // This mirrors the prompt-builder logic but runs in content script
    const categoryPrompts = {
        politics: 'World Politics news cover - professional Thai broadcast style with leader photos',
        breaking: 'Breaking News cover - urgent red theme with dramatic presentation',
        finance: 'Financial News cover - corporate style with charts and market elements',
        football: 'Football News cover - dynamic sports style with team elements',
        transfer: 'Transfer News cover - "HERE WE GO!" Fabrizio Romano style with club badges',
        drama: 'Thai Drama News cover - tabloid style with emotional presentation',
        honkrasae: 'โหนกระแส TV Show cover - talk show studio style',
        esports: 'Esports/Gaming News cover - neon cyberpunk style',
        health: 'Health/Research News cover - clean medical/scientific style',
        celebrity: 'Celebrity News cover - glamorous entertainment magazine style',
    };

    let prompt = `Create a professional ${categoryPrompts[category] || 'news cover image'}.

REQUIREMENTS:
- Aspect ratio: ${aspectRatio}
- High quality, publication-ready
- Modern, professional design
`;

    if (headline) {
        prompt += `
HEADLINE TEXT (in Thai):
"${headline}"
- Position: ${textPosition}
- Style: ${fontStyles.join(', ')}
`;
    }

    if (mood && mood !== 'none') {
        prompt += `
Subject expression/mood: ${mood}
`;
    }

    prompt += `
Generate a photorealistic, professionally designed news cover image.`;

    return prompt;
}

/**
 * Upload images to Gemini
 */
async function uploadImages(images) {
    // Find upload button
    const uploadBtn = document.querySelector(SELECTORS.UPLOAD_BTN);

    if (!uploadBtn) {
        console.warn('[Gemini Injector] Upload button not found, skipping image upload');
        return;
    }

    // For now, we'll paste images directly into the chat
    // Gemini supports pasting images from clipboard
    for (const imageData of images) {
        try {
            // Convert base64 to blob
            const blob = await base64ToBlob(imageData);

            // Create clipboard item
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);

            // Focus input and paste
            const input = findInput();
            if (input) {
                input.focus();
                document.execCommand('paste');
                await sleep(500); // Wait for paste to complete
            }
        } catch (e) {
            console.warn('[Gemini Injector] Image paste failed:', e);
        }
    }

    await sleep(TIMEOUTS.INJECT_DELAY);
}

/**
 * Inject prompt text into chat input
 */
async function injectPrompt(prompt) {
    const input = findInput();

    if (!input) {
        throw new Error('Could not find Gemini input field');
    }

    // Focus the input
    input.focus();
    await sleep(100);

    // Clear existing content
    if (input.tagName === 'TEXTAREA') {
        input.value = prompt;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        // For contenteditable divs
        input.innerHTML = '';
        input.textContent = prompt;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    await sleep(TIMEOUTS.INJECT_DELAY);

    console.log('[Gemini Injector] Prompt injected');
}

/**
 * Click the send button
 */
async function clickSend() {
    const sendBtn = document.querySelector(SELECTORS.SEND_BTN) ||
        document.querySelector(SELECTORS.SEND_BTN_ALT);

    if (!sendBtn) {
        // Try keyboard shortcut instead
        const input = findInput();
        if (input) {
            input.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true,
                ctrlKey: true
            }));
            console.log('[Gemini Injector] Sent via keyboard');
            return;
        }
        throw new Error('Could not find send button');
    }

    sendBtn.click();
    console.log('[Gemini Injector] Send button clicked');

    await sleep(1000);
}

/**
 * Wait for image to be generated in response
 */
async function waitForImage() {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const poll = setInterval(() => {
            // Check timeout
            if (Date.now() - startTime > TIMEOUTS.MAX_WAIT) {
                clearInterval(poll);
                reject(new Error('Timeout waiting for image generation'));
                return;
            }

            // Check for loading state
            const loading = document.querySelector(SELECTORS.LOADING);
            if (loading) {
                console.log('[Gemini Injector] Still loading...');
                return; // Keep waiting
            }

            // Look for generated images
            const images = document.querySelectorAll(SELECTORS.RESPONSE_IMAGE);

            // Find the most recent image (last in DOM)
            const recentImages = Array.from(images).filter(img => {
                // Filter for actual generated images, not UI elements
                const src = img.src;
                return src &&
                    (src.includes('googleusercontent') || src.includes('ggpht')) &&
                    img.width > 100; // Ignore tiny icons
            });

            if (recentImages.length > 0) {
                const latestImage = recentImages[recentImages.length - 1];
                clearInterval(poll);

                console.log('[Gemini Injector] Image found:', latestImage.src);

                resolve({
                    imageUrl: latestImage.src,
                    generatedAt: Date.now(),
                });
            }
        }, TIMEOUTS.POLL_INTERVAL);
    });
}

/**
 * Notify background script to download image
 */
async function notifyDownload(imageUrl, category) {
    const filename = `newszeed-${category}-${Date.now()}.png`;

    chrome.runtime.sendMessage({
        type: 'DOWNLOAD_IMAGE',
        imageUrl,
        filename
    });
}

// ============================================
// Helper Functions
// ============================================

function findInput() {
    return document.querySelector(SELECTORS.INPUT) ||
        document.querySelector(SELECTORS.INPUT_ALT) ||
        document.querySelector(SELECTORS.INPUT_RICH);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function base64ToBlob(base64) {
    // Handle data URL format
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const mimeType = base64.includes('data:') ? base64.match(/data:([^;]+)/)[1] : 'image/png';

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

// ============================================
// Visual Feedback (Optional)
// ============================================

function showProcessingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'newszeed-overlay';
    overlay.innerHTML = `
    <div class="newszeed-processing">
      <div class="newszeed-spinner"></div>
      <div class="newszeed-text">Newszeed: กำลังสร้างหน้าปก...</div>
    </div>
  `;
    document.body.appendChild(overlay);
}

function hideProcessingOverlay() {
    const overlay = document.getElementById('newszeed-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// ============================================
// Initialize
// ============================================

console.log('[Gemini Injector] Content script loaded');
