// app/api/chat/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NEARSERVE_CONTEXT } from "@/lib/nearserve-data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-pro for stable and reliable responses
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: NEARSERVE_CONTEXT }], // Feed the project info as the first message
        },
        {
          role: "model",
          parts: [
            {
              text: "Understood. I am ready to answer questions about NearServe.",
            },
          ],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch response" },
      { status: 500 }
    );
  }
}
