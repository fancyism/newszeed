/**
 * Newszeed Cover Generator - Popup Main Script
 * Handles UI interactions, state management, and Chrome extension messaging
 */

import { QueueManager, QueueStatus } from '../lib/queue-manager.js';
import { buildPrompt } from '../prompts/prompt-builder.js';

// ============================================
// State Management
// ============================================
const state = {
    activeTab: 'ai-cover',
    images: [],
    category: 'politics',
    showText: true,
    headline: '',
    textPosition: 'bottom',
    fontStyles: ['3d'],
    aspectRatio: '1:1',
    mood: 'none',
    autoDownload: true,
    presets: [],
};

// Queue Manager Instance
let queueManager = null;

// ============================================
// DOM Elements
// ============================================
const elements = {
    // Tabs
    tabs: document.querySelectorAll('.tab'),
    contents: {
        aiCover: document.getElementById('ai-cover-content'),
        gridCreator: document.getElementById('grid-creator-content'),
    },

    // Settings
    autoDownloadToggle: document.getElementById('auto-download'),

    // Upload
    uploadZone: document.getElementById('upload-zone'),
    fileInput: document.getElementById('file-input'),
    imagePreviews: document.getElementById('image-previews'),
    imageCount: document.getElementById('image-count'),

    // Category
    categoryGrid: document.getElementById('category-grid'),
    categoryBtns: document.querySelectorAll('.category-btn'),

    // Text Config
    showTextToggle: document.getElementById('show-text'),
    textConfig: document.getElementById('text-config'),
    headlineInput: document.getElementById('headline-input'),
    positionGrid: document.getElementById('position-grid'),
    positionBtns: document.querySelectorAll('.position-btn'),
    fontGrid: document.getElementById('font-grid'),
    fontBtns: document.querySelectorAll('.font-btn'),

    // Aspect Ratio
    aspectGrid: document.getElementById('aspect-grid'),
    aspectBtns: document.querySelectorAll('.aspect-btn'),

    // Mood
    moodGrid: document.getElementById('mood-grid'),
    moodBtns: document.querySelectorAll('.mood-btn'),

    // Presets
    presetNameInput: document.getElementById('preset-name'),
    savePresetBtn: document.getElementById('save-preset-btn'),
    presetList: document.getElementById('preset-list'),

    // Queue
    queueCard: document.getElementById('queue-card'),
    queuePending: document.getElementById('queue-pending'),
    queueProcessing: document.getElementById('queue-processing'),
    queueCompleted: document.getElementById('queue-completed'),
    queueFailed: document.getElementById('queue-failed'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    queueList: document.getElementById('queue-list'),

    // Generate
    generateBtn: document.getElementById('generate-btn'),
};

// ============================================
// Initialization
// ============================================
async function init() {
    // Initialize Queue Manager
    queueManager = new QueueManager();
    await queueManager.init();

    // Load saved state
    await loadState();

    // Set up event listeners
    setupEventListeners();

    // Apply loaded state to UI
    applyStateToUI();

    // Start queue status updates
    startQueueStatusUpdates();

    console.log('Newszeed Cover Generator initialized');
}

// ============================================
// Event Listeners Setup
// ============================================
function setupEventListeners() {
    // Tab switching
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => handleTabSwitch(tab.dataset.tab));
    });

    // Auto download toggle
    elements.autoDownloadToggle.addEventListener('change', (e) => {
        state.autoDownload = e.target.checked;
        saveState();
    });

    // Image upload
    elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.uploadZone.addEventListener('dragover', handleDragOver);
    elements.uploadZone.addEventListener('dragleave', handleDragLeave);
    elements.uploadZone.addEventListener('drop', handleDrop);

    // Category selection
    elements.categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => handleCategorySelect(btn.dataset.category));
    });

    // Show text toggle
    elements.showTextToggle.addEventListener('change', (e) => {
        state.showText = e.target.checked;
        elements.textConfig.style.display = state.showText ? 'block' : 'none';
        saveState();
    });

    // Headline input
    elements.headlineInput.addEventListener('input', (e) => {
        state.headline = e.target.value;
        saveState();
    });

    // Position selection
    elements.positionBtns.forEach(btn => {
        btn.addEventListener('click', () => handlePositionSelect(btn.dataset.position));
    });

    // Font style selection (multi-select)
    elements.fontBtns.forEach(btn => {
        btn.addEventListener('click', () => handleFontToggle(btn.dataset.font));
    });

    // Aspect ratio selection
    elements.aspectBtns.forEach(btn => {
        btn.addEventListener('click', () => handleAspectSelect(btn.dataset.aspect));
    });

    // Mood selection
    elements.moodBtns.forEach(btn => {
        btn.addEventListener('click', () => handleMoodSelect(btn.dataset.mood));
    });

    // Preset save
    elements.savePresetBtn.addEventListener('click', handleSavePreset);

    // Generate button
    elements.generateBtn.addEventListener('click', handleGenerate);
}

