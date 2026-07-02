import React, { useState, useMemo } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format } from 'date-fns';
import './BookingModal.css';
// Ensure you create this component in a separate file
import PrintReceipt from './PrintReceipt';

const TIME_SLOTS = ["9:00 AM", "1:00 PM", "4:00 PM"];

const PaymentModal = ({ booking, onConfirm, onCancel }) => {
  // 1. Fetch dynamic services from your Convex database
  const servicesData = useQuery(api.services.getServices) || [];

  const [selectedServices, setSelectedServices] = useState([]);
  const [extraFee, setExtraFee] = useState("");

  const toggleService = (service) => {
    setSelectedServices(prev =>
      prev.find(s => s._id === service._id)
        ? prev.filter(s => s._id !== service._id)
        : [...prev, service]
    );
  };

  const total = useMemo(() => {
    const serviceTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
    return serviceTotal + (Number(extraFee) || 0);
  }, [selectedServices, extraFee]);

  return (
    <div className="modal-overlay">
      <div className="detail-card payment-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="detail-name">Checkout: {booking.name}</h2>
        <p className="payment-subtitle">Select services provided:</p>

        {/* 2. Scrollable Services Grid using database data */}
        <div className="services-grid" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {servicesData.length > 0 ? (
            servicesData.map(s => (
              <div
                key={s._id}
                className={`service-item ${selectedServices.find(sel => sel._id === s._id) ? 'selected' : ''}`}
                onClick={() => toggleService(s)}
              >
                <div className="service-item-info">
                  {s.imageUrl && <img src={s.imageUrl} alt="" className="mini-thumb" style={{ width: '10px', height: '10px', marginRight: '5px' }} />}
                  <span>{s.name}</span>
                </div>
                <span>₱{s.price.toLocaleString()}</span>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: '#888' }}>No services found in menu.</p>
          )}
        </div>

        <div className="fee-input-section">
          <label>Additional Fee (₱)</label>
          <input
            type="number"
            value={extraFee}
            onChange={(e) => setExtraFee(e.target.value)}
            placeholder="e.g. for nail art or stones"
          />
        </div>

        <div className="payment-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>₱{(total - (Number(extraFee) || 0)).toLocaleString()}</span>
          </div>
          <div className="summary-row total-row">
            <span>Total Amount:</span>
            <span style={{ color: '#6366f1' }}>₱{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="detail-actions">
          <button className="btn-cancel-res" onClick={onCancel}>Back</button>
          <button
            className="btn-done-res"
            onClick={() => onConfirm({
              // FIXED: Sending objects with name AND price instead of just names
              services: selectedServices.map(s => ({
                name: s.name,
                price: s.price
              })),
              additionalFee: Number(extraFee) || 0,
              totalFee: total
            })}
            disabled={selectedServices.length === 0}
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
};

const ReceiptModal = ({ transaction, onPrint, onClose }) => (
  <div className="modal-overlay">
    <div className="detail-card receipt-modal-card" onClick={(e) => e.stopPropagation()}>
      <div className="success-icon-container">
        <div className="success-icon">✓</div>
      </div>
      <h2 className="detail-name">Payment Successful</h2>

      <div className="receipt-display-grid">
        <div className="r-display-item">
          <span>Transaction ID</span>
          <p>{transaction.id ? transaction.id.toString().slice(-8).toUpperCase() : transaction._id?.toString().slice(-8).toUpperCase()}</p>
        </div>
        <div className="r-display-item">
          <span>Client Name</span>
          <p>{transaction.name}</p>
        </div>
        <div className="r-display-item">
          <span>Phone Number</span>
          <p>{transaction.phone}</p>
        </div>
        <div className="r-display-item full-width">
          <span>Services Provided</span>
          {/* Logic added to handle both string and object formats safely */}
          <p>
            {transaction.services?.map(s => (typeof s === 'object' ? s.name : s)).join(", ")}
          </p>
        </div>
        <div className="r-display-item total-highlight">
          <span>Total Paid</span>
          <p>₱{transaction.totalFee.toLocaleString()}</p>
        </div>
      </div>

      <div className="detail-actions">
        <button className="btn-cancel-res" onClick={onClose}>Close</button>
        <button className="btn-done-res" onClick={onPrint}>Print Receipt</button>
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
const BookingModal = ({ date, onClose }) => {
  const [viewingBooking, setViewingBooking] = useState(null);
  const [isCheckout, setIsCheckout] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false); // For image zoom

  const allBookings = useQuery(api.bookings.getAllBookings) || [];
  const updateStatus = useMutation(api.admin.updateBookingStatus);
  const manualOccupy = useMutation(api.admin.manualOccupy);
  const deleteBooking = useMutation(api.admin.deleteBooking);
  const createTransaction = useMutation(api.admin.createTransaction);

  const completedTransaction = useQuery(api.admin.getTransactionByBookingId,
    viewingBooking?.status === 'completed' ? { bookingId: viewingBooking._id } : "skip"
  );

  const dayBookings = useMemo(() =>
    allBookings.filter(b => b.date === date),
    [allBookings, date]
  );

  const handleFinalCheckout = async (paymentData) => {
    try {
      const completedDate = format(new Date(), 'yyyy-MM-dd');

      const transactionId = await createTransaction({
        bookingId: viewingBooking._id,
        name: viewingBooking.name,
        phone: viewingBooking.phone || "N/A",
        services: paymentData.services,
        additionalFee: paymentData.additionalFee,
        totalFee: paymentData.totalFee,
        date: completedDate,
      });

      setTransactionResult({
        _id: transactionId,
        ...paymentData,
        name: viewingBooking.name,
        phone: viewingBooking.phone || "N/A"
      });

      setIsCheckout(false);
      await updateStatus({ id: viewingBooking._id, status: 'completed' });

    } catch (err) {
      console.error("TRANSACTION ERROR:", err);
      alert("Error saving transaction.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const DetailView = () => {
    const isManualBlock = viewingBooking.name === "Occupied";
    const imageUrl = useQuery(api.bookings.getImageUrl, {
      storageId: viewingBooking.imageStorageId
    });

    return (
      <div className="modal-overlay" onClick={() => setViewingBooking(null)}>

        {isExpanded && imageUrl && (
          <div className="image-expand-overlay" onClick={() => setIsExpanded(false)}>
            <img src={imageUrl} alt="Zoomed" className="expanded-photo" />
          </div>
        )}

        <div className="detail-card no-scroll" onClick={(e) => e.stopPropagation()}>

          {!isManualBlock && viewingBooking.imageStorageId && (
            <div className="detail-image-section clickable" onClick={() => setIsExpanded(true)}>
              {imageUrl ? (
                <img src={imageUrl} alt="Reference" className="booking-reference-photo" />
              ) : (
                <div className="image-placeholder">Loading Reference...</div>
              )}
            </div>
          )}

          <h2 className="detail-name">{isManualBlock ? "Slot Blocked" : viewingBooking.name}</h2>

          <div className="detail-info-grid">
            <InfoItem label="Facebook" value={viewingBooking.facebookName} />
            <InfoItem label="Phone" value={viewingBooking.phone} />
            <InfoItem label="Email" value={viewingBooking.email} />

            <div className="info-item">
              <span>Status</span>
              <p className={`status-badge ${viewingBooking.status || 'pending'}`}>
                {viewingBooking.status || 'Pending'}
              </p>
            </div>

            <div className="info-item full-width">
              <span>Slot</span>
              <p>{viewingBooking.slot} on {viewingBooking.date}</p>
            </div>
          </div>

          <div className="detail-actions">
            <button className="btn-cancel-res" onClick={async () => {
              if (window.confirm("Action cannot be undone. Proceed?")) {
                if (isManualBlock) await deleteBooking({ id: viewingBooking._id });
                else await updateStatus({ id: viewingBooking._id, status: 'canceled' });
                setViewingBooking(null);
                onClose();
              }
            }}>
              {isManualBlock ? "Delete Block" : "Cancel Reservation"}
            </button>

            {!isManualBlock && viewingBooking.status === 'completed' && (
              <button className="btn-done-res" onClick={() => setTransactionResult(completedTransaction)}>
                Print Receipt
              </button>
            )}

            {!isManualBlock && viewingBooking.status !== 'completed' && viewingBooking.status !== 'canceled' && (
              <button className="btn-done-res" onClick={() => setIsCheckout(true)}>
                Done Reservation
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ListView = () => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="slot-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-date-title">{format(new Date(date.replace(/-/g, '/')), 'MMMM, d')}</h2>
        <div className="slot-container">
          {TIME_SLOTS.map(slot => {
            const booking = dayBookings.find(b =>
              b.slot === slot &&
              b.status !== 'canceled'
            );
            return (
              <div key={slot} className="slot-row">
                <span className="slot-time">{slot}</span>
                <span className={booking ? (booking.status === 'completed' ? 'vacant-text' : 'booked-text') : 'vacant-text'}>
                  {booking ? (booking.name === "Occupied" ? "Occupied" : booking.name) : 'Vacant'}
                  {booking?.status === 'completed' && " (Done)"}
                </span>
                {booking ? (
                  <button className="view-slot-btn" onClick={() => setViewingBooking(booking)}>View</button>
                ) : (
                  <button className="view-slot-btn block-btn" onClick={() => {
                    if (window.confirm("Manually block this slot?")) manualOccupy({ date, slot, name: "Occupied" });
                  }}>Block</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (transactionResult) {
    return (
      <>
        <ReceiptModal transaction={transactionResult} onPrint={handlePrint} onClose={() => { setTransactionResult(null); onClose(); }} />
        <PrintReceipt transaction={transactionResult} />
      </>
    );
  }

  if (isCheckout) return <PaymentModal booking={viewingBooking} onCancel={() => setIsCheckout(false)} onConfirm={handleFinalCheckout} />;

  return viewingBooking ? <DetailView /> : <ListView />;
};

const InfoItem = ({ label, value }) => (
  <div className="info-item">
    <span>{label}</span>
    <p>{value || 'N/A'}</p>
  </div>
);

export default BookingModal;