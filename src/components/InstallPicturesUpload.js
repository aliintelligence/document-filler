import React, { useState } from 'react';
import './InstallPicturesUpload.css';

const InstallPicturesUpload = ({ customerData, onPicturesSubmit, onBack }) => {
  const [pictures, setPictures] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState('');

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);

    // Process each file
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPicture = {
            id: Date.now() + Math.random(),
            file: file,
            preview: e.target.result,
            name: file.name,
            size: file.size
          };
          setPictures(prev => [...prev, newPicture]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePicture = (pictureId) => {
    setPictures(prev => prev.filter(pic => pic.id !== pictureId));
  };

  const handleSubmit = async () => {
    if (pictures.length === 0) {
      alert('Please upload at least one install picture.');
      return;
    }

    setUploading(true);
    try {
      await onPicturesSubmit({
        pictures,
        notes,
        customerData
      });
    } catch (error) {
      console.error('Error submitting pictures:', error);
      alert('Failed to submit pictures. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="install-pictures-container">
      <div className="install-pictures-header">
        <h2>📸 Installation Site Pictures</h2>
        <p className="subtitle">
          Please upload pictures of where the water filtration system will be installed
        </p>
      </div>

      <div className="customer-info-summary">
        <h3>Customer: {customerData.firstName} {customerData.lastName}</h3>
        <p>{customerData.address}, {customerData.city}, {customerData.state} {customerData.zipCode}</p>
        <p>Phone: {customerData.phone} | Email: {customerData.email}</p>
      </div>

      <div className="upload-section">
        <div className="upload-area">
          <input
            type="file"
            id="picture-upload"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
          />
          <label htmlFor="picture-upload" className="upload-label">
            <div className="upload-icon">📷</div>
            <div className="upload-text">
              <strong>Click to upload pictures</strong>
              <br />
              or drag and drop images here
            </div>
            <div className="upload-hint">
              JPG, PNG, HEIC up to 10MB each
            </div>
          </label>
        </div>

        <div className="upload-guidelines">
          <h4>📋 Picture Guidelines:</h4>
          <ul>
            <li>Take pictures of the installation area (kitchen, basement, utility room, etc.)</li>
            <li>Show existing plumbing connections</li>
            <li>Include any obstacles or special considerations</li>
            <li>Capture multiple angles of the install location</li>
            <li>Take photos of water source/main line if accessible</li>
          </ul>
        </div>
      </div>

      {pictures.length > 0 && (
        <div className="pictures-preview">
          <h3>Uploaded Pictures ({pictures.length})</h3>
          <div className="pictures-grid">
            {pictures.map(picture => (
              <div key={picture.id} className="picture-card">
                <img
                  src={picture.preview}
                  alt={picture.name}
                  className="picture-thumbnail"
                />
                <div className="picture-info">
                  <p className="picture-name">{picture.name}</p>
                  <p className="picture-size">{formatFileSize(picture.size)}</p>
                </div>
                <button
                  onClick={() => removePicture(picture.id)}
                  className="remove-picture-btn"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="notes-section">
        <label htmlFor="install-notes">
          <h4>📝 Installation Notes (Optional)</h4>
        </label>
        <textarea
          id="install-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any special notes about the installation site, accessibility, or requirements..."
          rows="4"
          className="notes-textarea"
        />
      </div>

      <div className="actions-section">
        <button
          onClick={onBack}
          className="back-btn"
          disabled={uploading}
        >
          ← Back
        </button>

        <button
          onClick={handleSubmit}
          className="submit-pictures-btn"
          disabled={uploading || pictures.length === 0}
        >
          {uploading ? (
            <>
              <span className="spinner"></span>
              Sending Pictures...
            </>
          ) : (
            <>
              📧 Send Install Pictures
              {pictures.length > 0 && ` (${pictures.length})`}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InstallPicturesUpload;