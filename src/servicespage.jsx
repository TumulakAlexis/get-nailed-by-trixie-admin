import React, { useState } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import './servicespage.css';

const ServicesPage = () => {
  const services = useQuery(api.services.getServices) || [];
  const addService = useMutation(api.services.addService);
  const updateService = useMutation(api.services.updateService);
  const removeService = useMutation(api.services.removeService);
  const generateUploadUrl = useMutation(api.services.generateUploadUrl);

  const [form, setForm] = useState({ name: '', description: '', price: '', image: null });
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let storageId = editingId ? services.find(s => s._id === editingId).imageStorageId : undefined;

      if (form.image instanceof File) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": form.image.type },
          body: form.image,
        });
        const { storageId: sId } = await result.json();
        storageId = sId;
      }

      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        imageStorageId: storageId,
      };

      if (editingId) {
        await updateService({ id: editingId, ...payload });
      } else {
        await addService(payload);
      }

      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (service) => {
    setEditingId(service._id);
    setForm({
      name: service.name,
      description: service.description,
      price: service.price,
      image: service.imageUrl 
    });
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', image: null });
    setEditingId(null);
  };

  return (
    <div className="servdash-container">
      <header className="servdash-header">
        <div>
          <h1>Service Management</h1>
          <p>Configure and manage your active menu and offerings.</p>
        </div>
        <div className="servdash-badge">
          <span>{services.length} Active Services</span>
        </div>
      </header>

      <div className="servdash-grid">
        {/* FORM SECTION */}
        <div className="servdash-card">
          <div className="servdash-card-header">
            <h3>{editingId ? "Edit Service" : "Add New Service"}</h3>
            {editingId && <span className="servdash-editing-indicator">Editing Mode</span>}
          </div>
          
          <form onSubmit={handleSubmit} className="servdash-form">
            <div className="servdash-field">
              <label>Service Name</label>
              <input 
                placeholder="e.g. Signature Gel Manicure" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                required 
              />
            </div>

            <div className="servdash-field">
              <label>Description</label>
              <textarea 
                placeholder="Brief summary of what's included..." 
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                rows="3"
              />
            </div>

            <div className="servdash-field">
              <label>Price (₱)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={form.price}
                onChange={e => setForm({...form, price: e.target.value})}
                required 
              />
            </div>

            <div className="servdash-field">
              <label>Service Image</label>
              <div className="servdash-file-dropzone">
                <input 
                  type="file" 
                  id="servdash-file-upload"
                  onChange={e => setForm({...form, image: e.target.files[0]})}
                  accept="image/*"
                />
                <label htmlFor="servdash-file-upload" className="servdash-file-label">
                  {form.image instanceof File ? form.image.name : typeof form.image === 'string' ? "Image attached (Click to change)" : "Choose image file..."}
                </label>
              </div>
            </div>
            
            <div className="servdash-form-actions">
              <button type="submit" className="servdash-btn-save" disabled={uploading}>
                {uploading ? "Processing..." : editingId ? "Update Service" : "Publish Service"}
              </button>
              {editingId && (
                <button type="button" className="servdash-btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LIST SECTION */}
        <div className="servdash-card">
          <h3>Active Menu Directory</h3>
          <div className="servdash-table-container">
            <table className="servdash-table">
              <thead>
                <tr>
                  <th>Service Details</th>
                  <th>Price</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="servdash-empty">No services found. Add your first service using the form.</td>
                  </tr>
                ) : (
                  services.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div className="servdash-table-info">
                          {s.imageUrl ? (
                            <img src={s.imageUrl} className="servdash-mini-thumb" alt={s.name} />
                          ) : (
                            <div className="servdash-thumb-placeholder">No Img</div>
                          )}
                          <div>
                            <strong>{s.name}</strong>
                            <p className="servdash-desc-snippet">{s.description || "No description provided."}</p>
                          </div>
                        </div>
                      </td>
                      <td className="servdash-price-col">₱{(Number(s.price) || 0).toLocaleString()}</td>
                      <td>
                        <div className="servdash-action-btns">
                          <button className="servdash-edit-btn" onClick={() => handleEditClick(s)}>Edit</button>
                          <button className="servdash-del-btn" onClick={() => {
                            if(window.confirm("Are you sure you want to delete this service?")) removeService({ id: s._id });
                          }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;