import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './SentimentTimeseries.css';
import { IconPositive, IconNegative, IconNeutral } from './Icons';

const API_BASE_URL = 'http://localhost:8080/api';
const DAYS_OPTIONS = [7, 14, 30, 90];

const formatDate = (dateStr) => {
    const [, month, day] = dateStr.split('-');
    return `${day}/${month}`;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '0.5rem 0.8rem' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
            {payload.map(p => (
                <p key={p.name} style={{ margin: 0, color: p.color }}>{p.name}: {p.value}</p>
            ))}
        </div>
    );
};

const SentimentTimeseries = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [entityName, setEntityName] = useState('');
    const [days, setDays] = useState(7);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const entityFromUrl = searchParams.get('entity');
        const daysFromUrl = Number(searchParams.get('days')) || 7;
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
            const response = await axios.get(`${API_BASE_URL}/entities/sentiment`, { params: { name: name.trim(), days: d } });
            setData(response.data);
            setError(null);
        } catch (err) {
            setError('Ошибка: ' + err.message);
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

    const totals = {
        positive: data?.points.reduce((s, p) => s + p.positive, 0) || 0,
        neutral: data?.points.reduce((s, p) => s + p.neutral, 0) || 0,
        negative: data?.points.reduce((s, p) => s + p.negative, 0) || 0,
    };
    const totalAll = totals.positive + totals.neutral + totals.negative;

    return (
        <div className="sentiment-timeseries">
            <form onSubmit={handleSearch} className="sentiment-form">
                <div className="sentiment-form-row">
                    <input type="text" value={entityName} onChange={e => setEntityName(e.target.value)} placeholder="Сущность: Месси, Зенит, etc" required />
                    <button type="submit" disabled={loading}>Анализ</button>
                </div>
                <div className="days-quick-filter">
                    {DAYS_OPTIONS.map(d => (
                        <button key={d} type="button" className={`days-quick-btn ${days === d ? 'active' : ''}`} onClick={() => handleDaysChange(d)}>
                            {d} дней
                        </button>
                    ))}
                </div>
            </form>

            {error && <div className="error">{error}</div>}
            {loading && <div className="loading">Загрузка графика...</div>}

            {data && !loading && (
                <>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Динамика тональности: <span style={{ color: 'var(--accent)' }}>{data.entity}</span></h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{data.from} — {data.to}</p>
                    </div>

                    {totalAll === 0 ? (
                        <div className="no-data">Нет упоминаний за период</div>
                    ) : (
                        <>
                            <div className="sentiment-summary">
                                <div className="summary-card positive">
                                    <div className="summary-label"><IconPositive size={14} color="#22c55e" style={{ marginRight: '4px' }} /> Позитивные</div><div className="summary-value">{totals.positive}</div><div>{Math.round(totals.positive/totalAll*100)}%</div></div>
                                <div className="summary-card neutral">
                                    <div className="summary-label"><IconNeutral size={14} color="#eab308" /> Нейтральные</div><div className="summary-value">{totals.neutral}</div><div>{Math.round(totals.neutral/totalAll*100)}%</div></div>
                                <div className="summary-card negative">
                                    <div className="summary-label"><IconNegative size={14} color="#ef4444" /> Негативные</div><div className="summary-value">{totals.negative}</div><div>{Math.round(totals.negative/totalAll*100)}%</div></div>
                            </div>

                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={320}>
                                    <AreaChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#94a3b8' }} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Area type="monotone" dataKey="Позитивные" stackId="1" stroke="#4ade80" fill="#4ade80" fillOpacity={0.2} strokeWidth={2} />
                                        <Area type="monotone" dataKey="Нейтральные" stackId="2" stroke="#facc15" fill="#facc15" fillOpacity={0.2} strokeWidth={2} />
                                        <Area type="monotone" dataKey="Негативные" stackId="3" stroke="#f87171" fill="#f87171" fillOpacity={0.2} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="search-news-link">
                                <button onClick={() => navigate(`/news?entity=${encodeURIComponent(data.entity)}`)}>📰 Все новости об этой сущности</button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default SentimentTimeseries;