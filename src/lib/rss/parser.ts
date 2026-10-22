import Parser from "rss-parser";

const parser = new Parser();

export interface RSSItem {
    title?: string;
    link?: string;
    pubDate?: string;
    content?: string;
    contentSnippet?: string;
    guid?: string;
    isoDate?: string;
}

export interface RSSFeedData {
    title?: string;
    description?: string;
    items: RSSItem[];
}

export async function fetchRSSFeed(url: string): Promise<RSSFeedData> {
    try {
        const feed = await parser.parseURL(url);
        return feed as RSSFeedData;
    } catch (error) {
        console.error("RSS Fetch Error:", error);
        throw new Error(`Failed to fetch RSS feed from ${url}`);
    }
}

export function extractImageFromContent(content: string): string | null {
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const match = imgRegex.exec(content);
    return match ? match[1] : null;
}
