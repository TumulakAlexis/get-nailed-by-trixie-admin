import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format } from 'date-fns';
import './bookingmodal.css';
import PrintReceipt from './printreceipt';

const TIME_SLOTS = ["9:00 AM", "1:00 PM", "4:00 PM"];

const PaymentModal = ({ booking, onConfirm, onCancel }) => {
  const servicesData = useQuery(api.services.getServices) || [];

  const [selectedServices, setSelectedServices] = useState(() => {
    if (!booking?.services || !Array.isArray(booking.services)) return [];
    return servicesData.filter(dbService => 
      booking.services.some(bServ => (typeof bServ === 'object' ? bServ.name : bServ) === dbService.name)
    );
  });

  const [extraFee, setExtraFee] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState("peso"); // 'peso' or 'percent'

  useEffect(() => {
    if (servicesData.length > 0 && booking?.services && selectedServices.length === 0) {
      const matched = servicesData.filter(dbService => 
        booking.services.some(bServ => (typeof bServ === 'object' ? bServ.name : bServ) === dbService.name)
      );
      if (matched.length > 0) {
        setSelectedServices(matched);
      }
    }
  }, [servicesData, booking]);

  const toggleService = (service) => {
    setSelectedServices(prev =>
      prev.find(s => s._id === service._id)
        ? prev.filter(s => s._id !== service._id)
        : [...prev, service]
    );
  };

  const { subtotal, discountAmount, total } = useMemo(() => {
    const serviceTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const sub = serviceTotal + (Number(extraFee) || 0);
    
    let discAmt = 0;
    const dVal = Number(discountValue) || 0;
    if (dVal > 0) {
      if (discountType === 'percent') {
        discAmt = sub * (dVal / 100);
      } else {
        discAmt = dVal;
      }
    }
    const finalTotal = Math.max(0, sub - discAmt);
    return { subtotal: sub, discountAmount: discAmt, total: finalTotal };
  }, [selectedServices, extraFee, discountValue, discountType]);

  return (
    <div className="modal-overlay">
      <div className="detail-card payment-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="detail-name">Checkout: {booking.name}</h2>
        <p className="payment-subtitle">Review or adjust services provided:</p>

        <div className="services-grid" style={{ maxHeight: '240px', overflowY: 'auto' }}>
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

        <div className="fee-input-section">
          <div className="discount-header-row">
            <label>Discount</label>
            <div className="discount-type-toggle">
              <button 
                type="button" 
                className={`disc-toggle-btn ${discountType === 'peso' ? 'active' : ''}`}
                onClick={() => setDiscountType('peso')}
              >₱</button>
              <button 
                type="button" 
                className={`disc-toggle-btn ${discountType === 'percent' ? 'active' : ''}`}
                onClick={() => setDiscountType('percent')}
              >%</button>
            </div>
          </div>
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            placeholder={discountType === 'peso' ? "e.g. 100 off" : "e.g. 10% off"}
          />
        </div>

        <div className="payment-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>₱{subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="summary-row" style={{ color: '#ffb3b3' }}>
              <span>Discount ({discountType === 'percent' ? `${discountValue}%` : 'Peso'}):</span>
              <span>-₱{discountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="summary-row total-row">
            <span>Total Amount:</span>
            <span style={{ color: '#8BA08E' }}>₱{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="detail-actions">
          <button className="btn-cancel-res" onClick={onCancel}>Back</button>
          <button
            className="btn-done-res"
            onClick={() => onConfirm({
              services: selectedServices.map(s => ({
                name: s.name,
                price: s.price
              })),
              additionalFee: Number(extraFee) || 0,
              discount: {
                type: discountType,
                value: Number(discountValue) || 0,
                amount: discountAmount
              },
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
          <p>
            {transaction.services?.map(s => (typeof s === 'object' ? s.name : s)).join(", ")}
          </p>
        </div>
        {transaction.discount?.amount > 0 && (
          <div className="r-display-item">
            <span>Discount Applied</span>
            <p>{transaction.discount.type === 'percent' ? `${transaction.discount.value}%` : `₱${transaction.discount.value}`} (-₱{transaction.discount.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })})</p>
          </div>
        )}
        <div className="r-display-item total-highlight">
          <span>Total Paid</span>
          <p>₱{transaction.totalFee?.toLocaleString() || 0}</p>
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
  const [isExpanded, setIsExpanded] = useState(false);

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
        discount: paymentData.discount,
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

            <div className="info-item full-width">
              <span>Client's Selected Services</span>
              <div className="client-services-tags">
                {Array.isArray(viewingBooking.services) && viewingBooking.services.length > 0
                  ? viewingBooking.services.map((s, index) => {
                      const serviceName = typeof s === 'object' ? s.name : s;
                      return (
                        <span key={index} className="service-tag">
                          {serviceName}
                        </span>
                      );
                    })
                  : <p style={{ margin: 0, fontWeight: 600, color: '#2D3A3A' }}>None specified</p>}
              </div>
            </div>

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