import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROMPTS = [
  // ─── Essay B1 (5) ─────────────────────────────────────────────────────
  {
    title: "Technology and Social Life",
    instruction:
      "Do you think technology makes people more or less social? Give your opinion with examples.",
    type: "essay",
    level: "B1",
    topic: "technology",
    minWords: 150,
    maxWords: 300,
  },
  {
    title: "School Uniforms",
    instruction:
      "Should students be required to wear uniforms at school? Discuss both sides.",
    type: "essay",
    level: "B1",
    topic: "education",
    minWords: 150,
    maxWords: 300,
  },
  {
    title: "Big City vs Small Town",
    instruction: "Is it better to live in a big city or a small town? Why?",
    type: "essay",
    level: "B1",
    topic: "society",
    minWords: 150,
    maxWords: 300,
  },
  {
    title: "Social Media Communication",
    instruction:
      "How has social media changed the way people communicate?",
    type: "essay",
    level: "B1",
    topic: "technology",
    minWords: 150,
    maxWords: 300,
  },
  {
    title: "Gap Year",
    instruction:
      "Should young people take a gap year before university?",
    type: "essay",
    level: "B1",
    topic: "education",
    minWords: 150,
    maxWords: 300,
  },

  // ─── Essay B2 (5) ─────────────────────────────────────────────────────
  {
    title: "Economy vs Environment",
    instruction:
      "Some argue that economic growth should be prioritized over environmental protection. To what extent do you agree?",
    type: "essay",
    level: "B2",
    topic: "environment",
    minWords: 200,
    maxWords: 350,
  },
  {
    title: "Remote Work",
    instruction:
      "Remote work has transformed the modern workplace. Discuss advantages and disadvantages.",
    type: "essay",
    level: "B2",
    topic: "business",
    minWords: 200,
    maxWords: 350,
  },
  {
    title: "AI and Employment",
    instruction:
      "Is artificial intelligence a threat or an opportunity for employment?",
    type: "essay",
    level: "B2",
    topic: "technology",
    minWords: 200,
    maxWords: 350,
  },
  {
    title: "Wealth Inequality",
    instruction:
      "The gap between rich and poor continues to widen. What are the causes and solutions?",
    type: "essay",
    level: "B2",
    topic: "society",
    minWords: 200,
    maxWords: 350,
  },
  {
    title: "Space Exploration",
    instruction:
      "Should governments invest more in space exploration or focus on Earth's problems?",
    type: "essay",
    level: "B2",
    topic: "society",
    minWords: 200,
    maxWords: 350,
  },

  // ─── Essay C1 (5) ─────────────────────────────────────────────────────
  {
    title: "Globalization & Culture",
    instruction:
      "Globalization has eroded cultural identity. Critically evaluate this statement.",
    type: "essay",
    level: "C1",
    topic: "society",
    minWords: 250,
    maxWords: 400,
  },
  {
    title: "Education as Commodity",
    instruction:
      "The commodification of education undermines its fundamental purpose. Discuss.",
    type: "essay",
    level: "C1",
    topic: "education",
    minWords: 250,
    maxWords: 400,
  },
  {
    title: "Individual vs Collective",
    instruction:
      "To what extent should individual freedoms be restricted for the collective good?",
    type: "essay",
    level: "C1",
    topic: "society",
    minWords: 250,
    maxWords: 400,
  },
  {
    title: "Cryptocurrency Future",
    instruction:
      "Cryptocurrency represents the future of finance. Assess this claim.",
    type: "essay",
    level: "C1",
    topic: "business",
    minWords: 250,
    maxWords: 400,
  },
  {
    title: "Meritocracy Myth",
    instruction: "Is meritocracy a myth in modern societies?",
    type: "essay",
    level: "C1",
    topic: "society",
    minWords: 250,
    maxWords: 400,
  },

  // ─── Paragraph B1/B2 (5) ──────────────────────────────────────────────
  {
    title: "Influential Person",
    instruction:
      "Describe a person who has influenced your life significantly.",
    type: "paragraph",
    level: "B1",
    topic: "personal",
    minWords: 80,
    maxWords: 180,
  },
  {
    title: "Online Learning",
    instruction:
      "Write a paragraph about the pros and cons of online learning.",
    type: "paragraph",
    level: "B2",
    topic: "education",
    minWords: 80,
    maxWords: 180,
  },
  {
    title: "Ideal Work Environment",
    instruction: "Describe your ideal work environment.",
    type: "paragraph",
    level: "B1",
    topic: "business",
    minWords: 80,
    maxWords: 180,
  },
  {
    title: "Overcoming Challenges",
    instruction:
      "Write about a challenge you overcame and what you learned.",
    type: "paragraph",
    level: "B2",
    topic: "personal",
    minWords: 80,
    maxWords: 180,
  },
  {
    title: "Stress Management",
    instruction: "Explain how you manage stress in daily life.",
    type: "paragraph",
    level: "B1",
    topic: "personal",
    minWords: 80,
    maxWords: 180,
  },

  // ─── Email B1/B2 (5) ──────────────────────────────────────────────────
  {
    title: "Day Off Request",
    instruction:
      "Write a formal email to your manager requesting a day off.",
    type: "email",
    level: "B1",
    topic: "business",
    minWords: 60,
    maxWords: 150,
  },
  {
    title: "Hotel Complaint",
    instruction:
      "Write a complaint email to a hotel about poor service.",
    type: "email",
    level: "B2",
    topic: "business",
    minWords: 80,
    maxWords: 180,
  },
  {
    title: "Interview Follow-up",
    instruction: "Write a follow-up email after a job interview.",
    type: "email",
    level: "B2",
    topic: "business",
    minWords: 80,
    maxWords: 180,
  },
  {
    title: "Project Delay",
    instruction:
      "Write an email to a colleague explaining a project delay.",
    type: "email",
    level: "B1",
    topic: "business",
    minWords: 60,
    maxWords: 150,
  },
  {
    title: "Team Introduction",
    instruction:
      "Write a professional email introducing yourself to a new team.",
    type: "email",
    level: "B1",
    topic: "business",
    minWords: 60,
    maxWords: 150,
  },

  // ─── Trading/Business (4) ─────────────────────────────────────────────
  {
    title: "Risk Management",
    instruction:
      "Explain the concept of risk management in financial trading.",
    type: "essay",
    level: "B2",
    topic: "trading",
    minWords: 150,
    maxWords: 300,
  },
  {
    title: "Trader Psychology",
    instruction:
      "What are the psychological challenges of being a trader?",
    type: "essay",
    level: "B2",
    topic: "trading",
    minWords: 150,
    maxWords: 300,
  },
  {
    title: "AI in Finance",
    instruction:
      "Write a brief analysis of how AI is changing financial markets.",
    type: "essay",
    level: "B2",
    topic: "trading",
    minWords: 150,
    maxWords: 300,
  },
  {
    title: "Fundamental vs Technical",
    instruction:
      "Describe the key differences between fundamental and technical analysis.",
    type: "essay",
    level: "B2",
    topic: "trading",
    minWords: 150,
    maxWords: 300,
  },
];

async function main() {
  console.log("Seeding 29 writing prompts...");

  for (const prompt of PROMPTS) {
    await prisma.writingPrompt.upsert({
      where: {
        id: (
          await prisma.writingPrompt.findFirst({
            where: { title: prompt.title },
          })
        )?.id ?? "",
      },
      update: {},
      create: prompt,
    });
    console.log(`  ✓ ${prompt.type}/${prompt.level}: ${prompt.title}`);
  }

  console.log(`\nDone! ${PROMPTS.length} prompts seeded.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
