import { NextResponse } from "next/server";
import { generateNewsContent } from "@/lib/ai/gemini";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sourceText, context } = body;

        if (!sourceText) {
            return NextResponse.json(
                { error: "Source text is required" },
                { status: 400 }
            );
        }

        const result = await generateNewsContent(sourceText, context);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Content API Error:", error);
        return NextResponse.json(
            { error: "Failed to generate content" },
            { status: 500 }
        );
    }
}
