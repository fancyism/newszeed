"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { FB_SCOPES, getFacebookPages } from "@/lib/facebook/api";
import { Loader2, Facebook, Check, Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// NOTE: Ideally this comes from your database utility
import { savePageConnection } from "@/app/actions/facebook";

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [pages, setPages] = useState<any[]>([]);
    const [connectedPages, setConnectedPages] = useState<any[]>([]);
    const [error, setError] = useState("");
    const supabase = createClient();

    const handleConnectFacebook = async () => {
        setLoading(true);
        setError("");
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "facebook",
                options: {
                    scopes: FB_SCOPES,
                    redirectTo: `${window.location.origin}/dashboard/settings?connected=true`,
                },
            });
            if (error) throw error;
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    };

    // Check for session and provider token on mount
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.provider_token) {
                setLoading(true);
                try {
                    const fbPages = await getFacebookPages(session.provider_token);
                    setPages(fbPages);
                } catch (e) {
                    console.error(e);
                    setError("Failed to fetch Facebook pages. Try reconnecting.");
                } finally {
                    setLoading(false);
                }
            }
        };

        checkSession();
    }, []);

    const handleSavePage = async (page: any) => {
        // This would call a Server Action or API to save to DB
        // await savePageConnection(page);
        setConnectedPages([...connectedPages, page.id]);
        alert(`Connected to ${page.name}`);
    };

    return (
        <div className="p-8 max-w-4xl space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your integrations and preferences.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Facebook Integration</CardTitle>
                    <CardDescription>Connect your Facebook Pages to enable auto-posting.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {!pages.length ? (
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900">
                            <div className="bg-blue-100 p-4 rounded-full mb-4">
                                <Facebook className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Connect Facebook Account</h3>
                            <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                                We need permission to manage posts on your pages.
                                Please grant all requested permissions.
                            </p>
                            <Button onClick={handleConnectFacebook} disabled={loading} className="bg-[#1877F2] hover:bg-[#166fe5]">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Facebook className="mr-2 h-4 w-4" />}
                                Connect with Facebook
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Available Pages</h3>
                            <div className="grid gap-4">
                                {pages.map((page) => {
                                    const isConnected = connectedPages.includes(page.id);
                                    return (
                                        <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-zinc-950">
                                            <div className="flex items-center space-x-4">
                                                <Avatar>
                                                    <AvatarImage src={page.picture?.data?.url} />
                                                    <AvatarFallback>{page.name.substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{page.name}</p>
                                                    <p className="text-xs text-muted-foreground">ID: {page.id}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant={isConnected ? "outline" : "default"}
                                                size="sm"
                                                onClick={() => handleSavePage(page)}
                                                disabled={isConnected}
                                                className={isConnected ? "text-green-600 border-green-200 bg-green-50" : ""}
                                            >
                                                {isConnected ? (
                                                    <><Check className="mr-2 h-4 w-4" /> Connected</>
                                                ) : (
                                                    <><Plus className="mr-2 h-4 w-4" /> Connect Page</>
                                                )}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleConnectFacebook} className="text-muted-foreground">
                                Reconnect / Refresh Pages
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