// ============================================
// Event Handlers
// ============================================
function handleTabSwitch(tabId) {
    state.activeTab = tabId;

    // Update tab buttons
    elements.tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Update content visibility
    elements.contents.aiCover.classList.toggle('hidden', tabId !== 'ai-cover');
    elements.contents.gridCreator.classList.toggle('hidden', tabId !== 'grid-creator');
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadZone.classList.remove('dragover');

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    addImages(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addImages(files);
    e.target.value = ''; // Reset for re-select
}

async function addImages(files) {
    const maxImages = 10;
    const remainingSlots = maxImages - state.images.length;
    const filesToAdd = files.slice(0, remainingSlots);

    for (const file of filesToAdd) {
        const base64 = await fileToBase64(file);
        state.images.push({
            id: crypto.randomUUID(),
            name: file.name,
            data: base64,
        });
    }

    renderImagePreviews();
    saveState();
}

function removeImage(id) {
    state.images = state.images.filter(img => img.id !== id);
    renderImagePreviews();
    saveState();
}

function renderImagePreviews() {
    elements.imagePreviews.innerHTML = state.images.map(img => `
    <div class="image-preview" data-id="${img.id}">
      <img src="${img.data}" alt="${img.name}">
      <button class="remove-btn" onclick="removeImage('${img.id}')">×</button>
    </div>
  `).join('');

    elements.imageCount.textContent = state.images.length;
}

// Make removeImage accessible globally
window.removeImage = removeImage;

function handleCategorySelect(category) {
    state.category = category;

    elements.categoryBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    saveState();
}

function handlePositionSelect(position) {
    state.textPosition = position;

    elements.positionBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.position === position);
    });

    saveState();
}

function handleFontToggle(font) {
    const index = state.fontStyles.indexOf(font);

    if (index === -1) {
        state.fontStyles.push(font);
    } else {
        state.fontStyles.splice(index, 1);
    }

    // Ensure at least one font is selected
    if (state.fontStyles.length === 0) {
        state.fontStyles.push('3d');
    }

    elements.fontBtns.forEach(btn => {
        btn.classList.toggle('active', state.fontStyles.includes(btn.dataset.font));
    });

    saveState();
}

function handleAspectSelect(aspect) {
    state.aspectRatio = aspect;

    elements.aspectBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.aspect === aspect);
    });

    saveState();
}

function handleMoodSelect(mood) {
    state.mood = mood;

    elements.moodBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mood === mood);
    });

    saveState();
}

async function handleSavePreset() {
    const name = elements.presetNameInput.value.trim();
    if (!name) return;

    const preset = {
        id: crypto.randomUUID(),
        name,
        category: state.category,
        showText: state.showText,
        textPosition: state.textPosition,
        fontStyles: [...state.fontStyles],
        aspectRatio: state.aspectRatio,
        mood: state.mood,
    };

    state.presets.push(preset);
    elements.presetNameInput.value = '';

    renderPresets();
    saveState();
}

function loadPreset(id) {
    const preset = state.presets.find(p => p.id === id);
    if (!preset) return;

    state.category = preset.category;
    state.showText = preset.showText;
    state.textPosition = preset.textPosition;
    state.fontStyles = [...preset.fontStyles];
    state.aspectRatio = preset.aspectRatio;
    state.mood = preset.mood;

    applyStateToUI();
    saveState();
}

function deletePreset(id) {
    state.presets = state.presets.filter(p => p.id !== id);
    renderPresets();
    saveState();
}

// Make preset functions accessible globally
window.loadPreset = loadPreset;
window.deletePreset = deletePreset;

function renderPresets() {
    elements.presetList.innerHTML = state.presets.map(preset => `
    <div class="preset-item" onclick="loadPreset('${preset.id}')">
      <span class="preset-name">${preset.name}</span>
      <button class="preset-delete" onclick="event.stopPropagation(); deletePreset('${preset.id}')">🗑️</button>
    </div>
  `).join('');
}

// ============================================
// Generate & Queue
// ============================================
async function handleGenerate() {
    // Validate
    if (state.images.length === 0) {
        alert('กรุณาเพิ่มรูปภาพอย่างน้อย 1 รูป');
        return;
    }

    // Build job payload
    const payload = {
        category: state.category,
        images: state.images.map(img => img.data),
        headline: state.headline,
        textPosition: state.textPosition,
        aspectRatio: state.aspectRatio,
        fontStyles: state.fontStyles,
        mood: state.mood,
    };

    try {
        // Add to queue
        const jobId = await queueManager.addJob(payload);
        console.log('Job added to queue:', jobId);

        // Update UI
        updateQueueUI();

        // Clear images for next job
        state.images = [];
        renderImagePreviews();
        saveState();

    } catch (error) {
        if (error.message === 'DUPLICATE_JOB') {
            alert('งานนี้ซ้ำกับงานที่อยู่ในคิวแล้ว');
        } else {
            console.error('Failed to add job:', error);
            alert('เกิดข้อผิดพลาดในการเพิ่มงาน: ' + error.message);
        }
    }
}

