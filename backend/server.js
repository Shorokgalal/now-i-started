import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import admin from "firebase-admin";
import cron from "node-cron";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// --- Load Firebase service account ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "serviceAccountKey.json"), "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(bodyParser.json());

// --- In-memory token store (replace with DB in prod) ---
const userTokens = {};

// Save FCM token
app.post("/api/save-fcm-token", (req, res) => {
  const { uid, token } = req.body;
  if (!uid || !token) {
    return res.status(400).send("Missing uid or token");
  }
  userTokens[uid] = token;
  console.log(`✅ Saved token for user ${uid}`);
  res.sendStatus(200);
});

// Subscribe to all topics
app.post("/api/subscribe-all", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).send("Missing token");

  try {
    await admin.messaging().subscribeToTopic(token, "questions");
    await admin.messaging().subscribeToTopic(token, "journey-am");
    await admin.messaging().subscribeToTopic(token, "journey-pm");
    console.log(`✅ Token subscribed to all topics`);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Failed to subscribe:", err);
    res.status(500).send("Subscription failed");
  }
});

// --- Notification Scheduler ---
// Daily questions (rotate)
const questions = [
  "ايه الحاجه الواحده الصح اللي عملتها انهاردة؟",
  "ما التحدي الذي تغلبت عليه؟",
  "ايه ال ٣ حاجات اللي انت ممتن ليهم انهاردة؟",
];
let questionIndex = 0;

// Daily quotes
const quotes = [
"لو كل الانجازات اللي عملتها الاسبوع ده كانت لشغلك او ولادك او اهلك متخليش انهارده يعدي من غير ما تعمل حاجة لنفسك.",
"متنساش هدفك انهاردة، عشان دي الحاجه اللي هتشكروا نفسكم عليها بعد سنين من انهاردة ",
"قليل دائم خير من كثير منقطع ❤️",
"المجهود الذي تفعله اليوم، يعود إليك❤️"

];

// 7 PM — Question reminder
cron.schedule("0 19 * * *", async () => {
  const q = questions[questionIndex];
  questionIndex = (questionIndex + 1) % questions.length;

  await admin.messaging().sendToTopic("questions", {
    notification: {
      title: "📌 السؤال اليومي",
      body: q,
      icon: "/icon-192.png",
    },
    webpush: {
      fcmOptions: { link: "http://localhost:5173/questions" },
    },
  });

  console.log("📩 تم إرسال تذكير السؤال اليومي");
});

// 8 AM — Morning inspiration
cron.schedule("0 8 * * *", async () => {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  await admin.messaging().sendToTopic("journey-am", {
    notification: {
      title: "🌅 إلهام الصباح",
      body: quote,
      icon: "/icon-192.png",
    },
    webpush: {
      fcmOptions: { link: "http://localhost:5173/journeys" },
    },
  });

  console.log("📩 تم إرسال إلهام الصباح");
});

// 8 PM — Vote reminder
cron.schedule("0 20 * * *", async () => {
  await admin.messaging().sendToTopic("journey-pm", {
    notification: {
      title: "🗳️ تذكير التصويت",
      body: "هل اشتغلت على هدفك انهاردة؟",
    },
    webpush: {
      fcmOptions: { link: "http://localhost:5173/vote" },
    },
  });

  console.log("📩 تم إرسال تذكير التصويت");
});

// --- Start server ---
app.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");
});
