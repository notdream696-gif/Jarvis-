require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors()); // أثناء التطوير؛ نقيّد المصادر قبل إطلاق التطبيق للعامة
app.use(express.json({ limit: "1mb" }));

app.use("/api/", rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

app.get("/", (_req, res) => {
  res.json({ name: "JARVIS Backend", status: "running" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "jarvis-backend" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "اكتب رسالة صحيحة." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        error: "خدمة الذكاء الاصطناعي غير مفعّلة بعد. أضف GROQ_API_KEY في Environment."
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter(item =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
          )
          .slice(-10)
          .map(item => ({
            role: item.role,
            content: item.content.slice(0, 4000)
          }))
      : [];

    const model = process.env.GROQ_MODEL;
    if (!model) {
      return res.status(503).json({
        error: "أضف اسم موديل متاح في متغير GROQ_MODEL."
      });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "أنت JARVIS، مساعد ذكي. أجب باللغة التي يستخدمها المستخدم، وكن واضحاً ودقيقاً. لا تدّعِ أنك نفذت إجراءً على الهاتف إذا لم يحدث فعلاً."
          },
          ...safeHistory,
          { role: "user", content: message.trim().slice(0, 4000) }
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Groq API error:", response.status, data);
      return res.status(502).json({
        error: "صار خطأ من خدمة الذكاء الاصطناعي.",
        providerStatus: response.status
      });
    }

    const answer = data.choices?.[0]?.message?.content;
    if (!answer) {
      return res.status(502).json({ error: "الخدمة رجّعت جواب فارغ." });
    }

    return res.json({ answer });
  } catch (error) {
    console.error("Server error:", error.message);
    return res.status(500).json({ error: "صار خطأ داخلي بالسيرفر." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`JARVIS backend running on port ${PORT}`);
});
