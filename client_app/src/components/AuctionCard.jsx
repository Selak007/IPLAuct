import React, { useEffect, useState } from 'react';

const AuctionCard = ({ player, currentBid, currentBidder, status, teams, timerRemaining }) => {
    const [timeLeft, setTimeLeft] = useState(timerRemaining);

    useEffect(() => {
        // timerRemaining is now the absolute end time (timestamp) or 0
        if (status !== 'BIDDING' || !timerRemaining) {
            setTimeLeft(0);
            return;
        }

        const interval = setInterval(() => {
            const remaining = Math.max(0, timerRemaining - Date.now());
            setTimeLeft(remaining);
        }, 100);

        return () => clearInterval(interval);
    }, [timerRemaining, status]);

    if (!player) return <div className="auction-card waiting">Waiting for next player...</div>;

    const bidderTeam = teams.find(t => t.id === currentBidder);
    const secondsLeft = Math.ceil(timeLeft / 1000);

    return (
        <div className="auction-card">
            {/* Alerts Overlay */}
            {status === 'SOLD' && (
                <div className="alert-overlay success">
                    <div className="alert-content">
                        <h1>SOLD!</h1>
                        <p>To {bidderTeam?.name}</p>
                        <p>₹{(currentBid / 10000000).toFixed(2)} Cr</p>
                    </div>
                </div>
            )}

            {status === 'UNSOLD' && (
                <div className="alert-overlay danger">
                    <div className="alert-content">
                        <h1>UNSOLD</h1>
                        <p>No Bids Received</p>
                    </div>
                </div>
            )}

            <div className="card-header">
                <span className="set-badge">{player.set}</span>
                {status === 'BIDDING' && <span className={`timer-badge ${secondsLeft <= 5 ? 'urgent' : ''}`}>{secondsLeft}s</span>}
            </div>

            <div className="player-info">
                <h2>{player.name}</h2>
                <div className="player-badges">
                    <span className="role">{player.role}</span>
                    <span className={`country-badge ${player.country === 'India' ? 'indian' : 'overseas'}`}>
                        {player.country}
                    </span>
                </div>

                <div className="stats-grid">
                    <div className="stat-item">
                        <label>Matches</label>
                        <span>{player.stats.matches}</span>
                    </div>
                    <div className="stat-item">
                        <label>Runs</label>
                        <span>{player.stats.runs}</span>
                    </div>
                    <div className="stat-item">
                        <label>Wickets</label>
                        <span>{player.stats.wickets}</span>
                    </div>
                </div>

                <p className="base-price">Base Price: ₹{(player.basePrice / 10000000).toFixed(2)} Cr</p>
            </div>

            <div className="bid-section">
                <h3>Current Bid</h3>
                <div className="price-display">₹{(currentBid / 10000000).toFixed(2)} Cr</div>

                {bidderTeam ? (
                    <div className="bidder-info">
                        <span>Held by:</span>
                        <strong>{bidderTeam.name}</strong>
                    </div>
                ) : (
                    <div className="bidder-info placeholder">No Bids Yet</div>
                )}

                <div className={`status-badge ${status.toLowerCase()}`}>{status}</div>
            </div>
        </div>
    );
};

export default AuctionCard;
