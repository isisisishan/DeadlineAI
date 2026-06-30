import { NextResponse } from "next/server";
import { aiClient, isGeminiConfigured, geminiFallback } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Missing task title" }, { status: 400 });
    }

    const fallbackResponse = () => {
      const mockSubtasksList = geminiFallback.decompose(title);
      const subtasks = mockSubtasksList.map((st, idx) => ({
        id: `sub_${Date.now()}_${idx}`,
        title: st,
        completed: false,
        duration: idx === 0 ? 0.05 : 0.5,
        isMicro: idx === 0
      }));
      return NextResponse.json({ subtasks });
    };

    if (!isGeminiConfigured || !aiClient) {
      return fallbackResponse();
    }

    const systemPrompt = `You are an expert Productivity Coach. Take a main task and decompose it into 4 to 6 smaller, actionable subtasks.
Crucially:
- The first subtask MUST be a 2-minute micro-step. It should be incredibly easy to start, requiring almost no mental friction (e.g. 'Open IDE and create one blank file', 'Write the email subject line', 'Open lecture slide 1').
- Mark this first task with "isMicro": true.
- Estimate the duration in hours (decimal, e.g. 0.05 for 2-3 minutes, 0.5 for 30 minutes, etc.) for each subtask.

Return a JSON object matching this schema:
{
  subtasks: Array<{
    title: string;
    duration: number; // estimated hours (e.g. 0.05, 0.5, 1.0)
    isMicro: boolean; // true ONLY for the first 2-minute starter step
  }>;
}`;

    const userPrompt = `Decompose the task: "${title}" ${description ? `(Description: ${description})` : ""}`;

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

      const subtasks = data.subtasks.map((st: any, idx: number) => ({
        id: `sub_${Date.now()}_${idx}`,
        title: st.title,
        completed: false,
        duration: st.duration,
        isMicro: st.isMicro || idx === 0
      }));

      return NextResponse.json({ subtasks });
    } catch (genError) {
      console.error("Gemini API Error or Parse Error:", genError);
      return fallbackResponse();
    }
  } catch (error: any) {
    console.error("Error in /api/decompose:", error);
    return NextResponse.json({ error: error.message || "Failed to decompose task" }, { status: 500 });
  }
}
