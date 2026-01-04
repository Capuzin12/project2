
export const handler = async (event, context) => {
    const { queryStringParameters } = event;
    const { endpoint, query, category, pageSize, lang } = queryStringParameters;

    const NEWS_API_KEY = process.env.VITE_NEWS_API_KEY || process.env.NEWS_API_KEY;
    const GNEWS_API_KEY = process.env.VITE_GNEWS_API_KEY || process.env.GNEWS_API_KEY;

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        let url;
        
        if (endpoint === 'gnews') {
            if (!GNEWS_API_KEY) {
                // If key is missing, return error or maybe let it fail gracefully if you want fallback
                return { statusCode: 500, headers, body: JSON.stringify({ error: 'GNews API key configuration missing' }) };
            }
            const GNEWS_API_BASE = 'https://gnews.io/api/v4';
            const params = new URLSearchParams({
                lang: lang || 'uk',
                max: pageSize || 20,
                apikey: GNEWS_API_KEY
            });
            
             const categoryMap = {
                technology: 'technology',
                sports: 'sports',
                business: 'business',
                entertainment: 'entertainment',
                health: 'health',
                science: 'science'
            };

            if (category && category !== 'all' && categoryMap[category]) {
                params.set('topic', categoryMap[category]);
                if (query) params.set('q', query);
            } else {
                 params.set('q', query || 'news');
            }
            
            url = `${GNEWS_API_BASE}/search?${params.toString()}`;

        } else if (endpoint === 'newsapi') {
             if (!NEWS_API_KEY) {
                return { statusCode: 500, headers, body: JSON.stringify({ error: 'NewsAPI key configuration missing' }) };
            }
            const NEWS_API_BASE = 'https://newsapi.org/v2';
             
             if (queryStringParameters.sources) {
                 const params = new URLSearchParams({ 
                     sources: queryStringParameters.sources, 
                     pageSize: pageSize || 20, 
                     apiKey: NEWS_API_KEY 
                 });
                 url = `${NEWS_API_BASE}/everything?${params.toString()}`;
             } else if (category !== 'all' && !query) {
                const params = new URLSearchParams({ category, pageSize: pageSize || 20, apiKey: NEWS_API_KEY });
                url = `${NEWS_API_BASE}/top-headlines?${params.toString()}`;
             } else {
                 let searchQuery = query || 'news';
                 if (category !== 'all' && query) searchQuery = `${query} ${category}`;
                 else if (category !== 'all') searchQuery = category;
                 
                 const params = new URLSearchParams({
                    q: searchQuery,
                    language: lang || 'uk',
                    sortBy: 'publishedAt',
                    pageSize: pageSize || 20,
                    apiKey: NEWS_API_KEY
                });
                url = `${NEWS_API_BASE}/everything?${params.toString()}`;
             }

        } else {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid endpoint specified. Use "gnews" or "newsapi".' }) };
        }

        const response = await fetch(url);
        
        if (!response.ok) {
             // Pass through the error status
             console.error(`API Error: ${response.status} ${response.statusText}`);
             return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ error: `Upstream API error: ${response.status}` })
            };
        }
        
        const data = await response.json();
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
