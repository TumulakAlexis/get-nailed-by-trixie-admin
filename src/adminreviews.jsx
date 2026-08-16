import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid, faTrashCan, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import './adminReviews.css'; // Optional: style to match your admin panel

const AdminReviews = () => {
  const data = useQuery(api.admin.getReviewsWithAnalytics);
  const deleteReview = useMutation(api.admin.deleteReview);
  
  const [deletingId, setDeletingId] = useState(null);

  if (!data) return <div className="admin-loading">Loading reviews...</div>;

  const { reviews, totalReviews, averageRating } = data;

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      setDeletingId(reviewId);
      await deleteReview({ id: reviewId });
    } catch (err) {
      alert("Failed to delete review. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const renderStars = (score) => {
    return [...Array(5)].map((_, i) => (
      <FontAwesomeIcon 
        key={i} 
        icon={i < Math.floor(score) ? faStarSolid : faStarRegular} 
        style={{ color: '#f39c12', marginRight: '2px', fontSize: '0.9rem' }} 
      />
    ));
  };

  return (
    <div className="admin-reviews-container">
      <div className="admin-header-row">
        <div>
          <h2>Manage Client Reviews</h2>
          <p>Total Reviews: {totalReviews} | Average Rating: {averageRating} ★</p>
        </div>
      </div>

      <div className="admin-reviews-table-wrapper">
        {reviews.length === 0 ? (
          <p className="no-admin-reviews">No reviews found.</p>
        ) : (
          <table className="admin-reviews-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Photo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((rev) => (
                <tr key={rev._id}>
                  <td className="font-weight-bold">{rev.clientName}</td>
                  <td>
                    <div className="admin-stars-cell">
                      {renderStars(rev.rating)}
                    </div>
                  </td>
                  <td className="admin-comment-cell">
                    <p>{rev.comment}</p>
                  </td>
                  <td>{new Date(rev.createdAt).toLocaleDateString()}</td>
                  <td>
                    {rev.imageUrl ? (
                      <a href={rev.imageUrl} target="_blank" rel="noopener noreferrer">
                        <img src={rev.imageUrl} alt="Client upload" className="admin-review-thumbnail" />
                      </a>
                    ) : (
                      <span className="no-photo-text">None</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="admin-delete-btn" 
                      onClick={() => handleDelete(rev._id)}
                      disabled={deletingId === rev._id}
                    >
                      <FontAwesomeIcon icon={faTrashCan} /> {deletingId === rev._id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;