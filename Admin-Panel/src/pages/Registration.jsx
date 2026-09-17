import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { captureIris } from '../services/BiometricService';
import { speak } from '../services/VoiceService';
import { Fingerprint, Eye, CheckCircle, AlertTriangle } from 'lucide-react';

async function sha256(message) {
  if (!message) return '';
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Registration() {
  const navigate = useNavigate();
  const { registerVoter } = useStore();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ voterId: '', fullName: '' });
  const [biometricStatus, setBiometricStatus] = useState('');
  const [error, setError] = useState('');
  
  const [scannedFp, setScannedFp] = useState('');
  const [scannedIrisHash, setScannedIrisHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFpScanner, setShowFpScanner] = useState(false);

  const handleInfoSubmit = (e) => {
    e.preventDefault();
    setError('');
    setStep(2);
    setBiometricStatus("Please capture at least one biometric method (Fingerprint or Iris).");
    speak("Please capture at least one biometric method, either fingerprint or iris.");
  };

  const handleCaptureIris = async () => {
    try {
      setBiometricStatus("Capturing Iris...");
      speak("Please look at the Iris scanner.");
      const irisData = await captureIris();
      setScannedIrisHash(irisData.hash);
      setBiometricStatus("Iris captured successfully!");
      speak("Iris captured successfully.");
    } catch (err) {
      setError("Iris capture failed. Error: " + err.message);
      speak("Iris capture failed.");
    }
  };

  const submitRegistration = async () => {
    if (!scannedFp && !scannedIrisHash) {
      setError("You must provide at least one biometric method.");
      speak("You must provide at least one biometric method.");
      return;
    }
    
    setIsSubmitting(true);
    setBiometricStatus("Saving to Database...");
    
    const generatedVoterId = formData.voterId.trim() !== '' ? formData.voterId.trim() : `VOTER-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const fpHash = scannedFp ? await sha256(scannedFp) : '';
    
    try {
      const formDataApi = new URLSearchParams();
      formDataApi.append('voter_id', generatedVoterId);
      formDataApi.append('name', formData.fullName);
      if (scannedFp) formDataApi.append('fingerprint_template', scannedFp);
      if (fpHash) formDataApi.append('fingerprint_hash', fpHash);
      if (scannedIrisHash) formDataApi.append('iris_hash', scannedIrisHash);
      
      const res = await fetch('http://127.0.0.1:5000/api/admin/voter', {
        method: 'POST',
        body: formDataApi
      });
      
      const dbData = await res.json();
      if (dbData.status === 'success') {
        const newVoter = {
          voterId: generatedVoterId,
          ...formData,
          hasVoted: false,
          has_fingerprint: !!scannedFp,
          has_iris: !!scannedIrisHash
        };
        registerVoter(newVoter);
        speak(`New voter successfully registered. Your Voter ID is ${generatedVoterId}.`);
        
        setStep(3);
        setBiometricStatus(`Success! Voter ID: ${generatedVoterId}`);
        
        setTimeout(() => {
          navigate('/admin');
        }, 5000);
      } else {
        setError(`Failed to save to Backend Database: ${dbData.message}`);
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("Failed to communicate with the server. Error: " + err.message);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleMessage = async (event) => {
      if (step === 2 && event.data && event.data.type === 'SECUGEN_SCAN_COMPLETE') {
        const scannedTemplate = event.data.template;
        setScannedFp(scannedTemplate);
        setShowFpScanner(false);
        setBiometricStatus("Fingerprint captured successfully!");
        speak("Fingerprint captured successfully.");
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [step]);

  return (
    <div className="page-container">
      <div className="glass-panel" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Voter Registration</h2>
        
        {error && (
          <div style={{ background: 'var(--danger-color)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', gap: '8px', color: '#fff' }}>
            <AlertTriangle />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleInfoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Voter ID (Leave blank to auto-generate)</label>
              <input className="input-field" type="text" placeholder="e.g. VOTER-1234" value={formData.voterId} onChange={e => setFormData({...formData, voterId: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Full Name</label>
              <input required className="input-field" type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>Proceed to Biometrics</button>
          </form>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginBottom: '24px' }}>{biometricStatus}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div style={{ padding: '24px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-hover)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <Fingerprint size={64} color={scannedFp ? "var(--primary-color)" : "var(--text-muted)"} />
                <button 
                  className={`btn ${scannedFp ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setShowFpScanner(!showFpScanner)}
                >
                  {scannedFp ? "Recapture Fingerprint" : "Capture Fingerprint"}
                </button>
                {scannedFp && <span style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 'bold' }}><CheckCircle size={16} style={{display:'inline', verticalAlign:'middle'}}/> Captured</span>}
              </div>
              
              <div style={{ padding: '24px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-hover)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <Eye size={64} color={scannedIrisHash ? "var(--primary-color)" : "var(--text-muted)"} />
                <button 
                  className={`btn ${scannedIrisHash ? 'btn-primary' : 'btn-outline'}`}
                  onClick={handleCaptureIris}
                >
                  {scannedIrisHash ? "Recapture Iris" : "Capture Iris"}
                </button>
                {scannedIrisHash && <span style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 'bold' }}><CheckCircle size={16} style={{display:'inline', verticalAlign:'middle'}}/> Captured</span>}
              </div>
            </div>

            {showFpScanner && (
              <div style={{ border: '2px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'white', marginBottom: '24px' }}>
                  <iframe src="http://127.0.0.1:5000/SimpleScan" title="Python SecuGen" style={{ width: '100%', height: '320px', border: 'none' }}></iframe>
              </div>
            )}
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '16px' }}
              disabled={(!scannedFp && !scannedIrisHash) || isSubmitting}
              onClick={submitRegistration}
            >
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <CheckCircle size={80} color="var(--accent-color)" style={{ marginBottom: '16px' }} className="animate-fade-in" />
            <h3 style={{ color: 'var(--accent-color)', fontSize: '1.5rem', marginBottom: '8px' }}>Registration Complete</h3>
            <p style={{ color: 'var(--text-muted)' }}>{biometricStatus}</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '16px', fontSize: '0.9rem' }}>Redirecting to Admin Dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
