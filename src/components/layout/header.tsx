import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Header() {
    return (
        <div className="border-b h-16 flex items-center px-8 justify-between bg-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-x-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Dashboard
                </h2>
            </div>
            <div className="flex items-center gap-x-4">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Feedback
                </Button>
                <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-800" />
                <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>NZ</AvatarFallback>
                </Avatar>
            </div>
        </div>
    );
}
