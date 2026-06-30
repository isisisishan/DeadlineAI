import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const isGeminiConfigured = !!apiKey;

export const aiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Mock fallback generators for stateless API routes when API Key is missing
export const geminiFallback = {
  intake: (text: string): any => {
    const lowercase = text.toLowerCase();
    let title = text.trim();
    let category = "General";
    let duration = 2; // Default 2 hours
    let urgency = 3;
    let deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // Tomorrow

    if (lowercase.includes("exam") || lowercase.includes("test")) {
      title = "Exam Preparation";
      category = "Academic";
      duration = 4;
      urgency = 5;
    } else if (lowercase.includes("hackathon") || lowercase.includes("build") || lowercase.includes("project")) {
      title = "Hackathon Submission";
      category = "Development";
      duration = 8;
      urgency = 5;
      deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split("T")[0]; // In 2 days
    } else if (lowercase.includes("assignment") || lowercase.includes("homework")) {
      title = "Assignment Submission";
      category = "Academic";
      duration = 3;
      urgency = 4;
    } else if (lowercase.includes("interview") || lowercase.includes("job")) {
      title = "Interview Prep";
      category = "Career";
      duration = 2;
      urgency = 5;
    } else if (lowercase.includes("rent") || lowercase.includes("bill")) {
      title = "Pay Rent / Bills";
      category = "Finance";
      duration = 0.5;
      urgency = 4;
      if (lowercase.includes("5th")) {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        deadline = `${currentYear}-${String(currentMonth).padStart(2, "0")}-05`;
      }
    }

    // Try to extract date/time details if shorthand
    if (lowercase.includes("fri")) {
      deadline = getNextDayOfWeek(5);
    } else if (lowercase.includes("sat")) {
      deadline = getNextDayOfWeek(6);
    } else if (lowercase.includes("sun")) {
      deadline = getNextDayOfWeek(0);
    } else if (lowercase.includes("mon")) {
      deadline = getNextDayOfWeek(1);
    } else if (lowercase.includes("tue")) {
      deadline = getNextDayOfWeek(2);
    } else if (lowercase.includes("wed")) {
      deadline = getNextDayOfWeek(3);
    } else if (lowercase.includes("thu")) {
      deadline = getNextDayOfWeek(4);
    } else if (lowercase.includes("tonight")) {
      deadline = new Date().toISOString().split("T")[0];
    } else if (lowercase.includes("tomorrow")) {
      deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    }

    return {
      title,
      deadline,
      duration,
      urgency,
      category,
      dependencies: lowercase.includes("report") 
        ? ["Finish report outline", "Get mentor approval"] 
        : [],
      isCommunicationTask: lowercase.includes("email") || lowercase.includes("ask") || lowercase.includes("request") || lowercase.includes("send")
    };
  },

  prioritize: (tasks: any[], peakHours: string): any => {
    // Sort tasks logically by urgency, deadline proximity, and dependencies
    const sorted = [...tasks].sort((a, b) => {
      // 1. Overdue first (simulated)
      // 2. High urgency (5 down to 1)
      if (b.urgency !== a.urgency) return b.urgency - a.urgency;
      // 3. Earliest deadline
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    const priorityList = sorted.map((task, idx) => {
      const remainingTime = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
      let riskScore = 15;
      let riskReason = "Low risk. Sufficient time remains to complete this task.";

      if (remainingTime < 0) {
        riskScore = 99;
        riskReason = "Task is overdue. Action is required immediately.";
      } else if (remainingTime < task.duration) {
        riskScore = 95;
        riskReason = `Requires ${task.duration} hours, but only ${Math.max(0, Math.round(remainingTime))} hours remain.`;
      } else if (remainingTime < task.duration * 2) {
        riskScore = 75;
        riskReason = `Requires ${task.duration} hours. High risk of overlap with other deadlines.`;
      } else if (task.urgency >= 5) {
        riskScore = 40;
        riskReason = "High importance. Delaying will cause severe consequences.";
      }

      return {
        ...task,
        priority: idx + 1,
        riskScore,
        riskReason,
        confidence: Math.round(85 + Math.random() * 10),
        explanation: `Scheduled based on deadline proximity (${task.deadline}) and urgency score ${task.urgency}. ${
          peakHours === "morning" && idx === 0 ? "Allocated in Morning Peak window for maximum focus." : ""
        }`
      };
    });

    return {
      tasks: priorityList,
      explanation: "Prioritization computed by factoring in deadline severity, task duration, and user Peak Energy Hours.",
      confidenceLevel: 92
    };
  },

  decompose: (title: string): string[] => {
    const lowercase = title.toLowerCase();
    if (lowercase.includes("exam") || lowercase.includes("study") || lowercase.includes("revision")) {
      return [
        "Gather all syllabus resources and lecture slides",
        "Create a summary sheet of formulas/key concepts",
        "Solve at least 2 practice exam papers under timer",
        "Review incorrect answers and clarify doubts",
        "Complete a 15-minute quick flashcard quiz"
      ];
    }
    if (lowercase.includes("hackathon") || lowercase.includes("project") || lowercase.includes("build")) {
      return [
        "Write project README and map DB schema",
        "Setup boilerplate UI templates and theme configuration",
        "Implement core API routes and Gemini prompts",
        "Integrate database actions and mock local fallbacks",
        "Test user paths and deploy to production hosting"
      ];
    }
    if (lowercase.includes("report") || lowercase.includes("write") || lowercase.includes("paper")) {
      return [
        "Outline introduction, methodology, and conclusion",
        "Draft the raw content blocks without self-editing",
        "Review data diagrams and insert proper captions",
        "Send draft to supervisor/mentor for early feedback",
        "Perform spelling checks and upload final PDF document"
      ];
    }
    return [
      "Define requirements and research instructions",
      "List immediate milestones and split into phases",
      "Spend 10 minutes drafting the first structural part",
      "Refine layout and compile intermediate draft",
      "Verify completion criteria and submit work"
    ];
  },

  schedule: (tasks: any[], peakHours: string, _availableHours: number = 8): any => {
    const blocks: any[] = [];
    const isCrisisMode = tasks.filter(t => t.status === "pending").length >= 3;
    let currentHour = 9; // Start schedule at 09:00 AM

    // Mock hourly block allocations
    const pendingTasks = tasks.filter(t => t.status === "pending");
    
    // Add sleep blocks or off-hours
    blocks.push({
      id: "b_sleep",
      type: "sleep",
      title: "Rest & Sleep",
      startTime: "00:00",
      endTime: "07:30",
      duration: 450
    });

    blocks.push({
      id: "b_morning_routine",
      type: "break",
      title: "Morning Routine",
      startTime: "07:30",
      endTime: "09:00",
      duration: 90
    });

    if (isCrisisMode) {
      // Emergency schedule hourly layout
      pendingTasks.forEach((task, idx) => {
        const start = currentHour;
        const end = currentHour + 2;
        blocks.push({
          id: `b_crisis_${idx}`,
          type: "work",
          title: `Crisis: ${task.title}`,
          startTime: `${String(start).padStart(2, "0")}:00`,
          endTime: `${String(end).padStart(2, "0")}:00`,
          duration: 120,
          taskId: task.id
        });
        
        // Add a crisis rest block
        blocks.push({
          id: `b_crisis_break_${idx}`,
          type: "break",
          title: "Micro Recovery Break",
          startTime: `${String(end).padStart(2, "0")}:00`,
          endTime: `${String(end).padStart(2, "0")}:15`,
          duration: 15
        });
        
        currentHour = end + 0.25; // advance current hour (15 mins break)
      });
    } else {
      // Normal schedule: allocate tasks during Peak hours
      pendingTasks.forEach((task, idx) => {
        const start = currentHour;
        const duration = Math.min(2, task.duration || 1);
        const end = currentHour + duration;
        
        blocks.push({
          id: `b_normal_${idx}`,
          type: "work",
          title: task.title,
          startTime: `${String(start).padStart(2, "0")}:00`,
          endTime: `${String(Math.floor(end)).padStart(2, "0")}:${end % 1 === 0 ? "00" : "30"}`,
          duration: duration * 60,
          taskId: task.id
        });
        
        // Break block
        blocks.push({
          id: `b_break_${idx}`,
          type: "break",
          title: "Mental Decompression",
          startTime: `${String(Math.floor(end)).padStart(2, "0")}:${end % 1 === 0 ? "00" : "30"}`,
          endTime: `${String(Math.floor(end + 0.5)).padStart(2, "0")}:${(end + 0.5) % 1 === 0 ? "00" : "30"}`,
          duration: 30
        });

        currentHour = end + 0.5;
      });
    }

    return {
      blocks,
      isCrisisMode,
      conflictResolver: isCrisisMode 
        ? "Conflict: High volume of tasks colliding tomorrow. Actioned emergency recovery blocking." 
        : "Tradeoffs: Allocated tasks during your peak productivity time (" + peakHours + ")."
    };
  },

  delaySimulation: (task: any, allTasks: any[]): any => {
    const delayImpacts = [
      "Reduces sleep budget tonight by approximately 1.5 hours.",
      `Overlaps with upcoming "${allTasks.find(t => t.id !== task.id)?.title || "next task"}" deadline.`,
      "Increases overall risk score of remaining tasks by +14% due to backloading.",
    ];
    return {
      impacts: delayImpacts,
      recommendation: "Complete this task today. Postponing creates an immediate study block overlap.",
      riskLevel: "HIGH"
    };
  },

  draft: (title: string, _category: string): string => {
    const lowercase = title.toLowerCase();
    if (lowercase.includes("email") || lowercase.includes("professor") || lowercase.includes("extension")) {
      return `Subject: Request for Brief Assignment Extension - [Your Name]

Dear Professor [Name],

I hope you are having a productive week.

I am writing to respectfully request a 24-hour extension on the [Assignment Name] due on [Date]. Due to an unexpected overlap in exams and high-priority commitments, I want to ensure my submission meets the academic standards of your course.

Thank you very much for your understanding and consideration.

Best regards,
[Your Name]
[Student ID]`;
    }
    
    if (lowercase.includes("slack") || lowercase.includes("team") || lowercase.includes("update")) {
      return `Hey team, 

Quick update on the progress:
I'm currently finalising the core implementation and database layers. I expect to be fully done with this milestone within the next two hours, at which point I will push the codebase and trigger the deployment. 

Let me know if anyone has questions!`;
    }

    return `Hi [Contact],

I'm currently working on "${title}". I'm on track and will follow up with the completed files shortly. Let me know if there's any additional context I should incorporate.

Thanks,
[Your Name]`;
  },

  coach: (messages: any[]): string => {
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
    if (lastMsg.includes("procrastinate") || lastMsg.includes("lazy") || lastMsg.includes("start")) {
      return "I hear you, starting is always the hardest part. Let's make an agreement: don't think about the whole task right now. Let's do a 2-minute micro-step: open your compiler, write a single line, or write just one heading on a sheet. I will start a 2-minute timer for you now. Just focus on that single micro-step. Ready?";
    }
    if (lastMsg.includes("plan") || lastMsg.includes("weekend")) {
      return "Let's structure a custom layout for you! I recommend putting your heaviest task in the morning (when your energy is highest), followed by a solid block of rest, and reviewing your checklist at night. How does that sound?";
    }
    return "Hi there! I am your DeadlineAI Executive Productivity Coach. I don't just remind you of tasks; I help you debug your procrastination patterns. Tell me, what task is stressing you out right now?";
  },

  summary: (completed: number, postponed: number, pendingTasks: any[]): any => {
    const risks = pendingTasks.map(t => `"${t.title}" due in ${Math.round((new Date(t.deadline).getTime() - Date.now()) / (1000 * 60 * 60))}h`);
    return {
      completedCount: completed,
      postponedCount: postponed,
      risksForTomorrow: risks.length > 0 ? risks : ["No immediate deadline threats!"],
      recommendedActionBeforeBed: "Review the focus sequence and sleep at least 7 hours to ensure high cognitive performance tomorrow."
    };
  }
};

// Helper function to get next day of week (0 = Sunday, 1 = Monday, etc.)
function getNextDayOfWeek(dayOfWeek: number) {
  const resultDate = new Date();
  resultDate.setDate(resultDate.getDate() + (dayOfWeek + 7 - resultDate.getDay()) % 7);
  return resultDate.toISOString().split("T")[0];
}
