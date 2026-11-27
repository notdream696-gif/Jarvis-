
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

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

// JARVIS AI
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "GROQ_API_KEY is missing"
      });
    }

    const messages = [
      {
        role: "system",
        content: `
أنت JARVIS، مساعد ذكاء اصطناعي متقدم.

قواعد الحديث:
- افهم المستخدم مهما كانت لهجته، بما فيها اللهجة العراقية.
- أجب دائماً باللغة العربية الفصحى الحديثة.
- لا تستخدم اللهجة العراقية في إجاباتك.
- استخدم جملاً عربية طبيعية وواضحة وسهلة النطق.
- تجنب الكلمات العامية والاختصارات.
- اكتب الأرقام والكلمات بطريقة مناسبة للنطق الصوتي.
- لا تستخدم التشكيل إلا عند الحاجة لتوضيح النطق.
- اجعل إجاباتك مختصرة ومباشرة.
- لا تستخدم الإيموجي أو الزخارف.
- لا تكرر السؤال في الإجابة.
- لا تدّعِ أنك نفذت شيئاً لم تنفذه.
        `
      },
      ...history.slice(-12),
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
          messages,
          temperature: 0.5
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      answer: data.choices[0].message.content
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// FISH AUDIO
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;

    if (!process.env.FISH_API_KEY || !process.env.FISH_VOICE_ID) {
      return res.status(500).json({
        error: "Fish Audio environment variables are missing"
      });
    }

    if (!text) {
      return res.status(400).json({
        error: "Text is required"
      });
    }

    const response = await fetch(
      "https://api.fish.audio/v1/tts",
      {
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
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({
        error: error
      });
    }

    const audio = await response.arrayBuffer();

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(Buffer.from(audio));

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = app;
