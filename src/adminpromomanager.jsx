import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faBullhorn } from '@fortawesome/free-solid-svg-icons';
import './adminpromomanager.css';

const AdminPromoManager = () => {
  const promoData = useQuery(api.promo.getPromoSettings);
  const updatePromoSettings = useMutation(api.promo.updatePromoSettings);
  const generateUploadUrl = useMutation(api.promo.generateUploadUrl);

  const [uploading, setUploading] = useState(false);

  if (!promoData) return <div className="admin-promo-loading">Loading promo settings...</div>;

  const handleToggleActive = async () => {
    await updatePromoSettings({ promoActive: !promoData.promoActive });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const postUrl = await generateUploadUrl();

      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      await updatePromoSettings({ promoImageStorageId: storageId });
      alert("Promo image updated successfully!");
    } catch (error) {
      console.error("Failed to upload image", error);
      alert("Error uploading image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-promo-wrapper">
      {/* HEADER SECTION */}
      <div className="admin-promo-header">
        <div className="admin-promo-title-area">
          <div className="header-icon-box">
            <FontAwesomeIcon icon={faBullhorn} />
          </div>
          <div>
            <h2>Popup Promo Manager</h2>
            <p>Control the promotional popup banner displayed to site visitors instantly.</p>
          </div>
        </div>
        
        {/* LIVE STATUS PILL */}
        <div className={`admin-promo-status-pill ${promoData.promoActive ? 'active' : 'inactive'}`}>
          <span className="status-dot"></span>
          {promoData.promoActive ? 'Live & Active' : 'Offline'}
        </div>
      </div>

      {/* DASHBOARD CONTENT GRID */}
      <div className="admin-promo-grid">
        
        {/* CARD 1: TOGGLE SETTINGS */}
        <div className="admin-promo-card-box">
          <h3>Visibility Control</h3>
          <p className="box-desc">Toggle the advertisement popup on or off for incoming client visits.</p>
          
          <div className="admin-promo-action-card">
            <div className="action-info">
              <strong>Popup State</strong>
              <span>{promoData.promoActive ? 'Currently showing to visitors' : 'Hidden from visitors'}</span>
            </div>
            <button 
              onClick={handleToggleActive}
              className={`admin-promo-toggle-btn ${promoData.promoActive ? 'is-active' : 'is-inactive'}`}
            >
              {promoData.promoActive ? 'Turn OFF' : 'Turn ON'}
            </button>
          </div>
        </div>

        {/* CARD 2: BANNER UPLOAD & PREVIEW */}
        <div className="admin-promo-card-box">
          <h3>Poster Image</h3>
          <p className="box-desc">Upload a high-resolution promotional poster (Portrait layout recommended).</p>

          <div className="admin-promo-upload-group">
            <input 
              type="file" 
              id="promo-file-input"
              accept="image/*" 
              onChange={handleImageUpload} 
              disabled={uploading} 
              className="hidden-file-input"
            />
            <label htmlFor="promo-file-input" className="upload-dropzone">
              <FontAwesomeIcon icon={faCloudUploadAlt} className="upload-icon" />
              <span>{uploading ? 'Uploading poster...' : 'Click to select or drop new poster'}</span>
              <span className="upload-hint">PNG, JPG, or WEBP up to 5MB</span>
            </label>
          </div>

          {promoData.imageUrl && (
            <div className="admin-promo-preview-wrapper">
              <span className="preview-label">Current Active Poster:</span>
              <div className="preview-img-container">
                <img src={promoData.imageUrl} alt="Current Promo Poster" className="admin-promo-preview-img" />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminPromoManager;