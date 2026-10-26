import { User } from "../models/userModel.js";
import {
  accessCookieName,
  getCookie,
  verifyAccessToken,
} from "../services/authServices.js";
import AppError from "../utils/appError.js";

export const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : getCookie(req, accessCookieName());
    if (!token) throw new AppError("Authentication required.", 401);
    const payload = verifyAccessToken(token);
    const user = await User.findOne({ _id: payload.sub, isActive: true });
    if (!user) throw new AppError("Authentication required.", 401);
    req.user = user;
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError("Authentication required.", 401),
    );
  }
};
