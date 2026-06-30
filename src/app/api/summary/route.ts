import { NextResponse } from "next/server";
import { aiClient, isGeminiConfigured, geminiFallback } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { completedCount, postponedCount, pendingTasks } = await request.json();

    if (!Array.isArray(pendingTasks)) {
      return NextResponse.json({ error: "Pending tasks must be an array" }, { status: 400 });
    }

    if (!isGeminiConfigured || !aiClient) {
      const mockResult = geminiFallback.summary(completedCount, postponedCount, pendingTasks);
      return NextResponse.json(mockResult);
    }

    const tasksData = pendingTasks.map(t => `- "${t.title}" (Due: ${t.deadline}, Urgency: ${t.urgency}, Duration: ${t.duration}h)`).join("\n");

    const systemPrompt = `You are an AI Executive summary planner.
Analyze the user's progress for today and their upcoming risks for tomorrow.
Generate a JSON object conforming exactly to this structure:
{
  completedCount: number; // Echo the count
  postponedCount: number; // Echo the count
  risksForTomorrow: string[]; // List of 2-3 specific scheduling risks based on remaining tasks and deadlines
  recommendedActionBeforeBed: string; // One single highly actionable recommendation before going to sleep (e.g. 'Pack your laptop', 'Draft extension email outline', 'Review OS cheatsheet for 5 mins')
}

Ensure valid JSON output. No markdown wrappers.`;

    const userPrompt = `Today's Stats:
- Completed Tasks: ${completedCount}
- Postponed/Delayed Tasks: ${postponedCount}

Remaining Pending Tasks for Tomorrow:
${tasksData || "None!"}

Generate my End-of-Day Summary.`;

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
    console.error("Error in /api/summary:", error);
    return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 });
  }
}
