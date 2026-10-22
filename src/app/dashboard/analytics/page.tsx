"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";

const data = [
    { name: "Mon", reach: 4000, revenue: 2400 },
    { name: "Tue", reach: 3000, revenue: 1398 },
    { name: "Wed", reach: 2000, revenue: 9800 },
    { name: "Thu", reach: 2780, revenue: 3908 },
    { name: "Fri", reach: 1890, revenue: 4800 },
    { name: "Sat", reach: 2390, revenue: 3800 },
    { name: "Sun", reach: 3490, revenue: 4300 },
];

const nicheData = [
    { name: "Politics", revenue: 4000, engagement: 2400 },
    { name: "Finance", revenue: 3000, engagement: 1398 },
    { name: "Sports", revenue: 2000, engagement: 9800 },
    { name: "Drama", revenue: 2780, engagement: 3908 },
    { name: "Tech", revenue: 1890, engagement: 4800 },
];

export default function AnalyticsPage() {
    return (
        <div className="p-8 space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Reach & Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3bdbf7" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3bdbf7" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f7184f" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#f7184f" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="reach" stroke="#3bdbf7" fillOpacity={1} fill="url(#colorReach)" />
                                <Area type="monotone" dataKey="revenue" stroke="#f7184f" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Niche Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={nicheData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="revenue" fill="#f7184f" name="Revenue ($)" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="engagement" fill="#3bdbf7" name="Engagement" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
