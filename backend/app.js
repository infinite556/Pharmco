import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/connectDB.js";
import { authRouter } from "./routers/authRouter.js";
import { validateAuthConfig } from "./services/authServices.js";

dotenv.config();
validateAuthConfig();
await connectDB();

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use("/api/v1/auth", authRouter);

app.use((req, res) => {
  res.status(404).json({ status: "fail", message: "Route not found." });
});

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: err.status || "error",
    message:
      process.env.NODE_ENV === "production" && statusCode >= 500
        ? "Internal Server Error"
        : err.message,
  });
});

app.listen(process.env.PORT || 4000, () => {
  console.log(`Server is running on port ${process.env.PORT || 4000}`);
});

export default app;
