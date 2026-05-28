
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import NewsCard from '../NewsCard';
import './NewsByEntity.css';

const API_BASE_URL = 'http://localhost:8080/api';
const MAX_DAYS_RANGE = 365;
const PAGE_SIZE = 5;

const NewsByEntity = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [entityName, setEntityName] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationError, setValidationError] = useState('');
    const [searched, setSearched] = useState(false);
    const [sentimentFilter, setSentimentFilter] = useState('all');
    const [searchHistory, setSearchHistory] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Функция для отображения страниц с многоточиями
    const getVisiblePages = (current, total) => {
        const delta = 2;
        const left = Math.max(0, current - delta);
        const right = Math.min(total - 1, current + delta);

        let pages = new Set([0, total - 1]);
        for (let i = left; i <= right; i++) pages.add(i);
        pages = Array.from(pages).sort((a, b) => a - b);

        const result = [];
        let last = null;
        for (const p of pages) {
            if (last !== null && p - last > 1) {
                result.push(p - last === 2 ? last + 1 : '...');
            }
            result.push(p);
            last = p;
        }
        return result;
    };

    useEffect(() => {
        const saved = localStorage.getItem('searchHistory');
        if (saved) setSearchHistory(JSON.parse(saved));
    }, []);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        if (!dateFrom) setDateFrom(today);
        if (!dateTo) setDateTo(today);
    }, []);

    const validateDates = (from, to) => {
        if (!from || !to) {
            setValidationError('Выберите обе даты');
            return false;
        }
        const fromDate = new Date(from), toDate = new Date(to);
        if (fromDate > toDate) {
            setValidationError('Начало не может быть позже конца');
            return false;
        }
        const diffDays = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
        if (diffDays > MAX_DAYS_RANGE) {
            setValidationError(`Период не более ${MAX_DAYS_RANGE} дней`);
            return false;
        }
        setValidationError('');
        return true;
    };

    const performSearch = async (searchEntity, from, to, sentiment, page) => {
        if (!searchEntity.trim() || !from || !to) return;
        if (!validateDates(from, to)) return;
        try {
            setLoading(true);
            setError(null);
            const sentimentParam = sentiment === 'all' ? null : sentiment;
            const response = await axios.get(`${API_BASE_URL}/entities/news/paged`, {
                params: { name: searchEntity.trim(), from, to, sentiment: sentimentParam, page, size: PAGE_SIZE }
            });
            setNews(response.data.content);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
            setCurrentPage(response.data.number);
            setSearched(true);
            saveToHistory(searchEntity.trim());
        } catch (err) {
            setError('Ошибка: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!entityName.trim()) return setError('Введите название сущности');
        if (!dateFrom || !dateTo) return setError('Выберите период');
        if (!validateDates(dateFrom, dateTo)) return setError(validationError);
        setCurrentPage(0);
        setSearchParams({ entity: entityName.trim() });
        await performSearch(entityName, dateFrom, dateTo, sentimentFilter, 0);
    };

    const saveToHistory = (query) => {
        const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    };

    const handleHistoryClick = (query) => {
        setEntityName(query);
        setCurrentPage(0);
        setSearchParams({ entity: query });
        if (dateFrom && dateTo) performSearch(query, dateFrom, dateTo, sentimentFilter, 0);
    };

    const handleSentimentFilter = (newFilter) => {
        setSentimentFilter(newFilter);
        if (entityName && dateFrom && dateTo) {
            setCurrentPage(0);
            performSearch(entityName, dateFrom, dateTo, newFilter, 0);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 0 || newPage >= totalPages) return;
        setCurrentPage(newPage);
        performSearch(entityName, dateFrom, dateTo, sentimentFilter, newPage);
    };

    useEffect(() => {
        const entityFromUrl = searchParams.get('entity');
        if (entityFromUrl && dateFrom && dateTo) {
            setEntityName(entityFromUrl);
            performSearch(entityFromUrl, dateFrom, dateTo, sentimentFilter, 0);
        }
    }, [searchParams, dateFrom, dateTo]);

    return (
        <div className="news-by-entity">
            <form onSubmit={handleSearch} className="search-form">
                <div className="form-group">
                    <label>Сущность (имя, команда, лига)</label>
                    <input type="text" value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="Пример: Месси, Зенит, НБА" required />
                </div>
                <div className="form-group">
                    <label>Период</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); validateDates(e.target.value, dateTo); }} required />
                        <span>—</span>
                        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); validateDates(dateFrom, e.target.value); }} required />
                    </div>
                    {validationError && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem' }}>{validationError}</div>}
                </div>
                <button type="submit" disabled={loading || !!validationError}>{loading ? 'Поиск...' : 'Найти новости'}</button>
            </form>

            {searchHistory.length > 0 && (
                <div className="search-history">
                    <div className="search-history-title">🔍 Недавние запросы:</div>
                    <div className="history-items">
                        {searchHistory.map((q, idx) => (
                            <button key={idx} className="history-item" onClick={() => handleHistoryClick(q)}>
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {error && <div className="error">{error}</div>}

            {searched && !loading && (
                <div className="results">
                    <h3>Результаты по «{entityName}» — {totalElements} новостей</h3>
                    {totalElements > 0 && (
                        <div className="result-filters">
                            <button className={`filter-btn ${sentimentFilter === 'all' ? 'active' : ''}`} onClick={() => handleSentimentFilter('all')}>Все</button>
                            <button className={`filter-btn ${sentimentFilter === 'positive' ? 'active' : ''}`} onClick={() => handleSentimentFilter('positive')}>Позитивные</button>
                            <button className={`filter-btn ${sentimentFilter === 'neutral' ? 'active' : ''}`} onClick={() => handleSentimentFilter('neutral')}>Нейтральные</button>
                            <button className={`filter-btn ${sentimentFilter === 'negative' ? 'active' : ''}`} onClick={() => handleSentimentFilter('negative')}>Негативные</button>
                        </div>
                    )}
                    {news.length === 0 ? (
                        <div className="no-data">Новостей не найдено</div>
                    ) : (
                        <>
                            <div className="news-list">
                                {news.map((item, idx) => <NewsCard key={item.id || idx} news={item} />)}
                            </div>
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button className="page-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>←</button>
                                    {getVisiblePages(currentPage, totalPages).map((item, idx) =>
                                        item === '...' ? (
                                            <span key={`dots-${idx}`} className="page-dots">...</span>
                                        ) : (
                                            <button
                                                key={item}
                                                className={`page-btn ${currentPage === item ? 'active' : ''}`}
                                                onClick={() => handlePageChange(item)}
                                            >
                                                {item + 1}
                                            </button>
                                        )
                                    )}
                                    <button className="page-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages - 1}>→</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {loading && (
                <div>
                    {[1, 2].map(i => (
                        <div key={i} className="skeleton-card">
                            <div className="skeleton skeleton-title"></div>
                            <div className="skeleton skeleton-meta"></div>
                            <div className="skeleton skeleton-text"></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NewsByEntity;