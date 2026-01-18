"use client";

import { useEffect, useState } from "react";
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

function BottomNavContent() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-900 pb-safe z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href) ?? false;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full touch-target relative",
                "transition-all duration-200",
                isActive
                  ? "text-[#ff6c9f]"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              {/* Active indicator bar at top */}
              {isActive && (
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-1 bg-gradient-to-r from-[#ff6c9f] to-[#ff3d7a] rounded-b-full transition-all duration-200"
                  style={{ width: '60%' }}
                />
              )}
              
              <Icon 
                className={cn(
                  "w-6 h-6 mb-1 transition-all duration-200",
                  isActive && "drop-shadow-[0_0_8px_rgba(255,108,159,0.6)]"
                )} 
              />
              <span className={cn(
                "text-xs font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomNav() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <BottomNavContent />;
}
