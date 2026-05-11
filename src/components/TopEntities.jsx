// components/TopEntities.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './TopEntities.css';

const API_BASE_URL = 'http://localhost:8080/api';

const TopEntities = () => {
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [limit, setLimit] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTopEntities();
    }, [limit]);

    const fetchTopEntities = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/entities/top`, {
                params: { limit }
            });

            // Фильтруем некорректные сущности
            const filteredData = response.data.filter(item => {
                if (item.entity === ', ' || item.entity === ',' || item.entity.trim() === '') {
                    return false;
                }
                if (item.entity.trim().length < 2) {
                    return false;
                }
                return true;
            });

            setEntities(filteredData);
            setError(null);
        } catch (err) {
            setError('Ошибка при загрузке данных: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEntityClick = (entityName) => {
        navigate(`/news?entity=${encodeURIComponent(entityName)}`);
    };

    const handleSentimentClick = (e, entityName) => {
        e.stopPropagation();
        navigate(`/sentiment?entity=${encodeURIComponent(entityName)}&days=30`);
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="top-entities">
            <div className="controls">
                <label>
                    Количество сущностей:
                    <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </label>
            </div>

            {entities.length === 0 ? (
                <div className="no-data">Нет данных для отображения</div>
            ) : (
                <div className="entities-grid">
                    {entities.map((entity, index) => (
                        <div
                            key={entity.entity}
                            className="entity-card clickable"
                            onClick={() => handleEntityClick(entity.entity)}
                        >
                            <div className="entity-rank">#{index + 1}</div>
                            <div className="entity-name">{entity.entity}</div>
                            <div className="entity-count">📊 {entity.count} упоминаний</div>
                            <div className="entity-actions">
                                <span className="action-hint">🔍 Новости</span>
                                <span
                                    className="action-hint sentiment-link"
                                    onClick={(e) => handleSentimentClick(e, entity.entity)}
                                >
                                    💭 Тональность
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TopEntities;