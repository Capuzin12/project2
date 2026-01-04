import { formatDate, truncateText, calculateReadingTime, getSourceLogo } from './utils.js';

function createPlaceholderImage(text) {
    const svg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#e2e8f0"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

export function createNewsCard(article, hideCategory = false) {
    const card = document.createElement('article');
    card.className = 'news-card';
    card.setAttribute('role', 'article');

    if (article.urlToImage) {
        const image = document.createElement('img');
        image.className = 'news-card__image';
        let imageUrl = article.urlToImage;
        if (imageUrl && (imageUrl.includes('via.placeholder.com') || imageUrl.includes('placeholder'))) {
            imageUrl = createPlaceholderImage('Зображення');
        }
        image.src = imageUrl;
        image.alt = article.title || 'Зображення новини';
        image.loading = 'lazy';
        image.onerror = function() {
            this.src = createPlaceholderImage('Зображення');
        };
        card.appendChild(image);
    }

    const content = document.createElement('div');
    content.className = 'news-card__content';

    // Заголовок з логотипом джерела
    const header = document.createElement('div');
    header.className = 'news-card__header';
    
    const sourceInfo = document.createElement('div');
    sourceInfo.className = 'news-card__source-info';
    
    const sourceLogo = document.createElement('span');
    sourceLogo.className = 'news-card__source-logo';
    sourceLogo.textContent = getSourceLogo(article.source?.name);
    sourceLogo.setAttribute('aria-label', `Джерело: ${article.source?.name || 'Невідоме джерело'}`);
    sourceInfo.appendChild(sourceLogo);
    
    const sourceName = document.createElement('span');
    sourceName.className = 'news-card__source-name';
    sourceName.textContent = article.source?.name || 'Невідоме джерело';
    sourceInfo.appendChild(sourceName);
    
    header.appendChild(sourceInfo);
    content.appendChild(header);

    if (article.category && !hideCategory) {
        const category = document.createElement('span');
        category.className = 'news-card__category';
        category.textContent = getCategoryName(article.category);
        content.appendChild(category);
    }

    const title = document.createElement('h2');
    title.className = 'news-card__title';
    title.textContent = article.title || 'Без заголовка';
    content.appendChild(title);

    if (article.description) {
        const description = document.createElement('p');
        description.className = 'news-card__description';
        description.textContent = truncateText(article.description, 150);
        content.appendChild(description);
    }

    const footer = document.createElement('div');
    footer.className = 'news-card__footer';

    const metaInfo = document.createElement('div');
    metaInfo.className = 'news-card__meta';

    if (article.publishedAt) {
        const date = document.createElement('span');
        date.className = 'news-card__date';
        date.textContent = formatDate(article.publishedAt);
        metaInfo.appendChild(date);
    }

    // Час на читання
    const readingTime = document.createElement('span');
    readingTime.className = 'news-card__reading-time';
    const fullText = (article.title || '') + ' ' + (article.description || '');
    const minutes = calculateReadingTime(fullText);
    readingTime.textContent = `⏱ ${minutes} ${minutes === 1 ? 'хв' : 'хв'}`;
    readingTime.setAttribute('aria-label', `Час на читання: ${minutes} хвилин`);
    metaInfo.appendChild(readingTime);

    footer.appendChild(metaInfo);

    // Кнопка поділитися
    const shareButton = document.createElement('button');
    shareButton.className = 'news-card__share';
    shareButton.setAttribute('aria-label', 'Поділитися новиною');
    shareButton.type = 'button';
    shareButton.innerHTML = '🔗';
    shareButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = article.url || window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                const originalText = shareButton.innerHTML;
                shareButton.innerHTML = '✓';
                shareButton.setAttribute('aria-label', 'Посилання скопійовано!');
                setTimeout(() => {
                    shareButton.innerHTML = originalText;
                    shareButton.setAttribute('aria-label', 'Поділитися новиною');
                }, 2000);
            }).catch(() => {
                // Fallback для старих браузерів
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    const originalText = shareButton.innerHTML;
                    shareButton.innerHTML = '✓';
                    setTimeout(() => {
                        shareButton.innerHTML = originalText;
                    }, 2000);
                } catch (err) {
                    console.error('Помилка копіювання:', err);
                }
                document.body.removeChild(textArea);
            });
        }
    });
    footer.appendChild(shareButton);

    const link = document.createElement('a');
    link.className = 'news-card__link';
    link.href = article.url || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Читати далі →';
    footer.appendChild(link);

    content.appendChild(footer);
    card.appendChild(content);

    return card;
}

function getCategoryName(category) {
    const categoryNames = {
        technology: 'Технології',
        sports: 'Спорт',
        business: 'Бізнес',
        entertainment: 'Розваги',
        health: 'Здоров\'я',
        science: 'Наука',
        all: 'Загальні'
    };

    return categoryNames[category] || category;
}

export function renderNewsGrid(articles, container, onCardCreated = null, hideCategory = false) {
    container.innerHTML = '';

    if (!articles || articles.length === 0) {
        return;
    }

    const cards = articles.map(article => {
        const card = createNewsCard(article, hideCategory);
        if (onCardCreated && typeof onCardCreated === 'function') {
            onCardCreated(article, card);
        }
        return card;
    });

    cards.forEach(card => {
        container.appendChild(card);
    });
}

export function showNoResults(container) {
    container.hidden = false;
}

export function hideNoResults(container) {
    container.hidden = true;
}

export function showLoading(loadingElement) {
    loadingElement.hidden = false;
    loadingElement.setAttribute('aria-busy', 'true');
}

export function hideLoading(loadingElement) {
    loadingElement.hidden = true;
    loadingElement.setAttribute('aria-busy', 'false');
}

export function showError(errorContainer, message) {
    const errorMessage = errorContainer.querySelector('#errorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    errorContainer.hidden = false;
}

export function hideError(errorContainer) {
    errorContainer.hidden = true;
}

export function updatePagination(paginationElements, currentPage, totalPages) {
    const { container, currentPageEl, totalPagesEl, prevButton, nextButton } = paginationElements;

    if (currentPageEl) {
        currentPageEl.textContent = currentPage;
    }

    if (totalPagesEl) {
        totalPagesEl.textContent = totalPages;
    }

    if (prevButton) {
        prevButton.disabled = currentPage <= 1;
    }

    if (nextButton) {
        nextButton.disabled = currentPage >= totalPages;
    }

    if (container) {
        container.hidden = totalPages <= 1;
    }
}

