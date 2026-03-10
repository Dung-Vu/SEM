import { prisma } from "@/lib/prisma";
import { NotificationType } from "./types";
import { logNotification } from "./helpers";
import { sendPushToSubscriptions, PushPayload } from "@/lib/push";

export async function sendUserPushNotification(
  userId: string,
  type: NotificationType,
  content: PushPayload
) {
  // 1. Get user's push subscriptions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      PushSubscription: true,
    },
  });

  if (!user || user.PushSubscription.length === 0) {
    return;
  }

  // 2. Prepare payload
  const payload: PushPayload = {
    ...content,
    type,
    data: {
      ...content.data,
      url: content.data?.url || content.url || "/",
    },
  };

  // 3. Send
  await sendPushToSubscriptions(
    user.PushSubscription,
    payload,
    async (expiredId) => {
      // Cleanup expired subscriptions
      await prisma.pushSubscription.delete({ where: { id: expiredId } });
    }
  );

  // 4. Log
  await logNotification(userId, type, { title: content.title, body: content.body });
}
