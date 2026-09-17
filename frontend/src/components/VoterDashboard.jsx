import React from 'react';

export default function VoterDashboard({
  sessionVoterId,
  selectedCandidateId,
  setSelectedCandidateId,
  isConfirming,
  isVoteSubmitted,
  isDoubleVoteError,
  txHash,
  candidatesList,
  handleVoteConfirm,
  handleLogout
}) {
  return (
    <main id="screen-dashboard" className="screen active">
      <div className="dashboard-container">
        <header className="dash-header">
          <div className="header-titles">
            <h1>Digital Voting System</h1>
            <p>Please select your preferred representative. Your choice is encrypted and secure.</p>
          </div>
          <div className="user-badge">
            <div className="user-badge-info">
              <span className="badge-label">VERIFIED VOTER</span>
              <span className="badge-id" id="display-voter-id">{sessionVoterId}</span>
            </div>
            <div className="badge-icon">
              <i className="ri-shield-user-fill"></i>
            </div>
          </div>
        </header>

        <section className="voting-section">
          <h2 className="section-title">Select your preferred candidate</h2>
          <div className="candidates-grid" id="candidates-grid">
            {candidatesList.map(candidate => {
              const isSelected = selectedCandidateId === candidate.id;
              return (
                <div 
                  key={candidate.id}
                  className={`candidate-card ${candidate.isNOTA ? 'nota-card' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCandidateId(candidate.id)}
                >
                  {candidate.isNOTA ? (
                    <div className="nota-icon">
                      <i className="ri-prohibited-line"></i>
                    </div>
                  ) : (
                    <img src={candidate.photo_path || ''} alt={candidate.name} className="candidate-photo" />
                  )}
                  <div className="candidate-info">
                    <h3>{candidate.name}</h3>
                    <p className="candidate-party">{candidate.party}</p>
                    <span className="candidate-id">
                      <i className="ri-government-line"></i> {candidate.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="dash-footer">
          <div className="action-area">
            <button 
              className="btn-primary btn-confirm" 
              id="btn-confirm" 
              disabled={!selectedCandidateId || isConfirming}
              onClick={handleVoteConfirm}
            >
              {isConfirming ? (
                <>
                  <i className="ri-loader-4-line ri-spin"></i> Processing on Blockchain...
                </>
              ) : (
                <>
                  Confirm Selection <i className="ri-arrow-right-line"></i>
                </>
              )}
            </button>
            <p className="security-note">
              <i className="ri-lock-password-line"></i> By clicking confirm, your vote will be digitally signed and securely encrypted.
            </p>
          </div>
        </footer>
      </div>
      
      {/* Confirmation Modal Overlay */}
      <div id="modal-overlay" className={`modal-overlay ${(isVoteSubmitted || isDoubleVoteError) ? 'active' : ''}`}>
        {isDoubleVoteError ? (
          <div className="modal error-modal" style={{ borderTop: '4px solid var(--danger-color)' }}>
            <div className="modal-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
              <i className="ri-error-warning-line"></i>
            </div>
            <h2>Double Voting Detected</h2>
            <p>Your vote was rejected by the smart contract because you have already cast a vote in this election.</p>
            <p style={{marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)'}}>You will be automatically logged out shortly.</p>
          </div>
        ) : (
          <div className="modal">
            <div className="modal-icon">
              <i className="ri-check-double-line"></i>
            </div>
            <h2>Vote Submitted</h2>
            <p>Your vote has been securely recorded on the Ethereum blockchain.</p>
            {txHash && (
              <div className="tx-hash-box">
                <p><strong>Transaction Hash:</strong></p>
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary-color)', fontSize: '0.9rem', wordBreak: 'break-all'}}>
                  {txHash}
                </a>
              </div>
            )}
            <p style={{marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)'}}>You will be automatically logged out shortly.</p>
          </div>
        )}
      </div>
    </main>
  );
}
