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
  { id: "u1", name: "Rahim Ahmed", email: "rahim@example.com", role: "user" },
  { id: "u2", name: "Ayesha Rahman", email: "ayesha@example.com", role: "librarian" },
  { id: "u3", name: "Admin", email: "admin@gmail.com", role: "admin" },
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
