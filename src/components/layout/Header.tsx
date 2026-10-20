"use client";
import React from 'react';
import {
  Wifi,
  WifiOff,
  User,
  ChevronRight,
  Bell,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  // Mock state for connection status
  const isOnline = true;

  return (
    <header className="h-16 border-b bg-background sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Breadcrumbs / Title */}
        <div className="flex items-center text-sm text-muted-foreground">
          <span className="hover:text-foreground cursor-pointer transition-colors">App</span>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-foreground font-medium">Dashboard</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search (Optional but common in shells) */}
        <div className="hidden md:flex items-center relative">
          <Search size={16} className="absolute left-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-1.5 text-sm border rounded-md bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
          />
        </div>

        {/* Connection Status */}
        <div className={cn(
          "flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium transition-colors",
          isOnline
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        )}>
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Notifications */}
        <button className="p-2 text-muted-foreground hover:text-foreground relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none">Admin User</p>
            <p className="text-xs text-muted-foreground mt-1">Network Admin</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
