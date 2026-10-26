import AppError from "../utils/appError.js";

export const validateOrigin = (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (!origin) return next();
  const trusted = (process.env.TRUSTED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const sameOrigin = `${req.protocol}://${req.get("host")}`;
  if (!trusted.includes(origin) && origin !== sameOrigin) {
    return next(new AppError("Request origin is not allowed.", 403));
  }
  next();
};
