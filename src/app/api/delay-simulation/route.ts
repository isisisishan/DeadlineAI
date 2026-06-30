import { NextResponse } from "next/server";
import { aiClient, isGeminiConfigured, geminiFallback } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { task, allTasks } = await request.json();

    if (!task) {
      return NextResponse.json({ error: "Missing target task" }, { status: 400 });
    }

    if (!isGeminiConfigured || !aiClient) {
      const mockResult = geminiFallback.delaySimulation(task, allTasks || []);
      return NextResponse.json(mockResult);
    }

    const taskInfo = `
Task: ${task.title}
Deadline: ${task.deadline}
Estimated Duration: ${task.duration} hours
Urgency: ${task.urgency}
Category: ${task.category}
`;

    const otherTasksInfo = Array.isArray(allTasks) 
      ? allTasks.filter(t => t.id !== task.id).map(t => `- ${t.title} (Due: ${t.deadline}, Duration: ${t.duration}h, Urgency: ${t.urgency})`).join("\n")
      : "No other tasks.";

    const systemPrompt = `You are an AI Procrastination Counselor.
Analyze the impact of postponing a specific task to tomorrow or later.
Compute:
1. Sleep impact: If delayed, will they have to cut sleep tomorrow night? Estimate sleep loss.
2. Collision risk: Will it overlap with other scheduled tasks due soon?
3. Workload pressure: What happens to tomorrow's risk index?
4. Recommendation: Should they delay it or finish it now?
5. Risk Level: 'LOW', 'MEDIUM', or 'HIGH'.

Return a JSON object conforming to this schema:
{
  impacts: string[]; // 3-4 bullet points detailing specific impacts (e.g., 'Sleep decreases by 2 hours', 'DSA practice pushed')
  recommendation: string; // Encouraging but realistic advice
  riskLevel: "LOW" | "MEDIUM" | "HIGH"; // Overall risk level of postponing
}`;

    const userPrompt = `Target Task to delay:
${taskInfo}

Other current commitments:
${otherTasksInfo}

What happens if I delay this task today?`;

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

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in /api/delay-simulation:", error);
    return NextResponse.json({ error: error.message || "Failed to simulate delay" }, { status: 500 });
  }
}
