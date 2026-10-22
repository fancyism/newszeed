import dotenv from "dotenv";
dotenv.config();

import { publishingQueue } from "@/lib/queue/bull";
import { prisma } from "@/lib/prisma";
import axios from "axios";

console.log("🚀 Worker started! Listening for jobs...");

publishingQueue.process(async (job) => {
    const { postId } = job.data;
    console.log(`Processing job for post: ${postId}`);

    try {
        // 1. Fetch Post
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { page: true },
        });

        if (!post || !post.page) {
            throw new Error("Post or Page not found");
        }

        // 2. Publish to Facebook
        let fbPostId;
        const accessToken = post.page.accessToken;
        const pageId = post.page.pageId;
        const message = `${post.headline}\n\n${post.content}\n\n${post.tags.map(t => `#${t}`).join(" ")}`;

        if (post.coverUrl) {
            // Publish Photo
            const res = await axios.post(
                `https://graph.facebook.com/v19.0/${pageId}/photos`,
                {
                    url: post.coverUrl,
                    message: message,
                    access_token: accessToken,
                }
            );
            fbPostId = res.data.post_id || res.data.id;
        } else {
            // Publish Feed (Text)
            const res = await axios.post(
                `https://graph.facebook.com/v19.0/${pageId}/feed`,
                {
                    message: message,
                    access_token: accessToken,
                }
            );
            fbPostId = res.data.id;
        }

        // 3. Update DB
        await prisma.post.update({
            where: { id: postId },
            data: {
                status: "PUBLISHED",
                publishedAt: new Date(),
                fbPostId: fbPostId,
            },
        });

        console.log(`✅ Successfully published post ${postId} to FB: ${fbPostId}`);
        return { success: true, fbPostId };

    } catch (error) {
        console.error(`❌ Job failed for post ${postId}:`, error.message);

        // Update status to FAILED
        await prisma.post.update({
            where: { id: postId },
            data: { status: "FAILED" },
        });

        throw error;
    }
});
