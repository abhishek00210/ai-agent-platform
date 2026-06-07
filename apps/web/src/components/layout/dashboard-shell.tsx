"use client";

import {
  Activity,
  BarChart3,
  Bot,
  CreditCard,
  LayoutDashboard,
  Menu,
  Moon,
  PhoneCall,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from "@ai-agent-platform/ui";
import { useAppStore } from "@/store/app-store";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/voice", label: "Voice", icon: PhoneCall },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <div className="min-h-svh bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-zinc-200 bg-white transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-950 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5 dark:border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-600 text-white">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">AI Agent Platform</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                Voice operations
              </span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
                  active && "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200",
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="lg:pl-72">
        <TopNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function TopNav() {
  const { setSidebarOpen } = useAppStore();
  const { theme, setTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Open sidebar</span>
        </Button>
        <div>
          <p className="text-sm font-semibold">Operations dashboard</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Local development environment</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setTheme(nextTheme)}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-3 px-2">
              <Avatar>
                <AvatarFallback>AP</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">Platform Admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-50 min-w-48 rounded-md border border-zinc-200 bg-white p-1 text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-zinc-500">
              Signed in as admin
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <DropdownMenuItem className="cursor-pointer rounded px-2 py-1.5 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-900">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded px-2 py-1.5 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-900">
              Workspace
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded px-2 py-1.5 outline-none hover:bg-zinc-100 dark:hover:bg-zinc-900">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
