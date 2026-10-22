"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit2, Trash2, Eye } from "lucide-react";

// Mock data
const posts = [
    {
        id: "1",
        headline: "Breaking: Bitcoin hits $100k!",
        category: "Finance",
        status: "PUBLISHED",
        reach: 15200,
        generatedAt: "2024-03-20T10:00:00Z",
    },
    {
        id: "2",
        headline: "New Liverpool signing confirmed",
        category: "Sports",
        status: "SCHEDULED",
        reach: 0,
        generatedAt: "2024-03-21T09:00:00Z",
    },
    {
        id: "3",
        headline: "PM announces new holiday",
        category: "Politics",
        status: "DRAFT",
        reach: 0,
        generatedAt: "2024-03-21T11:00:00Z",
    },
];

export default function PostsPage() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">All Posts (3)</h2>
                <Button>Export CSV</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Posts</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Headline</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Reach</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.map((post) => (
                                <TableRow key={post.id}>
                                    <TableCell className="font-medium">{post.headline}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{post.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={post.status === 'PUBLISHED' ? 'default' : post.status === 'SCHEDULED' ? 'secondary' : 'outline'}
                                            className={post.status === 'PUBLISHED' ? 'bg-green-500 hover:bg-green-600' : ''}
                                        >
                                            {post.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{post.reach.toLocaleString()}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
