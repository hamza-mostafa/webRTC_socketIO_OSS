import express from "express";
import User from "../models/user.js";
import { sign } from "../utils/jwt.js";
const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password, interests } = req.body;
  const u = new User({ email, interests });
  await u.setPassword(password);
  await u.save();
  res.json({ token: sign({ id: u.id, interests }) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email });
  if (!u || !(await u.checkPassword(password)))
    return res.status(401).json({ error: "Invalid" });
  res.json({ token: sign({ id: u.id, interests: u.interests }) });
});


export default router;
