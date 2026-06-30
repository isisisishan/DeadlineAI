"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useFocus } from "@/context/focus-context";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X, 
  Zap,
  Timer,
  BarChart,
  LineChart,
  Settings,
  Search,
  Bell,
  ChevronUp,
  Sparkles
} from "lucide-react";
import { GlobalLyra } from "./global-lyra";

interface NavShellProps {
  children: React.ReactNode;
}

export const NavShell: React.FC<NavShellProps> = ({ children }) => {
  const { user, logout, isMockMode } = useAuth();
  const { isFocusMode, activeTab, setActiveTab, setIsLyraOpen } = useFocus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) {
    return <>{children}</>;
  }

  // If in Focus Mode, render children full-screen without sidebar/headers
  if (isFocusMode) {
    return (
      <main className="flex-1 w-full min-h-screen dashboard-glass-theme flex flex-col justify-center items-center p-4 transition-all duration-500">
        {children}
      </main>
    );
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "My Tasks", icon: CheckSquare },
    { id: "calendar", label: "Calendar", icon: CalendarIcon },
    { id: "planner", label: "AI Planner", icon: Zap },
    { id: "timer", label: "Focus Timer", icon: Timer },
    { id: "analytics", label: "Analytics", icon: LineChart },
    { id: "chat", label: "AI Coach", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex min-h-screen dashboard-glass-theme text-snow font-sans selection:bg-current/30 p-0 md:p-3 lg:p-4 items-center justify-center">
      {/* Outer App Container */}
      <div className="flex w-full max-w-[1600px] bg-white rounded-none md:rounded-[20px] overflow-hidden shadow-2xl border border-[#D2DCD6] h-[100vh] md:h-[calc(100vh-2rem)]">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-[260px] z-30 shrink-0 relative bg-[#111827]">
        {/* Subtle right border */}
        <div className="absolute top-0 right-0 bottom-0 w-px bg-white/[0.05]" />

        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-6 pt-8 pb-8 select-none">
          <div className="p-2 bg-gradient-to-tr from-[#10B981] to-[#06B6D4] rounded-[10px] shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
            <Zap className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-bold text-[16px] tracking-tight text-white">Deadline<span className="text-[#10B981]">AI</span></span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 flex flex-col gap-2 px-3 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all duration-200 border-l-[3px] ${
                  isActive 
                    ? "border-[#10B981] bg-[#10B981]/15 text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                    : "border-transparent text-[#9CA3AF] bg-transparent hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon 
                  className={`h-[22px] w-[22px] transition-colors ${isActive ? "text-[#10B981]" : "text-[#6B7280]"}`} 
                  fill={isActive ? "currentColor" : "none"} 
                  strokeWidth={isActive ? 1.8 : 2}
                />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom User Section */}
        <div className="mt-auto px-4 pb-5">
          {/* Thin divider */}
          <div className="h-px bg-white/[0.08] mb-4" />



          {/* Ask Lyra Button */}
          <button 
            onClick={() => setIsLyraOpen(true)}
            className="mb-4 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium text-sm py-3 px-4 rounded-xl shadow-md shadow-emerald-900/10 transition-all duration-200 group active:scale-95 w-full"
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse group-hover:rotate-12 transition-transform" />
            <span>Ask Lyra</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200"></span>
            </span>
          </button>
          
          {/* User Profile */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-white/[0.06] cursor-pointer transition-all duration-200">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "Avatar"} 
                className="h-9 w-9 rounded-full border border-white/10 shadow-sm"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#10B981] to-[#06B6D4] flex items-center justify-center font-medium text-white text-sm shadow-sm">
                {user.displayName?.[0] || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate text-white">{user.displayName === "Hackathon Demo User" ? "Workspace Admin" : (user.displayName || "Workspace Admin")}</p>
              <p className="text-[11px] text-white/40 font-normal">Productivity Explorer</p>
            </div>
            <ChevronUp className="h-4 w-4 text-white/30" />
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 mt-1 rounded-[12px] text-[13px] font-medium text-white/40 hover:bg-white/[0.06] hover:text-rose-400 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative min-w-0 h-full overflow-hidden bg-[#F8FAFC]">
          {/* Top Header - Desktop */}
          <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-[#D2DCD6] bg-white/80 backdrop-blur-md z-20 shrink-0">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-xl font-bold text-snow tracking-tight">
                {activeTab === "dashboard" ? "Overview" : 
                 activeTab === "tasks" ? "My Tasks" :
                 activeTab === "calendar" ? "Calendar" :
                 activeTab === "planner" ? "AI Planner" :
                 activeTab === "timer" ? "Focus Session" :
                 activeTab === "progress" ? "Progress" :
                 activeTab === "analytics" ? "Analytics" :
                 activeTab === "chat" ? "AI Coach" : "Settings"}
              </h1>
              
              <div className="hidden lg:flex items-center bg-[#F8FAFC] border border-[#E5E7EB] shadow-[0_2px_4px_rgba(0,0,0,0.02)] rounded-[14px] px-3 h-[42px] w-64 focus-within:ring-2 focus-within:ring-[#10B981]/20 focus-within:border-[#10B981]/40 transition-all">
                <Search className="h-4 w-4 text-[#9CA3AF] mr-2" />
                <input 
                  type="text"
                  placeholder="Search tasks, events..."
                  className="bg-transparent border-none outline-none text-[14px] w-full text-[#111827] placeholder-[#9CA3AF] font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-5 relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-black transition-colors"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
              </button>

              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)} 
                  />
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                      <h4 className="font-semibold text-sm">Notifications</h4>
                      <span className="text-xs text-cyan-500 font-medium cursor-pointer hover:text-cyan-600 transition-colors">Mark all read</span>
                    </div>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {/* Eye-Catching Hackathon Notifications */}
                      <div className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg text-xs cursor-pointer transition-colors">
                        <p className="font-medium text-slate-900 dark:text-white">🚀 Model Optimization Complete</p>
                        <p className="text-slate-500 mt-0.5">Your e-waste classification model finished training with 94% accuracy.</p>
                      </div>
                      <div className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg text-xs cursor-pointer transition-colors">
                        <p className="font-medium text-slate-900 dark:text-white">📅 Schedule Optimized</p>
                        <p className="text-slate-500 mt-0.5">AI Coach shifted your Deep Work block to bypass peak network traffic windows.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </header>

        {/* Top Mobile Bar */}
        <div className="md:hidden flex items-center justify-between w-full h-16 px-4 z-40 fixed top-0 left-0 bg-[#111827]">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#10B981]" />
            <span className="font-bold text-[15px] text-white">Deadline<span className="text-emerald-400">AI</span></span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white/60 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30 pt-16 flex flex-col p-5 bg-[#111827]">
            <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.05] shadow-sm">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="h-10 w-10 rounded-full border border-white/10" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#06B6D4] flex items-center justify-center font-medium text-white border border-white/10">
                  {user.displayName?.[0] || "U"}
                </div>
              )}
              <div>
                <p className="text-[14px] font-semibold text-white">{user.displayName === "Hackathon Demo User" ? "Workspace Admin" : (user.displayName || "Workspace Admin")}</p>
                <p className="text-[12px] text-white/40">Productivity Explorer</p>
              </div>
            </div>

            {/* Ask Lyra Button Mobile */}
            <button 
              onClick={() => { setIsLyraOpen(true); setMobileMenuOpen(false); }}
              className="mb-4 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium text-sm py-3 px-4 rounded-xl shadow-md shadow-emerald-900/10 transition-all duration-200 group active:scale-95 w-full"
            >
              <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse group-hover:rotate-12 transition-transform" />
              <span>Ask Lyra</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200"></span>
              </span>
            </button>

            <nav className="flex-1 flex flex-col gap-1 mt-2 px-2 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all duration-200 border-l-[3px] ${
                      isActive 
                        ? "border-[#10B981] bg-[#10B981]/15 text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                        : "border-transparent text-[#9CA3AF] bg-transparent hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <Icon 
                      className={`h-[22px] w-[22px] transition-colors ${isActive ? "text-[#10B981]" : "text-[#6B7280]"}`} 
                      fill={isActive ? "currentColor" : "none"}
                      strokeWidth={isActive ? 1.8 : 2}
                    />
                    <span className="font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 mt-4 rounded-[12px] text-[14px] font-medium text-white/40 hover:bg-white/[0.06] hover:text-rose-400 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}

          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <GlobalLyra />
            {children}
          </div>
      </main>
      </div>
      
      {/* Global Dashboard Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.15);
        }
      `}} />
    </div>
  );
};
