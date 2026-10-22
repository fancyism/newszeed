/**
 * Newszeed Cover Generator - Queue Manager
 * Implements: Priority Scheduler, Token Bucket Rate Limiter, 
 * Exponential Backoff + Jitter, Deduplication, IndexedDB Persistence
 */

// ============================================
// Type Definitions
// ============================================

/**
 * @typedef {Object} QueueJob
 * @property {string} id - Unique job ID (UUID)
 * @property {string} hash - Content hash for deduplication
 * @property {'pending'|'processing'|'completed'|'failed'|'retrying'} status
 * @property {number} priority - 1-10 (higher = more urgent)
 * @property {number} createdAt - Timestamp
 * @property {number} [startedAt] - Processing start time
 * @property {number} [completedAt] - Completion time
 * @property {number} retryCount - Current retry attempt
 * @property {number} maxRetries - Max allowed retries
 * @property {number} [nextRetryAt] - Calculated with backoff + jitter
 * @property {Object} payload - Job data
 * @property {Object} [result] - Generation result
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} QueueStatus
 * @property {number} pending
 * @property {number} processing
 * @property {number} completed
 * @property {number} failed
 * @property {number} retrying
 */

// ============================================
// Priority Scheduler
// ============================================
class PriorityScheduler {
    /**
     * Get next job to process (priority DESC, createdAt ASC)
     * @param {QueueJob[]} queue 
     * @returns {QueueJob|null}
     */
    getNextJob(queue) {
        const now = Date.now();
        const pending = queue
            .filter(j =>
                j.status === 'pending' ||
                (j.status === 'retrying' && j.nextRetryAt && j.nextRetryAt <= now)
            )
            .sort((a, b) => {
                // Higher priority first
                if (a.priority !== b.priority) return b.priority - a.priority;
                // Earlier created first (FIFO)
                return a.createdAt - b.createdAt;
            });

        return pending[0] || null;
    }
}

// ============================================
// Token Bucket Rate Limiter
// ============================================
class TokenBucketRateLimiter {
    constructor(maxTokens = 5, refillRate = 0.5) {
        this.maxTokens = maxTokens;
        this.tokens = maxTokens;
        this.refillRate = refillRate; // tokens per second
        this.lastRefill = Date.now();
    }

    refill() {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;
        this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
        this.lastRefill = now;
    }

    canProcess() {
        this.refill();
        return this.tokens >= 1;
    }

    consume() {
        if (!this.canProcess()) return false;
        this.tokens -= 1;
        return true;
    }

    getWaitTime() {
        this.refill();
        if (this.tokens >= 1) return 0;
        return Math.ceil((1 - this.tokens) / this.refillRate * 1000);
    }
}

// ============================================
// Retry Manager (Exponential Backoff + Jitter)
// ============================================
class RetryManager {
    constructor() {
        this.baseDelay = 1000;    // 1 second
        this.maxDelay = 60000;    // 60 seconds
        this.maxRetries = 5;
    }

    /**
     * Calculate next retry time with exponential backoff and decorrelated jitter
     * @param {QueueJob} job 
     * @returns {number} Next retry timestamp, or -1 if max retries exceeded
     */
    calculateNextRetry(job) {
        if (job.retryCount >= this.maxRetries) {
            return -1; // Give up
        }

        // Exponential backoff: 2^attempt * baseDelay
        const exponentialDelay = Math.pow(2, job.retryCount) * this.baseDelay;

        // Cap at maxDelay
        const cappedDelay = Math.min(exponentialDelay, this.maxDelay);

        // Decorrelated jitter: random between 0.5x and 1.5x
        // Prevents "thundering herd" when multiple jobs retry simultaneously
        const jitter = 0.5 + Math.random();
        const finalDelay = Math.floor(cappedDelay * jitter);

        return Date.now() + finalDelay;
    }

    /**
     * Determine if job should be retried based on error type
     * @param {QueueJob} job 
     * @param {string} error 
     * @returns {boolean}
     */
    shouldRetry(job, error) {
        // Don't retry on permanent/unrecoverable errors
        const permanentErrors = [
            'INVALID_INPUT',
            'CONTENT_POLICY',
            'AUTH_FAILED',
            'QUOTA_EXCEEDED',
            'INVALID_PROMPT'
        ];

        if (permanentErrors.some(e => error.includes(e))) {
            return false;
        }

        return job.retryCount < this.maxRetries;
    }
}

