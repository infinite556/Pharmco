import crypto from "node:crypto";
import { User } from "../models/userModel.js";
import { RefreshSession } from "../models/refreshSessionModel.js";
import AppError from "../utils/appError.js";

const ACCESS_ALGORITHM = "HS256";

const durationToMs = (value, fallback) => {
  const match = String(value || fallback).match(/^(\d+)\s*(s|m|h|d|w)$/i);
  if (!match) throw new Error("Invalid token duration configuration");
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  return Number(match[1]) * units[match[2].toLowerCase()];
};

const secret = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be configured`);
  return value;
};

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = (value) => JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

const signJwt = (payload, signingSecret) => {
  const header = encode({ alg: ACCESS_ALGORITHM, typ: "JWT" });
  const body = encode(payload);
  const signature = crypto
    .createHmac("sha256", signingSecret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
};

export const accessTokenExpiresInMs = () =>
  durationToMs(process.env.JWT_ACCESS_EXPIRES_IN, "15m");

export const refreshTokenExpiresInMs = () =>
  durationToMs(process.env.JWT_REFRESH_EXPIRES_IN, "7d");

export const signAccessToken = (id) =>
  signJwt(
    {
      sub: String(id),
      tokenType: "access",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + accessTokenExpiresInMs()) / 1000),
    },
    secret("JWT_ACCESS_SECRET"),
  );

export const verifyAccessToken = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Malformed token");
    const [header, body, signature] = parts;
    const expected = crypto
      .createHmac("sha256", secret("JWT_ACCESS_SECRET"))
      .update(`${header}.${body}`)
      .digest();
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
      throw new Error("Invalid signature");
    }
    const decodedHeader = decode(header);
    const payload = decode(body);
    if (decodedHeader.alg !== ACCESS_ALGORITHM || decodedHeader.typ !== "JWT") {
      throw new Error("Invalid algorithm");
    }
    if (payload.tokenType !== "access" || typeof payload.sub !== "string") {
      throw new Error("Invalid token purpose");
    }
    if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new Error("Expired token");
    }
    return payload;
  } catch {
    throw new AppError("Invalid or expired access token.", 401);
  }
};

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const generateRefreshToken = () => crypto.randomBytes(32).toString("hex");

export const createRefreshSession = async (userId, token = generateRefreshToken()) => {
  const expiresAt = new Date(Date.now() + refreshTokenExpiresInMs());
  const session = await RefreshSession.create({
    userId,
    refreshTokenHash: hashToken(token),
    expiresAt,
  });
  return { token, session };
};

export const rotateRefreshToken = async (token) => {
  const oldHash = hashToken(token);
  const now = new Date();
  const replacement = generateRefreshToken();
  const replacementHash = hashToken(replacement);
  const session = await RefreshSession.findOneAndUpdate(
    { refreshTokenHash: oldHash, revokedAt: null, expiresAt: { $gt: now } },
    {
      $set: {
        refreshTokenHash: replacementHash,
        expiresAt: new Date(now.getTime() + refreshTokenExpiresInMs()),
        replacedByTokenHash: replacementHash,
      },
    },
    { new: true },
  );
  if (!session) throw new AppError("Invalid or expired refresh token.", 401);
  const user = await User.findOne({ _id: session.userId, isActive: true });
  if (!user) {
    await RefreshSession.updateOne(
      { _id: session._id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    throw new AppError("Unable to authenticate with this session.", 401);
  }
  return { token: replacement, user, session };
};

export const revokeRefreshSession = async (token) => {
  if (!token) return;
  await RefreshSession.updateOne(
    { refreshTokenHash: hashToken(token), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
};

export const revokeAllRefreshSessions = (userId) =>
  RefreshSession.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

export const validateAuthConfig = () => {
  secret("JWT_ACCESS_SECRET");
  accessTokenExpiresInMs();
  refreshTokenExpiresInMs();
};

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.COOKIE_SAME_SITE || "lax",
  domain: process.env.COOKIE_DOMAIN || undefined,
};

export const accessCookieName = () => process.env.ACCESS_TOKEN_COOKIE_NAME || "accessToken";
export const refreshCookieName = () =>
  process.env.REFRESH_TOKEN_COOKIE_NAME || "refreshToken";
export const refreshCookiePath = () =>
  process.env.REFRESH_TOKEN_COOKIE_PATH || "/api/v1/auth";

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie(accessCookieName(), accessToken, {
    ...cookieOptions,
    maxAge: accessTokenExpiresInMs(),
    path: "/api/v1",
  });
  res.cookie(refreshCookieName(), refreshToken, {
    ...cookieOptions,
    maxAge: refreshTokenExpiresInMs(),
    path: refreshCookiePath(),
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie(accessCookieName(), { ...cookieOptions, path: "/api/v1" });
  res.clearCookie(refreshCookieName(), {
    ...cookieOptions,
    path: refreshCookiePath(),
  });
};

export const getCookie = (req, name) => {
  const header = req.headers.cookie || "";
  const item = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : undefined;
};

export const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  role: user.role,
  pointsBlance: user.pointsBlance,
  isActive: user.isActive,
});
