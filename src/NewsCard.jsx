import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewsCard.css';
import {
    IconPositive, IconNegative, IconNeutral,
    IconAuthor, IconCalendar, IconSource,
    IconTag, IconEntity
} from './components/Icons';

const NewsCard = ({ news }) => {
    const [expanded, setExpanded] = useState(false);
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment.toLowerCase()) {
            case 'positive': return '#22c55e';
            case 'negative': return '#ef4444';
            case 'neutral': return '#eab308';
            default: return '#64748b';
        }
    };

    const renderSentimentIcon = (sentiment) => {
        switch (sentiment.toLowerCase()) {
            case 'positive': return <IconPositive size={24} color="#22c55e" />;
            case 'negative': return <IconNegative size={24} color="#ef4444" />;
            case 'neutral': return <IconNeutral size={24} color="#eab308" />;
            default: return null;
        }
    };

    const handleEntityClick = (entity) => {
        navigate(`/news?entity=${encodeURIComponent(entity)}`);
    };

    const sentimentIcon = renderSentimentIcon(news.sentiment);
    const sentimentColor = getSentimentColor(news.sentiment);

    return (
        <div className="news-card">
            <div className="news-header">
                <div className="news-sentiment" style={{ color: sentimentColor, display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {sentimentIcon}
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{news.sentiment}</span>
                </div>
                <h3><a href={news.link} target="_blank" rel="noopener noreferrer">{news.title}</a></h3>
                <div className="news-meta">
                    <span><IconAuthor size={20} style={{ marginRight: '4px' }} /> {news.author}</span>
                    <span><IconCalendar size={20} style={{ marginRight: '4px' }} /> {formatDate(news.date)}</span>
                    <span><IconSource size={20} style={{ marginRight: '4px' }} /> {news.source}</span>
                </div>
            </div>
            <div className="news-body">
                <p className="news-text">
                    {expanded ? news.text : `${news.text.substring(0, 280)}...`}
                    {news.text.length > 280 && (
                        <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
                            {expanded ? 'Свернуть' : 'Читать далее'}
                        </button>
                    )}
                </p>
                <div className="news-footer">
                    <div><IconTag size={20} style={{ marginRight: '4px' }} /> <strong>Теги:</strong> <div className="tags-list">{news.tags.map((tag, idx) => <span key={idx} className="tag">{tag}</span>)}</div></div>
                    <div><IconEntity size={20} style={{ marginRight: '4px' }} /> <strong>Сущности:</strong> <div className="entities-list">{news.entities.map((entity, idx) => (
                        <span key={idx} className="entity clickable-entity" onClick={() => handleEntityClick(entity)}>{entity}</span>
                    ))}</div></div>
                </div>
            </div>
        </div>
    );
};

export default NewsCard;