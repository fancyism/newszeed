import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export interface ContentGenerationResult {
    headline: string;
    content: string;
    summary: string;
    tags: string[];
    category: string;
    nicheScore: number;
}

export async function generateNewsContent(
    sourceText: string,
    context?: string
): Promise<ContentGenerationResult> {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    Role: Expert Social Media News Editor for "Newszeed" (Thailand).
    Task: Rewrite and summarize the provided news source into a highly engaging, viral-worthy Facebook post.
    Target Audience: Thai social media users (mass audience).
    Language: Thai (Natural, engaging, not stiff).

    Source Text:
    "${sourceText.substring(0, 15000)}"

    Context/Instructions:
    ${context || "Normalize the tone to be interesting but factual. Use bullet points for key details."}

    Guidelines:
    1. **Headline**: Must be click-worthy but not clickbait. Use 1-2 relevant emojis.
    2. **Hook**: The first paragraph must grab attention immediately.
    3. **Content**: 
       - Break long text into short paragraphs.
       - Use bullet points (•) for lists/details.
       - Use formatting to highlight key numbers or names.
    4. **Tone**: Informative, fast-paced, "เล่าข่าว" style (storytelling).
    5. **Hashtags**: Include 3-5 relevant trending hashtags at the end.
    6. **Summary**: A distinct 1-sentence summary for internal use.

    Output Format (Strict JSON):
    {
      "headline": "Headline here 🚨",
      "content": "Full post content...",
      "summary": "Short internal summary...",
      "tags": ["tag1", "tag2"],
      "category": "One of: Politics, Finance, Sports, Entertinment, Technology, Social, General",
      "nicheScore": 1-10
    }
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanText) as ContentGenerationResult;
    } catch (error) {
        console.error("Gemini generation error:", error);
        throw new Error("Failed to generate content");
    }
}
