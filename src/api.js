const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || '';
const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY || '';

const NEWS_API_BASE = 'https://newsapi.org/v2';
const GNEWS_API_BASE = 'https://gnews.io/api/v4';

const API_CONFIG = {
    newsApi: {
        enabled: !!NEWS_API_KEY,
        key: NEWS_API_KEY
    },
    gnews: {
        enabled: !!GNEWS_API_KEY,
        key: GNEWS_API_KEY
    },
    newsData: {
        enabled: false
    }
};

function buildNewsApiUrl(query, category = 'all') {
    if (!API_CONFIG.newsApi.enabled) {
        return null;
    }

    if (category !== 'all' && !query) {
        const params = new URLSearchParams({
            category: category,
            pageSize: 20
        });
        return `https://project2-khaki-three.vercel.app/api/news?${params.toString()}`;
    }

    let searchQuery = query || 'news';

    if (category !== 'all' && query) {
        searchQuery = `${query} ${category}`;
    } else if (category !== 'all' && !query) {
        searchQuery = category;
    }

    const params = new URLSearchParams({
        q: searchQuery,
        language: 'uk',
        sortBy: 'publishedAt',
        pageSize: 20
    });

    return `https://project2-khaki-three.vercel.app/api/news?${params.toString()}`;
}

function buildGNewsApiUrl(query, category = 'all') {
    if (!API_CONFIG.gnews.enabled) {
        return null;
    }

    const categoryMap = {
        technology: 'technology',
        sports: 'sports',
        business: 'business',
        entertainment: 'entertainment',
        health: 'health',
        science: 'science'
    };

    const params = new URLSearchParams({
        lang: 'uk',
        max: 20,
        apikey: API_CONFIG.gnews.key
    });

    if (category !== 'all' && categoryMap[category]) {
        params.set('topic', categoryMap[category]);
        if (query) {
            params.set('q', query);
        }
    } else {
        params.set('q', query || 'news');
    }

    return `${GNEWS_API_BASE}/search?${params.toString()}`;
}

function normalizeApiResponse(data, apiType) {
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
                url: `https://example.com/news/${cat}-${index + 1}`,
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

        const sources = ['BBC', 'CNN', 'Local News'];

        generalTitles.forEach((title, index) => {
            const sourceIndex = index % sources.length;
            mockArticles.push({
                title: query ? `${query} - ${title}` : title,
                description: 'Головні події з усього світу, які варто знати.',
                url: `https://example.com/news/general-${index + 1}`,
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

export async function fetchNews(query = '', category = 'all') {
    const apiAttempts = [];

    if (API_CONFIG.newsApi.enabled) {
        const newsApiUrl = buildNewsApiUrl(query, category);
        if (newsApiUrl) {
            apiAttempts.push({ url: newsApiUrl, type: 'newsapi', name: 'NewsAPI.org' });
        }
    }

    if (API_CONFIG.gnews.enabled) {
        const gnewsUrl = buildGNewsApiUrl(query, category);
        if (gnewsUrl) {
            apiAttempts.push({ url: gnewsUrl, type: 'gnews', name: 'GNews API' });
        }
    }

    if (apiAttempts.length === 0) {
        return await getMockNews(query, category);
    }

    for (const apiAttempt of apiAttempts) {
        try {
            const response = await fetch(apiAttempt.url);

            if (!response.ok) {
                if (response.status === 401 || response.status === 403 || response.status === 429) {
                    continue;
                }
                continue;
            }

            const data = await response.json();

            if (data.status === 'error') {
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
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                continue;
            }
            continue;
        }
    }

    return await getMockNews(query, category);
}

export async function fetchNewsBySource(source) {
    try {
        if (!API_CONFIG.newsApi.enabled) {
            return await getMockNews('', 'all');
        }

        const url = `${NEWS_API_BASE}/everything?sources=${source}&apiKey=${API_CONFIG.newsApi.key}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP помилка! Статус: ${response.status}`);
        }

        const data = await response.json();
        return normalizeApiResponse(data, 'newsapi');
    } catch (error) {
        throw new Error('Не вдалося завантажити новини з джерела.');
    }
}
