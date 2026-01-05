// src/api.js

// Адреса вашого бекенду на Vercel
const BACKEND_URL = 'https://project2-khaki-three.vercel.app/api/news.js';

// Конфігурація: Вмикаємо API примусово, бо перевірка ключів відбувається на сервері
const API_CONFIG = {
    newsApi: {
        enabled: true
    },
    gnews: {
        enabled: true
    },
    newsData: {
        enabled: false
    }
};

function buildNewsApiUrl(query, category = 'all') {
    const params = new URLSearchParams({
        endpoint: 'newsapi', // Кажемо бекенду використовувати NewsAPI
        lang: 'uk',
        pageSize: 20
    });

    if (query) params.set('query', query);
    if (category && category !== 'all') params.set('category', category);

    return `${BACKEND_URL}?${params.toString()}`;
}

function buildGNewsApiUrl(query, category = 'all') {
    const params = new URLSearchParams({
        endpoint: 'gnews', // Кажемо бекенду використовувати GNews
        lang: 'uk',
        max: 20
    });

    if (query) params.set('query', query);
    if (category && category !== 'all') params.set('category', category);

    return `${BACKEND_URL}?${params.toString()}`;
}

function normalizeApiResponse(data, apiType) {
    // Якщо це GNews, приводимо структуру до формату NewsAPI
    if (apiType === 'gnews') {
        return {
            status: 'ok',
            totalResults: data.totalArticles || 0,
            articles: (data.articles || []).map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                urlToImage: article.image,
                source: { name: article.source?.name || 'Unknown' },
                publishedAt: article.publishedAt,
                category: article.category || 'all'
            }))
        };
    }
    return data;
}

