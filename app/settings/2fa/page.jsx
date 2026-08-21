// app/settings/2fa/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { Lock, Check, X } from 'lucide-react';
import OTPInput from '@/components/OTPInput';

export default function TwoFactorAuthPage() {
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showOTPSection, setShowOTPSection] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Fetch user data and 2FA status
  useEffect(() => {
    const userData = {
      email: 'kjabhishek.@gmail.com',
      userId: '9789305175'
    };
    
    setUserEmail(userData.email);
    setUserId(userData.userId);

    fetch(`/api/auth/toggle-2fa?email=${userData.email}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIs2FAEnabled(data.enabled);
        }
      })
      .catch(err => console.error('Error fetching 2FA status:', err));
  }, []);

  // Timer for OTP expiry
  useEffect(() => {
    if (!otpExpiry) return;

    const timer = setInterval(() => {
      const remaining = Math.floor((otpExpiry - Date.now()) / 1000);
      if (remaining <= 0) {
        setOtpSent(false);
        setShowOTPSection(false);
        setOtpExpiry(null);
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [otpExpiry]);

  const handleGenerateOTP = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setShowOTPSection(true);
        setOtpExpiry(data.expiryTime);
        setMessageType('info');
        setMessage(`OTP sent to ${userEmail}. Valid for 10 minutes.`);
        
        if (data.dev_otp) {
          console.log(`Development OTP: ${data.dev_otp}`);
        }
      } else {
        setMessageType('error');
        setMessage(data.message || 'Failed to generate OTP');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Error generating OTP. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp) => {
    setVerifyingOtp(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, otp })
      });

      const data = await response.json();

      if (data.success) {
        await handleToggle2FA(!is2FAEnabled, true);
      } else {
        setMessageType('error');
        setMessage(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Error verifying OTP. Please try again.');
      console.error('Error:', error);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleToggle2FA = async (newState, otpVerified = false) => {
    if (!otpVerified) {
      setShowOTPSection(true);
      await handleGenerateOTP();
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/toggle-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          enabled: newState,
          adminEmail: userEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        setIs2FAEnabled(newState);
        setShowOTPSection(false);
        setOtpSent(false);
        setOtpExpiry(null);
        setMessageType('success');
        setMessage(`2FA ${newState ? 'enabled' : 'disabled'} successfully`);
      } else {
        setMessageType('error');
        setMessage(data.message || 'Failed to toggle 2FA');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Error updating 2FA. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowOTPSection(false);
    setOtpSent(false);
    setMessage('');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="settings-main-content">
      <div className="settings-header">
        <h1 className="settings-title">Two Factor Authentication</h1>
        <p className="settings-subtitle">
          Admin can enable the 2FA via mobile OTP in this section.
        </p>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">
          <Lock size={20} />
          Security Settings
        </h2>

        <div className="user-2fa-info">
          <div className="user-email-label">Email Address</div>
          <div className="user-email-value">{userEmail}</div>
          <div className="user-id">{userId}</div>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : message.includes('error') ? 'error' : 'info'}`}>
            {messageType === 'success' && <Check size={16} style={{ display: 'inline', marginRight: '8px' }} />}
            {messageType === 'error' && <X size={16} style={{ display: 'inline', marginRight: '8px' }} />}
            {message}
          </div>
        )}

        {!showOTPSection && (
          <div className="toggle-buttons-container">
            <button
              className={`toggle-button ${is2FAEnabled ? 'active' : ''}`}
              onClick={() => handleToggle2FA(true)}
              disabled={loading || is2FAEnabled}
            >
              {loading && <span className="loading-spinner"></span>}
              <span>Yes</span> Enable 2FA
            </button>
            <button
              className={`toggle-button danger ${!is2FAEnabled ? 'active' : ''}`}
              onClick={() => handleToggle2FA(false)}
              disabled={loading || !is2FAEnabled}
            >
              {loading && <span className="loading-spinner"></span>}
              <span>No</span> Disable 2FA
            </button>
          </div>
        )}

        {showOTPSection && otpSent && (
          <div className="otp-section show">
            <label className="otp-label">
              Enter the OTP sent to your email:
            </label>

            {timeLeft > 0 && (
              <div className="otp-timer">
                OTP expires in {minutes}:{seconds.toString().padStart(2, '0')} minutes
              </div>
            )}

            <OTPInput
              length={6}
              onComplete={handleOTPComplete}
              disabled={verifyingOtp}
            />

            <div className="button-group">
              <button
                className="verify-button"
                onClick={() => handleOTPComplete('')}
                disabled={verifyingOtp}
                style={{ opacity: 0 }}
              >
                Verify
              </button>
              <button
                className="verify-button"
                style={{ background: '#999' }}
                onClick={handleCancel}
                disabled={verifyingOtp}
              >
                Cancel
              </button>
            </div>

            {verifyingOtp && (
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#ff6b35', marginTop: '10px' }}>
                <span className="loading-spinner"></span> Verifying OTP...
              </p>
            )}
          </div>
        )}
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">
          <Lock size={20} />
          2FA Status
        </h2>
        <div className="status-box">
          <p className="status-label">Current Status</p>
          <p className={`status-value ${is2FAEnabled ? 'enabled' : 'disabled'}`}>
            {is2FAEnabled ? '✓ Enabled' : '✗ Disabled'}
          </p>
        </div>
      </div>
    </div>
  );
}