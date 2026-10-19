import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";


const app = express();

// ---------- middleware ----------
app.use(cors());
app.use(express.json());

// ---------- health check ----------
app.get("/", (req, res) => {
  res.send("API running");
});

// ---------- routes ----------
app.use("/auth", authRoutes);
app.use("/transactions", transactionRoutes);
app.use("/ai", aiRoutes);

// ---------- server ----------
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
