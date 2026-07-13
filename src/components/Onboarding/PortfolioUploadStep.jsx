import { useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { functions } from '../../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import ProgressDots from '../ui/ProgressDots';
import AIConsentModal from '../ui/AIConsentModal';
import { acceptAIConsent, hasAIConsent } from '../../lib/aiConsent';

export default function PortfolioUploadStep({ step, totalSteps, onNext }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [synced, setSynced] = useState(false);
  const [showAIConsent, setShowAIConsent] = useState(false);
  const [pickerAttempted, setPickerAttempted] = useState(false);
  const fileInputRef = useRef(null);

  const analyzeImage = async (imageBase64) => {
    setLoading(true);
    setError(null);
    try {
      const analyzePortfolioScreenshot = httpsCallable(functions, 'analyzePortfolioScreenshot');
      await analyzePortfolioScreenshot({ imageBase64 });
      setSynced(true);
      setTimeout(() => onNext(), 1500);
    } catch (err) {
      console.error('Analysis error:', err);
      setError("We couldn't analyze that screenshot. Try another image or continue without it.");
    } finally {
      setLoading(false);
    }
  };

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Unable to read image.'));
    reader.readAsDataURL(file);
  });

  const openPortfolioPicker = async () => {
    setPickerAttempted(true);
    if (!Capacitor.isNativePlatform()) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const cameraModule = await import('@capacitor/camera');
      const { results } = await cameraModule.Camera.chooseFromGallery({
        mediaType: cameraModule.MediaTypeSelection.Photo,
        allowMultipleSelection: false,
        includeMetadata: true,
        presentationStyle: 'fullscreen'
      });
      const selected = results?.[0];
      if (!selected) return;

      if (selected.uri) {
        const filesystemModule = await import('@capacitor/filesystem');
        const { data } = await filesystemModule.Filesystem.readFile({ path: selected.uri });
        const format = selected.metadata?.format === 'png' ? 'png' : 'jpeg';
        const imageData = typeof data === 'string'
          ? `data:image/${format};base64,${data}`
          : await fileToDataUrl(data);
        await analyzeImage(imageData);
        return;
      }

      if (!selected.webPath) throw new Error('Unable to read selected screenshot.');
      const response = await fetch(selected.webPath);
      await analyzeImage(await fileToDataUrl(await response.blob()));
    } catch (err) {
      const message = String(err?.message || '').toLowerCase();
      if (!message.includes('cancel')) {
        console.error('Photo picker error:', err);
        setError('Photos could not be opened. Please try again.');
      }
    }
  };

  const handleUploadClick = () => {
    // Check AI consent before allowing upload
    if (!hasAIConsent()) {
      setShowAIConsent(true);
      return;
    }
    openPortfolioPicker();
  };

  const handleAIConsentAccept = () => {
    acceptAIConsent();
    setShowAIConsent(false);
    openPortfolioPicker();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await analyzeImage(await fileToDataUrl(file));
      } catch (err) {
        console.error('Image read error:', err);
        setError('That screenshot could not be read. Please try another image.');
      }
    }
  };

  return (
    <div className="onboard-step">
      <ProgressDots current={step} total={totalSteps} />
      <div className="onboard-hero-icon" style={{ color: 'var(--accent-teal)' }}>
        <ion-icon name={synced ? "checkmark-circle" : "image-outline"}></ion-icon>
      </div>
      <div className="onboard-title">
        {synced ? "Portfolio Analyzed!" : "Sync Your Portfolio"}
      </div>
      <div className="onboard-subtitle">
        {synced 
          ? "Graham has successfully mapped your holdings." 
          : "Select an existing screenshot from Robinhood or Fidelity. Graham's AI will read your holdings—no passwords required."}
      </div>
      
      {error && <div style={{ color: 'var(--accent-rose)', marginTop: '8px', fontSize: '14px' }}>{error}</div>}
      
      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!synced && (
          <>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageUpload}
              onCancel={() => setPickerAttempted(true)}
            />
            <button 
              className="onboard-next" 
              onClick={handleUploadClick} 
              disabled={loading}
            >
              {loading ? "Graham AI is Scanning..." : "Choose Screenshot from Photos"}
            </button>
          </>
        )}
        
        {!synced && !loading && pickerAttempted && (
          <button 
            className="onboard-next" 
            style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }} 
            onClick={onNext}
          >
            Continue without a portfolio
          </button>
        )}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <ion-icon name="shield-checkmark"></ion-icon> Shared for AI analysis only after your consent
      </div>

      <AIConsentModal
        isOpen={showAIConsent}
        onAccept={handleAIConsentAccept}
        onDecline={() => {
          setShowAIConsent(false);
          setPickerAttempted(true);
        }}
      />
    </div>
  );
}
