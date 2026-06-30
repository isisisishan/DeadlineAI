import { NextResponse } from "next/server";
import { aiClient, isGeminiConfigured } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { activeGoal, availableHours, peakFocusWindow, currentDate, smartBufferSlots } = await request.json();

    const systemPrompt = `You are a universal lifestyle organizer and professional Executive Productivity Coach. You plan any real-world activity type (entertainment, lifestyle, fitness, social, academic, or professional).
Today's date is: ${currentDate}.
Take this input goal from the user: "${activeGoal}" along with their schedule parameters: "${availableHours} hours available, peak focus window during the ${peakFocusWindow}". 

You must adapt your step generation styles dynamically to match the activity:
- If gaming/movies/entertainment: Generate relaxation, setup, or viewing intervals (e.g., "Install game updates", "Grab snacks & set up stream").
- If meeting/work: Generate prep and review intervals (e.g., "Review agenda points", "Execute call & log action items").
- If academic: Generate practical study steps.

You are highly typo-tolerant. Intelligently infer the true intent of any misspelled words or shorthand. Correct the spelling silently in your brain and ensure that the titles generated for the final roadmap list cards feature perfectly corrected capitalization and spelling.

Analyze the input goal string to extract the intended date and time context. 
- Date Logic: If the user says "tomorrow", compute tomorrow's calendar date based on today's date. If no day is specified or they say "today", default to today's date (${currentDate}).
- Time Logic (Explicit Overrides): Inspect the text for specific time declarations (e.g., "at 8pm", "from 4:30 PM", "around 11 AM"). If an explicit time is detected, completely ignore the "Peak Focus Window" preference. You MUST anchor the very first task step exactly at that requested timestamp (e.g., "08:00 PM") and calculate the subsequent steps sequentially from there. 
If NO explicit time is found, map exact start and end times based on the "Peak Focus Window":
  - Morning: Starts sequentially from 08:00 AM.
  - Afternoon: Starts sequentially from 12:00 PM.
  - Night: Starts sequentially from 06:00 PM.

Energy Deficit Constraints: Actively scan the objective text for energy warnings (e.g., "focus crash at 7 PM", "tired in afternoon"). When detected, automatically schedule low-cognitive tasks (like printing, formatting, packing) or a dedicated buffer slot during that specific window, moving high-intensity work to a higher energy period.
Next-Day Boundary Safeguard: If the user selects the "Night" window, you MUST NOT push consecutive task intervals past 02:00 AM (a realistic human recovery boundary) UNLESS the user explicitly types commands like "all-nighter" or "until morning" in their input.

${smartBufferSlots ? "Inject a 15-minute buffer gap between the endTime of one step and the startTime of the next." : "Do not inject any buffer gaps between steps. Start the next step exactly when the previous ends."}

Break this task down into exactly 4 logical, sequential, highly practical steps. Do not use corporate jargon.
Return the response strictly as a clean, parseable JSON object matching this schema: 
{
  "targetDate": "YYYY-MM-DD",
  "steps": [
    { "id": "step-1", "title": "Step text here", "durationHours": 1.5, "priority": "High", "type": "personal", "startTime": "12:00 PM", "endTime": "01:30 PM" }
  ]
}

Valid priority values: "High", "Medium", "Low".
Valid type values (Dynamic Color Category Tagging based on activity type): "study", "project", "personal", "meeting", "assignment", "hackathon", "workout". For example, movies or gaming should automatically return "type": "personal".
Ensure the output is ONLY the JSON object.`;

    const fallbackResponse = () => {
      let mockDate = currentDate || new Date().toISOString().split('T')[0];
      const goalLower = activeGoal?.toLowerCase() || "";
      if (goalLower.includes("tomorrow")) {
        const d = new Date(mockDate);
        d.setDate(d.getDate() + 1);
        mockDate = d.toISOString().split('T')[0];
      }

      let currentHour = peakFocusWindow === 'morning' ? 8 : peakFocusWindow === 'afternoon' ? 12 : 18;
      let currentMin = 0;
      
      const mockSteps = [
        { id: "step-1", title: "Review Core Theory & Formulas", durationHours: 1.5, priority: "High", type: "study", checked: true },
        { id: "step-2", title: "Solve Textbook Exercises & Examples", durationHours: 2, priority: "High", type: "assignment", checked: true },
        { id: "step-3", title: "Practice Speed Drills", durationHours: 1.5, priority: "Medium", type: "study", checked: true },
        { id: "step-4", title: "Self-Assessment Quiz", durationHours: 1, priority: "Medium", type: "personal", checked: true }
      ].map(step => {
        const startH = currentHour;
        const startM = currentMin;
        
        let endH = currentHour + Math.floor(step.durationHours);
        let endM = currentMin + (step.durationHours % 1) * 60;
        if (endM >= 60) {
          endH += Math.floor(endM / 60);
          endM = endM % 60;
        }

        const formatT = (h: number, m: number) => {
          const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
          const h12 = h % 12 === 0 ? 12 : h % 12;
          return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
        };
        
        const startTime = formatT(startH, startM);
        const endTime = formatT(endH, endM);
        
        currentHour = endH;
        currentMin = endM;
        if (smartBufferSlots) {
          currentMin += 15;
          if (currentMin >= 60) {
            currentHour += Math.floor(currentMin / 60);
            currentMin = currentMin % 60;
          }
        }
        
        return { ...step, startTime, endTime };
      });

      return NextResponse.json({ targetDate: mockDate, steps: mockSteps });
    };

    if (!isGeminiConfigured || !aiClient) {
      return fallbackResponse();
    }

    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: "Generate the roadmap." }] }] as any,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json"
        }
      });

      let replyText = response.text || '{"targetDate": "2026-06-28", "steps": []}';
      replyText = replyText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const payload = JSON.parse(replyText);
      
      const stepsWithChecked = (payload.steps || []).map((s: any, idx: number) => ({ 
        ...s, 
        id: s.id || `step-${idx+1}`,
        checked: true 
      }));

      return NextResponse.json({ targetDate: payload.targetDate, steps: stepsWithChecked });
    } catch (genError) {
      console.error("Gemini API Error or Parse Error:", genError);
      return fallbackResponse();
    }
  } catch (error: any) {
    console.error("Error in /api/planner:", error);
    return NextResponse.json({ error: error.message || "Failed to generate roadmap" }, { status: 500 });
  }
}
