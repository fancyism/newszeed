"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function savePageConnection(page: any) {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore as any); // Cast to any if type mismatch occurs with Next 15 types
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Check if user exists in our DB, if not create (sync with Supabase)
    let dbUser = await prisma.user.findUnique({ where: { email: user.email! } });

    if (!dbUser) {
        dbUser = await prisma.user.create({
            data: {
                id: user.id,
                email: user.email!,
            },
        });
    }

    // Save or update FB Page
    await prisma.fBPage.upsert({
        where: { pageId: page.id },
        create: {
            pageId: page.id,
            pageName: page.name,
            accessToken: page.access_token,
            imageUrl: page.picture?.data?.url,
            userId: dbUser.id,
        },
        update: {
            pageName: page.name,
            accessToken: page.access_token,
            imageUrl: page.picture?.data?.url,
            isActive: true,
        },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
}
