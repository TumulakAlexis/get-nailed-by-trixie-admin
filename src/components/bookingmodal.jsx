import React, { useState, useMemo } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format } from 'date-fns';
import './BookingModal.css';
// Ensure you create this component in a separate file
import PrintReceipt from './PrintReceipt'; 

const TIME_SLOTS = ["9:00 AM", "1:00 PM", "4:00 PM"];

const PaymentModal = ({ booking, onConfirm, onCancel }) => {
  const SERVICE_LIST = [
    { id: 'soft-gel', name: 'Soft Gel Extension', price: 799 },
    { id: 'gel-polish', name: 'Gel Polish', price: 399 },
    { id: 'removal', name: 'Removal', price: 199 },
  ];

  const [selectedServices, setSelectedServices] = useState([]);
  const [extraFee, setExtraFee] = useState("");

  const toggleService = (service) => {
    setSelectedServices(prev =>
      prev.find(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
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

        <div className="services-grid">
          {SERVICE_LIST.map(s => (
            <div
              key={s.id}
              className={`service-item ${selectedServices.find(sel => sel.id === s.id) ? 'selected' : ''}`}
              onClick={() => toggleService(s)}
            >
              <span>{s.name}</span>
              <span>₱{s.price}</span>
            </div>
          ))}
        </div>

        <div className="fee-input-section">
          <label>Additional Fee (₱)</label>
          <input
            type="number"
            value={extraFee}
            onChange={(e) => setExtraFee(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="payment-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>₱{total - (Number(extraFee) || 0)}</span>
          </div>
          <div className="summary-row total-row">
            <span>Total Amount:</span>
            <span>₱{total}</span>
          </div>
        </div>

        <div className="detail-actions">
          <button className="btn-cancel-res" onClick={onCancel}>Back</button>
          <button
            className="btn-done-res"
            onClick={() => onConfirm({
              services: selectedServices.map(s => s.name),
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
          <p>{transaction.services.join(", ")}</p>
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

  // Added query to fetch transaction for completed view
  const completedTransaction = useQuery(api.admin.getTransactionByBookingId, 
    viewingBooking?.status === 'completed' ? { bookingId: viewingBooking._id } : "skip"
  );

  const dayBookings = useMemo(() =>
    allBookings.filter(b => b.date === date),
    [allBookings, date]
  );

  const handleFinalCheckout = async (paymentData) => {
    try {
      // 1. Manually create the date string
      const completedDate = format(new Date(), 'yyyy-MM-dd');
      
      // 2. LOG IT - Press F12 in your browser to see if this prints a date
      console.log("Saving Transaction with Date:", completedDate);

      const transactionId = await createTransaction({
        bookingId: viewingBooking._id,
        name: viewingBooking.name,
        phone: viewingBooking.phone || "N/A",
        services: paymentData.services,
        additionalFee: paymentData.additionalFee,
        totalFee: paymentData.totalFee,
        date: completedDate, // <--- ENSURE THIS LINE IS HERE
      });

      setTransactionResult({
        id: transactionId,
        ...paymentData,
        name: viewingBooking.name,
        phone: viewingBooking.phone || "N/A"
      });

      setIsCheckout(false);
      await updateStatus({ id: viewingBooking._id, status: 'completed' });

    } catch (err) {
      console.error("TRANSACTION ERROR:", err);
      alert("Error saving transaction. Check console (F12).");
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

            {/* Added Print button for completed status */}
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
        <ReceiptModal transaction={transactionResult} onPrint={handlePrint} onClose={() => {setTransactionResult(null); onClose();}} />
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