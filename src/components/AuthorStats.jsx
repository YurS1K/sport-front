import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IconPositive, IconNegative, IconNeutral, IconNews } from './Icons';
import './AuthorStats.css';

const API_BASE_URL = 'http://localhost:8080/api';

const AuthorStats = () => {
    const [authors, setAuthors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [limit, setLimit] = useState(20);

    useEffect(() => {
        fetchStats();
    }, [limit]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/authors/stats`, { params: { limit } });
            setAuthors(response.data);
            setError(null);
        } catch (err) {
            setError('Ошибка загрузки: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getSentimentIcon = (sent) => {
        if (sent > 0.2) return <IconPositive size={35} color="#22c55e" />;
        if (sent < -0.2) return <IconNegative size={35} color="#ef4444" />;
        return <IconNeutral size={35} color="#eab308" />;
    };

    const formatSentiment = (sent) => sent.toFixed(2);

    if (loading) return <div className="loading">Загрузка данных...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="author-stats">
            <div className="controls">
                <label>
                    Количество:
                    <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </label>
            </div>

            {authors.length === 0 ? (
                <div className="no-data">Нет данных</div>
            ) : (
                <div className="authors-grid">
                    {authors.map((author, idx) => (
                        <div key={author.author} className="author-card">
                            <div className="author-rank">#{idx + 1}</div>
                            <div className="author-name-wrapper">
                                <div className="author-name">{author.author}</div>
                            </div>

                            <div className="author-sources">
                                {author.sourceDistribution?.RIA && (
                                    <span className="source-badge ria-badge">RIA</span>
                                )}
                                {author.sourceDistribution?.CHAMPIONAT && (
                                    <span className="source-badge champ-badge">Чемпионат</span>
                                )}
                            </div>

                            <div className="author-stats-row">
                                <div className="author-count">
                                    <IconNews size={25} className="author-count-icon" />
                                    <span className="author-count-text">{author.totalNews} новостей</span>
                                </div>
                                <div className="author-sentiment">
                                    {getSentimentIcon(author.avgSentiment)}
                                    <span className="sentiment-value">{formatSentiment(author.avgSentiment)}</span>
                                </div>
                            </div>

                            {author.topEntities && author.topEntities.length > 0 && (
                                <div className="author-entities">
                                    <div className="entities-label">Топ сущности:</div>
                                    <div className="entities-list">
                                        {author.topEntities.map((e) => (
                                            <span key={e.entity} className="entity-tag">
                                                {e.entity} ({e.count})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AuthorStats;