// components/NewsByEntity.jsx
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

    // Пагинация
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Загрузка истории поиска
    useEffect(() => {
        const saved = localStorage.getItem('searchHistory');
        if (saved) setSearchHistory(JSON.parse(saved));
    }, []);

    // Установка дат по умолчанию (сегодня)
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        if (!dateFrom) setDateFrom(today);
        if (!dateTo) setDateTo(today);
    }, []);

    const validateDates = (from, to) => {
        if (!from || !to) {
            setValidationError('Пожалуйста, выберите обе даты');
            return false;
        }
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (isNaN(fromDate) || isNaN(toDate)) {
            setValidationError('Некорректный формат даты');
            return false;
        }
        if (fromDate > toDate) {
            setValidationError('Дата начала не может быть позже даты окончания');
            return false;
        }
        const diffTime = Math.abs(toDate - fromDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > MAX_DAYS_RANGE) {
            setValidationError(`Период не может превышать ${MAX_DAYS_RANGE} дней`);
            return false;
        }
        setValidationError('');
        return true;
    };

    const handleDateFromChange = (e) => {
        const newFrom = e.target.value;
        setDateFrom(newFrom);
        if (dateTo) validateDates(newFrom, dateTo);
        else setValidationError('');
    };

    const handleDateToChange = (e) => {
        const newTo = e.target.value;
        setDateTo(newTo);
        if (dateFrom) validateDates(dateFrom, newTo);
        else setValidationError('');
    };

    const performSearch = async (searchEntity, from, to, sentiment, page) => {
        if (!searchEntity.trim() || !from || !to) return;
        if (!validateDates(from, to)) return;

        try {
            setLoading(true);
            setError(null);
            const sentimentParam = sentiment === 'all' ? null : sentiment;
            const response = await axios.get(`${API_BASE_URL}/entities/news/paged`, {
                params: {
                    name: searchEntity.trim(),
                    from,
                    to,
                    sentiment: sentimentParam,
                    page,
                    size: PAGE_SIZE,
                }
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
        if (!entityName.trim()) {
            setError('Введите название сущности');
            return;
        }
        if (!dateFrom || !dateTo) {
            setError('Выберите обе даты периода');
            return;
        }
        if (!validateDates(dateFrom, dateTo)) {
            setError(validationError);
            return;
        }
        // При новом поиске сбрасываем страницу на 0
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
        if (dateFrom && dateTo) {
            performSearch(query, dateFrom, dateTo, sentimentFilter, 0);
        }
    };

    // Обработка смены фильтра тональности
    const handleSentimentFilter = (newFilter) => {
        setSentimentFilter(newFilter);
        if (entityName && dateFrom && dateTo) {
            setCurrentPage(0);
            performSearch(entityName, dateFrom, dateTo, newFilter, 0);
        }
    };

    // Переключение страницы
    const handlePageChange = (newPage) => {
        if (newPage < 0 || newPage >= totalPages) return;
        setCurrentPage(newPage);
        performSearch(entityName, dateFrom, dateTo, sentimentFilter, newPage);
    };

    // Обработка параметра entity из URL
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
                    <label>Сущность:</label>
                    <input
                        type="text"
                        value={entityName}
                        onChange={(e) => setEntityName(e.target.value)}
                        placeholder="Например: Messi, Ronaldo"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Период:</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input type="date" value={dateFrom} onChange={handleDateFromChange} required />
                        <span>—</span>
                        <input type="date" value={dateTo} onChange={handleDateToChange} required />
                    </div>
                    {validationError && <div style={{ color: '#f44336', fontSize: '12px', marginTop: '5px' }}>{validationError}</div>}
                </div>

                <button type="submit" disabled={loading || !!validationError}>
                    {loading ? 'Поиск...' : 'Найти'}
                </button>
            </form>

            {searchHistory.length > 0 && (
                <div className="search-history">
                    <div className="search-history-title">📜 Недавние поиски:</div>
                    <div className="search-history-items">
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
                    <h3>Результаты по "{entityName}" ({totalElements})</h3>

                    {totalElements > 0 && (
                        <>
                            <div className="result-filters">
                                <button className={`filter-btn ${sentimentFilter === 'all' ? 'active' : ''}`} onClick={() => handleSentimentFilter('all')}>Все</button>
                                <button className={`filter-btn ${sentimentFilter === 'positive' ? 'active' : ''}`} onClick={() => handleSentimentFilter('positive')}>😊 Позитивные</button>
                                <button className={`filter-btn ${sentimentFilter === 'neutral' ? 'active' : ''}`} onClick={() => handleSentimentFilter('neutral')}>😐 Нейтральные</button>
                                <button className={`filter-btn ${sentimentFilter === 'negative' ? 'active' : ''}`} onClick={() => handleSentimentFilter('negative')}>😠 Негативные</button>
                            </div>
                        </>
                    )}

                    {news.length === 0 ? (
                        <div className="no-results">
                            {totalElements === 0 ? `Новостей с "${entityName}" в выбранном диапазоне и тональности не найдено` : `Нет новостей на этой странице`}
                        </div>
                    ) : (
                        <>
                            <div className="news-list">
                                {news.map((item, idx) => <NewsCard key={item.id || idx} news={item} />)}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button className="page-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
                                        ← Назад
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            className={`page-btn ${currentPage === i ? 'active' : ''}`}
                                            onClick={() => handlePageChange(i)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button className="page-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages - 1}>
                                        Вперёд →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {loading && (
                <div className="results">
                    {[1, 2].map(i => (
                        <div key={i} className="skeleton-card">
                            <div className="skeleton skeleton-title"></div>
                            <div className="skeleton skeleton-meta"></div>
                            <div className="skeleton skeleton-text"></div>
                            <div className="skeleton skeleton-tags"></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NewsByEntity;