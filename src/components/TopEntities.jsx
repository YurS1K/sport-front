import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './TopEntities.css';
import { IconNews, IconTrending, IconChart } from './Icons';

const API_BASE_URL = 'http://localhost:8080/api';

const TopEntities = () => {
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [limit, setLimit] = useState(5);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTopEntities();
    }, [limit]);

    const fetchTopEntities = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/entities/top`, { params: { limit } });
            const filtered = response.data.filter(item =>
                item.entity && item.entity.trim().length > 1 && item.entity !== ', '
            );
            setEntities(filtered);
            setError(null);
        } catch (err) {
            setError('Ошибка загрузки: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNewsClick = (e, name) => {
        e.stopPropagation();
        navigate(`/news?entity=${encodeURIComponent(name)}`);
    };

    const handleSentimentClick = (e, name) => {
        e.stopPropagation();
        navigate(`/sentiment?entity=${encodeURIComponent(name)}&days=7`);
    };

    if (loading) return <div className="loading">Загрузка данных...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="top-entities">
            <div className="controls">
                <label>
                    Количество:
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
                    {entities.map((entity, idx) => (
                        <div key={entity.entity} className="entity-card">
                            <div className="entity-rank">#{idx + 1}</div>
                            <div className="entity-name">{entity.entity}</div>
                            <div className="entity-count">
                                <IconChart size={25} className="entity-count-icon" />
                                <span className="entity-count-text">{entity.count} упоминаний</span>
                            </div>
                            <div className="entity-actions">
                                <button className="action-btn" onClick={(e) => handleNewsClick(e, entity.entity)}>
                                    <IconNews size={25} /> Новости
                                </button>
                                <button className="action-btn" onClick={(e) => handleSentimentClick(e, entity.entity)}>
                                    <IconTrending size={25} /> Тональность
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TopEntities;