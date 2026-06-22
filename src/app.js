const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const multer = require("multer");
const {
  books,
  deliveries,
  reviews,
  transactions,
} = require("./data/mock-data");
const {
  authCookieOptions,
  authBaseUrl,
  buildGoogleAuthUrl,
  countUsers,
  createUser,
  exchangeGoogleCode,
  fetchGoogleProfile,
  findUserByEmail,
  findUserById,
  hashPassword,
  sanitizeUser,
  signAuthToken,
  upsertGoogleUser,
  verifyAuthToken,
  verifyOAuthState,
  verifyPassword,
} = require("./lib/auth");

const upload = multer({ storage: multer.memoryStorage() });

function getRequestOrigin(req) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const proto = forwardedProto || req.protocol || "https";
  const host = forwardedHost || req.get("host");
  return `${proto}://${host}`;
}

function setAuthCookie(res, token) {
  res.cookie("bibliodrop_token", token, authCookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie("bibliodrop_token", {
    ...authCookieOptions(),
    maxAge: undefined,
  });
}

async function resolveCurrentUser(req) {
  const bearerToken = String(req.headers.authorization || "").startsWith("Bearer ")
    ? String(req.headers.authorization || "").slice(7).trim()
    : "";
  const token = bearerToken || req.cookies.bibliodrop_token;
  if (!token) {
    return null;
  }

  try {
    const payload = verifyAuthToken(token);
    if (!payload?.sub) {
      return null;
    }

    return await findUserById(payload.sub);
  } catch {
    return null;
  }
}

function createApp() {
  const app = express();
  const allowedOrigins = [
    process.env.CLIENT_ORIGIN || "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith(".vercel.app") ||
          origin.startsWith("http://localhost:") ||
          origin.startsWith("https://localhost:")
        ) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan("dev"));

  app.get("/", (_req, res) => {
    res.json({ ok: true, service: "bibliodrop-server" });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "bibliodrop-api" });
  });

  app.get("/api/books", (req, res) => {
    const query = String(req.query.query || "").toLowerCase();
    const category = String(req.query.category || "").toLowerCase();
    const status = String(req.query.status || "").toLowerCase();

    let result = books.filter((book) => book.status === "published");

    if (query) {
      result = result.filter((book) =>
        [book.title, book.author, book.category].some((value) =>
          value.toLowerCase().includes(query)
        )
      );
    }

    if (category) {
      result = result.filter((book) => book.category.toLowerCase() === category);
    }

    if (status === "available") {
      result = result.filter((book) => book.availability === "Available");
    }

    if (status === "checked out") {
      result = result.filter((book) => book.availability === "Checked Out");
    }

    res.json({ data: result });
  });

  app.get("/api/books/:id", (req, res) => {
    const book = books.find((item) => item.id === req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    return res.json({ data: book, reviews: reviews.filter((review) => review.bookId === book.id) });
  });

  app.get("/api/dashboard/:role", async (req, res) => {
    const { role } = req.params;

    const response = {
      user: {
        stats: [
          { label: "Total books read", value: 18 },
          { label: "Pending deliveries", value: 2 },
          { label: "Total spent", value: 1860 },
        ],
      },
      librarian: {
        stats: [
          { label: "Total books listed", value: 42 },
          { label: "Total earnings", value: 28700 },
          { label: "Active requests", value: 9 },
        ],
      },
      admin: {
        stats: [
          { label: "Total users", value: await countUsers() },
          { label: "Total books", value: books.length },
          { label: "Total revenue", value: 86400 },
        ],
      },
    };

    if (!response[role]) {
      return res.status(404).json({ message: "Dashboard role not found" });
    }

    return res.json({ data: response[role] });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await findUserByEmail(email);

    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signAuthToken(user);
    setAuthCookie(res, token);

    return res.json({
      user: sanitizeUser(user),
      token,
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, confirmPassword, photoUrl = "", role = "user" } = req.body || {};

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const exists = await findUserByEmail(email);
    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const safeRole = role === "librarian" ? "librarian" : "user";
    const user = await createUser({
      name,
      email,
      role: safeRole,
      photoUrl,
      passwordHash: hashPassword(password),
    });

    const token = signAuthToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      user: sanitizeUser(user),
      token,
    });
  });

  app.post("/api/auth/google/start", async (req, res) => {
    const { callbackURL = "/dashboard", role = "user" } = req.body || {};
    const origin = getRequestOrigin(req);
    const url = await buildGoogleAuthUrl({ origin, callbackURL, role });

    if (!url) {
      return res.status(500).json({ message: "Google sign-in is not configured" });
    }

    return res.json({ url, redirect: false });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code, state } = req.query;
    const clientOrigin = process.env.CLIENT_ORIGIN?.trim();

    if (typeof code !== "string" || typeof state !== "string") {
      return res.status(400).send("Missing OAuth parameters");
    }

    const payload = verifyOAuthState(state);
    if (!payload?.callbackURL) {
      return res.status(400).send("Invalid OAuth state");
    }

    const origin = getRequestOrigin(req);
    const baseUrl = authBaseUrl() || origin;
    const tokenResponse = await exchangeGoogleCode({
      code,
      redirectURI: `${baseUrl}/api/auth/google/callback`,
    });

    if (!tokenResponse?.access_token) {
      return res.status(401).send("Google sign-in failed");
    }

    const profile = await fetchGoogleProfile(tokenResponse.access_token);
    if (!profile?.email) {
      return res.status(401).send("Google profile not available");
    }

    const user = await upsertGoogleUser({
      email: profile.email,
      name: profile.name || profile.email.split("@")[0],
      photoUrl: profile.picture || "",
      role: payload.role || "user",
    });

    const token = signAuthToken(user);
    setAuthCookie(res, token);

    const callbackURL = String(payload.callbackURL || "/dashboard");
    if (callbackURL.startsWith("http") && clientOrigin && !callbackURL.startsWith(clientOrigin)) {
      return res.status(400).send("Invalid callback URL");
    }

    const redirectURL = callbackURL.startsWith("http")
      ? callbackURL
      : new URL(callbackURL, clientOrigin || origin).toString();

    return res.redirect(302, redirectURL);
  });

  app.post("/api/auth/logout", (_req, res) => {
    clearAuthCookie(res);

    return res.json({ ok: true });
  });

  app.get("/api/me", async (req, res) => {
    const user = await resolveCurrentUser(req);

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    return res.json({ user: sanitizeUser(user) });
  });

  app.post("/api/uploads/image", upload.single("file"), async (req, res) => {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const apiKey = process.env.IMGBB_API_KEY?.trim();
    if (!apiKey) {
      return res.status(500).json({ message: "IMGBB_API_KEY is missing" });
    }

    const uploadData = new FormData();
    uploadData.append("image", file.buffer.toString("base64"));

    const uploadResponse = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: uploadData,
    });

    if (!uploadResponse.ok) {
      return res.status(502).json({ message: "Image upload failed" });
    }

    const payload = await uploadResponse.json();
    const url = payload?.data?.url;

    if (!url) {
      return res.status(502).json({ message: "Image upload failed" });
    }

    return res.json({ url });
  });

  app.get("/api/deliveries", (_req, res) => {
    res.json({ data: deliveries });
  });

  app.post("/api/deliveries/request", (req, res) => {
    const { bookId, userEmail } = req.body;
    const book = books.find((item) => item.id === bookId);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const request = {
      id: `d${deliveries.length + 1}`,
      userEmail,
      librarianEmail: book.providerEmail,
      bookId,
      status: "Pending",
      amount: book.deliveryFee,
      date: new Date().toISOString().slice(0, 10),
    };

    deliveries.push(request);
    transactions.push({
      id: `txn_${transactions.length + 1}`,
      userEmail,
      librarianEmail: book.providerEmail,
      amount: book.deliveryFee,
      date: request.date,
    });

    return res.status(201).json({ data: request });
  });

  app.get("/api/reviews/:bookId", (req, res) => {
    res.json({ data: reviews.filter((review) => review.bookId === req.params.bookId) });
  });

  app.post("/api/reviews", (req, res) => {
    const { bookId, userEmail, rating, comment } = req.body;
    const delivery = deliveries.find(
      (item) => item.bookId === bookId && item.userEmail === userEmail && item.status === "Delivered"
    );

    if (!delivery) {
      return res.status(403).json({ message: "Delivered order required before review" });
    }

    const review = {
      id: `r${reviews.length + 1}`,
      bookId,
      userEmail,
      rating,
      comment,
      verified: true,
    };

    reviews.push(review);
    return res.status(201).json({ data: review });
  });

  app.get("/api/admin/approval-queue", (_req, res) => {
    res.json({ data: books.filter((book) => book.status === "pending_approval") });
  });

  app.get("/api/transactions", (_req, res) => {
    res.json({ data: transactions });
  });

  app.get("/api/reviews", (_req, res) => {
    res.json({ data: reviews });
  });

  app.post("/api/books", (req, res) => {
    const { title, author, description = "", deliveryFee = 0, category = "Fiction", coverImage = "", provider = "Librarian", providerEmail } = req.body || {};
    if (!title || !author || !providerEmail) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const crypto = require("node:crypto");
    const newBook = {
      id: `book_${crypto.randomUUID()}`,
      title,
      author,
      description,
      deliveryFee: Number(deliveryFee),
      category,
      coverImage: coverImage || "/covers/default.jpg",
      status: "published",
      availability: "Available",
      provider,
      providerEmail,
      providerRole: "librarian",
      providerAvatar: provider.charAt(0),
      providerPhoto: "",
      coverStart: "#0f172a",
      coverEnd: "#334155",
      addedAt: new Date().toISOString().slice(0, 10),
      rating: 5,
      reviews: 0,
      deliveries: 0,
      featured: false
    };

    books.push(newBook);
    return res.status(201).json({ data: newBook });
  });

  app.put("/api/deliveries", (req, res) => {
    const { id, status } = req.body || {};
    if (!id || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const delivery = deliveries.find((d) => d.id === id);
    if (delivery) {
      delivery.status = status;
      return res.json({ data: delivery });
    }

    return res.status(404).json({ message: "Delivery not found" });
  });

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  return app;
}

module.exports = { createApp };
