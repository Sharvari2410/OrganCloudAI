import express from "express";
import { users } from "../config/authUsers.js";
import { signToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = users.find((item) => item.email === email && item.password === password);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

router.get("/demo-users", (_req, res) => {
  res.json(
    users.map((user) => ({ email: user.email, password: user.password, role: user.role, name: user.name }))
  );
});

export default router;
