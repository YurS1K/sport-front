import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import TopEntities from './components/TopEntities';
import NewsByEntity from './components/NewsByEntity';
import './App.css';

function AppContent() {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(() => {
        // Определяем активную вкладку по текущему пути
        return location.pathname === '/news' ? 'search' : 'top';
    });

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className="App">
            <header className="app-header">
                <h1>📰 Sports News Analytics</h1>
                <p>Анализ спортивных новостей по сущностям</p>
            </header>

            <div className="tab-bar">
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <button
                        className={`tab-btn ${activeTab === 'top' ? 'active' : ''}`}
                        onClick={() => handleTabChange('top')}
                    >
                        🏆 Топ сущности
                    </button>
                </Link>
                <Link to="/news" style={{ textDecoration: 'none' }}>
                    <button
                        className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
                        onClick={() => handleTabChange('search')}
                    >
                        🔍 Поиск по сущности
                    </button>
                </Link>
            </div>

            <div className="content">
                <Routes>
                    <Route path="/" element={<TopEntities />} />
                    <Route path="/news" element={<NewsByEntity />} />
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