import { prisma } from "@/lib/prisma";
import { shouldSendNotification } from "./scheduler";
import { sendUserPushNotification } from "./push-handler";

// Called once a week — Wednesday 9am
export async function checkAndSendInsightAlert(userId: string) {
  if (!(await shouldSendNotification(userId, "ai_insight"))) {
    return;
  }

  // Load the LearningProfile (must exist; updated by ORACLE analytics)
  const profile = await prisma.learningProfile.findUnique({
    where: { userId },
  });
  if (!profile) return;

  const insight = detectNotifiableInsight(profile);
  if (!insight) return;

  const content = buildInsightContent(insight, profile);
  await sendUserPushNotification(userId, "ai_insight", content);
}

type InsightProfile = {
  speakingVelocity: number;
  vocabVelocity: number;
  consistencyScore: number;
  weakestSkill: string | null;
};

function detectNotifiableInsight(profile: InsightProfile): string | null {
  // Speaking is declining hard
  if (profile.speakingVelocity < -5) return "speaking_declining";

  // Weakest skill being neglected
  if (profile.weakestSkill === "writing") return "writing_neglected";

  // Vocab surging — reinforce positive momentum
  if (profile.vocabVelocity > 10) return "vocab_surge";

  // Consistency falling
  if (profile.consistencyScore < 40) return "consistency_low";

  return null;
}

function buildInsightContent(
  insightType: string,
  profile: InsightProfile
) {
  const templates: Record<string, { title: string; body: string; url: string }> = {
    speaking_declining: {
      title: "🧠 ORACLE phát hiện điều này",
      body: `Speaking giảm ${Math.abs(profile.speakingVelocity)} điểm/tuần. Thử Free Talk 10 phút hôm nay?`,
      url: "/speak",
    },
    writing_neglected: {
      title: "✍️ Writing đang bị bỏ quên",
      body: `Writing score đang giảm dần. Một Journal entry ngắn hôm nay đi!`,
      url: "/journal",
    },
    vocab_surge: {
      title: "🔥 Vocab đang tăng mạnh!",
      body: `+${profile.vocabVelocity} điểm tuần này. Duy trì Anki mỗi ngày để giữ đà nhé!`,
      url: "/anki",
    },
    consistency_low: {
      title: "📊 ORACLE có nhận xét",
      body: "Tuần này học không đều. 15 phút mỗi ngày tốt hơn 2 tiếng 1 lần.",
      url: "/analytics",
    },
  };

  const t = templates[insightType];
  return {
    title: t.title,
    body: t.body,
    data: { url: t.url },
  };
}
