import { NextResponse } from "next/server";
import { fetchRSSFeed } from "@/lib/rss/parser";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get("url");

        if (!url) {
            return NextResponse.json(
                { error: "URL parameter is required" },
                { status: 400 }
            );
        }

        const feed = await fetchRSSFeed(url);

        return NextResponse.json(feed);
    } catch (error) {
        console.error("RSS API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch RSS feed" },
            { status: 500 }
        );
    }
}
