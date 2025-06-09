const fetch = require("node-fetch");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { email, username } = JSON.parse(event.body);

  const API_KEY = process.env.MC_API_KEY;
  const LIST_ID = process.env.MC_LIST_ID;
  const DATACENTER = API_KEY.split("-")[1];

  const url = `https://${DATACENTER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `apikey ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: email,
      status: "subscribed",
      merge_fields: { FNAME: username },
    }),
  });

  if (response.ok) {
    return { statusCode: 200, body: "Subscribed successfully" };
  } else {
    const error = await response.json();
    return { statusCode: 400, body: JSON.stringify(error) };
  }
};
