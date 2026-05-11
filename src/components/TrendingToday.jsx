import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TrendingToday.css';

const API_BASE_URL = 'http://localhost:8080/api';

const zScoreBadge = (z) => {
    if (z >= 10) return { label: '🔥 Взрыв', cls: 'badge-fire' };
    if (z >= 5)  return { label: '📈 Резкий рост', cls: 'badge-hot' };
    return             { label: '↑ Рост', cls: 'badge-warm' };
};

const TrendingToday = () => {
    const navigate = useNavigate();

    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [limit, setLimit] = useState(10);
    const [baselineDays, setBaselineDays] = useState(30);

    useEffect(() => {
        fetchTrends();
    }, [limit, baselineDays]);

    const fetchTrends = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_BASE_URL}/trends/today`, {
                params: { limit, baselineDays }
            });
            setTrends(response.data);
        } catch (err) {
            setError('Ошибка загрузки трендов: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="trending-today">
            <div className="trending-controls">
                <label>
                    Показать:
                    <select value={limit} onChange={e => setLimit(Number(e.target.value))}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>
                </label>
                <label>
                    Базовый период:
                    <select value={baselineDays} onChange={e => setBaselineDays(Number(e.target.value))}>
                        <option value={7}>7 дней</option>
                        <option value={14}>14 дней</option>
                        <option value={30}>30 дней</option>
                    </select>
                </label>
                <button className="refresh-btn" onClick={fetchTrends} disabled={loading}>
                    🔄 Обновить
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            {loading && <div className="loading">Загрузка трендов...</div>}

            {!loading && !error && trends.length === 0 && (
                <div className="no-data">
                    Сегодня всплесков не обнаружено — всё в норме
                </div>
            )}

            {!loading && trends.length > 0 && (
                <div className="trends-grid">
                    {trends.map((trend, idx) => {
                        const badge = zScoreBadge(trend.zScore);
                        return (
                            <div
                                key={trend.entity}
                                className={`trend-card ${badge.cls}`}
                                onClick={() => navigate(`/news?entity=${encodeURIComponent(trend.entity)}`)}
                            >
                                <div className="trend-rank">#{idx + 1}</div>

                                <div className="trend-top">
                                    <span className="trend-name">{trend.entity}</span>
                                    <span className={`trend-badge ${badge.cls}`}>{badge.label}</span>
                                </div>

                                <div className="trend-stats">
                                    <div className="trend-stat">
                                        <span className="stat-label">Сегодня</span>
                                        <span className="stat-value today">{trend.todayCount}</span>
                                    </div>
                                    <div className="trend-stat">
                                        <span className="stat-label">Обычно/день</span>
                                        <span className="stat-value">{trend.baselineMean}</span>
                                    </div>
                                    <div className="trend-stat">
                                        <span className="stat-label">Рост</span>
                                        <span className="stat-value growth">×{trend.growthFactor}</span>
                                    </div>
                                    <div className="trend-stat">
                                        <span className="stat-label">Z-score</span>
                                        <span className="stat-value zscore">{trend.zScore}σ</span>
                                    </div>
                                </div>

                                <div className="trend-footer">
                                    <div className="zscore-bar-track">
                                        <div
                                            className="zscore-bar-fill"
                                            style={{ width: `${Math.min(trend.zScore / 20 * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="trend-hint">🔍 Нажмите для новостей</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TrendingToday;
