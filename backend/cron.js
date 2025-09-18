// backend/cron.js
import cron from "node-cron";
import admin from "firebase-admin";

// Send a reminder every day at 9 AM Cairo time
cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Sending daily reminder...");
  try {
    await admin.messaging().sendToTopic("daily-reminders", {
      notification: {
        title: "Daily Reminder",
        body: "Stay on track with your goals today 🚀",
      },
    });
    console.log("✅ Reminder sent");
  } catch (err) {
    console.error("❌ Failed to send reminder:", err);
  }
}, { timezone: "Africa/Cairo" });
