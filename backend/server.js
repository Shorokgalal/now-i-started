// backend/server.js
import express from "express";
import bodyParser from "body-parser";
import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(bodyParser.json());

// In-memory token store (replace with DB in production)
const userTokens = {};

// Save FCM token
app.post("/api/save-fcm-token", (req, res) => {
  const { uid, token } = req.body;
  if (!uid || !token) return res.status(400).send("Missing uid or token");
  userTokens[uid] = token;
  res.sendStatus(200);
});

// Send notification
app.post("/api/send-notification", async (req, res) => {
  const { uid, title, body } = req.body;
  const token = userTokens[uid];
  if (!token) return res.status(404).send("No token for user");
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
    });
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to send notification");
  }
});

app.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");
});
