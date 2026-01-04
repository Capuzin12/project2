exports.handler = async function(event, context) {
  // 1. Беремо ключ із налаштувань Netlify (безпечно)
  const API_KEY = process.env.VITE_GNEWS_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API Key not found in Netlify settings" })
    };
  }

  // 2. Отримуємо параметри від вашого сайту (query, category)
  const params = event.queryStringParameters || {};
  const query = params.query || 'news';
  const category = params.category || 'general';

  // 3. Формуємо запит до GNews
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&category=${category}&lang=uk&max=20&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);

    // Якщо GNews повернув помилку (наприклад, ліміт вичерпано)
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `GNews Error: ${response.statusText}` })
      };
    }

    const data = await response.json();

    // 4. Віддаємо дані вашому сайту з дозволом CORS
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Дозволяємо доступ усім
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};