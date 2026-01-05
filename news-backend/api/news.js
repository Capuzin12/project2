export default async function handler(req, res) {
  // 1. Налаштування CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint = 'gnews', query, category, sources, lang = 'uk', pageSize = 20, max = 20 } = req.query;

  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

  if (endpoint === 'newsapi' && !NEWS_API_KEY) return res.status(401).json({ error: 'MISSING_KEY', message: 'NEWS_API_KEY missing' });
  if (endpoint === 'gnews' && !GNEWS_API_KEY) return res.status(401).json({ error: 'MISSING_KEY', message: 'GNEWS_API_KEY missing' });

  let url = '';

  // --- ЛОГІКА GNEWS (Виправлена) ---
  if (endpoint === 'gnews') {
    const params = new URLSearchParams({
      apikey: GNEWS_API_KEY,
      lang: lang,
      max: max
    });

    // ВАЖЛИВО: GNews розділяє логіку
    if (query) {
      // 1. Якщо є ПОШУК -> використовуємо /search
      // Цей endpoint вимагає параметр 'q'
      url = 'https://gnews.io/api/v4/search';
      params.set('q', query);
      // Примітка: /search у GNews часто ігнорує 'topic', тому ми його тут не додаємо
    } else if (category && category !== 'all') {
      // 2. Якщо є КАТЕГОРІЯ (і немає пошуку) -> використовуємо /top-headlines
      // Цей endpoint вимагає 'topic'
      url = 'https://gnews.io/api/v4/top-headlines';
      params.set('topic', category);
    } else {
      // 3. Якщо нічого немає (Головна) -> використовуємо /top-headlines
      url = 'https://gnews.io/api/v4/top-headlines';
      // За замовчуванням GNews повертає breaking-news
    }

    url += `?${params.toString()}`;

  } else {
    // --- ЛОГІКА NEWSAPI ---
    if (sources) {
      url = `https://newsapi.org/v2/everything?sources=${sources}&apiKey=${NEWS_API_KEY}`;
    } else if (category && category !== 'all') {
      url = `https://newsapi.org/v2/top-headlines?category=${category}&language=${lang}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
    } else {
      const q = query || 'news';
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${lang}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
    }
  }

  try {
    console.log(`Fetching: ${url}`); // Лог для Vercel Dashboard
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error:`, data);
      return res.status(response.status).json({ error: data.message || 'External API Error' });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}