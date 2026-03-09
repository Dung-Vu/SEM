// Seed Shadow Scripts — Phase 12.3
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const scripts = [
    {
        title: "First Day at Work",
        level: "A2",
        topic: "work",
        durationSeconds: 45,
        accent: "US",
        tags: "a2,work,introductions",
        source: "SEM Original",
        content: `Hi everyone, I'm Alex. Today is my first day here and I'm very excited to join the team.

Can you tell me where the kitchen is? I'd also like to know about the lunch break schedule.

I'm going to work hard and learn as much as I can. Please feel free to ask me for help anytime.

Thank you for the warm welcome. I look forward to working with all of you.`,
    },
    {
        title: "Ordering at a Café",
        level: "A2",
        topic: "food",
        durationSeconds: 40,
        accent: "US",
        tags: "a2,food,service",
        source: "SEM Original",
        content: `Good morning! I'd like to order a large latte, please.

Can I also get a blueberry muffin? Is it fresh today?

Actually, can I change that to a croissant instead? Sorry for the confusion.

That's everything. How much is it? Here's my card. Thank you so much!`,
    },
    {
        title: "Planning a Weekend Trip",
        level: "B1",
        topic: "travel",
        durationSeconds: 55,
        accent: "US",
        tags: "b1,travel,planning",
        source: "SEM Original",
        content: `I've been planning a weekend trip to Da Nang and I can't wait!

I'm going to check out the Marble Mountains on Saturday morning, then spend the afternoon relaxing at My Khe Beach.

On Sunday, I'll explore the ancient town of Hoi An and try some local food — bánh mì, cao lầu, and definitely white rose dumplings.

I've already booked a hotel near the beach, so transportation should be easy. It's going to be an amazing trip.`,
    },
    {
        title: "Talking About Work Challenges",
        level: "B1",
        topic: "work",
        durationSeconds: 60,
        accent: "US",
        tags: "b1,work,challenges",
        source: "SEM Original",
        content: `This week has been really challenging at work. We have a major project deadline coming up on Friday, and the team is under a lot of pressure.

My manager asked me to prepare a presentation for the client meeting, which I've never done before. I was nervous at first, but I decided to dive in and do my best.

I spent extra time after work organizing my slides and practicing my delivery. My colleague gave me some useful feedback, and I made several improvements.

Actually, the more I prepared, the more confident I felt. I think the key lesson is that preparation beats anxiety every time.`,
    },
    {
        title: "Discussing Investment Strategy",
        level: "B2",
        topic: "finance",
        durationSeconds: 65,
        accent: "US",
        tags: "b2,finance,investment",
        source: "SEM Original",
        content: `When building an investment portfolio, diversification is the cornerstone of risk management.

Rather than concentrating all your capital in a single asset class, spreading exposure across equities, bonds, real estate, and commodities helps mitigate the impact of any individual market downturn.

Consider your risk tolerance carefully. A younger investor with a long time horizon can generally afford to allocate a higher proportion to growth assets, accepting short-term volatility in exchange for potentially superior long-term returns.

However, as you approach your financial goals, gradually shifting towards more conservative, income-generating assets helps preserve the wealth you've already accumulated.`,
    },
    {
        title: "Technology and the Future of Work",
        level: "B2",
        topic: "technology",
        durationSeconds: 70,
        accent: "US",
        tags: "b2,technology,ai,future",
        source: "SEM Original",
        content: `Artificial intelligence is fundamentally reshaping the employment landscape, and the pace of this transformation shows no sign of slowing down.

While automation is displacing certain categories of routine, repetitive tasks — particularly in manufacturing, data processing, and administrative functions — it's simultaneously generating new roles that didn't exist a decade ago.

The critical skill gap we face isn't simply about technical knowledge. It's about adaptability, creative problem-solving, and the uniquely human capacity for empathy and nuanced judgment.

Organizations that invest in continuous learning and upskilling programs will likely navigate this transition most successfully. The future belongs to those who learn to work alongside intelligent systems, not those who compete against them.`,
    },
    {
        title: "Navigating Ethical Dilemmas in Business",
        level: "C1",
        topic: "business",
        durationSeconds: 80,
        accent: "US",
        tags: "c1,business,ethics",
        source: "SEM Original",
        content: `Ethical decision-making in business rarely presents itself as a clear binary choice between right and wrong. More often, leaders find themselves navigating complex trade-offs between competing legitimate interests.

Consider the archetypal tension between shareholder value maximization and broader stakeholder responsibilities. A decision to offshore production might generate significant cost efficiencies and bolster short-term profitability, yet simultaneously displace hundreds of workers in local communities that have spent decades building expertise.

The most pragmatic framework isn't purely consequentialist — calculating net outcomes — nor rigidly deontological in adhering to fixed principles regardless of circumstances. Rather, it integrates both: establishing non-negotiable ethical boundaries while remaining sensitive to context and consequences.

What ultimately distinguishes exceptional leaders is not that they avoid these dilemmas, but that they confront them with intellectual honesty, transparency with stakeholders, and a clear articulation of the values that guide their judgment.`,
    },
    {
        title: "The Neuroscience of Language Learning",
        level: "C1",
        topic: "academic",
        durationSeconds: 75,
        accent: "US",
        tags: "c1,academic,neuroscience,language",
        source: "SEM Original",
        content: `Language acquisition leverages some of the brain's most sophisticated neural machinery. When we learn vocabulary in context — embedded within meaningful situations — the hippocampus encodes not just the word itself, but a rich constellation of associated emotions, imagery, and situational cues.

This multi-layered encoding dramatically enhances retention compared to rote memorization. The spaced repetition effect — revisiting material at strategically increasing intervals — capitalizes on the brain's natural memory consolidation processes during sleep.

Critically, emotional engagement is not merely motivational — it's neurologically functional. The amygdala, our brain's emotional processing center, amplifies the hippocampus's encoding signal when learning occurs in an emotionally resonant context.

This is precisely why immersive conversation practice, despite its discomfort, accelerates acquisition so dramatically. Authentic communication creates the emotional stakes that optimize neural encoding.`,
    },
];

async function main() {
    let added = 0;
    for (const s of scripts) {
        const existing = await prisma.shadowScript.findFirst({
            where: { title: s.title, level: s.level },
        });
        if (!existing) {
            await prisma.shadowScript.create({ data: s });
            added++;
        }
    }
    const total = await prisma.shadowScript.count();
    console.log(`✅ Shadow Scripts: ${added} added · ${total} total in DB`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
