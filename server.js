
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const SYSTEM_PROMPT = `
أنت JARVIS مساعد ذكاء اصطناعي شخصي.
أجب باختصار ووضوح.
استخدم اللهجة العراقية الطبيعية.
تجنب الرموز والزخارف والإيموجي.
لا تطل الإجابة إلا إذا طُلب منك.
كن مباشراً وطبيعياً
اذا كانت الكلمه فيها اخطاء املائيه صححها وجاوب.
`;

app.get("/", (req, res) => {
  res.json({ name: "JARVIS Backend", status: "running" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "jarvis-backend" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const safeHistory = Array.isArray(history)
      ? history.filter(item =>
          item &&
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string"
        )
      : [];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...safeHistory,
            { role: "user", content: String(message) }
          ],
          temperature: 0.6,
          max_tokens: 500
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Groq request failed" });
    }

    const answer =
      data.choices?.[0]?.message?.content || "ما كدرت أطلع إجابة";

    res.json({ answer });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
});

// Fish Audio text to speech
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    if (!process.env.FISH_API_KEY || !process.env.FISH_VOICE_ID) {
      return res.status(500).json({ error: "Fish Audio settings are missing" });
    }

    const response = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FISH_API_KEY}`,
        "Content-Type": "application/json",
        "model": "s2.1-pro-free"
      },
      body: JSON.stringify({
        text: text.slice(0, 3000),
        reference_id: process.env.FISH_VOICE_ID,
        format: "mp3"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fish Audio Error:", errorText);
      return res.status(response.status).json({
        error: "Fish Audio generation failed"
      });
    }

    const audio = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audio.length);
    res.setHeader("Cache-Control", "no-store");

    res.send(audio);

  } catch (error) {
    console.error("TTS Error:", error);
    res.status(500).json({ error: "Audio generation failed" });
  }
});

module.exports = app;
