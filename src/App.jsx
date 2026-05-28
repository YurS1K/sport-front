import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import TopEntities from './components/TopEntities';
import NewsByEntity from './components/NewsByEntity';
import SentimentTimeseries from './components/SentimentTimeseries';
import { IconNews, IconTrending } from './components/Icons';
import './App.css';

const TABS = [
    { path: '/', label: 'Рейтинг сущностей', icon: <IconTrending size={16} style={{ marginRight: '6px' }} /> },
    { path: '/news', label: 'Поиск по сущности', icon: <IconNews size={16} style={{ marginRight: '6px' }} /> },
    { path: '/sentiment', label: 'Динамика тональности', icon: <IconTrending size={16} style={{ marginRight: '6px' }} /> },
];

function AppContent() {
    const location = useLocation();

    return (
        <div className="app">
            <header className="app-header">
                <h1>📊 Sports Analytics</h1>
                <p>Мониторинг упоминаний и тональности в спортивных СМИ</p>
            </header>

            <div className="tab-bar">
                {TABS.map(tab => (
                    <Link key={tab.path} to={tab.path}>
                        <button className="tab-btn">
                            {tab.icon} {tab.label}
                        </button>
                    </Link>
                ))}
            </div>

            <div className="content">
                <Routes>
                    <Route path="/" element={<TopEntities />} />
                    <Route path="/news" element={<NewsByEntity />} />
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