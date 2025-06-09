const admin = require("firebase-admin");

const feedbackPool = {
  oneWord: [
    "One word? Mysterious. But more words = more reach.",
    "Short and sharp. Want to add a punchline?",
    "Just one? Try expanding. Make them stop scrolling.",
    "Minimalist. Intriguing. But intrigue needs context."
  ],
  noPunctuation: [
    "No punctuation? Try ending with impact. Like this.",
    "Add a full stop. Or don’t. But decide.",
    "Statements hit harder when they look complete.",
    "No period, no power. Add some."
  ],
  tooLong: [
    "That’s deep. But might echo louder if split.",
    "Try shorter lines. Glitch the rhythm.",
    "Dense thoughts deserve air. Break it up.",
    "Consider slicing your idea in parts. More retention."
  ],
  vague: [
    "Feels vague. Want it sharper? Focus the feeling.",
    "Unclear = unnoticed. Refine to amplify.",
    "Try clarity over cleverness. Just this once.",
    "Who’s it for? Make it hit someone."
  ],
  emotional: [
    "This hits hard. Want it to echo deeper?",
    "Emotional posts perform best with a twist.",
    "Honest is good. Raw is better.",
    "Push it further. They need to feel it."
  ]
};

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function analyzeInputTip(text) {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);

  if (words.length === 1) return randomFrom(feedbackPool.oneWord);
  if (!/[.!?]$/.test(trimmed)) return randomFrom(feedbackPool.noPunctuation);
  if (words.length > 40) return randomFrom(feedbackPool.tooLong);
  if (/okay|fine|whatever|idk|meh/i.test(trimmed)) return randomFrom(feedbackPool.vague);
  if (/sad|angry|tired|lonely|lost|hate|love/i.test(trimmed)) return randomFrom(feedbackPool.emotional);

  return "";
}

function smartFakeAIResponse(text, tone) {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);

  if (words.length < 3) return text;

  const styles = {
    funny: [
      "If life gives you lemons, ask for tequila.",
      "Mondays should come with a warning label.",
      "Productivity? Never heard of her."
    ],
    sarcastic: [
      "Oh great, another message that’ll change the world.",
      "Sure, go ahead. I'm *definitely* listening.",
      "That sounds totally original and not at all cliché."
    ],
    "attention-grabbing": [
      "They scroll. You disappear. Echo louder.",
      "You’re not invisible. Just filtered.",
      "Say it like it matters. Because it does."
    ],
    playful: [
      "Poking algorithms with digital sticks.",
      "This post contains 0% logic but 100% vibes.",
      "Your shadow just reposted this."
    ]
  };

  const toneResponses = styles[tone] || styles["attention-grabbing"];
  const choice = Math.floor(Math.random() * toneResponses.length);

  return `${trimmed} → ${toneResponses[choice]}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { uid, username, text, tone } = JSON.parse(event.body);
    if (!uid || !username || !text || !tone) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const aiPost = smartFakeAIResponse(text, tone);
    const feedbackTip = analyzeInputTip(text);

    if (!admin.apps.length) {
      const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
      admin.initializeApp({
        credential: admin.credential.cert(credentials)
      });
    }

    const db = admin.firestore();
    await db.collection("posts").add({
      userId: uid,
      username,
      originalText: text,
      aiPost,
      tone,
      feedbackTip,
      createdAt: new Date().toISOString()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, aiPost, feedbackTip })
    };
  } catch (err) {
    console.error("Combined function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error", details: err.message })
    };
  }
};
