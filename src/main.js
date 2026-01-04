import { fetchNews } from './api.js';
import { renderNewsGrid, showLoading, hideLoading, showError, hideError, showNoResults, hideNoResults, updatePagination } from './renderer.js';
import { 
    validateSearchQuery, 
    saveLastSearch, 
    getLastSearch, 
    saveLastCategory, 
    getLastCategory,
    saveCurrentPage,
    getCurrentPage,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getFavorites,
    saveTheme,
    getTheme,
    saveItemsPerPage,
    getItemsPerPage,
    getStatistics,
    formatDate,
    filterByDate,
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
    saveViewMode,
    getViewMode
} from './utils.js';

class NewsAggregator {
    constructor() {
        this.currentArticles = [];
        this.filteredArticles = [];
        this.currentPage = 1;
        this.itemsPerPage = getItemsPerPage();
        this.currentQuery = '';
        this.currentCategory = 'all';
        this.currentSource = 'all';
        this.currentDateFilter = 'all';
        this.currentSort = 'newest';
        this.viewMode = 'news';
        this.layoutView = 'grid'; // 'grid' or 'list'

        this.elements = {
            searchForm: document.getElementById('searchForm'),
            searchInput: document.getElementById('searchInput'),
            searchError: document.getElementById('searchError'),
            resetSearchButton: document.getElementById('resetSearchButton'),
            categoryFilter: document.getElementById('categoryFilter'),
            sourceFilter: document.getElementById('sourceFilter'),
            dateFilter: document.getElementById('dateFilter'),
            sortFilter: document.getElementById('sortFilter'),
            itemsPerPage: document.getElementById('itemsPerPage'),
            gridViewButton: document.getElementById('gridViewButton'),
            listViewButton: document.getElementById('listViewButton'),
            newsGrid: document.getElementById('newsGrid'),
            loading: document.getElementById('loading'),
            errorContainer: document.getElementById('errorContainer'),
            errorMessage: document.getElementById('errorMessage'),
            retryButton: document.getElementById('retryButton'),
            noResults: document.getElementById('noResults'),
            pagination: document.getElementById('pagination'),
            currentPageEl: document.getElementById('currentPage'),
            totalPagesEl: document.getElementById('totalPages'),
            prevButton: document.getElementById('prevButton'),
            nextButton: document.getElementById('nextButton'),
            favoritesButton: document.getElementById('favoritesButton'),
            backToNewsButton: document.getElementById('backToNewsButton'),
            themeToggle: document.getElementById('themeToggle'),
            statistics: document.getElementById('statistics'),
            totalNews: document.getElementById('totalNews'),
            categoriesStats: document.getElementById('categoriesStats'),
            modal: document.getElementById('newsModal'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalClose: document.getElementById('modalClose'),
            modalImage: document.getElementById('modalImage'),
            modalCategory: document.getElementById('modalCategory'),
            modalTitle: document.getElementById('modalTitle'),
            modalSource: document.getElementById('modalSource'),
            modalDate: document.getElementById('modalDate'),
            modalDescription: document.getElementById('modalDescription'),
            modalLink: document.getElementById('modalLink'),
            modalFavorite: document.getElementById('modalFavorite')
        };

        this.init();
    }

    init() {
        this.initTheme();
        this.restoreState();
        this.setupEventListeners();
        this.ensureMainViewState(); // Переконуємось, що стан головної сторінки коректний
        this.setLayoutView(this.layoutView); // Ініціалізуємо layout view
        this.setupScrollRestoration(); // Налаштовуємо scroll restoration
        this.loadNews();
    }

    setupScrollRestoration() {
        // Зберігаємо позицію скролу перед переходом на іншу сторінку
        window.addEventListener('beforeunload', () => {
            saveScrollPosition(this.viewMode);
        });

        // Зберігаємо позицію скролу при зміні сторінки
        window.addEventListener('scroll', () => {
            // Throttle для оптимізації
            if (!this.scrollTimeout) {
                this.scrollTimeout = setTimeout(() => {
                    saveScrollPosition(this.viewMode);
                    this.scrollTimeout = null;
                }, 250); // Зберігаємо позицію кожні 250мс
            }
        });

        // Зберігаємо позицію при натисканні на картку (перед відкриттям модального вікна)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.news-card') && !e.target.closest('.news-card__favorite') && !e.target.closest('.news-card__share')) {
                saveScrollPosition(this.viewMode);
            }
        }, true);
    }

    ensureMainViewState() {
        // Переконуємось, що всі елементи головної сторінки видимі та мають правильні стилі
        if (this.elements.backToNewsButton) {
            this.elements.backToNewsButton.classList.add('hidden');
            this.elements.backToNewsButton.style.display = 'none';
        }
        if (this.elements.favoritesButton) {
            this.elements.favoritesButton.classList.remove('hidden');
            this.elements.favoritesButton.style.display = 'block';
        }
        
        // Переконуємось, що фільтри та секція пошуку видимі
        if (this.elements.categoryFilter) {
            const filtersContainer = this.elements.categoryFilter.closest('.filters');
            if (filtersContainer) {
                filtersContainer.classList.remove('hidden');
                filtersContainer.style.display = '';
            }
        }
        
        if (this.elements.searchForm) {
            const searchSection = this.elements.searchForm.closest('.search-section');
            if (searchSection) {
                searchSection.classList.remove('hidden');
                searchSection.style.display = '';
            }
        }
    }

    initTheme() {
        const theme = getTheme();
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeButton(theme);
    }

    updateThemeButton(theme) {
        if (this.elements.themeToggle) {
            this.elements.themeToggle.textContent = theme === 'dark' ? '☀️ Світла тема' : '🌙 Темна тема';
        }
    }

    restoreState() {
        const lastSearch = getLastSearch();
        const lastCategory = getLastCategory();
        const lastPage = getCurrentPage();

        if (lastSearch) {
            this.elements.searchInput.value = lastSearch;
            this.currentQuery = lastSearch;
        }

        if (lastCategory) {
            this.elements.categoryFilter.value = lastCategory;
            this.currentCategory = lastCategory;
        }

        if (lastPage) {
            this.currentPage = lastPage;
        }

        this.updateResetButtonVisibility();
    }

    setupEventListeners() {
        this.elements.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        if (this.elements.resetSearchButton) {
            this.elements.resetSearchButton.addEventListener('click', () => {
                this.resetSearch();
            });
        }

        this.elements.searchInput.addEventListener('input', () => {
            this.updateResetButtonVisibility();
        });

        this.elements.categoryFilter.addEventListener('change', (e) => {
            // Зберігаємо позицію скролу перед зміною категорії
            saveScrollPosition(this.viewMode);
            this.currentCategory = e.target.value;
            saveLastCategory(this.currentCategory);
            this.currentPage = 1;
            saveCurrentPage(1);
            this.updateCategoryHighlight();
            this.loadNews();
        });

        if (this.elements.sourceFilter) {
            this.elements.sourceFilter.addEventListener('change', (e) => {
                // Зберігаємо позицію скролу перед зміною джерела
                saveScrollPosition(this.viewMode);
                this.currentSource = e.target.value;
                this.currentPage = 1;
                saveCurrentPage(1);
                this.updateResetButtonVisibility();
                this.applyFilters();
            });
        }

        if (this.elements.dateFilter) {
            this.elements.dateFilter.addEventListener('change', (e) => {
                // Зберігаємо позицію скролу перед зміною дати
                saveScrollPosition(this.viewMode);
                this.currentDateFilter = e.target.value;
                this.currentPage = 1;
                saveCurrentPage(1);
                this.updateResetButtonVisibility();
                this.applyFilters();
            });
        }

        if (this.elements.gridViewButton) {
            this.elements.gridViewButton.addEventListener('click', () => {
                this.setLayoutView('grid');
            });
        }

        if (this.elements.listViewButton) {
            this.elements.listViewButton.addEventListener('click', () => {
                this.setLayoutView('list');
            });
        }

        if (this.elements.sortFilter) {
            this.elements.sortFilter.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.sortArticles();
                this.updateDisplay();
            });
        }

        if (this.elements.itemsPerPage) {
            this.elements.itemsPerPage.value = this.itemsPerPage.toString();
            this.elements.itemsPerPage.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value, 10);
                saveItemsPerPage(this.itemsPerPage);
                this.currentPage = 1;
                saveCurrentPage(1);
                this.updateDisplay();
            });
        }

        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        if (this.elements.modalClose) {
            this.elements.modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (this.elements.modalOverlay) {
            this.elements.modalOverlay.addEventListener('click', () => {
                this.closeModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.modal && this.elements.modal.getAttribute('aria-hidden') === 'false') {
                this.closeModal();
            }
        });

        if (this.elements.favoritesButton) {
            this.elements.favoritesButton.addEventListener('click', () => {
                this.showFavorites();
            });
        }

        if (this.elements.backToNewsButton) {
            this.elements.backToNewsButton.addEventListener('click', () => {
                this.restoreMainView();
            });
        }

        this.elements.retryButton.addEventListener('click', () => {
            this.loadNews();
        });

        this.elements.prevButton.addEventListener('click', () => {
            if (this.currentPage > 1) {
                // Зберігаємо поточну позицію скролу перед зміною сторінки
                saveScrollPosition(this.viewMode);
                this.currentPage--;
                this.updateDisplay();
            }
        });

        this.elements.nextButton.addEventListener('click', () => {
            const totalPages = this.getTotalPages();
            if (this.currentPage < totalPages) {
                // Зберігаємо поточну позицію скролу перед зміною сторінки
                saveScrollPosition(this.viewMode);
                this.currentPage++;
                this.updateDisplay();
            }
        });
    }

    handleSearch() {
        const query = this.elements.searchInput.value;
        const validation = validateSearchQuery(query);

        if (!validation.isValid) {
            this.showSearchError(validation.error);
            return;
        }

        this.hideSearchError();
        this.currentQuery = validation.query;
        this.currentPage = 1;
        saveCurrentPage(1);
        saveLastSearch(this.currentQuery);
        this.updateResetButtonVisibility();
        this.loadNews();
    }

    resetSearch() {
        this.currentQuery = '';
        this.elements.searchInput.value = '';
        saveLastSearch('');
        this.hideSearchError();
        this.currentCategory = 'all';
        this.elements.categoryFilter.value = 'all';
        saveLastCategory('all');
        this.currentSource = 'all';
        if (this.elements.sourceFilter) {
            this.elements.sourceFilter.value = 'all';
        }
        this.currentDateFilter = 'all';
        if (this.elements.dateFilter) {
            this.elements.dateFilter.value = 'all';
        }
        this.updateCategoryHighlight();
        this.currentPage = 1;
        saveCurrentPage(1);
        this.updateResetButtonVisibility();
        this.loadNews();
    }

    updateResetButtonVisibility() {
        if (this.elements.resetSearchButton) {
            const hasQuery = this.elements.searchInput.value.trim().length > 0 || this.currentQuery.length > 0;
            const hasActiveFilters = hasQuery || 
                                    this.currentCategory !== 'all' || 
                                    this.currentSource !== 'all' || 
                                    this.currentDateFilter !== 'all';
            this.elements.resetSearchButton.style.display = hasActiveFilters ? 'inline-block' : 'none';
        }
    }

    showSearchError(message) {
        this.elements.searchError.textContent = message;
        this.elements.searchError.style.display = 'block';
    }

    hideSearchError() {
        this.elements.searchError.textContent = '';
        this.elements.searchError.style.display = 'none';
    }

    async loadNews() {
        if (this.viewMode === 'favorites') {
            this.showFavorites();
            return Promise.resolve();
        }

        try {
            showLoading(this.elements.loading);
            hideError(this.elements.errorContainer);
            hideNoResults(this.elements.noResults);

            const data = await fetchNews(this.currentQuery, this.currentCategory);
            this.currentArticles = data.articles || [];

            if (this.currentArticles.length === 0) {
                const noResultsText = document.getElementById('noResultsText');
                if (noResultsText) {
                    if (this.currentQuery) {
                        noResultsText.textContent = `Нічого не знайдено за запитом "${this.currentQuery}". Спробуйте змінити параметри пошуку.`;
                    } else if (this.currentCategory !== 'all') {
                        noResultsText.textContent = `Новин не знайдено в категорії "${this.getCategoryName(this.currentCategory)}". Спробуйте вибрати іншу категорію.`;
                    } else {
                        noResultsText.textContent = 'Новин не знайдено. Спробуйте змінити параметри пошуку або вибрати іншу категорію.';
                    }
                }
                showNoResults(this.elements.noResults);
                this.elements.newsGrid.innerHTML = '';
                this.filteredArticles = [];
                hideLoading(this.elements.loading);
                if (this.elements.pagination) {
                    this.elements.pagination.hidden = true;
                }
                return;
            }

            // Застосовуємо всі фільтри до завантажених статей
            this.applyFilters();
        } catch (error) {
            let errorMessage = 'Не вдалося завантажити новини.';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Помилка підключення до інтернету. Перевірте ваше з\'єднання.';
            } else if (error.message.includes('401') || error.message.includes('403')) {
                errorMessage = 'Помилка авторизації API. Перевірте правильність API ключа.';
            } else if (error.message.includes('429')) {
                errorMessage = 'Перевищено ліміт запитів до API. Спробуйте пізніше.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showError(this.elements.errorContainer, errorMessage);
            showNoResults(this.elements.noResults);
        } finally {
            hideLoading(this.elements.loading);
        }
        
        return Promise.resolve();
    }

    applyFilters() {
        // Перефільтровуємо поточні статті з урахуванням всіх активних фільтрів
        if (this.currentArticles.length === 0) {
            this.filteredArticles = [];
            this.updateDisplay();
            return;
        }

        this.filteredArticles = this.filterArticles(this.currentArticles);
        
        // Перевіряємо, чи є результати після фільтрації
        if (this.filteredArticles.length === 0) {
            const noResultsText = document.getElementById('noResultsText');
            if (noResultsText) {
                let message = 'Новин не знайдено за обраними фільтрами.';
                if (this.currentQuery) {
                    message += ` Запит: "${this.currentQuery}".`;
                }
                if (this.currentCategory !== 'all') {
                    message += ` Категорія: "${this.getCategoryName(this.currentCategory)}".`;
                }
                if (this.currentSource !== 'all') {
                    message += ` Джерело: "${this.currentSource}".`;
                }
                if (this.currentDateFilter !== 'all') {
                    const dateNames = {
                        'today': 'Сьогодні',
                        'week': 'Тиждень',
                        'month': 'Місяць'
                    };
                    message += ` Дата: "${dateNames[this.currentDateFilter] || this.currentDateFilter}".`;
                }
                message += ' Спробуйте змінити параметри пошуку.';
                noResultsText.textContent = message;
            }
            showNoResults(this.elements.noResults);
            this.elements.newsGrid.innerHTML = '';
            if (this.elements.pagination) {
                this.elements.pagination.hidden = true;
            }
            this.updateStatistics();
            return;
        }

        this.sortArticles();
        this.updateStatistics();
        this.updateDisplay();
        
        // Відновлюємо позицію скролу після оновлення відображення (якщо це не перше завантаження)
        const shouldRestoreScroll = this.currentPage > 1 || this.currentQuery || 
                                    this.currentCategory !== 'all' || 
                                    this.currentSource !== 'all' || 
                                    this.currentDateFilter !== 'all';
        
        if (shouldRestoreScroll) {
            setTimeout(() => {
                restoreScrollPosition(this.viewMode, true);
            }, 100); // Збільшена затримка для забезпечення рендерингу DOM
        }
    }

    filterArticles(articles) {
        let filtered = [...articles]; // Створюємо копію масиву

        // Фільтр за категорією
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(article => {
                if (article.category) {
                    return article.category === this.currentCategory;
                }
                return false; // Якщо категорія не визначена, виключаємо статтю
            });
        }

        // Фільтр за джерелом
        if (this.currentSource !== 'all') {
            filtered = filtered.filter(article => {
                const sourceName = article.source?.name || '';
                return sourceName === this.currentSource || 
                       sourceName.toLowerCase().includes(this.currentSource.toLowerCase());
            });
        }

        // Фільтр за датою
        if (this.currentDateFilter !== 'all') {
            filtered = filterByDate(filtered, this.currentDateFilter);
        }

        // Фільтр за пошуковим запитом (нечутливий до регістру)
        if (this.currentQuery && this.currentQuery.trim().length > 0) {
            const queryLower = this.currentQuery.toLowerCase().trim();
            filtered = filtered.filter(article => {
                const title = (article.title || '').toLowerCase();
                const description = (article.description || '').toLowerCase();
                const source = (article.source?.name || '').toLowerCase();

                return title.includes(queryLower) || 
                       description.includes(queryLower) || 
                       source.includes(queryLower);
            });
        }

        return filtered;
    }

    getCurrentPageArticles() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredArticles.slice(startIndex, endIndex);
    }

    getTotalPages() {
        return Math.ceil(this.filteredArticles.length / this.itemsPerPage);
    }

    sortArticles() {
        if (this.currentSort === 'newest') {
            this.filteredArticles.sort((a, b) => {
                const dateA = a.publishedAt ? new Date(a.publishedAt) : null;
                const dateB = b.publishedAt ? new Date(b.publishedAt) : null;
                
                // Якщо обидві дати валідні
                if (dateA && dateB && !isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                    return dateB.getTime() - dateA.getTime();
                }
                // Якщо тільки dateA валідна, вона йде першою
                if (dateA && !isNaN(dateA.getTime())) {
                    return -1;
                }
                // Якщо тільки dateB валідна, вона йде першою
                if (dateB && !isNaN(dateB.getTime())) {
                    return 1;
                }
                // Якщо обидві невалідні, залишаємо порядок
                return 0;
            });
        } else if (this.currentSort === 'oldest') {
            this.filteredArticles.sort((a, b) => {
                const dateA = a.publishedAt ? new Date(a.publishedAt) : null;
                const dateB = b.publishedAt ? new Date(b.publishedAt) : null;
                
                // Якщо обидві дати валідні
                if (dateA && dateB && !isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                    return dateA.getTime() - dateB.getTime();
                }
                // Якщо тільки dateA валідна, вона йде першою
                if (dateA && !isNaN(dateA.getTime())) {
                    return -1;
                }
                // Якщо тільки dateB валідна, вона йде першою
                if (dateB && !isNaN(dateB.getTime())) {
                    return 1;
                }
                // Якщо обидві невалідні, залишаємо порядок
                return 0;
            });
        }
    }

    updateCategoryHighlight() {
        const select = this.elements.categoryFilter;
        const options = select.options;
        
        for (let i = 0; i < options.length; i++) {
            options[i].selected = options[i].value === this.currentCategory;
        }
        
        select.classList.remove('filters__select--active');
        if (this.currentCategory !== 'all') {
            select.classList.add('filters__select--active');
        }
    }
    
    getCategoryName(category) {
        const categoryNames = {
            technology: 'Технології',
            sports: 'Спорт',
            business: 'Бізнес',
            entertainment: 'Розваги',
            health: 'Здоров\'я',
            science: 'Наука',
            all: 'Всі категорії'
        };
        return categoryNames[category] || category;
    }

    showFavorites() {
        // Зберігаємо позицію скролу перед переходом на сторінку "Обране"
        saveScrollPosition(this.viewMode);
        saveViewMode('favorites');
        
        this.viewMode = 'favorites';
        const favorites = getFavorites();
        
        // Приховуємо елементи головної сторінки
        if (this.elements.backToNewsButton) {
            this.elements.backToNewsButton.classList.remove('hidden');
            this.elements.backToNewsButton.style.display = 'block';
        }
        if (this.elements.favoritesButton) {
            this.elements.favoritesButton.classList.add('hidden');
        }
        
        // Приховуємо фільтри та секцію пошуку через клас
        if (this.elements.categoryFilter) {
            const filtersContainer = this.elements.categoryFilter.closest('.filters');
            if (filtersContainer) {
                filtersContainer.classList.add('hidden');
                // Видаляємо inline стилі, якщо вони були встановлені раніше
                filtersContainer.style.display = '';
            }
        }
        
        if (this.elements.searchForm) {
            const searchSection = this.elements.searchForm.closest('.search-section');
            if (searchSection) {
                searchSection.classList.add('hidden');
                // Видаляємо inline стилі
                searchSection.style.display = '';
            }
        }
        
        // Приховуємо view toggle
        const viewToggle = document.querySelector('.view-toggle');
        if (viewToggle) {
            viewToggle.classList.add('hidden');
            viewToggle.style.display = '';
        }
        
        if (favorites.length === 0) {
            const noResultsText = document.getElementById('noResultsText');
            if (noResultsText) {
                noResultsText.textContent = 'У вас немає збережених новин. Додайте новини до обраного, натиснувши на ❤️ на картці новини.';
            }
            showNoResults(this.elements.noResults);
            this.elements.newsGrid.innerHTML = '';
            this.currentArticles = [];
            this.filteredArticles = [];
            this.currentPage = 1;
            this.updateDisplay();
            return;
        }

        this.currentArticles = favorites;
        this.filteredArticles = favorites;
        this.sortArticles();
        this.currentPage = 1;
        saveCurrentPage(1);
        
        this.updateDisplay();
    }

    restoreMainView() {
        // Зберігаємо позицію скролу на сторінці "Обране" перед поверненням
        saveScrollPosition(this.viewMode);
        saveViewMode('news');
        
        this.viewMode = 'news';
        this.currentPage = 1;
        saveCurrentPage(1);
        
        // Показуємо кнопки навігації
        if (this.elements.backToNewsButton) {
            this.elements.backToNewsButton.classList.add('hidden');
            this.elements.backToNewsButton.style.display = 'none';
        }
        if (this.elements.favoritesButton) {
            this.elements.favoritesButton.classList.remove('hidden');
            this.elements.favoritesButton.style.display = 'block';
        }
        
        // Відновлюємо фільтри - видаляємо клас hidden та inline стилі
        if (this.elements.categoryFilter) {
            const filtersContainer = this.elements.categoryFilter.closest('.filters');
            if (filtersContainer) {
                filtersContainer.classList.remove('hidden');
                // Видаляємо inline стилі, щоб CSS міг працювати нормально
                filtersContainer.style.display = '';
            }
        }
        
        // Відновлюємо секцію пошуку
        if (this.elements.searchForm) {
            const searchSection = this.elements.searchForm.closest('.search-section');
            if (searchSection) {
                searchSection.classList.remove('hidden');
                // Видаляємо inline стилі
                searchSection.style.display = '';
            }
        }
        
        // Переконуємось, що view toggle видимий
        const viewToggle = document.querySelector('.view-toggle');
        if (viewToggle) {
            viewToggle.classList.remove('hidden');
            viewToggle.style.display = '';
        }
        
        // Відновлюємо layout view
        this.setLayoutView(this.layoutView);
        
        // Завантажуємо новини та відновлюємо позицію скролу
        this.loadNewsWithScrollRestore();
    }

    loadNewsWithScrollRestore() {
        // Завантажуємо новини
        this.loadNews().then(() => {
            // Після завантаження контенту відновлюємо позицію скролу
            setTimeout(() => {
                const restored = restoreScrollPosition('news', true);
                if (!restored) {
                    // Якщо не вдалося відновити, скролимо до початку списку новин
                    const newsGrid = this.elements.newsGrid;
                    if (newsGrid) {
                        newsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }, 100); // Невелика затримка для забезпечення рендерингу DOM
        });
    }

    handleFavoriteClick(article, button) {
        const isFav = isFavorite(article.url);
        
        if (isFav) {
            removeFromFavorites(article.url);
            button.textContent = '🤍';
            button.classList.remove('favorite-active');
            button.setAttribute('aria-label', 'Додати до обраного');
            
            if (this.viewMode === 'favorites') {
                this.showFavorites();
            }
        } else {
            addToFavorites(article);
            button.textContent = '❤️';
            button.classList.add('favorite-active');
            button.setAttribute('aria-label', 'Видалити з обраного');
        }
    }

    setLayoutView(view) {
        this.layoutView = view;
        
        // Переконуємось, що newsGrid існує перед зміною класів
        if (!this.elements.newsGrid) {
            return;
        }
        
        // Очищаємо класи та встановлюємо нові
        this.elements.newsGrid.className = 'news-grid';
        if (view === 'list') {
            this.elements.newsGrid.classList.add('news-grid--list');
        }
        
        if (this.elements.gridViewButton && this.elements.listViewButton) {
            if (view === 'grid') {
                this.elements.gridViewButton.classList.add('view-toggle__button--active');
                this.elements.listViewButton.classList.remove('view-toggle__button--active');
            } else {
                this.elements.listViewButton.classList.add('view-toggle__button--active');
                this.elements.gridViewButton.classList.remove('view-toggle__button--active');
            }
        }
        
        // Оновлюємо відображення тільки якщо не в режимі favorites
        if (this.viewMode !== 'favorites') {
            this.updateDisplay();
        }
    }

    updateDisplay() {
        const pageArticles = this.getCurrentPageArticles();

        if (pageArticles.length === 0) {
            const noResultsText = document.getElementById('noResultsText');
            if (noResultsText) {
                if (this.viewMode === 'favorites') {
                    noResultsText.textContent = 'У вас немає збережених новин. Додайте новини до обраного, натиснувши на ❤️ на картці новини.';
                } else if (this.currentQuery) {
                    noResultsText.textContent = 'Нічого не знайдено за запитом "' + this.currentQuery + '". Спробуйте змінити параметри пошуку.';
                } else {
                    noResultsText.textContent = 'Новин не знайдено. Спробуйте змінити параметри пошуку або вибрати іншу категорію.';
                }
            }
            showNoResults(this.elements.noResults);
            this.elements.newsGrid.innerHTML = '';
        } else {
            hideNoResults(this.elements.noResults);
            const hideCategory = this.currentCategory !== 'all' && this.viewMode !== 'favorites';
            renderNewsGrid(pageArticles, this.elements.newsGrid, (article, card) => {
                const favoriteButton = document.createElement('button');
                favoriteButton.className = 'news-card__favorite';
                favoriteButton.setAttribute('aria-label', 'Додати до обраного');
                favoriteButton.type = 'button';
                
                const isFav = isFavorite(article.url);
                favoriteButton.textContent = isFav ? '❤️' : '🤍';
                if (isFav) {
                    favoriteButton.classList.add('favorite-active');
                    favoriteButton.setAttribute('aria-label', 'Видалити з обраного');
                }
                
                favoriteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleFavoriteClick(article, favoriteButton);
                });
                
                const content = card.querySelector('.news-card__content');
                if (content) {
                    content.appendChild(favoriteButton);
                }

                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    this.openModal(article);
                });
            });
        }

        const totalPages = this.getTotalPages();
        updatePagination(
            {
                container: this.elements.pagination,
                currentPageEl: this.elements.currentPageEl,
                totalPagesEl: this.elements.totalPagesEl,
                prevButton: this.elements.prevButton,
                nextButton: this.elements.nextButton
            },
            this.currentPage,
            totalPages
        );

        saveCurrentPage(this.currentPage);

        // НЕ скролимо наверх при пагінації - залишаємося на поточній позиції
        // Якщо користувач хоче побачити початок списку, він може прокрутити вручну
    }

    getNewsStatistics() {
        return this.filteredArticles.reduce((stats, article) => {
            const category = article.category || 'unknown';
            stats.categories[category] = (stats.categories[category] || 0) + 1;
            stats.total++;
            return stats;
        }, {
            total: 0,
            categories: {}
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        saveTheme(newTheme);
        this.updateThemeButton(newTheme);
    }

    openModal(article) {
        if (!this.elements.modal) return;

        // Зберігаємо позицію скролу перед відкриттям модального вікна
        saveScrollPosition(this.viewMode);

        this.elements.modalTitle.textContent = article.title || 'Без заголовка';
        this.elements.modalDescription.textContent = article.description || 'Опис відсутній.';
        this.elements.modalLink.href = article.url || '#';
        this.elements.modalSource.textContent = article.source?.name || 'Невідоме джерело';
        this.elements.modalDate.textContent = formatDate(article.publishedAt);

        if (article.category) {
            this.elements.modalCategory.textContent = this.getCategoryName(article.category);
            this.elements.modalCategory.style.display = 'inline-block';
        } else {
            this.elements.modalCategory.style.display = 'none';
        }

        if (article.urlToImage) {
            this.elements.modalImage.src = article.urlToImage;
            this.elements.modalImage.alt = article.title || 'Зображення новини';
            this.elements.modalImage.style.display = 'block';
            this.elements.modalImage.onerror = () => {
                this.elements.modalImage.style.display = 'none';
            };
        } else {
            this.elements.modalImage.style.display = 'none';
        }

        const isFav = isFavorite(article.url);
        this.elements.modalFavorite.textContent = isFav ? '❤️' : '🤍';
        this.elements.modalFavorite.classList.toggle('favorite-active', isFav);
        this.elements.modalFavorite.onclick = () => {
            this.handleFavoriteClick(article, this.elements.modalFavorite);
        };

        this.elements.modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        if (!this.elements.modal) return;
        this.elements.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Відновлюємо позицію скролу після закриття модального вікна
        setTimeout(() => {
            restoreScrollPosition(this.viewMode, true);
        }, 50);
    }

    updateStatistics() {
        if (!this.elements.statistics) return;
        
        const stats = getStatistics(this.filteredArticles);
        this.elements.totalNews.textContent = stats.total;

        if (stats.total > 0) {
            const categoriesText = Object.entries(stats.categories)
                .map(([cat, count]) => `${this.getCategoryName(cat)}: ${count}`)
                .join(', ');
            this.elements.categoriesStats.textContent = categoriesText || '-';
            this.elements.statistics.hidden = false;
        } else {
            this.elements.statistics.hidden = true;
        }
    }
}

// ======= AUTH LOGIC (simplified localStorage email/pass) =======
const authSection = document.getElementById('authSection');
const registerForm = document.getElementById('authForm');
const loginForm = document.getElementById('loginForm');
const switchToLogin = document.getElementById('switchToLogin');
const switchToReg = document.getElementById('switchToRegister');
const authError = document.getElementById('authError');
const loginError = document.getElementById('loginError');

function showAuth(showReg = true) {
    authSection.classList.remove('hidden');
    document.querySelector('.container').classList.add('hidden');
    registerForm.classList.toggle('hidden', !showReg);
    loginForm.classList.toggle('hidden', showReg);
    authError.textContent = '';
    loginError.textContent = '';
}
function showApp() {
    authSection.classList.add('hidden');
    document.querySelector('.container').classList.remove('hidden');
}

function getUsers() {
    try { return JSON.parse(localStorage.getItem('newsAggregator_users')) || []; } catch { return []; }
}
function saveUsers(users) {
    localStorage.setItem('newsAggregator_users', JSON.stringify(users));
}
function setCurrentUser(email) {
    localStorage.setItem('newsAggregator_currentUser', email); 
}
function getCurrentUser() {
    return localStorage.getItem('newsAggregator_currentUser') || null;
}
function logoutUser() {
    localStorage.removeItem('newsAggregator_currentUser');
    showAuth(true);
}

// Add "Вихід" кнопку в хедер (поруч із темою)
function renderLogoutBtn() {
    let btn = document.getElementById('logoutButton');
    if (!btn) {
        btn = document.createElement('button');
        btn.className = 'header__button';
        btn.id = 'logoutButton';
        btn.textContent = '🚪 Вийти';
        btn.type = 'button';
        btn.onclick = logoutUser;
        document.querySelector('.header__actions').appendChild(btn);
    }
}
function removeLogoutBtn() {
    const btn = document.getElementById('logoutButton');
    if (btn) btn.remove();
}

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const pass = document.getElementById('regPassword').value;
    const rep = document.getElementById('regRepeatPassword').value;
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        authError.textContent = 'Невірний e-mail';
        return;
    }
    if (pass.length < 4) {
        authError.textContent = 'Пароль має бути 4+ символи';
        return;
    }
    if (pass !== rep) {
        authError.textContent = 'Паролі не співпадають';
        return;
    }
    let users = getUsers();
    if (users.find(u => u.email === email)) {
        authError.textContent = 'Такий email вже зареєстровано';
        return;
    }
    users.push({ email, password: pass });
    saveUsers(users);
    setCurrentUser(email);
    authError.textContent = '';
    showApp();
    renderLogoutBtn();
    location.reload();
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass = document.getElementById('loginPassword').value;
    let users = getUsers();
    const user = users.find(u => u.email === email && u.password === pass);
    if (!user) {
        loginError.textContent = 'Невірний email або пароль';
        return;
    }
    setCurrentUser(email);
    loginError.textContent = '';
    showApp();
    renderLogoutBtn();
    location.reload();
});

switchToLogin.addEventListener('click', () => showAuth(false));
switchToReg.addEventListener('click', () => showAuth(true));

// ========== ПРОТЕКТУВАННЯ UI: запускаємо app лише для залогіненого =============
document.addEventListener('DOMContentLoaded', () => {
    if (!getCurrentUser()) {
        showAuth(true);
        removeLogoutBtn();
        return;
    }
    showApp();
    renderLogoutBtn();
    const app = new NewsAggregator();
    window.newsAggregator = app;
});
