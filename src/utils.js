const STORAGE_KEYS = {
    LAST_SEARCH: 'newsAggregator_lastSearch',
    LAST_CATEGORY: 'newsAggregator_lastCategory',
    FAVORITES: 'newsAggregator_favorites',
    CURRENT_PAGE: 'newsAggregator_currentPage',
    THEME: 'newsAggregator_theme',
    ITEMS_PER_PAGE: 'newsAggregator_itemsPerPage',
    SCROLL_POSITION: 'newsAggregator_scrollPosition',
    VIEW_MODE: 'newsAggregator_viewMode'
};

export function saveLastSearch(query) {
    try {
        localStorage.setItem(STORAGE_KEYS.LAST_SEARCH, query);
    } catch (error) {
    }
}

export function getLastSearch() {
    try {
        return localStorage.getItem(STORAGE_KEYS.LAST_SEARCH);
    } catch (error) {
        return null;
    }
}

export function saveLastCategory(category) {
    try {
        localStorage.setItem(STORAGE_KEYS.LAST_CATEGORY, category);
    } catch (error) {
    }
}

export function getLastCategory() {
    try {
        return localStorage.getItem(STORAGE_KEYS.LAST_CATEGORY) || 'all';
    } catch (error) {
        return 'all';
    }
}

export function saveCurrentPage(page) {
    try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_PAGE, page.toString());
    } catch (error) {
    }
}

export function getCurrentPage() {
    try {
        const page = localStorage.getItem(STORAGE_KEYS.CURRENT_PAGE);
        return page ? parseInt(page, 10) : 1;
    } catch (error) {
        return 1;
    }
}

export function addToFavorites(article) {
    try {
        const user = localStorage.getItem('newsAggregator_currentUser');
        if (!user) return;
        const key = STORAGE_KEYS.FAVORITES + '_' + user;
        let favorites = [];
        try { favorites = JSON.parse(localStorage.getItem(key)) || []; } catch { favorites = []; }
        const exists = favorites.some(fav => fav.url === article.url);
        if (!exists) {
            favorites.push(article);
            localStorage.setItem(key, JSON.stringify(favorites));
        }
    } catch (error) {}
}

export function removeFromFavorites(url) {
    try {
        const user = localStorage.getItem('newsAggregator_currentUser');
        if (!user) return;
        const key = STORAGE_KEYS.FAVORITES + '_' + user;
        let favorites = [];
        try { favorites = JSON.parse(localStorage.getItem(key)) || []; } catch { favorites = []; }
        const filtered = favorites.filter(fav => fav.url !== url);
        localStorage.setItem(key, JSON.stringify(filtered));
    } catch (error) {}
}

export function getFavorites() {
    try {
        const user = localStorage.getItem('newsAggregator_currentUser');
        if (!user) return [];
        const key = STORAGE_KEYS.FAVORITES + '_' + user;
        const favorites = localStorage.getItem(key);
        return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
        return [];
    }
}

export function isFavorite(url) {
    const favorites = getFavorites();
    return favorites.some(fav => fav.url === url);
}

export function validateSearchQuery(query) {
    if (!query || typeof query !== 'string') {
        return {
            isValid: false,
            error: 'Будь ласка, введіть пошуковий запит'
        };
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
        return {
            isValid: false,
            error: 'Пошуковий запит не може бути порожнім'
        };
    }

    if (trimmedQuery.length < 2) {
        return {
            isValid: false,
            error: 'Пошуковий запит має містити принаймні 2 символи'
        };
    }

    if (trimmedQuery.length > 100) {
        return {
            isValid: false,
            error: 'Пошуковий запит занадто довгий (максимум 100 символів)'
        };
    }

    return {
        isValid: true,
        error: null,
        query: trimmedQuery
    };
}

export function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) {
            return 'щойно';
        } else if (minutes < 60) {
            return `${minutes} хв. тому`;
        } else if (hours < 24) {
            return `${hours} год. тому`;
        } else if (days < 7) {
            return `${days} дн. тому`;
        } else {
            return date.toLocaleDateString('uk-UA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    } catch (error) {
        return '';
    }
}

export function truncateText(text, maxLength = 150) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    if (text.length <= maxLength) {
        return text;
    }

    return text.substring(0, maxLength).trim() + '...';
}

export function saveTheme(theme) {
    try {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
    }
}

export function getTheme() {
    try {
        return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    } catch (error) {
        return 'light';
    }
}

