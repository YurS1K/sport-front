import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import TopEntities from './components/TopEntities';
import NewsByEntity from './components/NewsByEntity';
import SentimentTimeseries from './components/SentimentTimeseries';
import TrendingToday from './components/TrendingToday';
import './App.css';

const TABS = [
    { path: '/',          key: 'top',       label: '🏆 Топ сущности' },
    { path: '/news',      key: 'search',    label: '🔍 Поиск по сущности' },
    { path: '/trends',    key: 'trends',    label: '📈 Тренды' },
    { path: '/sentiment', key: 'sentiment', label: '💭 Тональность' },
];

function AppContent() {
    const location = useLocation();
    const activeKey = TABS.find(t => t.path === location.pathname)?.key ?? 'top';

    return (
        <div className="App">
            <header className="app-header">
                <h1>📰 Sports News Analytics</h1>
                <p>Анализ спортивных новостей по сущностям</p>
            </header>

            <div className="tab-bar">
                {TABS.map(tab => (
                    <Link key={tab.key} to={tab.path} style={{ textDecoration: 'none' }}>
                        <button className={`tab-btn ${activeKey === tab.key ? 'active' : ''}`}>
                            {tab.label}
                        </button>
                    </Link>
                ))}
            </div>

            <div className="content">
                <Routes>
                    <Route path="/"          element={<TopEntities />} />
                    <Route path="/news"      element={<NewsByEntity />} />
                    <Route path="/trends"    element={<TrendingToday />} />
                    <Route path="/sentiment" element={<SentimentTimeseries />} />
                </Routes>
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
