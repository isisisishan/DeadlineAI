import { NextResponse } from "next/server";
import { aiClient, isGeminiConfigured, geminiFallback } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { tasks, peakHours, previousOrder } = await request.json();

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: "Tasks list must be an array" }, { status: 400 });
    }

    if (tasks.length === 0) {
      return NextResponse.json({ tasks: [], explanation: "No tasks available to prioritize.", confidenceLevel: 100 });
    }

    const fallbackResponse = () => {
      const mockResult = geminiFallback.prioritize(tasks, peakHours);
      return NextResponse.json(mockResult);
    };

    if (!isGeminiConfigured || !aiClient) {
      return fallbackResponse();
    }

    // Prepare text representation of tasks for Gemini
    const tasksDetails = tasks.map((t, idx) => `
ID: ${t.id}
Title: ${t.title}
Deadline: ${t.deadline}
Estimated Hours: ${t.duration}
Urgency (1-5): ${t.urgency}
Category: ${t.category}
Dependencies: ${t.dependencies.join(", ") || "None"}
Status: ${t.status}
`).join("\n");

    const previousOrderDetails = previousOrder && Array.isArray(previousOrder) 
      ? `Previous prioritized order was:\n${previousOrder.map((t, idx) => `${idx + 1}. ${t.title} (ID: ${t.id})`).join("\n")}`
      : "No previous prioritization benchmark.";

    const systemPrompt = `You are a high-level Executive AI Scheduler. Your job is to analyze the user's workload and rank tasks.
Rank them from 1 (most critical, must do first) to N.
Consider:
1. Deadlines (closer deadlines have higher priority).
2. Urgency.
3. Dependencies (tasks that block others must be scheduled first).
4. Peak energy window: The user is most productive during the "${peakHours}" window. Schedule demanding tasks in this window.
5. Risk of failure: Compare estimated hours required vs. remaining hours before the deadline.

For each task in the prioritized list, you MUST output:
- priority: number (1 to N)
- riskScore: number (0 to 100, representing completion risk)
- riskReason: string (explaining the risk, e.g. 'Requires 4h, but only 2h free remain')
- confidence: number (0 to 100, representing your scheduling confidence)
- explanation: string (explaining 'Why this priority rank?')

Also output:
- tasks: The updated list of tasks with priority, riskScore, riskReason, confidence, and explanation fields.
- explanation: A global explanation of the priority sorting.
- confidenceLevel: A global sorting confidence level (0 to 100).
${previousOrder ? "- changeReason: A string explaining the changes between the previous order and this updated order." : ""}

Return a JSON object conforming exactly to this schema:
{
  tasks: Array<{
    id: string;
    priority: number;
    riskScore: number;
    riskReason: string;
    confidence: number;
    explanation: string;
  }>;
  explanation: string;
  confidenceLevel: number;
  changeReason?: string;
}`;

    const userPrompt = `Here are the current tasks:
${tasksDetails}

${previousOrderDetails}

Prioritize these tasks now.`;

    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: systemPrompt
        }
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(responseText);

      // Merge the AI rankings back into the original task details
      const prioritizedTasks = tasks.map((task: any) => {
        const rankInfo = data.tasks.find((t: any) => t.id === task.id);
        if (rankInfo) {
          return {
            ...task,
            priority: rankInfo.priority,
            riskScore: rankInfo.riskScore,
            riskReason: rankInfo.riskReason,
            confidence: rankInfo.confidence,
            explanation: rankInfo.explanation
          };
        }
        return {
          ...task,
          priority: 99,
          riskScore: 50,
          riskReason: "Not evaluated.",
          confidence: 50,
          explanation: "Ranked as lowest priority."
        };
      }).sort((a: any, b: any) => a.priority - b.priority);

      return NextResponse.json({
        tasks: prioritizedTasks,
        explanation: data.explanation,
        confidenceLevel: data.confidenceLevel,
        changeReason: data.changeReason
      });
    } catch (genError) {
      console.error("Gemini API Error or Parse Error:", genError);
      return fallbackResponse();
    }
  } catch (error: any) {
    console.error("Error in /api/prioritize:", error);
    return NextResponse.json({ error: error.message || "Failed to prioritize tasks" }, { status: 500 });
  }
}
