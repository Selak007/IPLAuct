import React, { useState } from 'react';

const LandingPage = ({ onCreateLobby, onJoinLobby }) => {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [mode, setMode] = useState('menu'); // menu, join

    const handleCreate = () => {
        if (!name.trim()) return alert('Please enter your name');
        onCreateLobby(name);
    };

    const handleJoin = () => {
        if (!name.trim()) return alert('Please enter your name');
        if (!code.trim()) return alert('Please enter a lobby code');
        onJoinLobby(code, name);
    };

    return (
        <div className="landing-page">
            <div className="landing-card">
                <h1>IPL Auction 2025</h1>

                <div className="input-group">
                    <label>Your Name</label>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {mode === 'menu' ? (
                    <div className="button-group">
                        <button className="primary-btn" onClick={handleCreate}>Create New Lobby</button>
                        <button className="secondary-btn" onClick={() => setMode('join')}>Join Existing Lobby</button>
                    </div>
                ) : (
                    <div className="join-form">
                        <div className="input-group">
                            <label>Lobby Code</label>
                            <input
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                maxLength={6}
                            />
                        </div>
                        <div className="button-group">
                            <button className="primary-btn" onClick={handleJoin}>Join Lobby</button>
                            <button className="text-btn" onClick={() => setMode('menu')}>Back</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LandingPage;
