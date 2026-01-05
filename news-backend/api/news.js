export default async function handler(req, res) {
  // 1. Налаштування CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Отримуємо параметри від фронтенду
  const { endpoint = 'gnews', query, category, sources, lang = 'uk', pageSize = 20, max = 20 } = req.query;

  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

  // Перевірка наявності ключів
  if (endpoint === 'newsapi' && !NEWS_API_KEY) {
    return res.status(401).json({ error: 'MISSING_KEY', message: 'NEWS_API_KEY missing' });
  }
  if (endpoint === 'gnews' && !GNEWS_API_KEY) {
    return res.status(401).json({ error: 'MISSING_KEY', message: 'GNEWS_API_KEY missing' });
  }

  let url = '';

  // --- ЛОГІКА GNEWS ---
  if (endpoint === 'gnews') {
    const params = new URLSearchParams({
      apikey: GNEWS_API_KEY,
      lang: lang,
      max: max
    });

    // 1. Якщо обрана категорія -> додаємо параметр 'topic'
    if (category && category !== 'all') {
      params.set('topic', category);
    }

    // 2. Обробка пошукового запиту 'q'
    if (query) {
      // Якщо користувач щось ввів -> шукаємо це
      params.set('q', query);
    } else if (!category || category === 'all') {
      // ВАЖЛИВО: GNews вимагає хоча б один параметр (q або topic).
      // Якщо немає ні категорії, ні пошуку -> ставимо дефолтний пошук 'news'
      params.set('q', 'news');
    }
    // (Якщо є категорія, але немає query -> 'q' не додаємо, GNews це дозволяє)

    url = `https://gnews.io/api/v4/search?${params.toString()}`;

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
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      // Логування помилки для налагодження (видно у Vercel logs)
      console.error(`External API Error (${endpoint}):`, data);
      return res.status(response.status).json({ error: data.message || 'External API Error' });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}