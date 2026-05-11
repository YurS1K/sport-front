import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './SentimentTimeseries.css';

const API_BASE_URL = 'http://localhost:8080/api';

const DAYS_OPTIONS = [7, 14, 30, 90];

const formatDate = (dateStr) => {
    const [, month, day] = dateStr.split('-');
    return `${day}.${month}`;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <p className="tooltip-date">{label}</p>
            {payload.map(p => (
                <p key={p.name} style={{ color: p.color }}>
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

const SentimentTimeseries = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [entityName, setEntityName] = useState('');
    const [days, setDays] = useState(30);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const entityFromUrl = searchParams.get('entity');
        const daysFromUrl = Number(searchParams.get('days')) || 30;
        if (entityFromUrl) {
            setEntityName(entityFromUrl);
            setDays(daysFromUrl);
            fetchTimeseries(entityFromUrl, daysFromUrl);
        }
    }, []);

    const fetchTimeseries = async (name, d) => {
        if (!name.trim()) return;
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_BASE_URL}/entities/sentiment`, {
                params: { name: name.trim(), days: d }
            });
            setData(response.data);
        } catch (err) {
            setError('Ошибка загрузки данных: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!entityName.trim()) return;
        setSearchParams({ entity: entityName.trim(), days });
        fetchTimeseries(entityName, days);
    };

    const handleDaysChange = (d) => {
        setDays(d);
        if (data) {
            setSearchParams({ entity: entityName.trim(), days: d });
            fetchTimeseries(entityName, d);
        }
    };

    const chartData = data?.points.map(p => ({
        date: formatDate(p.date),
        'Позитивные': p.positive,
        'Нейтральные': p.neutral,
        'Негативные': p.negative,
    })) ?? [];

    const totalPositive = data?.points.reduce((s, p) => s + p.positive, 0) ?? 0;
    const totalNegative = data?.points.reduce((s, p) => s + p.negative, 0) ?? 0;
    const totalNeutral = data?.points.reduce((s, p) => s + p.neutral, 0) ?? 0;
    const totalAll = totalPositive + totalNegative + totalNeutral;

    return (
        <div className="sentiment-timeseries">
            <form onSubmit={handleSearch} className="sentiment-form">
                <div className="sentiment-form-row">
                    <input
                        type="text"
                        value={entityName}
                        onChange={e => setEntityName(e.target.value)}
                        placeholder="Сущность: Месси, ЦСКА, Зенит..."
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Загрузка...' : 'Показать'}
                    </button>
                </div>

                <div className="days-quick-filter">
                    {DAYS_OPTIONS.map(d => (
                        <button
                            key={d}
                            type="button"
                            className={`days-quick-btn ${days === d ? 'active' : ''}`}
                            onClick={() => handleDaysChange(d)}
                        >
                            {d} дней
                        </button>
                    ))}
                </div>
            </form>

            {error && <div className="error">{error}</div>}

            {loading && <div className="loading">Загрузка графика...</div>}

            {data && !loading && (
                <>
                    <div className="timeseries-header">
                        <h2>Динамика тональности: <span className="entity-highlight">{data.entity}</span></h2>
                        <p className="timeseries-period">{data.from} — {data.to}</p>
                    </div>

                    {totalAll === 0 ? (
                        <div className="no-data">Нет упоминаний за выбранный период</div>
                    ) : (
                        <>
                            <div className="sentiment-summary">
                                <div className="summary-card positive">
                                    <span className="summary-label">😊 Позитивные</span>
                                    <span className="summary-value">{totalPositive}</span>
                                    <span className="summary-pct">{Math.round(totalPositive / totalAll * 100)}%</span>
                                </div>
                                <div className="summary-card neutral">
                                    <span className="summary-label">😐 Нейтральные</span>
                                    <span className="summary-value">{totalNeutral}</span>
                                    <span className="summary-pct">{Math.round(totalNeutral / totalAll * 100)}%</span>
                                </div>
                                <div className="summary-card negative">
                                    <span className="summary-label">😠 Негативные</span>
                                    <span className="summary-value">{totalNegative}</span>
                                    <span className="summary-pct">{Math.round(totalNegative / totalAll * 100)}%</span>
                                </div>
                            </div>

                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={320}>
                                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradPositive" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4caf50" stopOpacity={0.7} />
                                                <stop offset="95%" stopColor="#4caf50" stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="gradNeutral" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ff9800" stopOpacity={0.7} />
                                                <stop offset="95%" stopColor="#ff9800" stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="gradNegative" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f44336" stopOpacity={0.7} />
                                                <stop offset="95%" stopColor="#f44336" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 11, fill: '#888' }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis tick={{ fontSize: 11, fill: '#888' }} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ paddingTop: 16 }} />
                                        <Area type="monotone" dataKey="Позитивные" stackId="1" stroke="#4caf50" fill="url(#gradPositive)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="Нейтральные" stackId="1" stroke="#ff9800" fill="url(#gradNeutral)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="Негативные"  stackId="1" stroke="#f44336" fill="url(#gradNegative)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="search-news-link">
                                <button onClick={() => navigate(`/news?entity=${encodeURIComponent(data.entity)}`)}>
                                    🔍 Посмотреть новости об этой сущности
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default SentimentTimeseries;
