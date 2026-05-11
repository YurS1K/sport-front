// components/NewsByEntity.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import NewsCard from '../NewsCard';
import './NewsByEntity.css';

const API_BASE_URL = 'http://localhost:8080/api';

const NewsByEntity = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [entityName, setEntityName] = useState('');
    const [days, setDays] = useState(7);
    const [news, setNews] = useState([]);
    const [filteredNews, setFilteredNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);
    const [sentimentFilter, setSentimentFilter] = useState('all');
    const [searchHistory, setSearchHistory] = useState([]);

    // Загрузка истории поиска из localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('searchHistory');
        if (savedHistory) {
            setSearchHistory(JSON.parse(savedHistory));
        }
    }, []);

    // Проверяем параметры URL при загрузке
    useEffect(() => {
        const entityFromUrl = searchParams.get('entity');
        if (entityFromUrl) {
            setEntityName(entityFromUrl);
            // Автоматически выполняем поиск
            performSearch(entityFromUrl, days);
        }
    }, [searchParams]);

    const performSearch = async (searchEntity, searchDays) => {
        if (!searchEntity.trim()) return;

        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_BASE_URL}/entities/news`, {
                params: {
                    name: searchEntity.trim(),
                    days: searchDays
                }
            });

            setNews(response.data);
            setFilteredNews(response.data);
            setSearched(true);
            saveToHistory(searchEntity.trim());
        } catch (err) {
            setError('Ошибка при поиске новостей: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!entityName.trim()) return;

        // Обновляем URL с параметром entity
        setSearchParams({ entity: entityName.trim() });
        await performSearch(entityName, days);
    };

    const saveToHistory = (query) => {
        const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    };

    const handleQuickDays = (daysCount) => {
        setDays(daysCount);
        if (searched && entityName) {
            performSearch(entityName, daysCount);
        }
    };

    const handleHistoryClick = (query) => {
        setEntityName(query);
        setSearchParams({ entity: query });
        performSearch(query, days);
    };

    // Фильтрация по тональности
    useEffect(() => {
        if (sentimentFilter === 'all') {
            setFilteredNews(news);
        } else {
            setFilteredNews(news.filter(item =>
                item.sentiment?.toLowerCase() === sentimentFilter.toLowerCase()
            ));
        }
    }, [sentimentFilter, news]);

    const exportResults = (format) => {
        if (format === 'json') {
            const dataStr = JSON.stringify(filteredNews, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `news_${entityName}_${new Date().toISOString()}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        } else if (format === 'csv') {
            const headers = ['Title', 'Author', 'Date', 'Sentiment', 'Source', 'Tags', 'Entities'];
            const csvData = filteredNews.map(item => [
                `"${item.title.replace(/"/g, '""')}"`,
                `"${item.author}"`,
                item.date,
                item.sentiment,
                item.source,
                `"${item.tags.join(', ')}"`,
                `"${item.entities.join(', ')}"`
            ]);
            const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `news_${entityName}_${new Date().toISOString()}.csv`);
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="news-by-entity">
            <form onSubmit={handleSearch} className="search-form">
                <div className="form-group">
                    <label>Название сущности:</label>
                    <input
                        type="text"
                        value={entityName}
                        onChange={(e) => setEntityName(e.target.value)}
                        placeholder="Например: Messi, Ronaldo, Lakers"
                        required
                        autoComplete="off"
                    />
                </div>

                <div className="form-group">
                    <label>За последние дней:</label>
                    <input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 7))}
                        min="1"
                        max="365"
                    />
                    <div className="days-quick-filter">
                        <button type="button" className="days-quick-btn" onClick={() => handleQuickDays(1)}>1 день</button>
                        <button type="button" className="days-quick-btn" onClick={() => handleQuickDays(3)}>3 дня</button>
                        <button type="button" className="days-quick-btn" onClick={() => handleQuickDays(7)}>7 дней</button>
                        <button type="button" className="days-quick-btn" onClick={() => handleQuickDays(14)}>14 дней</button>
                        <button type="button" className="days-quick-btn" onClick={() => handleQuickDays(30)}>30 дней</button>
                    </div>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Поиск...' : 'Найти новости'}
                </button>
            </form>

            {searchHistory.length > 0 && (
                <div className="search-history">
                    <div className="search-history-title">
                        📜 Недавние поиски:
                    </div>
                    <div className="search-history-items">
                        {searchHistory.map((query, idx) => (
                            <button
                                key={idx}
                                className="history-item"
                                onClick={() => handleHistoryClick(query)}
                            >
                                {query}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {error && <div className="error">{error}</div>}

            {searched && !loading && (
                <div className="results">
                    <div className="results-header">
                        <h3>
                            Результаты поиска по сущности "{entityName}"
                            <span className="results-count"> ({filteredNews.length} новостей)</span>
                        </h3>

                        {filteredNews.length > 0 && (
                            <>
                                <div className="result-filters">
                                    <button
                                        className={`filter-btn ${sentimentFilter === 'all' ? 'active' : ''}`}
                                        onClick={() => setSentimentFilter('all')}
                                    >
                                        Все ({news.length})
                                    </button>
                                    <button
                                        className={`filter-btn ${sentimentFilter === 'positive' ? 'active' : ''}`}
                                        onClick={() => setSentimentFilter('positive')}
                                    >
                                        😊 Позитивные ({news.filter(n => n.sentiment?.toLowerCase() === 'positive').length})
                                    </button>
                                    <button
                                        className={`filter-btn ${sentimentFilter === 'neutral' ? 'active' : ''}`}
                                        onClick={() => setSentimentFilter('neutral')}
                                    >
                                        😐 Нейтральные ({news.filter(n => n.sentiment?.toLowerCase() === 'neutral').length})
                                    </button>
                                    <button
                                        className={`filter-btn ${sentimentFilter === 'negative' ? 'active' : ''}`}
                                        onClick={() => setSentimentFilter('negative')}
                                    >
                                        😠 Негативные ({news.filter(n => n.sentiment?.toLowerCase() === 'negative').length})
                                    </button>
                                </div>

                                <div className="export-buttons">
                                    <button className="export-btn" onClick={() => exportResults('json')}>
                                        📥 Экспорт JSON
                                    </button>
                                    <button className="export-btn" onClick={() => exportResults('csv')}>
                                        📊 Экспорт CSV
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {filteredNews.length === 0 ? (
                        <div className="no-results">
                            {news.length > 0
                                ? `Нет новостей с тональностью "${sentimentFilter}" для сущности "${entityName}"`
                                : `Новостей с сущностью "${entityName}" не найдено за последние ${days} дней`
                            }
                        </div>
                    ) : (
                        <div className="news-list">
                            {filteredNews.map((item, index) => (
                                <NewsCard key={item.id || index} news={item} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {loading && (
                <div className="results">
                    <div className="skeleton-card">
                        <div className="skeleton skeleton-title"></div>
                        <div className="skeleton skeleton-meta"></div>
                        <div className="skeleton skeleton-text"></div>
                        <div className="skeleton skeleton-tags"></div>
                    </div>
                    <div className="skeleton-card">
                        <div className="skeleton skeleton-title"></div>
                        <div className="skeleton skeleton-meta"></div>
                        <div className="skeleton skeleton-text"></div>
                        <div className="skeleton skeleton-tags"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsByEntity;