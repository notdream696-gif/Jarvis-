
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const SYSTEM_PROMPT = `
أنت JARVIS مساعد ذكاء اصطناعي شخصي.

أجب باختصار ووضوح.
استخدم اللهجة العراقية الطبيعية عند التحدث بالعربية.
لا تستخدم الرموز والزخارف مثل + - • $ # أو الإيموجي.
لا تستخدم القوائم إلا إذا طلب المستخدم.
لا تكرر السؤال.
لا تطل الإجابة إلا إذا طلب المستخدم شرحاً مفصلاً.
كن مباشراً وطبيعياً.
أجب بنفس لغة المستخدم.
`;

app.get("/", (req, res) => {
  res.json({
    name: "JARVIS Backend",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "jarvis-backend"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "Groq API key is missing"
      });
    }

    const safeHistory = Array.isArray(history)
      ? history.filter(item =>
          item &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string"
        )
      : [];

    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      ...safeHistory,
      {
        role: "user",
        content: String(message)
      }
    ];

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
          messages,
          temperature: 0.6,
          max_tokens: 500
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq Error:", data);
      return res.status(response.status).json({
        error: "AI request failed"
      });
    }

    const answer =
      data.choices?.[0]?.message?.content || "ما كدرت أطلع إجابة";

    return res.json({ answer });

  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

module.exports = app;
