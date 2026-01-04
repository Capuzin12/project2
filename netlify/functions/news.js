// netlify/functions/news.js

exports.handler = async function(event, context) {
  const params = event.queryStringParameters || {};
  const endpoint = params.endpoint || 'gnews'; // За замовчуванням gnews

  let url = '';
  let apiKey = '';

  // --- ЛОГІКА ВИБОРУ API ---
  if (endpoint === 'newsapi') {
    apiKey = process.env.VITE_NEWS_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "NewsAPI Key missing on server" }) };
    }

    const queryParams = new URLSearchParams({
      apiKey: apiKey,
      language: params.lang || 'uk',
      pageSize: params.pageSize || '20'
    });

    // NewsAPI має різні endpoints для пошуку і категорій
    if (params.sources) {
      queryParams.append('sources', params.sources);
      url = `https://newsapi.org/v2/top-headlines?${queryParams.toString()}`;
    } else if (params.category && params.category !== 'all' && !params.query) {
      queryParams.append('category', params.category);
      url = `https://newsapi.org/v2/top-headlines?${queryParams.toString()}`;
    } else {
      // Для пошуку або якщо є query
      const q = params.query || 'news';
      queryParams.append('q', q);
      queryParams.append('sortBy', 'publishedAt');
      url = `https://newsapi.org/v2/everything?${queryParams.toString()}`;
    }

  } else {
    // --- GNEWS (Default) ---
    apiKey = process.env.VITE_GNEWS_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "GNews Key missing on server" }) };
    }

    const queryParams = new URLSearchParams({
      apikey: apiKey,
      lang: params.lang || 'uk',
      max: params.max || '20',
      q: params.query || 'news'
    });

    if (params.category && params.category !== 'all') {
      queryParams.append('topic', params.category);
    }

    url = `https://gnews.io/api/v4/search?${queryParams.toString()}`;
  }

  // --- ЗАПИТ ДО РЕАЛЬНОГО API ---
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `External API Error: ${data.message || response.statusText}` })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
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