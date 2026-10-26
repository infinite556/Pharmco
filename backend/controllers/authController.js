import { User } from "../models/userModel.js";
import {
  clearAuthCookies,
  createRefreshSession,
  getCookie,
  publicUser,
  refreshCookieName,
  revokeAllRefreshSessions,
  revokeRefreshSession,
  rotateRefreshToken,
  setAuthCookies,
  signAccessToken,
} from "../services/authServices.js";
import AppError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";

const sendCredentials = async (res, user) => {
  const { token: refreshToken } = await createRefreshSession(user._id);
  setAuthCookies(res, signAccessToken(user._id), refreshToken);
  res.status(200).json({ status: "success", data: { user: publicUser(user) } });
};

export const register = catchAsync(async (req, res, next) => {
  const { email, phone, password, passwordConfirm, name } = req.body;
  if (!email || !phone || !password || !passwordConfirm) {
    return next(
      new AppError(
        "Email, phone, password, and password confirmation are required.",
        400,
      ),
    );
  }
  const user = await User.create({
    email,
    phone,
    password,
    passwordConfirm,
    name,
  });
  if (!user) {
    return next(new AppError("Failed to create user.", 500));
  }
  await sendCredentials(res, user);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError("Email and password are required.", 400));
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password.", 401));
  }
  await sendCredentials(res, user);
});

export const refresh = catchAsync(async (req, res) => {
  const token = getCookie(req, refreshCookieName());
  if (!token) throw new AppError("Refresh token is required.", 401);
  const result = await rotateRefreshToken(token);
  setAuthCookies(res, signAccessToken(result.user._id), result.token);
  res
    .status(200)
    .json({ status: "success", data: { user: publicUser(result.user) } });
});

export const logout = catchAsync(async (req, res) => {
  await revokeRefreshSession(getCookie(req, refreshCookieName()));
  clearAuthCookies(res);
  res
    .status(200)
    .json({ status: "success", message: "Logged out successfully." });
});

export const logoutAll = catchAsync(async (req, res) => {
  await revokeAllRefreshSessions(req.user._id);
  clearAuthCookies(res);
  res
    .status(200)
    .json({ status: "success", message: "Logged out from all devices." });
});

export const me = catchAsync(async (req, res) => {
  res
    .status(200)
    .json({ status: "success", data: { user: publicUser(req.user) } });
});
