import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Workspace from "../models/Workspace.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

function authPayload(user) {
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl
    },
    accessToken: signAccessToken({ sub: user._id.toString(), role: user.role }),
    refreshToken: signRefreshToken({ sub: user._id.toString(), role: user.role })
  };
}

function setRefreshCookie(res, token) {
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new AppError("Email already exists", 409);

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashed, role: role || "member" });
  const workspace = await Workspace.create({
    name: `${name}'s Workspace`,
    description: "Personal workspace",
    owner: user._id,
    inviteCode: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    members: [{ user: user._id, role: "admin" }]
  });
  user.workspaceIds = [workspace._id];
  await user.save();
  const payload = authPayload(user);
  user.refreshTokens.push(payload.refreshToken);
  await user.save();
  setRefreshCookie(res, payload.refreshToken);
  res.status(201).json({ success: true, ...payload });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password +refreshTokens");
  if (!user) throw new AppError("Invalid credentials", 401);
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new AppError("Invalid credentials", 401);
  const payload = authPayload(user);
  user.refreshTokens.push(payload.refreshToken);
  await user.save();
  setRefreshCookie(res, payload.refreshToken);
  res.json({ success: true, ...payload });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await User.findById(payload.sub).select("+refreshTokens");
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((item) => item !== token);
        await user.save();
      }
    } catch {
      // ignore invalid refresh token on logout
    }
  }
  res.clearCookie(env.COOKIE_NAME);
  res.json({ success: true });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.COOKIE_NAME] || req.body.refreshToken;
  if (!token) throw new AppError("Missing refresh token", 401);
  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.sub).select("+refreshTokens");
  if (!user || !user.refreshTokens.includes(token)) throw new AppError("Refresh token revoked", 401);
  const nextPayload = authPayload(user);
  user.refreshTokens = user.refreshTokens.filter((item) => item !== token);
  user.refreshTokens.push(nextPayload.refreshToken);
  await user.save();
  setRefreshCookie(res, nextPayload.refreshToken);
  res.json({ success: true, ...nextPayload });
});
