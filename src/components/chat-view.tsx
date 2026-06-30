"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useFocus } from "@/context/focus-context";
import { dbService, ChatMessage, Task } from "@/lib/db";
import { 
  Zap, 
  Send, 
  Trash2, 
  Bot, 
  User, 
  Sparkles, 
  Search,
  Bell,
  CheckCheck,
  Mic
} from "lucide-react";
export const ChatView: React.FC = () => {
  const { user } = useAuth();
  const { isLyraOpen, setIsLyraOpen } = useFocus();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  const startInlineCoachDictation = () => {
    if (isDictating) return;
    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechClass) return;

    const inlineRec = new SpeechClass();
    inlineRec.continuous = false;
    inlineRec.interimResults = false;

    inlineRec.onstart = () => setIsDictating(true);
    inlineRec.onend = () => setIsDictating(false);
    inlineRec.onerror = () => setIsDictating(false);

    inlineRec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInputText((prev) => prev ? `${prev} ${text}` : text);
    };

    inlineRec.start();
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history & focus task
  const loadData = async () => {
    if (!user) return;
    try {
      const history = await dbService.getChatHistory(user.uid);
      setMessages(history.length > 0 ? history : [
        {
          role: "model",
          content: "Hello! I am your DeadlineAI Coach. I don't just send notifications; I help you plan, prioritize, and debug your procrastination habits. What task is currently stressing you out?",
          timestamp: new Date().toISOString()
        }
      ]);

      const tasks = await dbService.getTasks(user.uid);
      const pending = tasks.filter(t => t.status === "pending").sort((a, b) => a.priority - b.priority);
      if (pending.length > 0) {
        setFocusTask(pending[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send Message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !user) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    setLoading(true);

    try {
      // Call Gemini Coach route
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          currentFocusTask: focusTask
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "API responded with an error");
      }

      const modelMsg: ChatMessage = {
        role: "model",
        content: data.reply || "Sorry, I couldn't process that properly. Could you rephrase?",
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, modelMsg];
      setMessages(finalMessages);
      
      // Save to database
      await dbService.saveChatHistory(user.uid, finalMessages);
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          content: "Failed to connect to the Gemini Coach. Please check your internet connection and try again.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Clear History
  const handleClearHistory = async () => {
    if (!user) return;
    await dbService.clearChatHistory(user.uid);
    setMessages([
      {
        role: "model",
        content: "Chat history cleared. How can I help you optimize your workload today?",
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const suggestedPrompts = [
    { text: "Plan my week", label: "📅 Plan my week", bg: "bg-blue-50", border: "border-blue-100", text_color: "text-blue-600", hover: "hover:border-blue-300 hover:text-blue-700" },
    { text: "Break my task into steps", label: "🎯 Break my task into steps", bg: "bg-emerald-50", border: "border-emerald-100", text_color: "text-emerald-600", hover: "hover:border-emerald-300 hover:text-emerald-700" },
    { text: "Help me beat procrastination", label: "🔥 Beat procrastination", bg: "bg-orange-50", border: "border-orange-100", text_color: "text-orange-600", hover: "hover:border-orange-300 hover:text-orange-700" },
    { text: "Create a study schedule", label: "📚 Create a study schedule", bg: "bg-violet-50", border: "border-violet-100", text_color: "text-violet-600", hover: "hover:border-violet-300 hover:text-violet-700" },
    { text: "Suggest productivity hacks", label: "⚡ Productivity hacks", bg: "bg-amber-50", border: "border-amber-100", text_color: "text-amber-600", hover: "hover:border-amber-300 hover:text-amber-700" },
    { text: "Plan my evening routine", label: "🌙 Evening routine", bg: "bg-cyan-50", border: "border-cyan-100", text_color: "text-cyan-600", hover: "hover:border-cyan-300 hover:text-cyan-700" }
  ];

  const isWelcomeState = messages.length === 1 && messages[0].content.includes("Hello! I am your DeadlineAI Coach");

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-screen w-full max-w-[1200px] mx-auto py-6 px-4 md:py-10 md:px-8 overflow-hidden bg-[#F3F6FA]" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <div className="flex flex-col flex-1 min-h-0 bg-white border border-[#E5E7EB] rounded-[22px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Top Header matching reference */}
        <div className="shrink-0 flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white z-10">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-bold text-gray-900">AI Coach</span>
            <Sparkles className="h-4 w-4 text-blue-400" />
          </div>
          
          <div className="flex-1 max-w-md mx-8">
            <div className="relative flex items-center w-full">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search tasks, events..." 
                className="w-full bg-gray-50 border border-gray-100 rounded-full py-2 pl-9 pr-4 text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setMessages([]);
                if (user) dbService.clearChatHistory(user.uid);
              }}
              className="text-xs bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Chat
            </button>
            <button className="p-2 bg-gray-50 border border-gray-100 rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 pb-24 space-y-8 bg-white" style={{ scrollBehavior: 'smooth' }}>
          
          {/* Hero Content aligned exactly like the image */}
          <div className="flex items-start gap-8 px-8 py-8 animate-in fade-in slide-in-from-top-4 duration-700 ease-out border-b border-gray-50 shrink-0">
              {/* Left: 3D Robot Mascot (simulated with CSS/Lucide) */}
              <div className="hidden md:flex shrink-0">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#E8F2FF] to-[#F3E8FF] opacity-90 shadow-inner" />
                  {/* Orbit rings */}
                  <div className="absolute inset-[-4px] rounded-full border border-purple-300/30 rotate-12" style={{ animation: 'spin 20s linear infinite' }} />
                  <div className="absolute inset-2 rounded-full border border-blue-300/40 -rotate-12" style={{ animation: 'spin 15s linear infinite reverse' }} />
                  
                  {/* Sparkles around mascot */}
                  <Sparkles className="absolute top-2 left-2 h-3 w-3 text-purple-400" />
                  <Sparkles className="absolute top-6 right-2 h-4 w-4 text-yellow-400" />
                  <Zap className="absolute bottom-4 left-4 h-3 w-3 text-blue-400" />

                  {/* Robot face */}
                  <div className="relative bg-[#0F172A] w-16 h-12 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20" style={{ animation: 'bounce 4s ease-in-out infinite' }}>
                    <div className="flex gap-2">
                      <div className="w-3 h-2 bg-teal-400 rounded-full animate-pulse" />
                      <div className="w-3 h-2 bg-teal-400 rounded-full animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 w-4 h-1.5 bg-teal-400 rounded-full opacity-60" />
                  </div>
                </div>
              </div>

              {/* Right: Text and Chips */}
              <div className="flex-1 min-w-0 pt-2">
                <h1 className="text-[28px] font-bold text-gray-900 leading-tight">
                  Hi there! 👋 I&apos;m your <span className="text-emerald-500">AI</span> <span className="text-purple-600">Coach</span>
                </h1>
                <p className="text-[14px] text-gray-600 font-medium mt-1">
                  Powered by <span className="text-blue-600 font-semibold">Gemini ✨</span>
                </p>
                <p className="text-[14px] text-gray-500 mt-3 leading-relaxed max-w-xl">
                  I&apos;m here to help you stay focused, plan smarter, beat procrastination <br/> and build better habits — one step at a time. 💪
                </p>
                
                {/* Suggestion Chips placed directly under the text */}
                <div className="flex flex-wrap gap-2 mt-5">
                  <button 
                    onClick={() => handleSendMessage("Give me some smart guidance.")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] rounded-full text-[12px] font-medium text-emerald-700 transition-transform hover:-translate-y-0.5"
                  >
                    <span className="text-[14px]">🍃</span> Smart Guidance
                  </button>
                  <button 
                    onClick={() => handleSendMessage("I need personalized advice.")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3E8FF] rounded-full text-[12px] font-medium text-purple-700 transition-transform hover:-translate-y-0.5"
                  >
                    <span className="text-[14px]">👤</span> Personalized Advice
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Give me a motivation boost!")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF3E0] rounded-full text-[12px] font-medium text-orange-600 transition-transform hover:-translate-y-0.5"
                  >
                    <span className="text-[14px]">🚀</span> Motivation Boost
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Tell me about your 24/7 support.")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E0F2FE] rounded-full text-[12px] font-medium text-blue-600 transition-transform hover:-translate-y-0.5"
                  >
                    <span className="text-[14px]">🕒</span> 24/7 Support
                  </button>
                </div>
              </div>
            </div>

          {messages.map((msg, index) => {
            const isModel = msg.role === "model";
            const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            return isModel ? (
              /* ── AI Message ── */
              <div key={index} className="flex items-start gap-4 max-w-[85%] mr-auto animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both" style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}>
                {/* Avatar matching reference */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-[#F3E8FF] flex items-center justify-center mt-1">
                  <div className="bg-[#0F172A] w-5 h-4 rounded flex items-center justify-center">
                     <div className="flex gap-0.5">
                       <div className="w-1 h-1 bg-teal-400 rounded-full" />
                       <div className="w-1 h-1 bg-teal-400 rounded-full" />
                     </div>
                  </div>
                </div>
                {/* Card */}
                <div className="flex-1 min-w-0 group">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 text-[14px] text-gray-800 leading-relaxed">
                    {msg.content.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      if (trimmed === '') return <div key={i} className="h-1.5" />;
                      if (trimmed.includes('```')) return <div key={i} className="bg-gray-800 text-gray-200 p-3 rounded-lg my-2 font-mono text-sm overflow-x-auto">{trimmed.replace(/```/g, '')}</div>;
                      if (trimmed.startsWith('#')) {
                        const text = trimmed.replace(/^#+\s*/, '');
                        return <p key={i} className="text-[15px] font-bold text-gray-900 mt-2 mb-1">{text}</p>;
                      }
                      const renderBold = (text: string) => {
                        if (!text.includes('**')) return text;
                        const parts = text.split('**');
                        return parts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} className="text-gray-900 font-semibold">{part}</strong> : <span key={idx}>{part}</span>);
                      };
                      if (trimmed.match(/^(\d+)[.)]\s+(.*)/)) {
                        const numMatch = trimmed.match(/^(\d+)[.)]\s+(.*)/);
                        return (
                          <div key={i} className="flex items-start gap-2 mb-1.5">
                            <span className="shrink-0 text-emerald-600 font-medium">{numMatch![1]}.</span>
                            <p className="flex-1">{renderBold(numMatch![2])}</p>
                          </div>
                        );
                      }
                      if (trimmed.startsWith('-') || (trimmed.startsWith('*') && !trimmed.startsWith('**'))) {
                        const text = trimmed.replace(/^[-*]\s*/, '');
                        return (
                          <div key={i} className="flex items-start gap-2 mb-1.5">
                            <span className="shrink-0 text-emerald-500 mt-1">•</span>
                            <p className="flex-1">{renderBold(text)}</p>
                          </div>
                        );
                      }
                      if (/^[✅☑✓]/.test(trimmed)) {
                        return (
                          <div key={i} className="flex items-start gap-2 mb-1.5">
                            <span className="shrink-0 text-emerald-500 bg-emerald-100 rounded text-[10px] p-0.5 mt-0.5">✓</span>
                            <p className="flex-1">{renderBold(trimmed.replace(/^[✅☑✓]\s*/, ''))}</p>
                          </div>
                        );
                      }
                      return <p key={i} className="mb-1.5 last:mb-0">{renderBold(trimmed)}</p>;
                    })}
                    <div className="text-[11px] text-gray-400 mt-2">{time}</div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── User Message ── */
              <div key={index} className="flex flex-col items-end max-w-[75%] ml-auto animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both" style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}>
                <div className="bg-[#E8F5E9] rounded-2xl rounded-tr-sm px-4 py-3 text-[14px] text-gray-800 leading-relaxed cursor-default inline-block">
                  {msg.content}
                  <div className="text-[11px] text-emerald-700 mt-2 flex items-center gap-1 justify-end">
                    {time} <CheckCheck className="h-3 w-3" />
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex items-start gap-4 max-w-[85%] mr-auto animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[#F3E8FF] flex items-center justify-center mt-1">
                  <div className="bg-[#0F172A] w-5 h-4 rounded flex items-center justify-center">
                     <div className="flex gap-0.5">
                       <div className="w-1 h-1 bg-teal-400 rounded-full" />
                       <div className="w-1 h-1 bg-teal-400 rounded-full" />
                     </div>
                  </div>
                </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-[14px] text-gray-400 flex items-center gap-2">
                <span className="animate-pulse">
                  Typing
                </span>
                <span className="flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

      {/* Bottom Input Area matching reference */}
      <div className="shrink-0 px-8 py-6 bg-white border-t border-transparent relative z-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          
          {/* Contextual Quick-Action Suggestion Chips */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => handleSendMessage("Break down my current task into smaller steps.")}
              disabled={loading}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-[12px] font-medium text-gray-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>⚡</span> Break Down a Task
            </button>
            <button 
              onClick={() => handleSendMessage("I am procrastinating. Help me get started.")}
              disabled={loading}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-[12px] font-medium text-gray-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>🚨</span> Procrastination Rescue
            </button>
            <button 
              onClick={() => handleSendMessage("Let's do a daily audit sync.")}
              disabled={loading}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-[12px] font-medium text-gray-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>📅</span> Daily Audit Sync
            </button>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex items-center bg-gray-50/80 border border-gray-100 rounded-2xl p-2 pl-4 transition-all duration-300 focus-within:bg-white focus-within:shadow-[0_2px_15px_rgba(0,0,0,0.05)] focus-within:border-gray-200"
          >
            <div className="relative flex items-center justify-center mr-1">
              {isDictating && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              )}
              <button 
                type="button" 
                onClick={startInlineCoachDictation}
                title="Dictate message"
                className={`relative p-1 transition-colors ${isDictating ? 'text-purple-500' : 'text-slate-400 hover:text-purple-500'}`}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <Sparkles className="h-4 w-4 text-purple-400 shrink-0 mr-3" />
            <input
              type="text"
              value={inputText}
              disabled={loading}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask your AI Coach anything..."
              className="flex-1 py-2 bg-transparent border-none outline-none text-[14px] text-gray-800 placeholder-gray-400 focus:ring-0"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white h-10 w-10 rounded-xl transition-all duration-200 disabled:opacity-40 shrink-0 flex items-center justify-center ml-2"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};
