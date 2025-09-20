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
    const text =
      resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      resp?.candidates?.[0]?.content?.parts?.[0]?.text ??
      resp?.response?.candidates?.[0]?.content?.text;
    return text ?? JSON.stringify(resp, null, 2);
  } catch (error) {
    console.error(error);
    return JSON.stringify(resp, null, 2);
  }
};

app.use(cors()); // use() ---> panggil / bikin middleware
//app.use(cors() => {}); // pakai bikin middleware sendiri
app.use(express.json()); //untuk memperblehkan kita menggunakan "Content-Type: application/ json" di header

app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0)
      throw new error("Pesan harus berupa Array!!");
    const contents = messages.map((message) => ({
      role: message.role,
      parts: [{ text: message.content }],
    }));
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//panggil app nya di sini
app.listen(port, () => {
  console.log(`Aplikasi gemini-chatbot-api berjalan di port ${port}`);
});
