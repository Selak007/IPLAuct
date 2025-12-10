import React from 'react';

const TeamDashboard = ({ team }) => {
    if (!team) return null;

    return (
        <div className="team-dashboard">
            <h3>{team.name} Dashboard</h3>
            <div className="stats-row">
                <div className="stat" style={{ marginBottom: '1rem', textAlign: 'center' }}>
                    <label>Purse Remaining</label>
                    <span style={{ fontSize: '1.5rem', color: 'var(--success)', display: 'block' }}>₹{(team.purse / 10000000).toFixed(2)} Cr</span>
                </div>

                <div className="slot-stats">
                    <div className="slot-item">
                        <label>Total Slots</label>
                        <span>{team.slots}</span>
                    </div>
                    <div className="slot-item">
                        <label>Indian</label>
                        <span>{team.slots - team.overseasSlots}</span>
                    </div>
                    <div className="slot-item">
                        <label>Overseas</label>
                        <span>{team.overseasSlots}</span>
                    </div>
                </div>
            </div>
            <div className="squad-list">
                <h4>Squad ({team.players.length})</h4>
                <ul>
                    {team.players.map((p, i) => (
                        <li key={i}>{p.name} - ₹{(p.soldPrice / 10000000).toFixed(2)} Cr</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TeamDashboard;
