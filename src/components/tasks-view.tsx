"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useFocus } from "@/context/focus-context";
import { dbService, Task, SubTask } from "@/lib/db";
import { 
  Zap, 
  Plus, 
  FileImage, 
  Trash2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff, 
  Clock, 
  Layers, 
  Send, 
  MessageSquare,
  Activity,
  AlertCircle,
  Copy,
  Check,
  UserCheck,
  RefreshCw,
  Calendar
} from "lucide-react";
import confetti from "canvas-confetti";

export const TasksView: React.FC = () => {
  const { user } = useAuth();
  const { startFocus } = useFocus();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Intake States
  const [inputText, setInputText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [imageType, setImageType] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global Toggle Reasoning
  const [showWhyOrder, setShowWhyOrder] = useState(false);

  // Smart Re-prioritization Banner State
  const [reprioBanner, setReprioBanner] = useState<{
    show: boolean;
    previous: { title: string; priority: number }[];
    updated: { title: string; priority: number }[];
    reason: string;
  } | null>(null);

  // Auto-Draft Drawer State
  const [activeDraftTask, setActiveDraftTask] = useState<Task | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);

  // Delay Simulation States
  const [activeDelayTask, setActiveDelayTask] = useState<Task | null>(null);
  const [isSimulatingDelay, setIsSimulatingDelay] = useState(false);
  const [delayImpacts, setDelayImpacts] = useState<string[]>([]);
  const [delayRec, setDelayRec] = useState("");
  const [delayRisk, setDelayRisk] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");

  // Load Tasks
  const loadTasks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const list = await dbService.getTasks(user.uid);
      setTasks(list.sort((a, b) => a.priority - b.priority));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  // Image upload base64 handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageName(file.name);
      setImageType(file.type);
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Intake submit handler
  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText && !image) return;
    if (!user) return;

    try {
      setIsAnalyzing(true);
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          image: image,
          imageType: imageType
        })
      });
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // 2. Generate subtasks for this task using /api/decompose
      const decompRes = await fetch("/api/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: data.title })
      });
      const decompData = await decompRes.json();

      const newTask: Task = {
        id: `task_${Date.now()}`,
        userId: user.uid,
        title: data.title || "Untitled Task",
        deadline: data.deadline || new Date(Date.now() + 24*60*60*1000).toISOString().split("T")[0],
        duration: data.duration || 2,
        urgency: data.urgency || 3,
        priority: tasks.length + 1,
        status: "pending",
        subtasks: decompData.subtasks || [],
        dependencies: data.dependencies || [],
        category: data.category || "General",
        riskScore: 20, // default placeholder, calculated in prioritizing
        riskReason: "Awaiting analysis.",
        explanation: "Evaluating position in timeline.",
        confidence: 90,
        addedAt: new Date().toISOString()
      };

      // 3. Recalculate Prioritization with Gemini
      setIsAnalyzing(false);
      setInputText("");
      setImage(null);
      setImageName("");
      
      triggerReprioritization(newTask);
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
    }
  };

  // Perform re-prioritization on new task addition
  const triggerReprioritization = async (newTask: Task) => {
    if (!user) return;
    try {
      setLoading(true);
      const currentTasks = [...tasks];
      const updatedTasksList = [...currentTasks, newTask];

      // Call Gemini prioritization
      const res = await fetch("/api/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: updatedTasksList,
          peakHours: user.peakHours,
          previousOrder: currentTasks
        })
      });
      const data = await res.json();

      if (data.tasks) {
        // Save the re-prioritized tasks back
        await dbService.saveTasksBulk(data.tasks);
        
        // Show Smart Re-prioritization changes
        if (currentTasks.length > 0) {
          const prevMap = currentTasks.map((t, idx) => ({ title: t.title, priority: idx + 1 }));
          const updatedMap = data.tasks.map((t: any) => ({ title: t.title, priority: t.priority }));

          setReprioBanner({
            show: true,
            previous: prevMap,
            updated: updatedMap,
            reason: data.changeReason || "A new high-priority deadline pushed other tasks down."
          });
        }

        // Fire complete confetti
        confetti({ particleCount: 80, spread: 60 });
        loadTasks();
      }
    } catch (e) {
      console.error("Error prioritizing tasks:", e);
      // Failover save new task directly
      await dbService.saveTask(newTask);
      loadTasks();
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    await dbService.deleteTask(taskId);
    loadTasks();
  };

  // Toggle Subtask
  const handleToggleSubtask = async (task: Task, subId: string) => {
    const updatedSub = task.subtasks.map(s => 
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    const allCompleted = updatedSub.every(s => s.completed);
    const updatedTask: Task = {
      ...task,
      subtasks: updatedSub,
      status: allCompleted ? "completed" : task.status
    };
    await dbService.saveTask(updatedTask);
    
    // Quick reload
    const list = await dbService.getTasks(user!.uid);
    setTasks(list.sort((a, b) => a.priority - b.priority));
  };

  // Generate Draft Assistant
  const handleOpenDraft = async (task: Task) => {
    setActiveDraftTask(task);
    setDraftContent("");
    setDraftCopied(false);
    setIsGeneratingDraft(true);

    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          category: task.category
        })
      });
      const data = await res.json();
      setDraftContent(data.draft || "");
    } catch (e) {
      console.error(e);
      setDraftContent("Failed to generate draft. Please edit manually.");
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Copy Draft Content
  const handleCopyDraft = () => {
    navigator.clipboard.writeText(draftContent);
    setDraftCopied(true);
    setTimeout(() => setDraftCopied(false), 2000);
  };

  // Simulate Delay Consequence
  const handleOpenDelay = async (task: Task) => {
    setActiveDelayTask(task);
    setDelayImpacts([]);
    setDelayRec("");
    setDelayRisk("LOW");
    setIsSimulatingDelay(true);

    try {
      const res = await fetch("/api/delay-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: task,
          allTasks: tasks
        })
      });
      const data = await res.json();
      setDelayImpacts(data.impacts || []);
      setDelayRec(data.recommendation || "");
      setDelayRisk(data.riskLevel || "LOW");
    } catch (e) {
      console.error(e);
      setDelayImpacts(["Error loading delay simulations."]);
    } finally {
      setIsSimulatingDelay(false);
    }
  };

  // Confirm Delay Execution
  const handleConfirmDelay = async () => {
    if (!activeDelayTask || !user) return;
    
    // Postpone the task: move deadline +1 day forward
    const currentDeadline = new Date(activeDelayTask.deadline);
    currentDeadline.setDate(currentDeadline.getDate() + 1);
    
    const postponedTask: Task = {
      ...activeDelayTask,
      deadline: currentDeadline.toISOString().split("T")[0],
      urgency: Math.min(5, activeDelayTask.urgency + 1) // Increment urgency because delaying increases pressure
    };

    setActiveDelayTask(null);
    setLoading(true);

    try {
      // Re-prioritize after shifting deadline
      const otherTasks = tasks.filter(t => t.id !== postponedTask.id);
      const res = await fetch("/api/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: [...otherTasks, postponedTask],
          peakHours: user.peakHours,
          previousOrder: tasks
        })
      });
      const data = await res.json();
      if (data.tasks) {
        await dbService.saveTasksBulk(data.tasks);
        loadTasks();
      }
    } catch (e) {
      console.error(e);
      await dbService.saveTask(postponedTask);
      loadTasks();
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full space-y-5 font-sans bg-[#F9F9F6] min-h-screen text-[#0F172A]">
      {/* 1. Re-prioritization Banner notification */}
      {reprioBanner && reprioBanner.show && (
        <div className="p-6 rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] relative animate-in slide-in-from-top-6 duration-300 space-y-4">
          <h4 className="text-[#0F172A] font-bold text-[18px] flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-600 animate-pulse" />
            </div>
            Smart Re-Prioritization Active
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[15px]">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-[14px] text-gray-500 font-semibold uppercase block mb-3 tracking-wider">Previous Sequence</span>
              {reprioBanner.previous.slice(0, 3).map((item, idx) => (
                <div key={idx} className="py-2 border-b border-gray-200 last:border-0 font-medium">
                  {idx + 1}. {item.title}
                </div>
              ))}
              {reprioBanner.previous.length === 0 && <div className="text-gray-400">Empty</div>}
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <span className="text-[14px] text-blue-600 font-semibold uppercase block mb-3 tracking-wider">Updated Sequence</span>
              {reprioBanner.updated.slice(0, 3).map((item, idx) => (
                <div key={idx} className="py-2 border-b border-blue-100 last:border-0 font-semibold text-blue-900">
                  {idx + 1}. {item.title}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] leading-normal font-medium">
            <span className="font-bold text-[#0F172A] block mb-2">AI Rationale:</span>
            {reprioBanner.reason}
          </div>

          <button
            onClick={() => setReprioBanner(null)}
            className="px-6 py-2 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white font-semibold rounded-full hover:-translate-y-[2px] transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] text-[15px]"
          >
            Acknowledge Tradeoffs
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-[36px] font-bold text-[#111827] tracking-tight leading-tight">Task Inbox</h1>
          <p className="text-[15px] text-[#6B7280] font-normal mt-1">Capture everything quickly. AI organizes, prioritizes and schedules it automatically.</p>
        </div>

        {/* Global Reasonings Toggle */}
        <button
          onClick={() => setShowWhyOrder(!showWhyOrder)}
          className={`flex items-center gap-2 h-[42px] px-5 border rounded-full text-[14px] font-medium transition-all duration-200 cursor-pointer shadow-sm ${
            showWhyOrder 
              ? "bg-[#10B981] border-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
              : "bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-[#ECFDF5] hover:border-[#A7F3D0] hover:text-[#059669]"
          }`}
        >
          {showWhyOrder ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          🧠 AI Reasoning
        </button>
      </div>

      {/* 2. Quick Capture (Intake Area) */}
      <div className="bg-white rounded-[20px] p-5 border border-[#E5E7EB] shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition-all duration-200">
        <div className="flex flex-col mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-[#10B981]" />
            </div>
            <h3 className="font-semibold text-[#111827] text-[24px]">Quick Capture</h3>
          </div>
        </div>

        <form onSubmit={handleIntakeSubmit} className="space-y-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="What do you need to get done today?"
            className="w-full h-[80px] p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[14px] text-[15px] text-[#111827] font-medium placeholder-[#9CA3AF] focus:outline-none focus:ring-4 focus:ring-[#10B981]/15 focus:border-[#10B981]/40 resize-none transition-all duration-200"
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Screenshot upload button */}
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 h-[42px] px-4 bg-white border border-dashed border-[#D1D5DB] hover:bg-[#ECFDF5] hover:border-[#10B981]/50 hover:text-[#059669] text-[#6B7280] font-medium text-[14px] rounded-[14px] transition-all duration-200 cursor-pointer shadow-sm group"
              >
                <FileImage className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#10B981] transition-colors" />
                {imageName ? imageName : "📎 Upload Screenshot"}
              </button>
              {!imageName && <span className="text-[14px] text-[#6B7280] font-medium hidden sm:inline">PNG • JPG • PDF</span>}
              {image && (
                <button
                  type="button"
                  onClick={() => { setImage(null); setImageName(""); }}
                  className="text-[14px] text-red-500 hover:text-red-600 font-medium cursor-pointer px-2 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || (!inputText && !image)}
              className="h-[42px] px-6 bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white font-medium text-[14px] rounded-[14px] hover:-translate-y-[2px] transition-all duration-200 shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  ✨ Prioritize with AI
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Task List View */}
      {loading ? (
        <div className="py-12 text-center text-[15px] text-[#64748B] font-medium animate-pulse bg-white rounded-[20px] border border-[#E5E7EB] shadow-sm">
          Organizing your tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[20px] border border-[#E5E7EB] shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="text-[48px] mb-4">📭</div>
          <h3 className="text-[20px] font-bold text-[#0F172A] mb-2">Inbox Zero</h3>
          <p className="text-[15px] text-[#64748B] font-medium max-w-md">You're all caught up.<br/>Drop a task above and AI will automatically prioritize and organize it.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tasks.map((task) => {
            const isOverdue = task.status === "pending" && new Date(task.deadline).getTime() < Date.now();
            const showDetails = showWhyOrder;
            
            // Badges Mapping
            const p = task.priority <= 2 ? "High" : task.priority <= 4 ? "Medium" : "Low";
            const priorityBadge = 
              p === "High" ? "bg-red-50 text-red-600 border border-red-200" :
              p === "Medium" ? "bg-amber-50 text-amber-600 border border-amber-200" :
              "bg-emerald-50 text-emerald-600 border border-emerald-200";
              
            const statusBadge = task.status === "completed" 
              ? "bg-green-50 text-green-700 border-green-200" 
              : "bg-indigo-50 text-indigo-700 border-indigo-200";

            // Subtask completion
            const totalSubs = task.subtasks?.length || 0;
            const completedSubs = task.subtasks?.filter(s => s.completed).length || 0;
            const progress = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0;

            return (
              <div 
                key={task.id}
                className={`bg-white rounded-[20px] p-6 border border-[#E5E7EB] shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)] transition-all duration-300 ${
                  task.status === "completed" ? "opacity-60 bg-gray-50 shadow-none hover:shadow-none hover:translate-y-0 border-gray-200" : ""
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  {/* Left content */}
                  <div className="flex-1 flex flex-col gap-3">
                    {/* Top Row: Badges & Meta */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 text-[12px] font-bold rounded-full uppercase tracking-wider ${priorityBadge}`}>
                        {p} Priority
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 text-[12px] font-bold rounded-full uppercase tracking-wider">
                        {task.category}
                      </span>
                      <span className={`px-3 py-1 text-[12px] font-bold rounded-full uppercase tracking-wider border ${statusBadge}`}>
                        {task.status === "completed" ? "Completed" : "Upcoming"}
                      </span>
                      <span className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 text-[12px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {task.duration}h
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`text-[18px] font-bold text-[#0F172A] leading-snug mt-1 ${task.status === "completed" ? "line-through text-gray-400" : ""}`}>
                      {task.title}
                    </h3>
                    
                    {/* Checklist & Progress */}
                    {task.status !== "completed" && totalSubs > 0 && (
                      <div className="mt-2 space-y-4 max-w-2xl">
                        {/* Progress Bar */}
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200/50">
                            <div className="bg-gradient-to-r from-[#10B981] to-[#06B6D4] h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-[13px] font-bold text-gray-600 w-8 text-right">{Math.round(progress)}%</span>
                        </div>
                        
                        {/* Checklist */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {task.subtasks.map((st) => (
                            <button
                              key={st.id}
                              onClick={() => handleToggleSubtask(task, st.id)}
                              className="flex items-start gap-3 text-left text-[14px] font-medium text-gray-600 hover:text-[#0F172A] py-1 transition-colors group"
                            >
                              <div className={`mt-0.5 w-4.5 h-4.5 rounded-[4px] border flex items-center justify-center shrink-0 transition-all ${st.completed ? "bg-[#10B981] border-[#10B981] text-white" : "border-gray-300 bg-white group-hover:border-[#10B981]"}`}>
                                {st.completed && <Check className="h-3 w-3" strokeWidth={3} />}
                              </div>
                              <span className={st.completed ? "line-through text-gray-400" : ""}>
                                {st.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-[14px] font-semibold text-gray-500 mt-2 flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <Calendar className="h-3 w-3 text-gray-500" />
                      </div>
                      Due: {task.deadline} {isOverdue && <span className="text-red-500 uppercase ml-2 text-[12px] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Overdue</span>}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col items-end justify-start gap-2 shrink-0">
                    {task.status !== "completed" && (
                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          onClick={() => startFocus(task.id)}
                          className="flex-1 md:w-[100px] h-[42px] px-4 bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white font-medium text-[14px] rounded-[14px] hover:-translate-y-[2px] transition-all duration-200 shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] flex justify-center items-center gap-1.5"
                        >
                          <Zap className="h-4 w-4" fill="currentColor" /> Focus
                        </button>
                        <button
                          onClick={() => handleOpenDelay(task)}
                          className="flex-1 md:w-[100px] h-[42px] px-4 bg-white text-[#111827] font-medium text-[14px] border border-[#E5E7EB] rounded-[14px] hover:bg-gray-50 hover:border-gray-300 transition-all flex justify-center items-center shadow-sm hover:shadow-md hover:-translate-y-[2px] duration-200"
                        >
                          Delay
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                      {task.status !== "completed" && task.isCommunicationTask && (
                        <button
                          onClick={() => handleOpenDraft(task)}
                          className="flex-1 md:w-[100px] h-[42px] px-4 bg-white text-[#111827] font-medium text-[14px] border border-[#E5E7EB] rounded-[14px] hover:bg-gray-50 hover:border-gray-300 transition-all flex justify-center items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-[2px] duration-200"
                        >
                          <MessageSquare className="h-4 w-4" /> Draft
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="w-[42px] h-[42px] bg-white text-red-500 border border-[#E5E7EB] rounded-[14px] hover:bg-red-50 hover:border-red-200 transition-all flex justify-center items-center shadow-sm hover:shadow-md hover:-translate-y-[2px] duration-200 group"
                        title="Delete Task"
                      >
                        <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsed/Expanded AI Details */}
                {showDetails && (
                  <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
                    <div className="p-4 rounded-[16px] bg-gray-50 border border-gray-200">
                      <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider block mb-3">AI Risk Assessment</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-[12px] font-bold mb-3 border ${task.riskScore > 80 ? 'bg-red-50 text-red-700 border-red-200' : task.riskScore > 40 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        {task.riskScore}% Risk
                      </span>
                      <p className="text-[14px] text-gray-600 font-medium">{task.riskReason}</p>
                    </div>

                    <div className="p-4 rounded-[16px] bg-gray-50 border border-gray-200 col-span-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider block mb-3">Sorting Explanation</span>
                        <p className="text-[14px] text-gray-700 font-medium mb-4">{task.explanation}</p>
                      </div>
                      <div className="flex items-center gap-4 text-[13px] font-bold text-gray-400">
                        <span>Confidence: {task.confidence}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- AUTO DRAFT ASSISTANT DRAWER MODAL --- */}
      {activeDraftTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[20px] p-8 relative flex flex-col max-h-[85vh] shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
            <div className="mb-6">
              <h3 className="text-[#0F172A] font-bold text-[20px] flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-indigo-600 animate-pulse" /> 
                </div>
                Auto-Draft Assistant
              </h3>
              <p className="text-[14px] font-medium text-gray-500 mt-2">Task: "{activeDraftTask.title}"</p>
            </div>

            <div className="flex-1 overflow-y-auto rounded-[16px] bg-gray-50 border border-gray-200 p-2 mb-6">
              {isGeneratingDraft ? (
                <div className="py-12 text-center text-[14px] text-gray-500 font-medium animate-pulse">
                  Querying AI for communication templates...
                </div>
              ) : (
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="w-full h-64 p-4 bg-transparent text-[15px] font-medium text-[#0F172A] focus:outline-none resize-none leading-relaxed"
                />
              )}
            </div>

            <div className="flex justify-end gap-3 mt-auto">
              <button
                onClick={() => setActiveDraftTask(null)}
                className="px-6 py-2.5 bg-white text-gray-700 font-semibold text-[15px] border border-gray-200 rounded-full hover:bg-gray-50 transition-all shadow-sm"
              >
                Close
              </button>
              <button
                onClick={() => handleCopyDraft()}
                disabled={isGeneratingDraft || !draftContent}
                className="px-6 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white font-semibold text-[15px] rounded-full hover:-translate-y-[2px] transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {draftCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {draftCopied ? "Copied!" : "Copy Draft"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELAY SIMULATOR MODAL --- */}
      {activeDelayTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[20px] p-8 relative shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
            <div className="mb-6">
              <h3 className="text-[#0F172A] font-bold text-[20px] flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 animate-bounce" /> 
                </div>
                Delay Impact Simulation
              </h3>
              <p className="text-[14px] font-medium text-gray-500 mt-2">Task: "{activeDelayTask.title}"</p>
            </div>

            {isSimulatingDelay ? (
              <div className="py-12 text-center text-[14px] text-gray-500 font-medium animate-pulse">
                Running mock consequences simulation...
              </div>
            ) : (
              <div className="space-y-6 mb-8">
                {/* Risk Gauge */}
                <div className="p-4 bg-red-50 border border-red-100 rounded-[16px] flex items-center justify-between">
                  <span className="text-[14px] text-red-800 font-bold uppercase tracking-wider">Postponing Risk:</span>
                  <span className="px-3 py-1 bg-red-600 text-white text-[12px] font-bold rounded-full">
                    {delayRisk}
                  </span>
                </div>

                {/* Impacts Checklist */}
                <div className="space-y-3">
                  <span className="text-[14px] font-bold text-gray-700 block">Consequences</span>
                  {delayImpacts.map((imp, idx) => (
                    <div key={idx} className="flex gap-3 text-[14px] text-gray-600 font-medium items-start">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>

                {/* Recommendation box */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-[16px] text-[14px] font-medium text-gray-600 leading-normal">
                  <span className="font-bold text-[#0F172A] block mb-1">AI Advice:</span>
                  {delayRec}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-auto">
              <button
                onClick={() => setActiveDelayTask(null)}
                className="px-6 py-2.5 bg-white text-gray-700 font-semibold text-[15px] border border-gray-200 rounded-full hover:bg-gray-50 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelay()}
                disabled={isSimulatingDelay}
                className="px-6 py-2.5 bg-white text-red-500 font-semibold text-[15px] border border-red-200 rounded-full hover:bg-red-50 shadow-sm transition-all disabled:opacity-50"
              >
                Postpone Anyway (+1d)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
