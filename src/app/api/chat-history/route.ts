import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connection";
import ChatHistory from "@/models/ChatHistory";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      // Get a specific chat history
      const chatHistory = await ChatHistory.findOne({ sessionId });
      return NextResponse.json(chatHistory || { messages: [] });
    } else {
      // Get all chat histories (limit to 20 most recent)
      const chatHistories = await ChatHistory.find()
        .sort({ updatedAt: -1 })
        .limit(20);
      return NextResponse.json(chatHistories);
    }
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();
    const { sessionId, documentName, documentType, messages } = data;

    if (!sessionId || !messages) {
      return NextResponse.json(
        { error: "SessionId and messages are required" },
        { status: 400 }
      );
    }

    // Upsert - create if not exists, update if exists
    const chatHistory = await ChatHistory.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        documentName,
        documentType,
        messages,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(chatHistory);
  } catch (error) {
    console.error("Error saving chat history:", error);
    return NextResponse.json(
      { error: "Failed to save chat history" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "SessionId is required" },
        { status: 400 }
      );
    }

    const result = await ChatHistory.findOneAndDelete({ sessionId });

    if (!result) {
      return NextResponse.json(
        { error: "Chat history not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat history:", error);
    return NextResponse.json(
      { error: "Failed to delete chat history" },
      { status: 500 }
    );
  }
}
