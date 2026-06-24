const crypto = require("node:crypto");
const { MongoClient } = require("mongodb");
const {
  books: seedBooks,
  deliveries: seedDeliveries,
  reviews: seedReviews,
  transactions: seedTransactions,
} = require("../data/mock-data");

const mongoUri = process.env.MONGODB_URI?.trim();

const memoryStore = {
  books: seedBooks.map((book) => ({ ...book })),
  deliveries: seedDeliveries.map((delivery) => ({ ...delivery })),
  reviews: seedReviews.map((review) => ({ ...review })),
  transactions: seedTransactions.map((transaction) => ({ ...transaction })),
};

let clientPromise = null;
let seedPromise = null;

function isMongoEnabled() {
  return Boolean(mongoUri);
}

async function getClient() {
  if (!mongoUri) {
    return null;
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(mongoUri).connect();
  }

  return clientPromise;
}

async function getCollections() {
  const client = await getClient();
  if (!client) {
    return null;
  }

  const db = client.db();
  return {
    books: db.collection("books"),
    deliveries: db.collection("deliveries"),
    reviews: db.collection("reviews"),
    transactions: db.collection("transactions"),
  };
}

async function seedCollections() {
  if (!isMongoEnabled()) {
    return;
  }

  if (!seedPromise) {
    seedPromise = (async () => {
      const collections = await getCollections();
      if (!collections) {
        return;
      }

      const seededBooks = await collections.books
        .find({ id: { $in: memoryStore.books.map((book) => book.id) } })
        .project({ id: 1 })
        .toArray();
      const existingBookIds = new Set(seededBooks.map((book) => book.id));
      const missingBooks = memoryStore.books.filter((book) => !existingBookIds.has(book.id));
      if (missingBooks.length > 0) {
        await collections.books.insertMany(missingBooks);
      }

      const seededDeliveries = await collections.deliveries
        .find({ id: { $in: memoryStore.deliveries.map((delivery) => delivery.id) } })
        .project({ id: 1 })
        .toArray();
      const existingDeliveryIds = new Set(seededDeliveries.map((delivery) => delivery.id));
      const missingDeliveries = memoryStore.deliveries.filter(
        (delivery) => !existingDeliveryIds.has(delivery.id)
      );
      if (missingDeliveries.length > 0) {
        await collections.deliveries.insertMany(missingDeliveries);
      }

      if ((await collections.reviews.estimatedDocumentCount()) === 0) {
        await collections.reviews.insertMany(memoryStore.reviews);
      }

      if ((await collections.transactions.estimatedDocumentCount()) === 0) {
        await collections.transactions.insertMany(memoryStore.transactions);
      }
    })();
  }

  await seedPromise;
}

async function getBookStore() {
  await seedCollections();

  if (isMongoEnabled()) {
    const collections = await getCollections();
    return (await collections?.books.find().toArray()) ?? [];
  }

  return [...memoryStore.books];
}

function matchesBookFilters(book, filters = {}) {
  const query = String(filters.query || "").trim().toLowerCase();
  const category = String(filters.category || "").trim().toLowerCase();
  const status = String(filters.status || "").trim().toLowerCase();

  if (query) {
    const haystack = `${book.title} ${book.author} ${book.category}`.toLowerCase();
    if (!haystack.includes(query)) {
      return false;
    }
  }

  if (category && String(book.category).toLowerCase() !== category) {
    return false;
  }

  if (status && String(book.status).toLowerCase() !== status) {
    return false;
  }

  return true;
}

async function listBooks(filters = {}) {
  const books = await getBookStore();
  return books.filter((book) => matchesBookFilters(book, filters));
}

async function findBookById(id) {
  const books = await getBookStore();
  return books.find((book) => book.id === id) ?? null;
}

async function listDeliveries() {
  await seedCollections();

  if (isMongoEnabled()) {
    const collections = await getCollections();
    return (await collections?.deliveries.find().sort({ date: -1 }).toArray()) ?? [];
  }

  return [...memoryStore.deliveries];
}

async function findActiveDeliveryForUserBook(userEmail, bookId) {
  const deliveries = await listDeliveries();
  return (
    deliveries.find(
      (delivery) =>
        String(delivery.userEmail).toLowerCase() === userEmail.toLowerCase() &&
        delivery.bookId === bookId &&
        delivery.status !== "Delivered"
    ) ?? null
  );
}

