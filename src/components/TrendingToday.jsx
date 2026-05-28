import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TrendingToday.css';

const API_BASE_URL = 'http://localhost:8080/api';

const getBadgeLabel = (z) => {
    if (z >= 10) return '🔥 Взрывной рост';
    if (z >= 5) return '📈 Резкий рост';
    return '⬆️ Рост';
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
            const response = await axios.get(`${API_BASE_URL}/trends/today`, { params: { limit, baselineDays } });
            setTrends(response.data);
            setError(null);
        } catch (err) {
            setError('Ошибка загрузки трендов');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Анализируем всплески...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="trending-today">
            <div className="trending-controls">
                <label>Показать: <select value={limit} onChange={e => setLimit(Number(e.target.value))}>
                    <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                </select></label>
                <label>Период сравнения: <select value={baselineDays} onChange={e => setBaselineDays(Number(e.target.value))}>
                    <option value={7}>7 дней</option><option value={14}>14 дней</option><option value={30}>30 дней</option>
                </select></label>
                <button className="refresh-btn" onClick={fetchTrends} disabled={loading}>⟳ Обновить</button>
            </div>

            {trends.length === 0 ? (
                <div className="no-data">Сегодня нет значительных всплесков</div>
            ) : (
                <div className="trends-grid">
                    {trends.map((trend, idx) => (
                        <div key={trend.entity} className="trend-card" onClick={() => navigate(`/news?entity=${encodeURIComponent(trend.entity)}`)}>
                            <div className="trend-rank">#{idx+1}</div>
                            <div className="trend-name">{trend.entity}</div>
                            <div className="trend-badge">{getBadgeLabel(trend.zScore)}</div>
                            <div className="trend-stats">
                                <div className="trend-stat"><div className="stat-label">Сегодня</div><div className="stat-value">{trend.todayCount}</div></div>
                                <div className="trend-stat"><div className="stat-label">Обычно</div><div className="stat-value">{trend.baselineMean}</div></div>
                                <div className="trend-stat"><div className="stat-label">Рост (×)</div><div className="stat-value">{trend.growthFactor}</div></div>
                                <div className="trend-stat"><div className="stat-label">Z-score</div><div className="stat-value">{trend.zScore}</div></div>
                            </div>
                            <div className="trend-footer"><div className="zscore-bar-fill" style={{ width: `${Math.min(trend.zScore / 20 * 100, 100)}%` }}></div></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TrendingToday;