export function saveItemsPerPage(items) {
    try {
        localStorage.setItem(STORAGE_KEYS.ITEMS_PER_PAGE, items.toString());
    } catch (error) {
    }
}

export function getItemsPerPage() {
    try {
        const items = localStorage.getItem(STORAGE_KEYS.ITEMS_PER_PAGE);
        return items ? parseInt(items, 10) : 6;
    } catch (error) {
        return 6;
    }
}

export function filterByDate(articles, dateFilter) {
    if (dateFilter === 'all') {
        return articles;
    }

    const now = new Date();
    const filterDate = new Date();

    switch (dateFilter) {
        case 'today':
            filterDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            filterDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            filterDate.setMonth(now.getMonth() - 1);
            break;
        default:
            return articles;
    }

    return articles.filter(article => {
        if (!article.publishedAt) return false;
        const articleDate = new Date(article.publishedAt);
        return articleDate >= filterDate;
    });
}

export function getStatistics(articles) {
    const stats = {
        total: articles.length,
        categories: {}
    };

    articles.forEach(article => {
        const category = article.category || 'all';
        stats.categories[category] = (stats.categories[category] || 0) + 1;
    });

    return stats;
}

// ============================================
// Scroll Position Management
// ============================================

export function saveScrollPosition(viewMode = 'news') {
    try {
        const scrollData = {
            position: window.scrollY || window.pageYOffset || document.documentElement.scrollTop,
            timestamp: Date.now(),
            viewMode: viewMode
        };
        sessionStorage.setItem(STORAGE_KEYS.SCROLL_POSITION, JSON.stringify(scrollData));
    } catch (error) {
        // Ignore storage errors
    }
}

export function getScrollPosition() {
    try {
        const scrollData = sessionStorage.getItem(STORAGE_KEYS.SCROLL_POSITION);
        if (scrollData) {
            const data = JSON.parse(scrollData);
            // Перевіряємо, чи дані не застарілі (більше 5 хвилин)
            const maxAge = 5 * 60 * 1000; // 5 хвилин
            if (Date.now() - data.timestamp < maxAge) {
                return data;
            }
        }
        return null;
    } catch (error) {
        return null;
    }
}

export function restoreScrollPosition(viewMode = 'news', forceRestore = false) {
    try {
        const scrollData = getScrollPosition();
        if (scrollData && (scrollData.viewMode === viewMode || forceRestore)) {
            // Використовуємо requestAnimationFrame для забезпечення, що DOM готовий
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    window.scrollTo({
                        top: scrollData.position,
                        behavior: 'auto' // Миттєвий скрол без анімації
                    });
                });
            });
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

export function clearScrollPosition() {
    try {
        sessionStorage.removeItem(STORAGE_KEYS.SCROLL_POSITION);
    } catch (error) {
        // Ignore storage errors
    }
}

export function saveViewMode(viewMode) {
    try {
        sessionStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
    } catch (error) {
        // Ignore storage errors
    }
}

export function getViewMode() {
    try {
        return sessionStorage.getItem(STORAGE_KEYS.VIEW_MODE) || 'news';
    } catch (error) {
        return 'news';
    }
}

export function calculateReadingTime(text) {
    if (!text || typeof text !== 'string') {
        return 1;
    }
    
    // Середня швидкість читання: 200-250 слів на хвилину
    // Використовуємо 200 слів/хв для консервативної оцінки
    const wordsPerMinute = 200;
    const wordCount = text.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    
    // Мінімум 1 хвилина
    return Math.max(1, readingTime);
}

export function getSourceLogo(sourceName) {
    // Простий мок для логотипів джерел
    const sourceLogos = {
        'BBC': '📺',
        'CNN': '📡',
        'Local News': '📰',
        'World News': '🌍',
        'Technology News': '💻',
        'Sports News': '⚽',
        'Business News': '💼',
        'Entertainment News': '🎬',
        'Health News': '🏥',
        'Science News': '🔬'
    };
    
    if (!sourceName) return '📰';
    
    // Перевіряємо точну відповідність
    if (sourceLogos[sourceName]) {
        return sourceLogos[sourceName];
    }
    
    // Перевіряємо часткову відповідність
    for (const [key, logo] of Object.entries(sourceLogos)) {
        if (sourceName.toLowerCase().includes(key.toLowerCase())) {
            return logo;
        }
    }
    
    return '📰'; // Заглушка за замовчуванням
}

