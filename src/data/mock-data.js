const bcrypt = require("bcryptjs");

const books = [
  {
    id: "atlas-of-light",
    title: "Atlas of Light",
    author: "Mina Hossain",
    category: "Fiction",
    deliveryFee: 120,
    status: "published",
    availability: "Available",
    provider: "Ayesha Rahman",
    providerEmail: "ayesha@example.com",
  },
  {
    id: "foundations-of-cloud",
    title: "Foundations of Cloud",
    author: "Nusrat Jahan",
    category: "Academic",
    deliveryFee: 110,
    status: "published",
    availability: "Available",
    provider: "Ayesha Rahman",
    providerEmail: "ayesha@example.com",
  },
  {
    id: "lab-notes-2040",
    title: "Lab Notes 2040",
    author: "Arafat Hossain",
    category: "Academic",
    deliveryFee: 170,
    status: "pending_approval",
    availability: "Available",
    provider: "Mizan Book House",
    providerEmail: "mizan@example.com",
  },
];

const users = [
  {
    id: "u1",
    name: "Rahim Ahmed",
    email: "rahim@example.com",
    role: "user",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop",
    passwordHash: bcrypt.hashSync("Password@123", 10),
  },
  {
    id: "u2",
    name: "Ayesha Rahman",
    email: "ayesha@example.com",
    role: "librarian",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop",
    passwordHash: bcrypt.hashSync("Password@123", 10),
  },
  {
    id: "u3",
    name: "Admin",
    email: "admin@gmail.com",
    role: "admin",
    photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&h=256&fit=crop",
    passwordHash: bcrypt.hashSync("Admin@123", 10),
  },
];

const deliveries = [
  {
    id: "d1",
    userEmail: "rahim@example.com",
    librarianEmail: "ayesha@example.com",
    bookId: "atlas-of-light",
    status: "Delivered",
    amount: 120,
    date: "2026-06-12",
  },
];

const reviews = [
  {
    id: "r1",
    bookId: "atlas-of-light",
    userEmail: "rahim@example.com",
    rating: 5,
    comment: "Beautifully written and delivered early.",
    verified: true,
  },
];

const transactions = [
  {
    id: "txn_01",
    userEmail: "rahim@example.com",
    librarianEmail: "ayesha@example.com",
    amount: 120,
    date: "2026-06-12",
  },
];

module.exports = {
  books,
  users,
  deliveries,
  reviews,
  transactions,
};
