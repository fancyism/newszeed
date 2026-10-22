import Queue from "bull";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const publishingQueue = new Queue("publishing-queue", REDIS_URL);

export const SCHEDULE_QUEUE_NAME = "publishing-queue";

// Helper to add job
export async function addToQueue(postId: string, scheduledAt?: Date) {
    const delay = scheduledAt ? scheduledAt.getTime() - Date.now() : 0;

    await publishingQueue.add(
        { postId },
        {
            delay: Math.max(0, delay),
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 5000,
            },
            removeOnComplete: true,
        }
    );
}
