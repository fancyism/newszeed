import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Newspaper,
    Calendar,
    BarChart3,
    Settings,
    LogOut,
    PlusCircle,
} from "lucide-react";

const routes = [
    {
        label: "Overview",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-sky-500",
    },
    {
        label: "Posts",
        icon: Newspaper,
        href: "/dashboard/posts",
        color: "text-violet-500",
    },
    {
        label: "Schedule",
        icon: Calendar,
        href: "/dashboard/schedule",
        color: "text-pink-700",
    },
    {
        label: "Analytics",
        icon: BarChart3,
        href: "/dashboard/analytics",
        color: "text-orange-700",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/dashboard/settings",
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
            <div className="px-3 py-2 flex-1">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <div className="relative w-8 h-8 mr-4 bg-gradient-to-br from-[#f7184f] to-[#3bdbf7] rounded-lg flex items-center justify-center">
                        <span className="font-bold text-white text-xl">N</span>
                    </div>
                    <h1 className="text-2xl font-bold">
                        Newszeed
                    </h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="px-3 py-2">
                <Link
                    href="/dashboard/create"
                    className="bg-gradient-to-r from-[#f7184f] to-[#3bdbf7] text-white w-full rounded-lg p-3 flex items-center justify-center font-bold hover:opacity-90 transition"
                >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Post
                </Link>
            </div>
        </div>
    );
}
