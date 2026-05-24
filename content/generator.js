const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PRODUCT_CATEGORIES = [
  {
    niche: "Small Business Owner",
    topics: [
      "social media captions",
      "email newsletters",
      "customer service responses",
      "product descriptions",
      "sales pages",
    ],
  },
  {
    niche: "Freelancer",
    topics: [
      "client proposals",
      "cold outreach emails",
      "project scopes",
      "invoice follow-ups",
      "portfolio descriptions",
    ],
  },
  {
    niche: "Content Creator",
    topics: [
      "YouTube scripts",
      "TikTok hooks",
      "Instagram captions",
      "blog post outlines",
      "newsletter ideas",
    ],
  },
  {
    niche: "Real Estate Agent",
    topics: [
      "property listings",
      "buyer follow-ups",
      "open house invites",
      "market update emails",
      "seller presentations",
    ],
  },
  {
    niche: "Coach or Consultant",
    topics: [
      "discovery call scripts",
      "onboarding emails",
      "testimonial requests",
      "program sales pages",
      "social proof posts",
    ],
  },
];

async function generateProductIdea(existingProducts = []) {
  const existingNames = existingProducts.map((p) => p.name).join(", ");

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are a digital product strategist. Generate a prompt pack product idea for Gumroad.

Existing products to avoid duplicating: ${existingNames || "none yet"}

Pick one niche and topic from this list or invent a better one:
${JSON.stringify(PRODUCT_CATEGORIES, null, 2)}

Respond ONLY in this exact JSON format, no markdown, no explanation:
{
  "name": "product name (max 60 chars)",
  "niche": "target audience",
  "topic": "specific topic",
  "price": 9.99,
  "tagline": "one sentence benefit statement",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Rules:
- Price between 7 and 27
- Name must be compelling and specific
- Tagline must focus on the outcome not the feature`,
      },
    ],
  });

  const raw = message.content[0].text.trim();
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

async function generatePromptPack(idea) {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `Create a premium AI prompt pack for: ${idea.name}
Target audience: ${idea.niche}
Topic: ${idea.topic}

Generate exactly 10 high-quality, ready-to-use AI prompts.

Format as plain text like this:

${idea.name.toUpperCase()}
${idea.tagline}

---

PROMPT 1: [Title]
[Full prompt with [BRACKETS] for user to fill in their details]

PROMPT 2: [Title]
[Full prompt]

...and so on for all 10 prompts.

---

HOW TO USE THIS PACK:
[3 sentences on getting best results]

---

Each prompt must be immediately usable, specific, and deliver real value.
No fluff. No filler. Professional quality only.`,
      },
    ],
  });

  return message.content[0].text;
}

async function generateDescription(idea) {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `Write a Gumroad product description for this prompt pack:

Name: ${idea.name}
Niche: ${idea.niche}
Topic: ${idea.topic}
Tagline: ${idea.tagline}
Price: $${idea.price}

Write a compelling product description that:
- Opens with a pain point the buyer has
- Lists exactly what they get (10 prompts)
- States 3 specific outcomes they'll achieve
- Ends with a low-risk call to action

Keep it under 200 words. No hype. No emojis. Professional but conversational.`,
      },
    ],
  });

  return message.content[0].text;
}

module.exports = { generateProductIdea, generatePromptPack, generateDescription };
