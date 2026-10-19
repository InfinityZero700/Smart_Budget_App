// backend/src/routes/aiRoutes.js

import express from "express";
import OpenAI from "openai";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

const openai =
  process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

router.post("/insights", requireAuth, async (req, res) => {
  try {
    // ---------- fetch last 30 days of transactions ----------
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const txns = await prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: since } },
      orderBy: { date: "desc" },
    });

    // ---------- category totals + totals ----------
    const categoryTotals = {};
    let totalSpent30d = 0;

    for (const t of txns) {
      const amt = Number(t.amount) || 0;
      totalSpent30d += amt;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
    }

    totalSpent30d = Math.round(totalSpent30d * 100) / 100;

    // ---------- baseline safe-to-spend math ----------
    const avgDaily = totalSpent30d / 30;

    // Weekend adjustment (Sat=6, Sun=0)
    const day = new Date().getDay();
    const weekendMultiplier = day === 0 || day === 6 ? 0.75 : 1.0;

    // Floor + cap so it feels human
    const floor = 5; // once user has any spending history, don’t show tiny numbers
    const capMultiplier = 1.2; // never suggest more than 120% of avg daily

    let baseline = avgDaily * 0.8 * weekendMultiplier;

    // If user has some activity, apply floor
    if (totalSpent30d > 0) baseline = Math.max(floor, baseline);

    // Cap it to avoid silly highs
    const cap = Math.max(floor, avgDaily * capMultiplier);
    baseline = Math.min(baseline, cap);

    baseline = Math.round(baseline * 100) / 100;
    baseline = Math.max(0, baseline);

    // ---------- smoothing (EWMA) using last snapshot ----------
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateKey = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const snapshotId = `${req.userId}-${dateKey}`;

    const last = await prisma.dailySnapshot.findFirst({
      where: { userId: req.userId },
      orderBy: { date: "desc" },
    });

    let smoothed = baseline;
    if (last?.safeSpend !== undefined && last?.safeSpend !== null) {
      const alpha = 0.35; // 0.2–0.4 is a good range
      smoothed = alpha * baseline + (1 - alpha) * Number(last.safeSpend);
      smoothed = Math.round(smoothed * 100) / 100;
      smoothed = Math.max(0, smoothed);
    }

    // Save today's snapshot (simple MVP id strategy)
    await prisma.dailySnapshot.upsert({
      where: { id: snapshotId },
      update: { safeSpend: smoothed, date: today },
      create: { id: snapshotId, userId: req.userId, date: today, safeSpend: smoothed },
    });

    // ---------- AI summary + alerts ----------
    // If no OpenAI key, still return deterministic output
    if (!openai) {
      return res.json({
        safeToSpendToday: smoothed,
        summary:
          totalSpent30d === 0
            ? "Add a few transactions to get a meaningful daily spending number."
            : "Here’s your spending snapshot for the last 30 days.",
        alerts:
          totalSpent30d === 0
            ? ["No recent spending data found. Add transactions to improve accuracy."]
            : [],
        topLeak:
          Object.keys(categoryTotals).length
            ? Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0]
            : "Unknown",
        categoryTotals,
        totalSpent30d,
      });
    }

    // Keep AI input small (avoid huge prompts)
    const txnLines = txns
      .slice(0, 60)
      .map(
        (t) =>
          `- ${new Date(t.date).toISOString().slice(0, 10)} | ${t.category} | $${Number(t.amount).toFixed(
            2
          )} | ${t.note || ""}`
      )
      .join("\n");

    const catLines = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([k, v]) => `- ${k}: $${Number(v).toFixed(2)}`)
      .join("\n");

    const prompt = `
You are a supportive money coach.

Recent transactions (last 30 days, most recent first):
${txnLines || "- (none)"}

Category totals (30d):
${catLines || "- (none)"}

System baseline safe-to-spend-today estimate: $${smoothed.toFixed(2)}

Return JSON ONLY with keys:
summary (string, 1-2 sentences, friendly),
alerts (array of short strings, max 4),
safeToSpendToday (number; can equal baseline or adjust slightly but do not exceed baseline by more than 20%),
topLeak (string; a category name or "Unknown").
`;

    let ai = {};
    try {
      const resp = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 250,
      });

      ai = JSON.parse(resp.choices?.[0]?.message?.content || "{}");
    } catch (e) {
      // If the AI call fails, fall back to deterministic output
      ai = {};
    }

    // Enforce safety rules on AI output
    const aiSafe = Number(ai.safeToSpendToday);
    let finalSafe = Number.isFinite(aiSafe) ? aiSafe : smoothed;

    // Clamp: never negative, never > baseline*1.2
    finalSafe = Math.max(0, finalSafe);
    finalSafe = Math.min(finalSafe, Math.round(smoothed * 1.2 * 100) / 100);
    finalSafe = Math.round(finalSafe * 100) / 100;

    const topLeak =
      typeof ai.topLeak === "string" && ai.topLeak.trim()
        ? ai.topLeak.trim()
        : Object.keys(categoryTotals).length
        ? Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0]
        : "Unknown";

    res.json({
      safeToSpendToday: finalSafe,
      summary:
        typeof ai.summary === "string" && ai.summary.trim()
          ? ai.summary.trim()
          : totalSpent30d === 0
          ? "Add a few transactions to get a meaningful daily spending number."
          : "Here’s your spending snapshot for the last 30 days.",
      alerts: Array.isArray(ai.alerts) ? ai.alerts.slice(0, 4) : [],
      topLeak,
      categoryTotals,
      totalSpent30d,
    });
  } catch (err) {
    console.error("AI INSIGHTS ERROR:", err);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

export default router;