function startQueueStatusUpdates() {
    // Update every second
    setInterval(() => {
        updateQueueUI();
    }, 1000);
}

function updateQueueUI() {
    if (!queueManager) return;

    const status = queueManager.getQueueStatus();
    const jobs = queueManager.getRecentJobs(10);

    // Update stats
    elements.queuePending.textContent = status.pending;
    elements.queueProcessing.textContent = status.processing;
    elements.queueCompleted.textContent = status.completed;
    elements.queueFailed.textContent = status.failed;

    // Update progress
    const currentJob = queueManager.getCurrentJob();
    if (currentJob) {
        elements.progressText.textContent = `กำลังสร้างรูป... (${currentJob.payload.category})`;
        elements.progressFill.style.width = '50%';
        elements.generateBtn.classList.add('processing');
    } else if (status.pending > 0) {
        elements.progressText.textContent = `รอคิว ${status.pending} งาน`;
        elements.progressFill.style.width = '0%';
        elements.generateBtn.classList.remove('processing');
    } else {
        elements.progressText.textContent = 'ว่าง';
        elements.progressFill.style.width = '0%';
        elements.generateBtn.classList.remove('processing');
    }

    // Update job list
    elements.queueList.innerHTML = jobs.map(job => {
        const statusIcon = getStatusIcon(job.status);
        const timeStr = formatTime(job.createdAt);
        const retryBtn = job.status === 'failed'
            ? `<button class="queue-retry-btn" onclick="retryJob('${job.id}')">↻</button>`
            : '';

        return `
      <div class="queue-item">
        <span class="queue-status-icon">${statusIcon}</span>
        <div class="queue-item-info">
          <div class="queue-item-title">${getCategoryName(job.payload.category)} - "${truncate(job.payload.headline, 20)}"</div>
          <div class="queue-item-time">${timeStr}</div>
        </div>
        ${retryBtn}
      </div>
    `;
    }).join('');
}

window.retryJob = async (id) => {
    await queueManager.retryJob(id);
    updateQueueUI();
};

function getStatusIcon(status) {
    const icons = {
        pending: '⚪',
        processing: '🔵',
        completed: '🟢',
        failed: '🔴',
        retrying: '🟡',
    };
    return icons[status] || '⚪';
}

function getCategoryName(category) {
    const names = {
        politics: 'การเมือง',
        breaking: 'ข่าวด่วน',
        finance: 'การเงิน',
        football: 'ฟุตบอล',
        transfer: 'ย้ายทีม',
        drama: 'ดราม่า',
        honkrasae: 'โหนกระแส',
        esports: 'Esports',
        health: 'สุขภาพ',
        celebrity: 'ดารา',
    };
    return names[category] || category;
}

// ============================================
// State Persistence
// ============================================
async function saveState() {
    const stateToSave = {
        category: state.category,
        showText: state.showText,
        textPosition: state.textPosition,
        fontStyles: state.fontStyles,
        aspectRatio: state.aspectRatio,
        mood: state.mood,
        autoDownload: state.autoDownload,
        presets: state.presets,
    };

    await chrome.storage.local.set({ newszeedState: stateToSave });
}

async function loadState() {
    const result = await chrome.storage.local.get('newszeedState');

    if (result.newszeedState) {
        Object.assign(state, result.newszeedState);
    }
}

function applyStateToUI() {
    // Auto download
    elements.autoDownloadToggle.checked = state.autoDownload;

    // Category
    elements.categoryBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === state.category);
    });

    // Show text
    elements.showTextToggle.checked = state.showText;
    elements.textConfig.style.display = state.showText ? 'block' : 'none';

    // Position
    elements.positionBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.position === state.textPosition);
    });

    // Font styles
    elements.fontBtns.forEach(btn => {
        btn.classList.toggle('active', state.fontStyles.includes(btn.dataset.font));
    });

    // Aspect ratio
    elements.aspectBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.aspect === state.aspectRatio);
    });

    // Mood
    elements.moodBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mood === state.mood);
    });

    // Presets
    renderPresets();
}

// ============================================
// Utility Functions
// ============================================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function truncate(str, maxLength) {
    if (!str) return '';
    return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

// ============================================
// Initialize on DOM Ready
// ============================================
document.addEventListener('DOMContentLoaded', init);
