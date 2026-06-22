const bcrypt = require("bcryptjs");

const books = [
  {
    id: "moonlit-postcards",
    title: "Moonlit Postcards",
    author: "Ayesha Rahman",
    category: "Fiction",
    coverImage: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80",
    deliveryFee: 120,
    status: "published",
    availability: "Available",
    provider: "Ayesha Rahman",
    providerPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop",
    providerEmail: "ayesha@example.com",
  },
  {
    id: "harbor-of-echoes",
    title: "Harbor of Echoes",
    author: "Ayesha Rahman",
    category: "Fiction",
    coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
    deliveryFee: 128,
    status: "published",
    availability: "Available",
    provider: "Ayesha Rahman",
    providerPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop",
    providerEmail: "ayesha@example.com",
  },
  {
    id: "signal-after-dawn",
    title: "Signal After Dawn",
    author: "Rafiq Hasan",
    category: "Sci-Fi",
    coverImage: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80",
    deliveryFee: 160,
    status: "published",
    availability: "Available",
    provider: "Nayeem Khan",
    providerPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop",
    providerEmail: "nayeem@example.com",
  },
  {
    id: "orbit-classroom",
    title: "Orbit Classroom",
    author: "Rafiq Hasan",
    category: "Sci-Fi",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    deliveryFee: 154,
    status: "published",
    availability: "Available",
    provider: "Nayeem Khan",
    providerPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop",
    providerEmail: "nayeem@example.com",
  },
  {
    id: "cloud-systems-primer",
    title: "Cloud Systems Primer",
    author: "Nusrat Jahan",
    category: "Academic",
    coverImage: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
    deliveryFee: 110,
    status: "published",
    availability: "Available",
    provider: "Nusrat Jahan",
    providerPhoto: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=256&h=256&fit=crop",
    providerEmail: "nusrat@example.com",
  },
  {
    id: "quantitative-methods-lab",
    title: "Quantitative Methods Lab",
    author: "Nusrat Jahan",
    category: "Academic",
    coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    deliveryFee: 118,
    status: "published",
    availability: "Available",
    provider: "Nusrat Jahan",
    providerPhoto: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=256&h=256&fit=crop",
    providerEmail: "nusrat@example.com",
  },
  {
    id: "founders-and-funnels",
    title: "Founders and Funnels",
    author: "Tanvir Islam",
    category: "Business",
    coverImage: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    deliveryFee: 140,
    status: "published",
    availability: "Available",
    provider: "Tanvir Islam",
    providerPhoto: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=256&h=256&fit=crop",
    providerEmail: "tanvir@example.com",
  },
  {
    id: "market-moves",
    title: "Market Moves",
    author: "Tanvir Islam",
    category: "Business",
    coverImage: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    deliveryFee: 145,
    status: "published",
    availability: "Available",
    provider: "Tanvir Islam",
    providerPhoto: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=256&h=256&fit=crop",
    providerEmail: "tanvir@example.com",
  },
  {
    id: "river-of-empires",
    title: "River of Empires",
    author: "Nayeem Khan",
    category: "History",
    coverImage: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1200&q=80",
    deliveryFee: 130,
    status: "published",
    availability: "Available",
    provider: "Nayeem Khan",
    providerPhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&h=256&fit=crop",
    providerEmail: "nayeem@example.com",
  },
  {
    id: "chronicles-of-the-delta",
    title: "Chronicles of the Delta",
    author: "Nayeem Khan",
    category: "History",
    coverImage: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
    deliveryFee: 102,
    status: "published",
    availability: "Available",
    provider: "Nayeem Khan",
    providerPhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&h=256&fit=crop",
    providerEmail: "nayeem@example.com",
  },
  {
    id: "salt-in-the-margins",
    title: "Salt in the Margins",
    author: "Farida Akter",
    category: "Poetry",
    coverImage: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=1200&q=80",
    deliveryFee: 95,
    status: "published",
    availability: "Checked Out",
    provider: "Farida Akter",
    providerPhoto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop",
    providerEmail: "farida@example.com",
  },
  {
    id: "quiet-weather",
    title: "Quiet Weather",
    author: "Farida Akter",
    category: "Poetry",
    coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    deliveryFee: 98,
    status: "published",
    availability: "Available",
    provider: "Farida Akter",
    providerPhoto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop",
    providerEmail: "farida@example.com",
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
    name: "Nayeem Khan",
    email: "nayeem@example.com",
    role: "librarian",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop",
    passwordHash: bcrypt.hashSync("Password@123", 10),
  },
  {
    id: "u4",
    name: "Nusrat Jahan",
    email: "nusrat@example.com",
    role: "librarian",
    photoUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=256&h=256&fit=crop",
    passwordHash: bcrypt.hashSync("Password@123", 10),
  },
  {
    id: "u5",
    name: "Tanvir Islam",
    email: "tanvir@example.com",
    role: "librarian",
    photoUrl: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=256&h=256&fit=crop",
    passwordHash: bcrypt.hashSync("Password@123", 10),
  },
  {
    id: "u6",
    name: "Rafiq Hasan",
    email: "rafiq@example.com",
    role: "librarian",
    photoUrl: "/download.png",
    passwordHash: bcrypt.hashSync("Password@123", 10),
  },
  {
    id: "u7",
    name: "Farida Akter",
    email: "farida@example.com",
    role: "librarian",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop",
    passwordHash: bcrypt.hashSync("Password@123", 10),
  },
  {
    id: "u8",
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
    bookId: "moonlit-postcards",
    status: "Delivered",
    amount: 120,
    date: "2026-06-12",
  },
];

