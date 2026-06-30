import { NextResponse } from "next/server";
import { aiClient, isGeminiConfigured, geminiFallback } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { tasks, peakHours, availableHours = 8 } = await request.json();

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: "Tasks must be an array" }, { status: 400 });
    }

    if (!isGeminiConfigured || !aiClient) {
      const mockResult = geminiFallback.schedule(tasks, peakHours, availableHours);
      return NextResponse.json(mockResult);
    }

    const tasksData = tasks.filter(t => t.status === "pending").map(t => `
ID: ${t.id}
Title: ${t.title}
Deadline: ${t.deadline}
Estimated Hours: ${t.duration}
Urgency: ${t.urgency}
Dependencies: ${t.dependencies.join(", ") || "None"}
`).join("\n");

    const systemPrompt = `You are an AI Executive Day Scheduler.
Create an optimized daily timeline for the user based on their pending tasks, peak energy hours ("${peakHours}"), and available hours (${availableHours} hours total).

RULES:
1. Schedule high-duration or complex tasks during the user's peak hours (${peakHours}).
2. Insert 15-30 minute breaks after every 1-2 hours of work.
3. If multiple deadlines collide (e.g. 3 or more urgent tasks due within 24 hours), activate "Crisis Mode" (hourly emergency recovery schedule).
4. Identify conflicts (e.g., two tasks due at the same time) and output a "conflictResolver" explanation describing which task to perform first and the tradeoffs made.
5. Blocks can have type: 'work' | 'break' | 'buffer' | 'sleep'.
6. Sleep block should generally span 00:00 to 07:30.
7. Output start and end times in HH:MM format.

Return a JSON object conforming to this schema:
{
  isCrisisMode: boolean; // True if deadlines collide and an hourly emergency schedule is needed
  conflictResolver: string; // Explaining conflicts and rationale for which task is prioritized first
  blocks: Array<{
    type: "work" | "break" | "buffer" | "sleep";
    title: string;       // Block title (e.g., task title, or "Coffee Break", "Sleep")
    startTime: string;   // HH:MM
    endTime: string;     // HH:MM
    duration: number;    // duration in minutes
    taskId?: string;     // If type is 'work', specify the task ID
  }>;
}`;

    const userPrompt = `Here are my tasks:
${tasksData || "No pending tasks."}

My available study/work hours for today is ${availableHours} hours.
My peak energy hours are in the ${peakHours}.
Create my schedule.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: systemPrompt
      }
    });

    const responseText = response.text || "{}";
    const data = JSON.parse(responseText.trim());

    // Ensure blocks have IDs
    const blocksWithIds = data.blocks.map((b: any, idx: number) => ({
      ...b,
      id: `block_${Date.now()}_${idx}`
    }));

    return NextResponse.json({
      blocks: blocksWithIds,
      isCrisisMode: data.isCrisisMode,
      conflictResolver: data.conflictResolver
    });
  } catch (error: any) {
    console.error("Error in /api/schedule:", error);
    return NextResponse.json({ error: error.message || "Failed to generate schedule" }, { status: 500 });
  }
}
