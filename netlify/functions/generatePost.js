const fetch = require("node-fetch");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { uid, text, tone } = JSON.parse(event.body);

  if (!uid || !text || !tone) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const prompt = `Rewrite the following user input as a ${tone}, attention-grabbing social media post optimized for engagement. Keep it authentic to the user's tone:

User input: "${text}"`;

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a social media assistant that rewrites user input to be more viral and emotional." },
          { role: "user", content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 100
      })
    });

    const openaiData = await openaiResponse.json();
    const aiPost = openaiData.choices?.[0]?.message?.content?.trim();

    if (!aiPost) {
      return { statusCode: 500, body: JSON.stringify({ error: "AI failed to generate a response" }) };
    }

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
    console.error("Error in generatePost:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate or store post" })
    };
  }
};
