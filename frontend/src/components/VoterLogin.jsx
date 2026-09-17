import React from 'react';

export default function VoterLogin({
  voterId,
  setVoterId,
  activeTab,
  setActiveTab,
  isFpComplete,
  setIsFpComplete,
  fpStatusLabel,
  fpStatusColor,
  isIrisComplete,
  setIsIrisComplete,
  irisStatusLabel,
  irisStatusColor,
  irisScanStatusText,
  irisGraphicBorder,
  irisIconClass,
  irisIconColor,
  isIrisLaserVisible,
  isIrisScanning,
  handleScanIris,
  handleLoginSubmit,
  handleVerifyId,
  isIdValid,
  setScreen
}) {
  const isButtonEnabled = (activeTab === 'fingerprint' && isFpComplete) ||
                          (activeTab === 'iris' && isIrisComplete);

  return (
    <main id="screen-auth" className="screen active">
      <div className="auth-card">
        <div className="auth-header">
          <div className="icon-wrapper">
            <i className="ri-government-fill"></i>
          </div>
          <h1>Digital Voting System</h1>
          <p>Access your secure ballot using your unique voter ID and biometric verification.</p>
        </div>
        
        <form id="auth-form" className="auth-body" onSubmit={handleLoginSubmit}>
          <div className="input-group">
            <label htmlFor="voter-id">ENTER VOTER ID</label>
            <div className="input-wrapper">
              <i className="ri-id-card-line"></i>
              <input 
                type="text" 
                id="voter-id" 
                placeholder="e.g. VTR99283711" 
                required 
                autoComplete="off"
                value={voterId}
                onChange={(e) => {
                  setVoterId(e.target.value);
                  if (isFpComplete || isIrisComplete) {
                    setIsFpComplete(false);
                    setIsIrisComplete(false);
                  }
                }}
                disabled={isIdValid}
              />
            </div>
          </div>

          {isIdValid && (
            <div className="biometric-tabs" id="biometric-tabs" style={{ display: 'flex', marginBottom: '1.5rem', gap: '0.5rem' }}>
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'fingerprint' ? 'active' : ''}`}
                id="tab-fingerprint" 
                onClick={() => setActiveTab('fingerprint')}
                style={{
                  flex: 1, 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: activeTab === 'fingerprint' ? '2px solid #2563EB' : '2px solid var(--border-color)', 
                  background: activeTab === 'fingerprint' ? '#EFF6FF' : 'transparent', 
                  color: activeTab === 'fingerprint' ? '#2563EB' : 'var(--text-muted)', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem'
                }}
              >
                <i className="ri-fingerprint-line"></i> Fingerprint
              </button>
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'iris' ? 'active' : ''}`}
                id="tab-iris" 
                onClick={() => setActiveTab('iris')}
                style={{
                  flex: 1, 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: activeTab === 'iris' ? '2px solid #2563EB' : '2px solid var(--border-color)', 
                  background: activeTab === 'iris' ? '#EFF6FF' : 'transparent', 
                  color: activeTab === 'iris' ? '#2563EB' : 'var(--text-muted)', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem'
                }}
              >
                <i className="ri-eye-line"></i> Iris Scan
              </button>
            </div>
          )}

          {isIdValid && activeTab === 'fingerprint' && (
            <div className="python-biometric-container" id="python-bio-container" style={{ display: 'block', marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SECUGEN PYTHON SCANNER</label>
              <div style={{ border: '2px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'white' }}>
                <iframe 
                  src="http://127.0.0.1:5000/SimpleScan" 
                  id="python-iframe" 
                  style={{ width: '100%', height: '320px', border: 'none' }}
                ></iframe>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--success-bg)', color: '#065F46', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  id="check-scan-complete" 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={isFpComplete}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      setIsFpComplete(false);
                    }
                  }}
                />
                <label htmlFor="check-scan-complete" style={{ cursor: 'pointer', margin: 0, fontSize: '0.85rem', color: fpStatusColor || '#065F46' }}>
                  {fpStatusLabel}
                </label>
              </div>
            </div>
          )}

          {isIdValid && activeTab === 'iris' && (
            <div className="mantra-biometric-container" id="mantra-bio-container" style={{ display: 'block', marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MANTRA IRIS SCANNER (MIS100VS)</label>
              <div style={{ border: '2px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', background: 'white', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div className="iris-scanner-graphic" id="iris-graphic" style={{ width: '80px', height: '80px', borderRadius: '50%', border: `3px dashed ${irisGraphicBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: irisIconColor, fontSize: '2rem', position: 'relative', overflow: 'hidden', backgroundColor: '#F9FAFB' }}>
                  <i className={irisIconClass} id="iris-icon-graphic" style={{ transition: 'all 0.3s ease', color: irisIconColor }}></i>
                  {isIrisLaserVisible && (
                    <div className="scan-laser" id="iris-laser" style={{ position: 'absolute', left: 0, right: 0, height: '3px', background: '#EF4444', top: 0, animation: 'scanMove 2s infinite ease-in-out', boxShadow: '0 0 8px #EF4444' }}></div>
                  )}
                </div>
                <button 
                  type="button" 
                  id="btn-scan-iris" 
                  className="btn-secondary" 
                  onClick={handleScanIris}
                  disabled={isIrisScanning}
                  style={{ width: '100%', maxWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-color)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {isIrisScanning ? (
                    <>
                      <i className="ri-loader-4-line ri-spin"></i> Initializing...
                    </>
                  ) : (
                    <>
                      <i className="ri-scan-line"></i> Scan Iris
                    </>
                  )}
                </button>
                <span id="iris-status-text" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{irisScanStatusText}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--success-bg)', color: '#065F46', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  id="check-iris-complete" 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={isIrisComplete}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      setIsIrisComplete(false);
                    }
                  }}
                />
                <label htmlFor="check-iris-complete" style={{ cursor: 'pointer', margin: 0, fontSize: '0.85rem', color: irisStatusColor || '#065F46' }}>
                  {irisStatusLabel}
                </label>
              </div>
            </div>
          )}

          {!isIdValid && (
            <div className="biometric-section" id="bio-section">
              <div className="biometric-info">
                <div className="bio-icon" id="bio-icon">
                  <i className="ri-id-card-line"></i>
                </div>
                <div className="bio-text" id="bio-text">
                  <strong id="bio-text-strong">Voter ID Verification</strong>
                  <span id="bio-text-span">Enter ID and click Verify ID</span>
                </div>
              </div>
              <div className="bio-status" id="bio-status">
                <span className="status-dot" id="status-dot"></span>
                WAITING
              </div>
            </div>
          )}

          {isIdValid && (
            <button type="submit" className="btn-primary" id="btn-verify" disabled={!isButtonEnabled}>
              VERIFY BIOMETRICS
            </button>
          )}
        </form>
        
        <div className="auth-footer" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="ri-shield-check-fill"></i>
            <span>END-TO-END ENCRYPTED VIA GOVERNMENT PROTOCOL</span>
          </div>

        </div>
      </div>
    </main>
  );
}
