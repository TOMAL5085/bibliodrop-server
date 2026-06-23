const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { users: mockUsers } = require("../data/mock-data");

const mongoUri = process.env.MONGODB_URI?.trim();
let mongoPromise = null;

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    emailLower: { type: String, required: true, unique: true, index: true },
    role: { type: String, required: true, enum: ["user", "librarian", "admin"] },
    photoUrl: { type: String, default: "" },
    passwordHash: { type: String, required: true },
  },
  { versionKey: false, timestamps: false }
);

const UserModel = mongoose.models.BiblioDropUser || mongoose.model("BiblioDropUser", userSchema);

function authSecret() {
  return process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || "bibliodrop-dev-secret";
}

function authBaseUrl() {
  return process.env.BETTER_AUTH_URL?.trim() || "";
}

function base64UrlEncode(input) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input) {
  return Buffer.from(input, "base64url").toString("utf8");
}

async function ensureMongo() {
  if (!mongoUri) {
    return false;
  }

  if (!mongoPromise) {
    mongoPromise = mongoose.connect(mongoUri);
  }

  await mongoPromise;
  return true;
}

async function seedUsersCollection() {
  if (!(await ensureMongo())) {
    return;
  }

  if ((await UserModel.countDocuments()) > 0) {
    return;
  }

  await UserModel.insertMany(
    mockUsers.map((user) => ({
      ...user,
      emailLower: user.email.toLowerCase(),
    }))
  );
}

function toPlainUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    photoUrl: user.photoUrl || "",
    passwordHash: user.passwordHash,
  };
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    photoUrl: user.photoUrl || "",
  };
}

async function findUserByEmail(email) {
  await seedUsersCollection();

  if (await ensureMongo()) {
    const user = await UserModel.findOne({ emailLower: email.toLowerCase() }).lean();
    return user ? toPlainUser(user) : null;
  }

  return mockUsers.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

async function findUserById(id) {
  await seedUsersCollection();

  if (await ensureMongo()) {
    const user = await UserModel.findOne({ id }).lean();
    return user ? toPlainUser(user) : null;
  }

  return mockUsers.find((user) => user.id === id) ?? null;
}

async function countUsers() {
  await seedUsersCollection();

  if (await ensureMongo()) {
    return UserModel.countDocuments();
  }

  return mockUsers.length;
}

async function createUser(input) {
  await seedUsersCollection();

  const role = input.role === "admin" || input.role === "librarian" ? input.role : "user";
  const user = {
    id: `u_${crypto.randomUUID()}`,
    name: input.name,
    email: input.email,
    emailLower: input.email.toLowerCase(),
    role,
    photoUrl: input.photoUrl || "",
    passwordHash: input.passwordHash,
  };

  if (await ensureMongo()) {
    await UserModel.create(user);
    return toPlainUser(user);
  }

  mockUsers.push(user);
  return toPlainUser(user);
}

async function upsertGoogleUser(input) {
  const existing = await findUserByEmail(input.email);

  if (existing) {
    const nextUser = {
      ...existing,
      name: input.name || existing.name,
      photoUrl: input.photoUrl || existing.photoUrl,
    };

    if (await ensureMongo()) {
      await UserModel.updateOne(
        { id: existing.id },
        {
          $set: {
            name: nextUser.name,
            photoUrl: nextUser.photoUrl,
          },
        }
      );
    } else {
      const localUser = mockUsers.find((user) => user.id === existing.id);
      if (localUser) {
        localUser.name = nextUser.name;
        localUser.photoUrl = nextUser.photoUrl;
      }
    }

    return nextUser;
  }

  return createUser({
    name: input.name,
    email: input.email,
    role: input.role || "user",
    photoUrl: input.photoUrl || "",
    passwordHash: bcrypt.hashSync(crypto.randomUUID(), 10),
  });
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
}

function signAuthToken(user, expiresIn = "7d") {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    authSecret(),
    { expiresIn }
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, authSecret());
}

function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

function signOAuthState(payload) {
  const body = JSON.stringify({
    callbackURL: payload.callbackURL,
    role: payload.role,
    ts: Date.now(),
  });

  const signature = crypto.createHmac("sha256", authSecret()).update(body).digest("base64url");
  return `${base64UrlEncode(body)}.${signature}`;
}

function verifyOAuthState(state) {
  const [encodedBody, signature] = String(state || "").split(".");
  if (!encodedBody || !signature) {
    return null;
  }

  const body = base64UrlDecode(encodedBody);
  const expectedSignature = crypto
    .createHmac("sha256", authSecret())
    .update(body)
    .digest("base64url");

  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);
  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return null;
  }

  if (!payload.callbackURL || Date.now() - payload.ts > 10 * 60 * 1000) {
    return null;
  }

  return payload;
}

async function buildGoogleAuthUrl({ origin, callbackURL, role }) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return null;
  }

  const baseUrl = authBaseUrl() || origin;
  const state = signOAuthState({ callbackURL, role });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeGoogleCode({ code, redirectURI }) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectURI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    return null;
  }

  return tokenResponse.json();
}

async function fetchGoogleProfile(accessToken) {
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!profileResponse.ok) {
    return null;
  }

  return profileResponse.json();
}

module.exports = {
  authCookieOptions,
  buildGoogleAuthUrl,
  authBaseUrl,
  createUser,
  exchangeGoogleCode,
  fetchGoogleProfile,
  findUserByEmail,
  findUserById,
  countUsers,
  hashPassword,
  sanitizeUser,
  signAuthToken,
  upsertGoogleUser,
  verifyAuthToken,
  verifyOAuthState,
  verifyPassword,
};
