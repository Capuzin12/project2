
exports.handler = async function(event, context) {
  const API_KEY = process.env.VITE_GNEWS_API_KEY; // Ключ беремо з налаштувань Netlify
  const { query, category } = event.queryStringParameters;

  const url = `https://gnews.io/api/v4/search?q=${query || 'news'}&lang=uk&max=20&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Дозволяємо всім
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch news" })
    };
  }
};