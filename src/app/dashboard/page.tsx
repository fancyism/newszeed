import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, Users, DollarSign, Activity } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <div className="flex items-center space-x-2">
          {/* Calendar Date Picker could go here */}
        </div>
      </div>

      {/* Queues & Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Posts
            </CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">
              +14% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Reach
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+24.5k</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue (Est.)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,234.56</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Now
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 Posts</div>
            <p className="text-xs text-muted-foreground">
              Waiting in queue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for recent posts list */}
              <div className="text-sm text-muted-foreground text-center py-10">
                No recent activity.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/dashboard/create"
              className="block w-full p-4 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition flex items-center"
            >
              <span className="font-semibold">✍️ Manual Post</span>
              <span className="ml-auto text-muted-foreground">→</span>
            </Link>
            <Link
              href="/dashboard/create?mode=ai"
              className="block w-full p-4 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition flex items-center"
            >
              <span className="font-semibold">🤖 Generate with AI</span>
              <span className="ml-auto text-muted-foreground">→</span>
            </Link>
            <Link
              href="/dashboard/schedule"
              className="block w-full p-4 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition flex items-center"
            >
              <span className="font-semibold">📅 Check Schedule</span>
              <span className="ml-auto text-muted-foreground">→</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
