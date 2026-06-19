const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const crypto = require("crypto");
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
    const { email } = req.body;
    const user = users.find((item) => item.email === email);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = crypto.createHash("sha256").update(`${user.email}:${Date.now()}`).digest("hex");
    res.cookie("bibliodrop_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res.json({ user, token });
  });

  app.post("/api/auth/register", (req, res) => {
    const { name, email, role = "user" } = req.body;
    const exists = users.some((item) => item.email === email);

    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const user = {
      id: `u${users.length + 1}`,
      name,
      email,
      role,
    };

    users.push(user);
    return res.status(201).json({ user });
  });

  app.get("/api/me", (req, res) => {
    const user = users[0];
    res.json({ user });
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