const reviewCountsByBookId = {
  "moonlit-postcards": 128,
  "harbor-of-echoes": 83,
  "signal-after-dawn": 83,
  "cloud-systems-primer": 94,
  "quantitative-methods-lab": 47,
  "founders-and-funnels": 51,
  "market-moves": 37,
  "river-of-empires": 71,
  "chronicles-of-the-delta": 61,
  "salt-in-the-margins": 55,
  "quiet-weather": 8,
  "orbit-classroom": 18,
};

const reviewNames = [
  "Nusrat",
  "Rafiq",
  "Ayesha",
  "Tanvir",
  "Farida",
  "Imran",
  "Tania",
  "Sadia",
  "Mahir",
  "Raisa",
  "Shahriar",
  "Nabila",
  "Faria",
  "Jannat",
  "Asif",
  "Nayem",
  "Mou",
  "Saimon",
  "Ariya",
  "Tahsin",
  "Rifat",
  "Shadman",
  "Miftah",
  "Nafisa",
  "Tamim",
  "Lamia",
];

const reviewPhrases = {
  Fiction: [
    "Beautiful pacing and vivid character work.",
    "It reads like a letter passed between neighborhoods.",
    "The emotional beats land with real care.",
    "A warm, memorable story that feels easy to return to.",
  ],
  "Sci-Fi": [
    "The future feels grounded and easy to believe.",
    "Big ideas land without losing the human thread.",
    "Sharp concepts, clean structure, and a strong hook.",
    "A clever story that keeps the momentum moving.",
  ],
  Academic: [
    "Clear structure, useful examples, and easy revision.",
    "Great for study sessions and quick refreshers.",
    "The explanations stay practical from start to finish.",
    "A solid pick when deadlines are getting close.",
  ],
  Business: [
    "Practical frameworks I could apply immediately.",
    "Short, sharp, and full of useful direction.",
    "Good balance between strategy and execution.",
    "The advice feels modern and easy to action.",
  ],
  History: [
    "It balances memory, context, and detail really well.",
    "The perspective feels rich and carefully researched.",
    "A thoughtful look at how the past still shapes now.",
    "Strong storytelling with a clear sense of place.",
  ],
  Poetry: [
    "Every page feels intentional and quietly moving.",
    "The imagery stays with you long after reading.",
    "Compact lines, strong feeling, and a gentle rhythm.",
    "A beautiful collection that rewards slow reading.",
  ],
  default: [
    "A thoughtful read with a smooth delivery experience.",
    "Well packed, well paced, and easy to recommend.",
    "A dependable choice from this library shelf.",
  ],
};

function formatReviewDate(offset) {
  const base = new Date(Date.UTC(2026, 5, 20));
  base.setUTCDate(base.getUTCDate() - offset);
  return base.toISOString().slice(0, 10);
}

function makeReviewsForBook(book) {
  const total = reviewCountsByBookId[book.id] ?? 0;
  const phrases = reviewPhrases[book.category] ?? reviewPhrases.default;

  return Array.from({ length: total }, (_, index) => {
    const reviewer = reviewNames[(index + book.id.length) % reviewNames.length];
    const comment = `${phrases[index % phrases.length]} ${reviewPhrases.default[index % reviewPhrases.default.length]}`;

    return {
      id: `review-${book.id}-${index + 1}`,
      bookId: book.id,
      user: reviewer,
      userEmail: `${reviewer.toLowerCase()}.${book.id}.${index + 1}@example.com`,
      rating: index % 11 === 0 ? 4 : 5,
      comment,
      date: formatReviewDate(index),
      verified: true,
    };
  });
}

const reviews = books.flatMap((book) => makeReviewsForBook(book));

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
