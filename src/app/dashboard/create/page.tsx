"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wand2, Rss, Link as LinkIcon, FileText, Send } from "lucide-react";
import axios from "axios";

export default function CreatePostPage() {
    const [activeTab, setActiveTab] = useState("manual");
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");
    const [headline, setHeadline] = useState("");
    const [rssUrl, setRssUrl] = useState("");
    const [generatedResult, setGeneratedResult] = useState<any>(null);

    const handleGenerate = async () => {
        if (!content) return;
        setLoading(true);
        try {
            const res = await axios.post("/api/content/generate", {
                sourceText: content,
                context: "Summarize for Facebook news feed, engaging and informative style.",
            });
            setGeneratedResult(res.data);
        } catch (error) {
            console.error("Generation failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchRSS = async () => {
        if (!rssUrl) return;
        setLoading(true);
        try {
            const res = await axios.get(`/api/rss/fetch?url=${encodeURIComponent(rssUrl)}`);
            // For demo, just take the first item's content
            if (res.data.items && res.data.items.length > 0) {
                const item = res.data.items[0];
                setContent(`${item.title}\n\n${item.contentSnippet || item.content}`);
            }
        } catch (error) {
            console.error("RSS fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Create New Post</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Input Source */}
                <div className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="manual">
                                <FileText className="w-4 h-4 mr-2" /> Manual / Paste
                            </TabsTrigger>
                            <TabsTrigger value="rss">
                                <Rss className="w-4 h-4 mr-2" /> RSS Feed
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="manual">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Source Content</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Paste News Text or Notes</Label>
                                        <Textarea
                                            placeholder="Paste your news content here..."
                                            className="min-h-[300px]"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white"
                                        onClick={handleGenerate}
                                        disabled={loading || !content}
                                    >
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                        Generate with AI
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="rss">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Fetch from RSS</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>RSS Feed URL</Label>
                                        <div className="flex space-x-2">
                                            <Input
                                                placeholder="https://example.com/feed.xml"
                                                value={rssUrl}
                                                onChange={(e) => setRssUrl(e.target.value)}
                                            />
                                            <Button variant="outline" onClick={handleFetchRSS} disabled={loading}>
                                                <LinkIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    {content && (
                                        <div className="space-y-2">
                                            <Label>Preview Content</Label>
                                            <Textarea
                                                value={content}
                                                readOnly
                                                className="min-h-[200px] bg-muted"
                                            />
                                            <Button
                                                className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white"
                                                onClick={handleGenerate}
                                                disabled={loading}
                                            >
                                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                                Generate with AI
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: AI Output */}
                <div className="space-y-6">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>AI Generated Result</span>
                                {generatedResult && <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Ready</span>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                            {generatedResult ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Headline</Label>
                                        <Input value={generatedResult.headline} readOnly className="font-bold text-lg" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Content</Label>
                                        <Textarea
                                            value={generatedResult.content}
                                            readOnly
                                            className="min-h-[200px] font-sans text-base leading-relaxed"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Category / Tags</Label>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                                {generatedResult.category}
                                            </span>
                                            {generatedResult.tags?.map((tag: string) => (
                                                <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex space-x-2">
                                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                                            <Send className="mr-2 h-4 w-4" /> Publish Now
                                        </Button>
                                        <Button variant="outline" className="flex-1">
                                            Save Draft
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 min-h-[300px]">
                                    <Wand2 className="h-12 w-12 opacity-20" />
                                    <p>Content will appear here after generation</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
