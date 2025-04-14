import mongoose, { Schema } from "mongoose";

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface IChatHistory {
  sessionId: string;
  documentName?: string;
  documentType?: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  role: { type: String, required: true, enum: ["user", "assistant"] },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatHistorySchema = new Schema<IChatHistory>({
  sessionId: { type: String, required: true, unique: true },
  documentName: { type: String },
  documentType: { type: String },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the timestamps when a document is modified
chatHistorySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Use MongoDB models only on the server side
const ChatHistory =
  mongoose.models.ChatHistory ||
  mongoose.model<IChatHistory>("ChatHistory", chatHistorySchema);

export default ChatHistory;
