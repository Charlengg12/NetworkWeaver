import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ fullScreen = false, text = 'Loading...' }) => {
    return (
        <div className={`spinner-container ${fullScreen ? 'fullscreen' : ''}`}>
            <div className="spinner-ring"></div>
            <p className="spinner-text">{text}</p>
        </div>
    );
};

export default LoadingSpinner;
