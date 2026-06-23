import React, { useState } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import './CompareEntities.css';

const API_BASE_URL = 'http://localhost:8080/api';
const DAYS_OPTIONS = [7, 14, 30, 90];

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [, month, day] = dateStr.split('-');
    return `${day}/${month}`;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', padding: '0.5rem 0.8rem' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
            {payload.map(p => {
                let value = p.value;
                if (typeof value === 'number') {
                    value = Number.isInteger(value) ? value : value.toFixed(2);
                }
                return (
                    <p key={p.name} style={{ margin: 0, color: p.color }}>
                        {p.name}: {value}
                    </p>
                );
            })}
        </div>
    );
};

const CompareEntities = () => {
    const [entity1, setEntity1] = useState('');
    const [entity2, setEntity2] = useState('');
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const fetchComparison = async () => {
        if (!entity1.trim() || !entity2.trim()) {
            setError('Введите обе сущности');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_BASE_URL}/entities/compare`, {
                params: { entity1: entity1.trim(), entity2: entity2.trim(), days }
            });
            setData(response.data);
        } catch (err) {
            setError('Ошибка загрузки: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchComparison();
    };

    const mentionsData = data?.data1?.map((_, idx) => ({
        date: formatDate(data.data1[idx].date),
        [data.entity1]: data.data1[idx].mentions,
        [data.entity2]: data.data2[idx].mentions,
    })) ?? [];

    const sentimentData = data?.data1?.map((_, idx) => ({
        date: formatDate(data.data1[idx].date),
        [data.entity1]: data.data1[idx].avgSentiment,
        [data.entity2]: data.data2[idx].avgSentiment,
    })) ?? [];

    return (
        <div className="compare-entities">
            <form onSubmit={handleSubmit} className="compare-form">
                <div className="compare-row">
                    <input
                        type="text"
                        placeholder="Сущность 1 (например, Месси)"
                        value={entity1}
                        onChange={(e) => setEntity1(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Сущность 2 (например, Роналду)"
                        value={entity2}
                        onChange={(e) => setEntity2(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading}>Сравнить</button>
                </div>
                <div className="days-quick-filter">
                    {DAYS_OPTIONS.map(d => (
                        <button
                            key={d}
                            type="button"
                            className={`days-quick-btn ${days === d ? 'active' : ''}`}
                            onClick={() => setDays(d)}
                        >
                            {d} дней
                        </button>
                    ))}
                </div>
            </form>

            {error && <div className="error">{error}</div>}
            {loading && <div className="loading">Загрузка данных...</div>}

            {data && !loading && (
                <>
                    <div className="compare-summary">
                        <h3>Сравнение: <span style={{ color: '#f97316' }}>{data.entity1}</span> vs <span style={{ color: '#3b82f6' }}>{data.entity2}</span></h3>
                        <p>{data.from} — {data.to}</p>
                    </div>

                    <div className="compare-stats">
                        <div className="stat-card">
                            <div className="stat-title">{data.entity1}</div>
                            <div>Всего упоминаний: {data.data1.reduce((s, d) => s + d.mentions, 0)}</div>
                            <div>Средняя тональность: {(data.data1.reduce((s, d) => s + d.avgSentiment, 0) / data.data1.length).toFixed(2)}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-title">{data.entity2}</div>
                            <div>Всего упоминаний: {data.data2.reduce((s, d) => s + d.mentions, 0)}</div>
                            <div>Средняя тональность: {(data.data2.reduce((s, d) => s + d.avgSentiment, 0) / data.data2.length).toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="chart-container">
                        <h4>Количество упоминаний по дням</h4>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={mentionsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
                                <YAxis tick={{ fill: '#94a3b8' }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey={data.entity1} stroke="#f97316" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey={data.entity2} stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-container">
                        <h4>Средняя тональность (от -1 негативная до +1 позитивная)</h4>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={sentimentData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
                                <YAxis domain={[-1, 1]} tick={{ fill: '#94a3b8' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                                <Line type="monotone" dataKey={data.entity1} stroke="#f97316" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey={data.entity2} stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
};

export default CompareEntities;