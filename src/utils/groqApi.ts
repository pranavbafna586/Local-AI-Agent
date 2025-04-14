import axios from "axios";

// Get GROQ API key from environment variables
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || "";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Query the GROQ API with a question and document context
 * @param question - The user's question
 * @param documentContent - The extracted document content
 * @param chatHistory - Previous conversation messages
 * @returns The AI's response to the question
 */
export const queryGroqAPI = async (
  question: string,
  documentContent: string,
  chatHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> => {
  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ API key not found. Please check your environment variables."
    );
  }

  try {
    // Prepare the messages array
    const messages: Message[] = [
      {
        role: "system",
        content: `You are a helpful assistant that answers questions based on the provided document content. 
                  Only answer based on the information in the document. If the answer is not in the document, 
                  say that you don't have enough information to answer the question.
                  Document content: ${documentContent}`,
      },
      ...chatHistory.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: "user", content: question },
    ];

    // Call the GROQ API
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages,
        temperature: 0.5,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error querying GROQ API:", error);
    throw new Error("Failed to get response from GROQ AI");
  }
};
