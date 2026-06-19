const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  books,
  users,
  deliveries,
  reviews,
  transactions,
} = require("./data/mock-data");

function createApp() {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";

  app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan("dev"));

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

  app.get("/api/dashboard/:role", (req, res) => {
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
          { label: "Total users", value: users.length },
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

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find((item) => item.email === email);

    if (!user || !password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = bcrypt.compareSync(password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      process.env.JWT_SECRET || "bibliodrop-dev-secret",
      {
        expiresIn: "7d",
      }
    );

    res.cookie("bibliodrop_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl ?? "",
      },
      token,
    });
  });

  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, confirmPassword, photoUrl = "", role = "user" } = req.body;
    const exists = users.some((item) => item.email === email);

    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = {
      id: `u${users.length + 1}`,
      name,
      email,
      role,
      photoUrl,
      passwordHash: bcrypt.hashSync(password, 10),
    };

    users.push(user);
    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
      },
    });
  });

  app.get("/api/me", (req, res) => {
    const token = req.cookies.bibliodrop_token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "bibliodrop-dev-secret");
      const user = users.find((item) => item.id === payload.sub);

      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          photoUrl: user.photoUrl ?? "",
        },
      });
    } catch {
      return res.status(401).json({ message: "Not authenticated" });
    }
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

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  return app;
}

module.exports = { createApp };
