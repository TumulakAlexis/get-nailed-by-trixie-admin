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
  const [editingId, setEditingId] = useState(null); // Track if we are editing
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let storageId = editingId ? services.find(s => s._id === editingId).imageStorageId : undefined;

      // Only upload new image if one was selected
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
      alert(editingId ? "Service updated!" : "Service added!");
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
      image: service.imageUrl // Keep existing URL for reference
    });
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', image: null });
    setEditingId(null);
  };

  return (
    <div className="services-mgmt-container">
      <header className="mgmt-header">
        <h1>Service Management</h1>
        <p>Add, edit, or remove your nail services.</p>
      </header>

      <div className="mgmt-grid">
        {/* FORM SECTION */}
        <div className="mgmt-card">
          <h3>{editingId ? "Edit Service" : "Add New Service"}</h3>
          <form onSubmit={handleSubmit} className="service-form">
            <input 
              placeholder="Service Name" 
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              required 
            />
            <textarea 
              placeholder="Description" 
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
            <input 
              type="number" 
              placeholder="Price (₱)" 
              value={form.price}
              onChange={e => setForm({...form, price: e.target.value})}
              required 
            />
            <div className="file-input-wrapper">
              <label>Service Image:</label>
              <input 
                type="file" 
                onChange={e => setForm({...form, image: e.target.files[0]})}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={uploading}>
                {uploading ? "Processing..." : editingId ? "Update Service" : "Save Service"}
              </button>
              {editingId && (
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LIST SECTION */}
        <div className="mgmt-card">
          <h3>Active Menu</h3>
          <div className="service-list-scroll">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div className="table-info">
                        {s.imageUrl && <img src={s.imageUrl} className="mini-thumb" alt="icon" />}
                        <div>
                          <strong>{s.name}</strong>
                        </div>
                      </div>
                    </td>
                    <td>₱{s.price}</td>
                    <td>
                      <div className="action-btns">
                        <button className="edit-btn" onClick={() => handleEditClick(s)}>Edit</button>
                        <button className="del-btn" onClick={() => {
                          if(window.confirm("Delete this?")) removeService({ id: s._id });
                        }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;