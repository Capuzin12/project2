export default async function handler(req, res) {
  // 1. --- НАЛАШТУВАННЯ CORS (ОБОВ'ЯЗКОВО) ---
  // Дозволяємо доступ з будь-якого джерела (*), або вкажіть 'http://localhost:4000' замість '*'
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. --- ОБРОБКА PREFLIGHT ЗАПИТУ ---
  // Браузер іноді спочатку питає "чи можна?", це метод OPTIONS. Відповідаємо "так".
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. --- ОТРИМАННЯ ДАНИХ ---
  const { endpoint, query, category, sources, lang = 'uk', pageSize = 20, max = 20 } = req.query;

  // Переконайтеся, що ці змінні є у Vercel Environment Variables
  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

  // Якщо немає ключа, повертаємо помилку (щоб ви бачили це в Network tab)
  if (!NEWS_API_KEY && endpoint === 'newsapi') {
    return res.status(500).json({ error: 'Server missing NEWS_API_KEY' });
  }
  if (!GNEWS_API_KEY && endpoint === 'gnews') {
    return res.status(500).json({ error: 'Server missing GNEWS_API_KEY' });
  }

  if (!endpoint) return res.status(400).json({ error: 'No endpoint specified' });

  let url = '';

  if (endpoint === 'gnews') {
    // GNews API
    const params = new URLSearchParams({
      apikey: GNEWS_API_KEY,
      lang,
      max
    });
    if (query) params.set('q', query);
    if (category && category !== 'all') params.set('topic', category);

    url = `https://gnews.io/api/v4/search?${params.toString()}`;
  } else {
    // NewsAPI
    if (sources) {
      url = `https://newsapi.org/v2/everything?sources=${sources}&apiKey=${NEWS_API_KEY}`;
    } else if (category && category !== 'all') {
      url = `https://newsapi.org/v2/top-headlines?category=${category}&language=${lang}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
    } else {
      // Якщо є query або просто завантаження
      const q = query || 'news';
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${lang}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
    }
  }

  try {
    const r = await fetch(url);
    const data = await r.json();

    // Якщо саме зовнішнє API повернуло помилку
    if (!r.ok) {
      return res.status(r.status).json({ error: data.message || 'External API Error' });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}