function createPlaceholderImage(text) {
    const svg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#e2e8f0"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// --- MOCK DATA (ЗАГЛУШКА) ---
async function getMockNews(query, category) {
    await new Promise(resolve => setTimeout(resolve, 500));

    const categories = {
        technology: 'Технології',
        sports: 'Спорт',
        business: 'Бізнес',
        entertainment: 'Розваги',
        health: 'Здоров\'я',
        science: 'Наука'
    };

    const mockArticles = [];

    const categoryTitles = {
        technology: [
            'Нові технології штучного інтелекту',
            'Оновлення в сфері кібербезпеки',
            'Розробка нових мобільних додатків',
            'Інновації в галузі робототехніки',
            'Прогрес у розробці квантових комп\'ютерів'
        ],
        sports: [
            'Останні результати футбольних матчів',
            'Нові рекорди в легкій атлетиці',
            'Трансфери в професійному спорті',
            'Підготовка до великих змагань',
            'Досягнення українських спортсменів'
        ],
        business: [
            'Аналіз ринкових трендів',
            'Нові інвестиційні можливості',
            'Зміни в економічній політиці',
            'Розвиток стартапів',
            'Корпоративні злиття та поглинання'
        ],
        entertainment: [
            'Прем\'єри нових фільмів',
            'Музичні релізи та концерти',
            'Театральні постановки',
            'Нові серіали та шоу',
            'Події в світі розваг'
        ],
        health: [
            'Нові медичні дослідження',
            'Рекомендації щодо здорового способу життя',
            'Розробка нових ліків',
            'Досягнення в медицині',
            'Важливі новини про здоров\'я'
        ],
        science: [
            'Наукові відкриття та дослідження',
            'Космічні місії та дослідження',
            'Екологічні ініціативи',
            'Розвиток науки та технологій',
            'Міжнародні наукові проекти'
        ]
    };

    const categoryDescriptions = {
        technology: 'Останні новини зі світу технологій та інновацій.',
        sports: 'Актуальні події та результати зі світу спорту.',
        business: 'Важливі новини про бізнес та економіку.',
        entertainment: 'Останні події зі світу розваг та культури.',
        health: 'Актуальна інформація про здоров\'я та медицину.',
        science: 'Наукові відкриття та дослідження.'
    };

    const sources = ['BBC', 'CNN', 'Local News'];

    Object.keys(categoryTitles).forEach(cat => {
        categoryTitles[cat].forEach((title, index) => {
            const sourceIndex = index % sources.length;
            mockArticles.push({
                title: title,
                description: categoryDescriptions[cat] + ' ' + (index + 1),
                url: `#`,
                urlToImage: createPlaceholderImage(categories[cat]),
                source: { name: sources[sourceIndex] },
                publishedAt: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
                category: cat
            });
        });
    });

    if (category === 'all') {
        const generalTitles = [
            'Світові новини: важливі події',
            'Головні події дня',
            'Міжнародні новини',
            'Важливі події з усього світу'
        ];

        generalTitles.forEach((title, index) => {
            const sourceIndex = index % sources.length;
            mockArticles.push({
                title: query ? `${query} - ${title}` : title,
                description: 'Головні події з усього світу, які варто знати.',
                url: `#`,
                urlToImage: createPlaceholderImage('World News'),
                source: { name: sources[sourceIndex] },
                publishedAt: new Date(Date.now() - index * 3600000).toISOString(),
                category: 'all'
            });
        });
    }

    let filtered = mockArticles;

    if (category !== 'all') {
        filtered = filtered.filter(article => article.category === category);
    }

    if (query) {
        const queryLower = query.toLowerCase();
        filtered = filtered.filter(article =>
          article.title.toLowerCase().includes(queryLower) ||
          article.description.toLowerCase().includes(queryLower)
        );
    }

    return {
        status: 'ok',
        totalResults: filtered.length,
        articles: filtered
    };
}

// --- ОСНОВНА ФУНКЦІЯ ОТРИМАННЯ НОВИН ---
export async function fetchNews(query = '', category = 'all') {
    const apiAttempts = [];

    if (API_CONFIG.newsApi.enabled) {
        apiAttempts.push({ url: buildNewsApiUrl(query, category), type: 'newsapi', name: 'NewsAPI' });
    }
    if (API_CONFIG.gnews.enabled) {
        apiAttempts.push({ url: buildGNewsApiUrl(query, category), type: 'gnews', name: 'GNews' });
    }

    if (apiAttempts.length === 0) {
        return await getMockNews(query, category);
    }

    for (const apiAttempt of apiAttempts) {
        try {
            const response = await fetch(apiAttempt.url);

            if (!response.ok) {
                console.warn(`${apiAttempt.name} Error: ${response.status}`);
                continue;
            }

            const data = await response.json();

            if (data.error || data.status === 'error') {
                console.warn(`${apiAttempt.name} API Error: ${data.message || data.error}`);
                continue;
            }

            const normalizedData = normalizeApiResponse(data, apiAttempt.type);

            if (!normalizedData.articles || normalizedData.articles.length === 0) {
                continue;
            }

            if (category !== 'all') {
                normalizedData.articles = normalizedData.articles.map(article => ({
                    ...article,
                    category: article.category || category
                }));
            }

            return normalizedData;

        } catch (error) {
            console.error(`Fetch Error (${apiAttempt.name}):`, error);
            continue;
        }
    }

    return await getMockNews(query, category);
}

// --- ОТРИМАННЯ НОВИН ЗА ДЖЕРЕЛОМ ---
export async function fetchNewsBySource(source) {
    try {
        // Використовуємо наш проксі-бекенд замість прямого запиту
        const params = new URLSearchParams({
            endpoint: 'newsapi',
            sources: source,
            pageSize: 20
        });

        const url = `${BACKEND_URL}?${params.toString()}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP помилка! Статус: ${response.status}`);
        }

        const data = await response.json();

        if (data.error || data.status === 'error') {
            throw new Error(data.message || 'API Error');
        }

        return normalizeApiResponse(data, 'newsapi');
    } catch (error) {
        console.error('Помилка завантаження джерела:', error);
        // Повертаємо пустий мок або помилку, яку обробить main.js
        return await getMockNews('', 'all');
    }
}