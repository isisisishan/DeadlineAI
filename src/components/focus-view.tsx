"use client";

import React, { useEffect, useState, useRef } from "react";
import { useFocus } from "@/context/focus-context";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Settings,
  CheckCircle2,
  ListTodo,
  Target,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Trash2,
  X
} from "lucide-react";

interface FocusViewProps {
  timeLeft: number;
  setTimeLeft: (val: number | ((prev: number) => number)) => void;
  isActive: boolean;
  setIsActive: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const FocusView: React.FC<FocusViewProps> = ({
  timeLeft,
  setTimeLeft,
  isActive,
  setIsActive
}) => {
  const [mode, setMode] = useState<"pomodoro" | "shortBreak" | "longBreak">("pomodoro");
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const { roadmapTasks, setRoadmapTasks, toggleRoadmapTask, moveRoadmapTask, setTotalXP, adaptiveState, updateTelemetry } = useFocus();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [showCommandMenu, setShowCommandMenu] = useState(false);

  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");

  const [selectedSound, setSelectedSound] = useState('none');
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [chimeEnabled, setChimeEnabled] = useState(true);
  const [customDurations, setCustomDurations] = useState({ pomodoro: 25, shortBreak: 5, longBreak: 15 });
  
  const [streak, setStreak] = useState(0);
  
  useEffect(() => {
    const storedStreak = localStorage.getItem("deadline_ai_streak");
    if (storedStreak) setStreak(parseInt(storedStreak, 10));
  }, []);

  const ambientTracks = [
    { id: 'none', name: '🚫 None / Mute', src: '' },
    { id: 'lofi', name: 'Lo-Fi Focus Beats', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'rain', name: 'Gentle Rain', src: 'https://assets.mixkit.co/active_storage/sfx/2433/2433-84.wav' },
    { id: 'forest', name: 'Nature Forest', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'crickets', name: 'Night Crickets', src: 'https://assets.mixkit.co/active_storage/sfx/1054/1054-84.wav' },
  ];

  // 1. Track-Switching Logic (Independent)
  useEffect(() => {
    // 1. Pause and reset the current active audio stream
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  
    // 2. Abort early if the track selection is explicitly muted
    if (selectedSound === 'none') return;
  
    // 3. Instantiate the fresh selected source line seamlessly
    const track = ambientTracks.find(t => t.id === selectedSound);
    if (track && track.src) {
      audioRef.current = new Audio(track.src);
      audioRef.current.loop = true;
    }
  
    // 4. Play it instantly only if the timer loop is currently active
    if (isActive && soundEnabled) {
      audioRef.current?.play().catch(err => console.log("Audio play blocked", err));
    }
  }, [selectedSound]);
  // Hydrate fallback tasks if global roadmap is empty
  useEffect(() => {
    if (roadmapTasks.length === 0) {
      setRoadmapTasks([
        { id: "fallback-1", title: "Review systems architecture", durationHours: 1, priority: "High", type: "project", checked: false },
        { id: "fallback-2", title: "Deploy initial edge worker", durationHours: 2, priority: "High", type: "project", checked: true },
        { id: "fallback-3", title: "Debug context bindings", durationHours: 1, priority: "Medium", type: "project", checked: false },
        { id: "fallback-4", title: "Write daily reflection", durationHours: 1, priority: "Low", type: "personal", checked: false }
      ]);
    }
  }, []);

  // Hydrate local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem("deadline_ai_sessions");
    if (stored) setSessionsCompleted(parseInt(stored, 10));
  }, []);

  // 2. Timer Pause/Resume Audio Interception
  useEffect(() => {
    // Block Default Auto-Play Overrides if muted
    if (selectedSound === 'none') {
      audioRef.current?.pause();
      return;
    }
    
    if (isActive && soundEnabled) {
      audioRef.current?.play().catch(e => console.log("Audio play blocked by browser:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isActive, soundEnabled, selectedSound]);

  const getBioStatus = () => {
    const hour = new Date().getHours();
    if (hour >= 19) return "🌙 Evening Wind Down — Keep it light";
    return "🔥 Time to lock in";
  };

  // Timer Web Worker Setup
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/focus-timer.worker.ts', import.meta.url));
    }
    
    workerRef.current.onmessage = (e) => {
      const { type, timeLeft: newTimeLeft } = e.data;
      if (type === 'TICK') {
        setTimeLeft(newTimeLeft);
      } else if (type === 'COMPLETE') {
        setTimeLeft(0);
      }
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [setTimeLeft]);

  // Sync worker active state
  useEffect(() => {
    if (isActive) {
      workerRef.current?.postMessage({ command: 'START', value: timeLeft });
    } else {
      workerRef.current?.postMessage({ command: 'PAUSE' });
    }
  }, [isActive]); // Only trigger on isActive changes, timer handles itself via worker

  // Timer Completion Logic Boundary
  useEffect(() => {
    if (isActive && timeLeft === 0) {
      setIsActive(false);
      
      // Completion chime
      if (typeof Audio !== "undefined" && chimeEnabled) {
        const chime = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3");
        chime.play().catch(e => console.log("Chime blocked:", e));
      }

      // Add to focus minutes logged based on the max time of this mode
      updateTelemetry("focusMinutesLogged", p => p + Math.floor(getMaxTime(mode) / 60));
      
      // Auto-increment sessions if it was a pomodoro
      if (mode === "pomodoro") {
        setSessionsCompleted(prev => {
          const next = prev + 1;
          
          // Next.js API Edge Logger
          fetch('/api/focus/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'session_complete',
              sessions: next,
              xpEarned: 25,
              timestamp: new Date().toISOString()
            })
          }).catch(err => console.error("API logging failed:", err));

          return next;
        });
        
        setTotalXP(prev => prev + 25);
        setShowReflectionModal(true);
        
        // Streak Logic: If this is the first completion today, increment streak
        const today = new Date().toISOString().split('T')[0];
        const lastStreakDate = localStorage.getItem("deadline_ai_last_streak_date");
        if (lastStreakDate !== today) {
          localStorage.setItem("deadline_ai_last_streak_date", today);
          setStreak(prev => {
            const next = prev + 1;
            localStorage.setItem("deadline_ai_streak", next.toString());
            updateTelemetry("currentStreak", next);
            return next;
          });
        }
      }
    }
  }, [timeLeft, isActive, mode, setTotalXP, setIsActive, chimeEnabled]);

  const getMaxTime = (m: string) => {
    if (m === "pomodoro") return customDurations.pomodoro * 60;
    if (m === "shortBreak") return customDurations.shortBreak * 60;
    return customDurations.longBreak * 60;
  };

  const toggleTimer = () => {
    if (isActive) {
      updateTelemetry("pauseTriggerCount", p => p + 1);
    }
    setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    if (isActive || (timeLeft > 0 && timeLeft < getMaxTime(mode))) {
      updateTelemetry("abandonedTimerCount", p => p + 1);
    }
    setIsActive(false);
    workerRef.current?.postMessage({ command: 'STOP' });
    setTimeLeft(getMaxTime(mode));
  };

  const switchMode = (newMode: "pomodoro" | "shortBreak" | "longBreak") => {
    if (isActive || (timeLeft > 0 && timeLeft < getMaxTime(mode))) {
      updateTelemetry("abandonedTimerCount", p => p + 1);
    }
    setMode(newMode);
    setIsActive(false);
    workerRef.current?.postMessage({ command: 'STOP' });
    setTimeLeft(getMaxTime(newMode));
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsActive(prev => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        resetTimer();
      } else if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandMenu(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, mode]);

  const handleReflectionSubmit = async () => {
    if (!reflectionText.trim()) {
      setShowReflectionModal(false);
      return;
    }
    
    try {
      await fetch('/api/focus/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reflection',
          text: reflectionText,
          timestamp: new Date().toISOString(),
          mode
        })
      });
    } catch (err) {
      console.error("API logging failed:", err);
    }
    
    setReflectionText("");
    setShowReflectionModal(false);
  };

  // Format time
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // SVG Config
  const maxTime = getMaxTime(mode);
  const progress = ((maxTime - timeLeft) / maxTime) * 100;
  const radius = 140;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Dual-Panel Filtering Logic (Master Inbox vs Today Focus)
  const cardATasks = roadmapTasks.filter(t => t.list === "todo" || !t.list);
  const cardBTasks = roadmapTasks.filter(t => t.list === "today");

  const handleAddA = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputA.trim()) {
      setRoadmapTasks(prev => [{ id: Date.now().toString(), title: inputA.trim(), checked: false, durationHours: 1, priority: "Medium", type: "project", list: "todo" }, ...prev]);
      updateTelemetry("totalTasksCreated", p => p + 1);
      setInputA("");
    }
  };

  const handleAddB = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputB.trim()) {
      setRoadmapTasks(prev => [...prev, { id: Date.now().toString(), title: inputB.trim(), checked: false, durationHours: 1, priority: "Medium", type: "project", list: "today" }]);
      updateTelemetry("totalTasksCreated", p => p + 1);
      setInputB("");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-[#0B1120] font-sans text-white p-6 md:p-12 flex flex-col xl:flex-row gap-8 items-center xl:items-start justify-center">
      
      {/* ─────────────────────────────────────────────
          LEFT WORKSPACE (RADIAL POMODORO)
          ───────────────────────────────────────────── */}
      <div className="w-full xl:w-1/2 flex flex-col items-center justify-center pt-8">
        <h2 className="text-[28px] font-bold tracking-tight text-white mb-2">POMODORO TIMER</h2>
        <p className="text-[13px] uppercase tracking-[0.3em] text-slate-400 mb-8">Focus • Work • Achieve</p>

        {adaptiveState.isFatigued && (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.1)] backdrop-blur-md flex items-center gap-2">
            <Target className="w-4 h-4" /> Optimization Protocol Active
          </div>
        )}
        
        <div className="flex items-center gap-6 md:gap-12 mb-12">
          {/* SESSIONS CARD */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-6 flex flex-col items-center justify-center w-36 h-36">
            <Target className="w-6 h-6 text-rose-400 mb-3" />
            <span className="text-[11px] uppercase tracking-widest text-slate-400 mb-1">Sessions</span>
            <span className="text-3xl font-semibold text-white">{sessionsCompleted}</span>
            <span className="text-[12px] text-slate-500 mt-1">Completed</span>
          </div>

          {/* MAIN RADIAL TIMER */}
          <div className="relative flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90 drop-shadow-2xl">
              <defs>
                <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
              </defs>
              {/* Background Track */}
              <circle
                stroke="rgba(255,255,255,0.05)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              {/* Progress Track */}
              <circle
                stroke="url(#timer-gradient)"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s linear" }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[12px] font-medium tracking-[0.2em] text-emerald-400 mb-1 uppercase">
                {mode === "pomodoro" ? "Focus Time" : mode === "shortBreak" ? "Short Break" : "Long Break"}
              </span>
              <span className="text-6xl font-bold tracking-tight text-white tabular-nums drop-shadow-md">
                {timeString}
              </span>
              <span className="text-[13px] text-slate-400 mt-2 flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10 transition-colors">
                {getBioStatus()}
              </span>
            </div>
          </div>

          {/* STREAK CARD */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-6 flex flex-col items-center justify-center w-36 h-36">
            <span className="text-[20px] mb-3">🔥</span>
            <span className="text-[11px] uppercase tracking-widest text-slate-400 mb-1">Streak</span>
            <span className="text-3xl font-semibold text-white">{streak}</span>
            <span className="text-[12px] text-slate-500 mt-1">Days</span>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={toggleTimer}
            className="flex items-center gap-2 h-14 px-10 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95 text-[15px]"
          >
            {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            {isActive ? "PAUSE FOCUS" : "START FOCUS"}
          </button>
          <button 
            onClick={resetTimer}
            className="w-14 h-14 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95"
          >
            <RotateCcw className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* CAPSULE DOCK */}
        <div className="flex items-center gap-2 bg-white/[0.03] backdrop-blur-md border border-white/10 p-1.5 rounded-full shadow-lg">
          <button 
            onClick={() => switchMode("pomodoro")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-colors ${mode === "pomodoro" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white"}`}
          >
            <Target className="w-4 h-4" /> Focus
          </button>
          <button 
            onClick={() => switchMode("shortBreak")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-colors ${mode === "shortBreak" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white"}`}
          >
            <Coffee className="w-4 h-4" /> Short Break
          </button>
          <button 
            onClick={() => switchMode("longBreak")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-colors ${mode === "longBreak" ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:text-white"}`}
          >
            <Coffee className="w-4 h-4" /> Long Break
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button onClick={() => setShowEditModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium text-slate-400 hover:text-white transition-colors">
            <Settings className="w-4 h-4" /> Edit
          </button>
        </div>

        {/* AUDIO CONTROL DOCK */}
        <div className="flex items-center gap-2 p-2 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-400 mt-4 w-[340px] max-w-full">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg transition-colors ${soundEnabled ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:bg-white/5'}`}
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <select 
            value={selectedSound}
            onChange={(e) => {
              setSelectedSound(e.target.value);
              if (e.target.value !== 'none') setSoundEnabled(true);
            }}
            className="bg-transparent border-none text-slate-300 text-xs focus:ring-0 cursor-pointer outline-none flex-1 py-1"
          >
            {ambientTracks.map(track => (
              <option key={track.id} value={track.id} className="bg-slate-900 text-slate-300 p-2">
                {track.name}
              </option>
            ))}
          </select>
        </div>
        
        <p className="text-[13px] text-slate-500 mt-8">Stay focused. Get things done.</p>
      </div>

      {/* ─────────────────────────────────────────────
          RIGHT WORKSPACE (DUAL-PANEL TASKLIST)
          ───────────────────────────────────────────── */}
      <div className="w-full xl:w-1/2 flex flex-col md:flex-row gap-6">
        
        {/* CARD A: CHAT TO-DO */}
        <div className="flex-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-6 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold tracking-widest uppercase flex items-center gap-2 text-white">
              <span className="w-1 h-4 bg-violet-500 rounded-full" />
              Chat To-Do
            </h3>
            <span className="text-[11px] font-semibold bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-md">
              +{cardATasks.filter(t => !t.checked).length}
            </span>
          </div>
          
          <input 
            type="text" 
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
            onKeyDown={handleAddA}
            placeholder="Add new task..." 
            className="bg-white/[0.03] border border-white/10 rounded-lg text-xs p-2 w-full placeholder:text-slate-500 mb-3 text-white focus:outline-none focus:border-violet-500/50" 
          />

          <div className="flex-1 overflow-y-auto pr-2 space-y-1 mb-6 custom-scrollbar">
            {cardATasks.length === 0 && (
              <div className="text-sm text-slate-500 italic mt-4 text-center">No tasks loaded. Run the AI Planner first!</div>
            )}
            {cardATasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2.5 hover:bg-white/[0.04] rounded-xl transition-colors group">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input type="checkbox" className="hidden" checked={task.checked} onChange={() => toggleRoadmapTask(task.id)} />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.checked ? 'bg-violet-500 border-violet-500' : 'border-slate-500 group-hover:border-violet-400'}`}>
                    {task.checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-[14px] font-medium transition-all ${task.checked ? 'text-slate-500 line-through opacity-50' : 'text-slate-200'}`}>
                    {task.title}
                  </span>
                </label>
                <button 
                  onClick={() => moveRoadmapTask(task.id, "today")}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg"
                  title="Move to Today Tasks"
                >
                  <ArrowRight className="w-4 h-4 text-slate-400 hover:text-emerald-400" />
                </button>
                <button 
                  onClick={() => setRoadmapTasks(prev => prev.filter(t => t.id !== task.id))}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg"
                  title="Delete Task"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-rose-400 transition-colors" />
                </button>
              </div>
            ))}
          </div>

          {/* Progress Bar Widget */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              <span>{cardATasks.filter(t => t.checked).length} OF {cardATasks.length}</span>
              <span className="text-violet-400">{cardATasks.length ? Math.round((cardATasks.filter(t => t.checked).length / cardATasks.length) * 100) : 0}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${cardATasks.length ? (cardATasks.filter(t => t.checked).length / cardATasks.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* CARD B: TODAY'S FOCAL PRIORITY */}
        <div className="flex-1 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-6 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold tracking-widest uppercase flex items-center gap-2 text-white">
              <span className="w-1 h-4 bg-emerald-500 rounded-full" />
              Today Tasks
            </h3>
            <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md">
              +{cardBTasks.filter(t => !t.checked).length}
            </span>
          </div>

          <input 
            type="text" 
            value={inputB}
            onChange={(e) => setInputB(e.target.value)}
            onKeyDown={handleAddB}
            placeholder="Add new task..." 
            className="bg-white/[0.03] border border-white/10 rounded-lg text-xs p-2 w-full placeholder:text-slate-500 mb-3 text-white focus:outline-none focus:border-emerald-500/50" 
          />

          <div className="flex-1 overflow-y-auto pr-2 space-y-1 mb-6 custom-scrollbar">
            {cardBTasks.length === 0 && (
              <div className="text-sm text-slate-500 italic mt-4 text-center">Awaiting tasks...</div>
            )}
            {cardBTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2.5 hover:bg-white/[0.04] rounded-xl transition-colors group">
                <button 
                  onClick={() => moveRoadmapTask(task.id, "todo")}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg"
                  title="Move back to Chat To-Do"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-400 hover:text-violet-400" />
                </button>
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input type="checkbox" className="hidden" checked={task.checked} onChange={() => toggleRoadmapTask(task.id)} />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 group-hover:border-emerald-400'}`}>
                    {task.checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-[14px] font-medium transition-all ${task.checked ? 'text-slate-500 line-through opacity-50' : 'text-slate-200'}`}>
                    {task.title}
                  </span>
                </label>
                <button 
                  onClick={() => setRoadmapTasks(prev => prev.filter(t => t.id !== task.id))}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg"
                  title="Delete Task"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-rose-400 transition-colors" />
                </button>
              </div>
            ))}
          </div>

          {/* Progress Bar Widget */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              <span>{cardBTasks.filter(t => t.checked).length} OF {cardBTasks.length}</span>
              <span className="text-emerald-400">{cardBTasks.length ? Math.round((cardBTasks.filter(t => t.checked).length / cardBTasks.length) * 100) : 0}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${cardBTasks.length ? (cardBTasks.filter(t => t.checked).length / cardBTasks.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* COMMAND MENU OVERLAY */}
      {showCommandMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-white font-bold text-lg mb-4">Command Menu</h3>
            <div className="space-y-2">
              <button onClick={() => { setIsActive(prev => !prev); setShowCommandMenu(false); }} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors text-left text-slate-300">
                <span>Start / Pause Timer</span>
                <kbd className="bg-white/10 px-2 py-1 rounded text-xs">Space</kbd>
              </button>
              <button onClick={() => { resetTimer(); setShowCommandMenu(false); }} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors text-left text-slate-300">
                <span>Reset Timer</span>
                <kbd className="bg-white/10 px-2 py-1 rounded text-xs">R</kbd>
              </button>
              <button onClick={() => setShowCommandMenu(false)} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors text-left text-slate-300">
                <span>Close Menu</span>
                <kbd className="bg-white/10 px-2 py-1 rounded text-xs">Esc</kbd>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POST-SESSION REFLECTION OVERLAY */}
      {showReflectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-emerald-500/30 rounded-2xl p-8 w-full max-w-lg shadow-[0_0_50px_rgba(16,185,129,0.15)] relative transform transition-all">
            <h3 className="text-white font-bold text-2xl mb-2 flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-400" /> Session Complete
            </h3>
            <p className="text-slate-400 mb-6 text-sm">How was your focus session? Log a quick reflection to help calibrate your next roadmap.</p>
            
            <textarea 
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="e.g. Felt distracted by emails, but got the core module built."
              rows={3}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none mb-6"
            />
            
            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => setShowReflectionModal(false)}
                className="px-6 py-2.5 rounded-full text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button 
                onClick={handleReflectionSubmit}
                className="px-6 py-2.5 rounded-full text-sm font-bold bg-emerald-500 text-[#0B1120] hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Save Log
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ─────────────────────────────────────────────
          EDIT OVERLAY MODAL
          ───────────────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0B1120] border border-white/10 p-6 rounded-2xl shadow-2xl relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" /> Timer Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-300">Focus Duration (min)</span>
                <input 
                  type="number" 
                  value={customDurations.pomodoro}
                  onChange={(e) => setCustomDurations({...customDurations, pomodoro: Number(e.target.value) || 25})}
                  className="bg-white/5 border border-white/10 rounded-lg w-16 text-center text-sm p-1 focus:outline-none focus:border-emerald-500 text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-300">Short Break (min)</span>
                <input 
                  type="number" 
                  value={customDurations.shortBreak}
                  onChange={(e) => setCustomDurations({...customDurations, shortBreak: Number(e.target.value) || 5})}
                  className="bg-white/5 border border-white/10 rounded-lg w-16 text-center text-sm p-1 focus:outline-none focus:border-cyan-500 text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-300">Long Break (min)</span>
                <input 
                  type="number" 
                  value={customDurations.longBreak}
                  onChange={(e) => setCustomDurations({...customDurations, longBreak: Number(e.target.value) || 15})}
                  className="bg-white/5 border border-white/10 rounded-lg w-16 text-center text-sm p-1 focus:outline-none focus:border-amber-500 text-white"
                />
              </div>
              
              <div className="h-px w-full bg-white/10 my-4" />
              
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-300">Sound Chime</span>
                <button 
                  onClick={() => setChimeEnabled(!chimeEnabled)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${chimeEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${chimeEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
            
            <button onClick={() => { setShowEditModal(false); resetTimer(); }} className="mt-8 w-full bg-white/[0.05] border border-white/10 rounded-xl py-2.5 text-sm font-semibold hover:bg-white/10 transition-colors">
              Save & Reset Timer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
