const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || '';
const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY || '';

const API_CONFIG = {
    newsApi: {
        enabled: true // Завжди ввімкнено, нехай сервер розбирається
    },
    gnews: {
        enabled: true // Завжди ввімкнено
    },
    newsData: {
        enabled: false
    }
};

function buildNewsApiUrl(query, category = 'all') {
    const params = new URLSearchParams({
        endpoint: 'newsapi', // Кажемо серверу, яке API ми хочемо
        lang: 'uk',
        pageSize: 20
    });

    if (query) params.set('query', query);
    if (category && category !== 'all') params.set('category', category);

    // Звертаємось до файлу news.js
    return `/.netlify/functions/news?${params.toString()}`;
}

function buildGNewsApiUrl(query, category = 'all') {
    const params = new URLSearchParams({
        endpoint: 'gnews', // Кажемо серверу, що це GNews
        lang: 'uk',
        max: 20
    });

    if (query) params.set('query', query);
    if (category && category !== 'all') params.set('category', category);

    return `/.netlify/functions/news?${params.toString()}`;
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
    // Для NewsAPI структура стандартна
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
    console.log('Використовуються Mock Data (API недоступне)');
    await new Promise(resolve => setTimeout(resolve, 500));
    const categories = {
        technology: 'Технології',
        sports: 'Спорт',
        business: 'Бізнес',
        entertainment: 'Розваги',
        health: 'Здоров\'я',
        science: 'Наука'
    };

    const mockArticles = [
        {
            title: "Тестова новина (Mock Data)",
            description: "Це заглушка, бо сервер не відповів або ключі не налаштовані.",
            url: "#",
            urlToImage: createPlaceholderImage('Mock News'),
            source: { name: "System" },
            publishedAt: new Date().toISOString(),
            category: category === 'all' ? 'technology' : category
        }
    ];
    
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
        totalResults: mockArticles.length,
        articles: mockArticles
    };
}

export async function fetchNews(query = '', category = 'all') {
    const apiAttempts = [];

    // Додаємо спроби у чергу
    // Пріоритет: спочатку NewsAPI (краща якість), потім GNews
    apiAttempts.push({ url: buildNewsApiUrl(query, category), type: 'newsapi', name: 'NewsAPI' });
    apiAttempts.push({ url: buildGNewsApiUrl(query, category), type: 'gnews', name: 'GNews' });

    for (const apiAttempt of apiAttempts) {
        try {
            console.log(`Спроба запиту до: ${apiAttempt.name}...`);
            const response = await fetch(apiAttempt.url);

            if (!response.ok) {
                console.warn(`${apiAttempt.name} повернув помилку: ${response.status}`);
                continue; // Пробуємо наступне API
            }

            const data = await response.json();

            if (data.error) {
                console.warn(`${apiAttempt.name} API Error: ${data.error}`);
                continue;
            }

            if (data.status === 'error' || (data.articles && data.articles.length === 0)) {
                continue;
            }

            return normalizeApiResponse(data, apiAttempt.type);

        } catch (error) {
            console.error(`Помилка під час запиту до ${apiAttempt.name}:`, error);
            continue;
        }
    }

    // Якщо нічого не спрацювало — віддаємо Mock Data
    return await getMockNews(query, category);
}

export async function fetchNewsBySource(source) {
    try {
        const params = new URLSearchParams({
            endpoint: 'newsapi',
            sources: source
        });

        const url = `/.netlify/functions/news?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error(`HTTP помилка! Статус: ${response.status}`);

        const data = await response.json();
        return normalizeApiResponse(data, 'newsapi');
    } catch (error) {
        console.error(error);
        return await getMockNews('', 'all');
    }
}
