"use client";
import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard, AlertTriangle, FileCode2, GitCompare, History, LogOut, FolderGit2, ActivitySquare } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { motion } from "framer-motion";

import Image from "next/image";

function SidebarNav() {
  const searchParams = useSearchParams();
  const repo = searchParams.get("repo") || "";
  const currentTab = searchParams.get("tab") || "overview";

  const navItems = [
    { icon: FolderGit2, label: "Repositories", href: "/app/repositories", isTab: false },
    { icon: ActivitySquare, label: "Analyses", href: "/app/analyses", isTab: false },
    { icon: LayoutDashboard, label: "Overview", tab: "overview", isTab: true },
    { icon: AlertTriangle, label: "Conflicts", tab: "conflicts", isTab: true },
    { icon: FileCode2, label: "Files", tab: "files", isTab: true },
    { icon: GitCompare, label: "Diff", tab: "diff", isTab: true },
    { icon: History, label: "Commits", tab: "commits", isTab: true },
  ];

  return (
    <aside className="w-16 border-r border-white/[0.05] flex flex-col items-center py-6 bg-background/50 backdrop-blur-xl z-20 shadow-2xl shadow-black/50">
      <div className="w-10 h-10 mb-8 rounded-xl shadow-lg shadow-white/10 overflow-hidden bg-white flex items-center justify-center">
        <Image src="/logo.png" alt="MCP Logo" width={40} height={40} className="object-cover" />
      </div>
      
      <nav className="flex-1 flex flex-col items-center space-y-4 w-full">
        {navItems.map((item, i) => {
          if (item.isTab && !repo) return null; // Don't show tabs if no repo selected
          
          const isActive = item.isTab ? currentTab === item.tab : false;
          const href = item.isTab ? `/app?provider=github&owner=${searchParams.get("owner")}&repo=${encodeURIComponent(repo)}&tab=${item.tab}` : item.href!;
          const Icon = item.icon;
          return (
            <Link
              key={i}
              href={href}
              className="relative group w-full flex justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-xl transition-colors relative z-10",
                  isActive ? "bg-accent/20 text-accent border border-accent/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]" : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 stroke-[1.5]" />
              </motion.div>
              
              {/* Tooltip */}
              <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-card border border-white/10 text-foreground text-xs px-3 py-1.5 rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-50 font-mono tracking-wider">
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center space-y-4 w-full">
        <button onClick={() => signOut({ callbackUrl: '/' })} className="relative group w-full flex justify-center">
          <motion.div
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5 stroke-[1.5]" />
          </motion.div>
          <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-card border border-red-500/20 text-red-500 text-xs px-3 py-1.5 rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-50 font-mono tracking-wider">
            Log Out
          </div>
        </button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans relative">
      <Suspense fallback={<aside className="w-16 border-r border-white/[0.05] bg-background/50 z-20" />}>
        <SidebarNav />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Glowing Radial Gradient */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent/5 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none z-0" />
        
        {/* Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
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
