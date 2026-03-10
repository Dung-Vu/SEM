import { sendUserPushNotification } from "./push-handler";

// Called directly after user's level increases
// Skips scheduler (no quiet hours, no cooldown)
export async function sendLevelUpNotification(
  userId: string,
  newLevel: number,
  newTitle: string
) {
  const content = {
    title: `🏆 LEVEL UP! Bạn đạt Level ${newLevel}`,
    body: `"${newTitle}" — Tiếp tục chinh phục nhé!`,
    icon: '/icons/level-up.png', // Fallback icon
    vibrate: [300, 100, 400], // Festive vibration
    data: {
      url: '/',
      action: 'open_home',
      level: newLevel
    }
  };

  // Skip the regular 'shouldSendNotification' check, Level Ups are realtime specials
  await sendUserPushNotification(userId, "level_up", content);
}
