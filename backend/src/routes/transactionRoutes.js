import express from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all transactions for logged-in user
router.get("/", requireAuth, async (req, res) => {
  try {
    const txns = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { date: "desc" },
    });
    res.json(txns);
  } catch (err) {
    console.error("GET TRANSACTIONS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Add a transaction
router.post("/", requireAuth, async (req, res) => {
  try {
    const { date, amount, category, note } = req.body;
    if (!date || amount === undefined || !category) {
      return res.status(400).json({ error: "Missing date, amount, or category" });
    }

    const txn = await prisma.transaction.create({
      data: {
        userId: req.userId,
        date: new Date(date),
        amount: Number(amount),
        category,
        note: note || null,
      },
    });

    res.status(201).json(txn);
  } catch (err) {
    console.error("CREATE TRANSACTION ERROR:", err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

// Delete a transaction
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // make sure user owns it
    const txn = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });
    if (!txn) return res.status(404).json({ error: "Not found" });

    await prisma.transaction.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE TRANSACTION ERROR:", err);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

export default router;
