import React from 'react';
import ScriptManagerComponent from '../components/RouterOS/ScriptManager';

const ScriptManager = () => {
    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">Script Manager</h1>
            </header>
            <ScriptManagerComponent />
        </div>
    );
};

export default ScriptManager;
