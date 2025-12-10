import React from 'react';

const BiddingControls = ({ onBid, disabled, myTeam }) => {
    if (!myTeam) return null;

    return (
        <div className="bidding-controls">
            <button disabled={disabled} onClick={() => onBid(2000000)}>+20L</button>
            <button disabled={disabled} onClick={() => onBid(5000000)}>+50L</button>
            <button disabled={disabled} onClick={() => onBid(10000000)}>+1Cr</button>
            <button disabled={disabled} onClick={() => onBid(20000000)}>+2Cr</button>
        </div>
    );
};

export default BiddingControls;