// ============================================
// Deduplication Manager
// ============================================
class DeduplicationManager {
    constructor() {
        this.recentHashes = new Map(); // hash -> timestamp
        this.hashExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Generate deterministic hash from job payload
     * @param {Object} payload 
     * @returns {Promise<string>}
     */
    async generateHash(payload) {
        const content = JSON.stringify({
            category: payload.category,
            images: payload.images.map(img => img.substring(0, 1000)), // First 1000 chars
            headline: (payload.headline || '').trim().toLowerCase(),
            aspectRatio: payload.aspectRatio,
        });

        return this.sha256(content);
    }

    /**
     * Check if hash exists in recent jobs
     * @param {string} hash 
     * @returns {boolean}
     */
    isDuplicate(hash) {
        this.cleanExpired();
        return this.recentHashes.has(hash);
    }

    /**
     * Mark hash as processed
     * @param {string} hash 
     */
    markProcessed(hash) {
        this.recentHashes.set(hash, Date.now());
    }

    cleanExpired() {
        const now = Date.now();
        for (const [hash, timestamp] of this.recentHashes) {
            if (now - timestamp > this.hashExpiry) {
                this.recentHashes.delete(hash);
            }
        }
    }

    /**
     * SHA-256 hash using Web Crypto API
     * @param {string} str 
     * @returns {Promise<string>}
     */
    async sha256(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

// ============================================
// Queue Persistence (IndexedDB)
// ============================================
class QueuePersistence {
    constructor() {
        this.dbName = 'newszeed-queue';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Queue store
                if (!db.objectStoreNames.contains('queue')) {
                    const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
                    queueStore.createIndex('status', 'status', { unique: false });
                    queueStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Write-Ahead Log for fault tolerance
                if (!db.objectStoreNames.contains('wal')) {
                    db.createObjectStore('wal', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    async addJob(job) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['queue', 'wal'], 'readwrite');

            // Write to WAL first (intent)
            tx.objectStore('wal').add({
                action: 'ADD',
                jobId: job.id,
                timestamp: Date.now(),
                data: job
            });

            // Write actual job
            tx.objectStore('queue').add(job);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async updateJob(job) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('queue', 'readwrite');
            tx.objectStore('queue').put(job);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async getJob(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('queue', 'readonly');
            const request = tx.objectStore('queue').get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllJobs() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('queue', 'readonly');
            const request = tx.objectStore('queue').getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteJob(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('queue', 'readwrite');
            tx.objectStore('queue').delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    /**
     * Recovery: Reset stuck jobs on startup
     */
    async recover() {
        const jobs = await this.getAllJobs();

        // Find jobs that were processing when crash occurred
        const stuckJobs = jobs.filter(j => j.status === 'processing');

        for (const job of stuckJobs) {
            job.status = 'pending';
            job.retryCount += 1;
            await this.updateJob(job);
        }

        return jobs.length;
    }
}

// ============================================
// Queue Manager (Orchestrator)
// ============================================
export class QueueManager {
    constructor() {
        this.scheduler = new PriorityScheduler();
        this.rateLimiter = new TokenBucketRateLimiter(5, 0.5);
        this.retryManager = new RetryManager();
        this.dedup = new DeduplicationManager();
        this.persistence = new QueuePersistence();

        this.queue = [];
        this.isProcessing = false;
        this.currentJob = null;
        this.listeners = [];
    }

    async init() {
        await this.persistence.init();
        await this.persistence.recover();
        this.queue = await this.persistence.getAllJobs();

        // Start processing if there are pending jobs
        if (this.queue.some(j => j.status === 'pending' || j.status === 'retrying')) {
            this.startProcessing();
        }

        console.log(`QueueManager initialized with ${this.queue.length} jobs`);
    }

    /**
     * Add a new job to the queue
     * @param {Object} payload 
     * @param {number} priority 
     * @returns {Promise<string>} Job ID
     */
    async addJob(payload, priority = 5) {
        const hash = await this.dedup.generateHash(payload);

        // Check deduplication
        if (this.dedup.isDuplicate(hash)) {
            throw new Error('DUPLICATE_JOB');
        }

        const job = {
            id: crypto.randomUUID(),
            hash,
            status: 'pending',
            priority,
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 5,
            payload
        };

        this.queue.push(job);
        await this.persistence.addJob(job);
        this.dedup.markProcessed(hash);

        // Trigger processing if not already running
        if (!this.isProcessing) {
            this.startProcessing();
        }

        this.emit('jobAdded', job);
        return job.id;
    }

    /**
     * Retry a failed job
     * @param {string} id 
     */
    async retryJob(id) {
        const job = this.queue.find(j => j.id === id);
        if (!job || job.status !== 'failed') return;

        job.status = 'pending';
        job.retryCount = 0;
        job.error = undefined;

        await this.persistence.updateJob(job);

        if (!this.isProcessing) {
            this.startProcessing();
        }

        this.emit('jobRetried', job);
    }

    /**
     * Cancel a pending job
     * @param {string} id 
     */
    async cancelJob(id) {
        const job = this.queue.find(j => j.id === id);
        if (!job || job.status !== 'pending') return;

        await this.persistence.deleteJob(id);
        this.queue = this.queue.filter(j => j.id !== id);

        this.emit('jobCancelled', job);
    }

    /**
     * Start the processing loop
     */
    async startProcessing() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (true) {
            // Check rate limit
            if (!this.rateLimiter.canProcess()) {
                const waitTime = this.rateLimiter.getWaitTime();
                await this.sleep(waitTime);
                continue;
            }

            // Get next job from scheduler
            const job = this.scheduler.getNextJob(this.queue);
            if (!job) {
                break; // No jobs to process
            }

            // Consume rate limit token
            this.rateLimiter.consume();

            // Process job
            await this.processJob(job);
        }

        this.isProcessing = false;
        this.currentJob = null;
    }

    /**
     * Process a single job
     * @param {QueueJob} job 
     */
    async processJob(job) {
        job.status = 'processing';
        job.startedAt = Date.now();
        this.currentJob = job;
        await this.persistence.updateJob(job);
        this.emit('jobStarted', job);

        try {
            const result = await this.executeGeminiGeneration(job);
            job.status = 'completed';
            job.completedAt = Date.now();
            job.result = result;
            this.emit('jobCompleted', job);

        } catch (error) {
            const errorMsg = error.message || String(error);

            if (this.retryManager.shouldRetry(job, errorMsg)) {
                job.status = 'retrying';
                job.retryCount += 1;
                job.nextRetryAt = this.retryManager.calculateNextRetry(job);
                job.error = errorMsg;
                this.emit('jobRetrying', job);
            } else {
                job.status = 'failed';
                job.error = errorMsg;
                this.emit('jobFailed', job);
            }
        }

        this.currentJob = null;
        await this.persistence.updateJob(job);
    }

    /**
     * Execute Gemini generation via content script
     * @param {QueueJob} job 
     * @returns {Promise<Object>} Result with image URL
     */
    async executeGeminiGeneration(job) {
        // Send message to background script which will relay to content script
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: 'GENERATE_COVER',
                payload: job.payload,
                jobId: job.id
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result);
                }
            });
        });
    }

    /**
     * Get current queue status
     * @returns {QueueStatus}
     */
    getQueueStatus() {
        return {
            pending: this.queue.filter(j => j.status === 'pending').length,
            processing: this.queue.filter(j => j.status === 'processing').length,
            completed: this.queue.filter(j => j.status === 'completed').length,
            failed: this.queue.filter(j => j.status === 'failed').length,
            retrying: this.queue.filter(j => j.status === 'retrying').length,
        };
    }

    /**
     * Get recent jobs for display
     * @param {number} limit 
     * @returns {QueueJob[]}
     */
    getRecentJobs(limit = 10) {
        return [...this.queue]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    }

    /**
     * Get currently processing job
     * @returns {QueueJob|null}
     */
    getCurrentJob() {
        return this.currentJob;
    }

    // Event emitter
    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    emit(event, data) {
        this.listeners
            .filter(l => l.event === event)
            .forEach(l => l.callback(data));
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export status type for TypeScript-like usage
export const QueueStatus = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    RETRYING: 'retrying',
};
