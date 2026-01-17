"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/home",
    label: "Home",
    icon: Home,
  },
  {
    href: "/earnings",
    label: "Earnings",
    icon: TrendingUp,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-900 pb-safe z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full touch-target",
                "transition-colors",
                isActive
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon className={cn("w-6 h-6 mb-1")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

