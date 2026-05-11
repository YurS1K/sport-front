import React, { useState } from 'react';
import './NewsCard.css';

const NewsCard = ({ news }) => {
    const [expanded, setExpanded] = useState(false);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment.toLowerCase()) {
            case 'positive': return '#4caf50';
            case 'negative': return '#f44336';
            case 'neutral': return '#ff9800';
            default: return '#9e9e9e';
        }
    };

    const getSentimentEmoji = (sentiment) => {
        switch (sentiment.toLowerCase()) {
            case 'positive': return '😊';
            case 'negative': return '😠';
            case 'neutral': return '😐';
            default: return '❓';
        }
    };

    return (
        <div className="news-card">
            <div className="news-header">
                <h3>
                    <a href={news.link} target="_blank" rel="noopener noreferrer">
                        {news.title}
                    </a>
                </h3>
                <div className="news-meta">
                    <span className="news-author">✍️ {news.author}</span>
                    <span className="news-date">📅 {formatDate(news.date)}</span>
                    <span className="news-source">📰 {news.source}</span>
                </div>
            </div>

            <div className="news-body">
                <p className="news-text">
                    {expanded ? news.text : `${news.text.substring(0, 300)}...`}
                    {news.text.length > 300 && (
                        <button
                            className="expand-btn"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? 'Свернуть' : 'Читать далее'}
                        </button>
                    )}
                </p>

                <div className="news-footer">
                    <div className="news-tags">
                        <strong>🏷️ Теги:</strong>
                        <div className="tags-list">
                            {news.tags.map((tag, idx) => (
                                <span key={idx} className="tag">{tag}</span>
                            ))}
                        </div>
                    </div>

                    <div className="news-entities">
                        <strong>🔍 Сущности:</strong>
                        <div className="entities-list">
                            {news.entities.map((entity, idx) => (
                                <span key={idx} className="entity">{entity}</span>
                            ))}
                        </div>
                    </div>

                    <div
                        className="news-sentiment"
                        style={{ backgroundColor: getSentimentColor(news.sentiment) }}
                    >
                        {getSentimentEmoji(news.sentiment)} {news.sentiment}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsCard;