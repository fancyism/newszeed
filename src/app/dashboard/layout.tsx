import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                <Sidebar />
            </div>
            <main className="md:pl-72 h-full bg-gray-50 dark:bg-gray-950">
                <Header />
                <div className="h-[calc(100%-4rem)] overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
