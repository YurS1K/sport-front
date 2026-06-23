import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import './SentimentTimeseries.css';
import {IconPositive, IconNegative, IconNeutral, IconNews} from './Icons';


const API_BASE_URL = 'http://localhost:8080/api';
const DAYS_OPTIONS = [7, 14, 30, 90];

const formatDate = (dateStr) => {
    const [, month, day] = dateStr.split('-');
    return `${day}/${month}`;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', padding: '0.5rem 0.8rem' }}>
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
    const [sourceStats, setSourceStats] = useState(null);

    useEffect(() => {
        const entityFromUrl = searchParams.get('entity');
        const daysFromUrl = Number(searchParams.get('days')) || 7;
        if (entityFromUrl) {
            setEntityName(entityFromUrl);
            setDays(daysFromUrl);
            fetchTimeseries(entityFromUrl, daysFromUrl);
            fetchSourceStats(entityFromUrl, daysFromUrl);   // добавить
        }
    }, [searchParams]);

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

    const fetchSourceStats = async (name, d) => {
        if (!name.trim()) return;
        try {
            const response = await axios.get(`${API_BASE_URL}/entities/sources-stats`, {
                params: { name: name.trim(), days: d }
            });
            setSourceStats(response.data);
        } catch (err) {
            console.error("Ошибка загрузки статистики источников", err);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!entityName.trim()) return;
        setSearchParams({ entity: entityName.trim(), days });
        fetchTimeseries(entityName, days);
        fetchSourceStats(entityName, days);
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
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>Динамика тональности: <span style={{ color: 'var(--accent)' }}>{data.entity}</span></h3>
                        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{data.from} — {data.to}</p>
                    </div>

                    {totalAll === 0 ? (
                        <div className="no-data">Нет упоминаний за период</div>
                    ) : (
                        <>
                            <div className="sentiment-summary">
                                <div className="summary-card positive">
                                    <div className="summary-content">
                                        <div className="summary-icon">
                                            <IconPositive size={36} color="#22c55e" />
                                        </div>
                                        <div className="summary-info">
                                            <div className="summary-label">Позитивные</div>
                                            <div className="summary-numbers">
                                                <div className="summary-value">{totals.positive}</div>
                                                <div className="summary-percent">{Math.round(totals.positive / totalAll * 100)}%</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="summary-card neutral">
                                    <div className="summary-content">
                                        <div className="summary-icon">
                                            <IconNeutral size={36} color="#eab308" />
                                        </div>
                                        <div className="summary-info">
                                            <div className="summary-label">Нейтральные</div>
                                            <div className="summary-numbers">
                                                <div className="summary-value">{totals.neutral}</div>
                                                <div className="summary-percent">{Math.round(totals.neutral / totalAll * 100)}%</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="summary-card negative">
                                    <div className="summary-content">
                                        <div className="summary-icon">
                                            <IconNegative size={36} color="#ef4444" />
                                        </div>
                                        <div className="summary-info">
                                            <div className="summary-label">Негативные</div>
                                            <div className="summary-numbers">
                                                <div className="summary-value">{totals.negative}</div>
                                                <div className="summary-percent">{Math.round(totals.negative / totalAll * 100)}%</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={400}>
                                    <AreaChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 20 }} />
                                        <YAxis tick={{ fill: '#94a3b8' }} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Area type="monotone" dataKey="Позитивные" stackId="1" stroke="#4ade80" fill="#4ade80" fillOpacity={0.2} strokeWidth={2} />
                                        <Area type="monotone" dataKey="Нейтральные" stackId="2" stroke="#facc15" fill="#facc15" fillOpacity={0.2} strokeWidth={2} />
                                        <Area type="monotone" dataKey="Негативные" stackId="3" stroke="#f87171" fill="#f87171" fillOpacity={0.2} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {sourceStats && (sourceStats.ria + sourceStats.championat) > 0 && (
                                <div className="sources-chart">
                                    <h4>Упоминания по источникам</h4>
                                    <div className="sources-container">
                                        <ResponsiveContainer width={700} height={400}>
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'РИА Новости', value: sourceStats.ria },
                                                        { name: 'Чемпионат', value: sourceStats.championat }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    outerRadius={150}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    <Cell fill="#f97316" />
                                                    <Cell fill="#3b82f6" />
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="source-legend">
                                            <div><span className="ria-badge"></span> РИА Новости: {sourceStats.ria}</div>
                                            <div><span className="champ-badge"></span> Чемпионат: {sourceStats.championat}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="search-news-link">
                                <button onClick={() => navigate(`/news?entity=${encodeURIComponent(data.entity)}`)}><IconNews size={26} color="currentColor" /> Все новости об этой сущности</button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default SentimentTimeseries;