import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const ai = new GoogleGenAI({});
const port = 3000;
const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Extracts text from a Gemini API response, handling various possible structures.
 * This approach ensures compatibility with different SDK versions and possible
 * multimodal response formats. If the text cannot be found, it gracefully
 * falls back to returning the entire response as a formatted JSON string
 * for easier debugging.
 *
 * @param {object} resp The response object from the Gemini API.
 * @returns {string} The extracted text or the full response as a JSON string.
 */
const extractText = (resp) => {
  try {
    // Use the built-in `text()` accessor if available, otherwise fallback to manual extraction.
    const text = resp.text ?? resp?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ?? JSON.stringify(resp, null, 2);
  } catch (error) {
    console.error(error);
    return JSON.stringify(resp, null, 2);
  }
};

app.use(cors()); // use() ---> panggil / bikin middleware
//app.use(cors() => {}); // pakai bikin middleware sendiri
app.use(express.json()); //untuk memperblehkan kita menggunakan "Content-Type: application/ json" di header

// Middleware untuk menyajikan file statis dari folder 'public'
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
  try {
    // Buat salinan dari messages agar array asli tidak termodifikasi
    const messages = [...req.body.messages];

    // Validate that messages is an array
    if (!messages || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({ error: "Input 'messages' must be an array." });
    }

    // The user's prompt is the last message in the history
    const lastMessage = messages.pop();
    if (!lastMessage || lastMessage.role !== "user") {
      return res.status(400).json({
        error: "The last message in the history must be from the 'user'.",
      });
    }

    // The `ai.chats.create` method is the correct way to start a chat session
    // with the @google/genai SDK. It takes the model and the history.
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      history: messages,
    });

    // Send the last message to the model. The `sendMessage` method expects
    // an object with a `message` property containing the parts.
    const result = await chat.sendMessage({ message: lastMessage.parts });

    // Extract the AI's response text
    const aiResponse = extractText(result);

    res.json({
      result: aiResponse,
    });
  } catch (error) {
    console.error("Error processing chat:", error);
    res.status(500).json({
      error:
        "An internal server error occurred while processing the chat request.",
    });
  }
});

//panggil app nya di sini
app.listen(port, () => {
  console.log(`Aplikasi gemini-chatbot-api berjalan di port ${port}`);
});
