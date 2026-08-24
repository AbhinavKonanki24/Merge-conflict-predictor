"use client";

import { usePathname } from "next/navigation";
import { LayoutDashboard, AlertTriangle, FileCode2, GitCompare, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: AlertTriangle, label: "Conflicts", href: "#" },
  { icon: FileCode2, label: "Files", href: "#" },
  { icon: GitCompare, label: "Diff", href: "#" },
  { icon: History, label: "Commits", href: "#" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Narrow Sidebar */}
      <aside className="w-16 border-r border-border flex flex-col items-center py-6 bg-background z-20">
        <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center font-mono font-bold text-lg mb-8">
          M
        </div>
        
        <nav className="flex-1 flex flex-col items-center space-y-4 w-full">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={i}
                href={item.href}
                className={cn(
                  "w-10 h-10 flex items-center justify-center transition-colors relative group",
                  isActive ? "bg-foreground text-background rounded-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 stroke-[1.5]" />
                
                {/* Tooltip */}
                <div className="absolute left-14 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 font-mono">
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center space-y-4 w-full">
          <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors group relative">
            <Settings className="w-5 h-5 stroke-[1.5]" />
            <div className="absolute left-14 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 font-mono">
              Settings
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none z-0" 
          style={{
            backgroundImage: `
              linear-gradient(to right, #ffffff 1px, transparent 1px),
              linear-gradient(to bottom, #ffffff 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px'
          }}
        />
        {children}
      </div>
    </div>
  );
}
