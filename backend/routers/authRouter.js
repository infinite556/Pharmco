import express from "express";
import {
  login,
  logout,
  logoutAll,
  me,
  refresh,
  register,
} from "../controllers/authController.js";
import { protect } from "../middleware/protect.js";
import { validateOrigin } from "../middleware/csrf.js";

export const authRouter = express.Router();

authRouter.use(validateOrigin);
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.post("/logout-all", protect, logoutAll);
authRouter.get("/me", protect, me);
