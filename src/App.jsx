import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import TopEntities from './components/TopEntities';
import NewsByEntity from './components/NewsByEntity';
import SentimentTimeseries from './components/SentimentTimeseries';
import AuthorStats from './components/AuthorStats';
import { IconDashboard, IconTrending, IconNews, IconChart, IconCompare, IconAuthor} from './components/Icons';
import CompareEntities from './components/CompareEntities';
import './App.css';

const TABS = [
    { path: '/', label: 'Рейтинг сущностей', icon: <IconChart size={20} /> },
    { path: '/news', label: 'Поиск по сущности', icon: <IconNews size={20} /> },
    { path: '/sentiment', label: 'Динамика тональности', icon: <IconTrending size={20} /> },
    { path: '/compare', label: 'Сравнить сущности', icon: <IconCompare size={20} /> },
    { path: '/authors', label: 'Авторы', icon: <IconAuthor size={20} /> },
];

function AppContent() {
    const location = useLocation();

    return (
        <div className="app">
            <header className="app-header">
                <h1>
                    <IconDashboard size={45} style={{ marginRight: '15px', verticalAlign: 'middle', color: 'var(--accent)' }} />
                    Sports Analytics
                </h1>
                <p>Мониторинг упоминаний и тональности в спортивных СМИ</p>
            </header>

            <div className="tab-bar">
                {TABS.map(tab => (
                    <Link key={tab.path} to={tab.path}>
                        <button className={`tab-btn ${location.pathname === tab.path ? 'active' : ''}`}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                {tab.icon}
                                {tab.label}
                            </span>
                        </button>
                    </Link>
                ))}
            </div>

            <div className="content">
                <Routes>
                    <Route path="/" element={<TopEntities />} />
                    <Route path="/news" element={<NewsByEntity />} />
                    <Route path="/sentiment" element={<SentimentTimeseries />} />
                    <Route path="/compare" element={<CompareEntities />} />
                    <Route path="/authors" element={<AuthorStats />} />
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