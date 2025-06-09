const fakeAIResponse = (text, tone) => {
  const responses = {
    funny: [
      "If life gives you lemons, ask for tequila.",
      "I tried to be productive today... and then I blinked.",
      "Mondays should come with a warning label."
    ],
    sarcastic: [
      "Oh great, another meeting that could’ve been an email.",
      "Sure, let me drop everything and work on your emergency.",
      "I'm not saying I'm tired, but my yawn just yawned."
    ],
    "attention-grabbing": [
      "You’re not invisible. You’re just being filtered.",
      "They see you. They scroll. You disappear. Echo louder.",
      "Engage now or stay ignored forever."
    ],
    playful: [
      "Poking algorithms with a digital stick.",
      "This post contains 0% logic but 100% vibes.",
      "Danced with my shadow today. It won."
    ]
  };

  const toneResponses = responses[tone] || responses["attention-grabbing"];
  const choice = Math.floor(Math.random() * toneResponses.length);
  return toneResponses[choice];
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { uid, text, tone } = JSON.parse(event.body);

    if (!uid || !text || !tone) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const aiPost = fakeAIResponse(text, tone);

    const admin = require("firebase-admin");
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    }

    const db = admin.firestore();

    await db.collection("posts").add({
      userId: uid,
      username: "anonymous",
      originalText: text,
      aiPost,
      tone,
      createdAt: new Date().toISOString()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, aiPost })
    };
  } catch (err) {
    console.error("Combined handler error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate or save post", details: err.message })
    };
  }
};