async function createDeliveryRequest({ bookId, userEmail }) {
  await seedCollections();

  const existing = await findActiveDeliveryForUserBook(userEmail, bookId);
  if (existing) {
    return existing;
  }

  const book = await findBookById(bookId);
  if (!book) {
    return null;
  }

  const record = {
    id: `d_${crypto.randomUUID()}`,
    userEmail,
    librarianEmail:
      book.providerEmail ??
      `${String(book.provider).toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`,
    bookId,
    status: "Pending",
    amount: book.deliveryFee,
    date: new Date().toISOString().slice(0, 10),
  };

  const transaction = {
    id: `txn_${crypto.randomUUID()}`,
    userEmail,
    librarianEmail: record.librarianEmail,
    amount: book.deliveryFee,
    date: record.date,
  };

  if (isMongoEnabled()) {
    const collections = await getCollections();
    await collections?.deliveries.insertOne(record);
    await collections?.transactions.insertOne(transaction);
  } else {
    memoryStore.deliveries.push(record);
    memoryStore.transactions.push(transaction);
  }

  return record;
}

async function updateDeliveryStatus(id, status) {
  await seedCollections();

  if (isMongoEnabled()) {
    const collections = await getCollections();
    const result = await collections?.deliveries.findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: "after" }
    );
    return result ?? null;
  }

  const delivery = memoryStore.deliveries.find((item) => item.id === id);
  if (delivery) {
    delivery.status = status;
    return delivery;
  }

  return null;
}

async function listTransactions() {
  await seedCollections();

  if (isMongoEnabled()) {
    const collections = await getCollections();
    return (await collections?.transactions.find().sort({ date: -1 }).toArray()) ?? [];
  }

  return [...memoryStore.transactions];
}

async function listReviews() {
  await seedCollections();

  if (isMongoEnabled()) {
    const collections = await getCollections();
    return (await collections?.reviews.find().sort({ date: -1 }).toArray()) ?? [];
  }

  return [...memoryStore.reviews];
}

async function listReviewsByBookId(bookId) {
  const reviews = await listReviews();
  return reviews.filter((review) => review.bookId === bookId);
}

async function createBook(input) {
  await seedCollections();

  const newBook = {
    id: `book_${crypto.randomUUID()}`,
    title: input.title,
    author: input.author,
    description: input.description ?? "",
    deliveryFee: Number(input.deliveryFee ?? 0),
    category: input.category ?? "Fiction",
    coverImage: input.coverImage || "/covers/default.jpg",
    status: "published",
    availability: "Available",
    provider: input.provider ?? "Librarian",
    providerEmail: input.providerEmail,
    providerRole: "librarian",
    providerAvatar: String(input.provider || "L").charAt(0),
    providerPhoto: "",
    coverStart: "#0f172a",
    coverEnd: "#334155",
    addedAt: new Date().toISOString().slice(0, 10),
    rating: 5,
    reviews: 0,
    deliveries: 0,
    featured: false,
  };

  if (isMongoEnabled()) {
    const collections = await getCollections();
    await collections?.books.insertOne(newBook);
  } else {
    memoryStore.books.push(newBook);
  }

  return newBook;
}

async function createReview(input) {
  await seedCollections();

  const record = {
    id: `r_${crypto.randomUUID()}`,
    bookId: input.bookId,
    userEmail: input.userEmail,
    rating: input.rating,
    comment: input.comment,
    verified: true,
    date: new Date().toISOString().slice(0, 10),
  };

  if (isMongoEnabled()) {
    const collections = await getCollections();
    await collections?.reviews.insertOne(record);
  } else {
    memoryStore.reviews.push(record);
  }

  return record;
}

async function countBooks(filters = {}) {
  const books = await getBookStore();
  return books.filter((book) => matchesBookFilters(book, filters)).length;
}

module.exports = {
  countBooks,
  createBook,
  createDeliveryRequest,
  createReview,
  findBookById,
  listBooks,
  listDeliveries,
  listReviews,
  listReviewsByBookId,
  listTransactions,
  updateDeliveryStatus,
};
