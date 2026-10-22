"use server";

import { prisma } from "@/lib/prisma";
import { addToQueue } from "@/lib/queue/bull";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(data: any) {
    // 1. Validate & Create Post in DB
    const post = await prisma.post.create({
        data: {
            ...data,
            status: "DRAFT", // Start as draft
        },
    });

    return post;
}

export async function publishPost(postId: string) {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { page: true } // check if page is connected
    });

    if (!post) throw new Error("Post not found");
    if (!post.pageId) throw new Error("No Facebook Page selected");

    // Update status
    await prisma.post.update({
        where: { id: postId },
        data: { status: "QUEUED" }
    });

    // Add to Queue
    await addToQueue(postId);

    revalidatePath("/dashboard/posts");
    return { success: true };
}
