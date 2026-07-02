import React from 'react';
import { format } from 'date-fns';
import './printreceipt.css';

const PrintReceipt = ({ transaction }) => {
  if (!transaction) return null;

  return (
    <div className="print-only-receipt-wrapper">
      <div className="receipt-header">
        <h1>Get Nailed By Trixie</h1>
        <p>Barangay Magsaysay, Polomolok, South Cotabato</p>
        <p>Phone: 0912-345-6789</p>
      </div>

      <div className="receipt-divider">--------------------------------</div>

      <div className="receipt-body">
        <div className="r-line" style={{ fontWeight: 'bold' }}>
          <span>Ref ID:</span>
          <span>{transaction._id?.toString().slice(-8).toUpperCase() || 'N/A'}</span>
        </div>
        
        <div className="r-line">
          <span>Date:</span>
          <span>{format(new Date(), 'MM/dd/yyyy HH:mm')}</span>
        </div>
        
        <div className="r-line">
          <span>Client:</span>
          <span>{transaction.name}</span>
        </div>
      </div>

      <div className="receipt-divider">--------------------------------</div>

      <div className="receipt-services">
        <p className="section-title"><strong>ITEMS/SERVICES</strong></p>
        
        {/* Updated Mapping: Logic added to show price, structure untouched */}
        {transaction.services?.map((service, index) => (
          <div key={index} className="r-line service-row">
            {typeof service === 'object' ? (
              <>
                <span>{service.name}</span>
                <span>₱{service.price?.toLocaleString()}</span>
              </>
            ) : (
              <span>{service}</span>
            )}
          </div>
        ))}
        
        {/* Display Additional Fee if it exists */}
        {transaction.additionalFee > 0 && (
          <div className="r-line additional-line">
            <span>Add-ons / Fees:</span>
            <span>₱{transaction.additionalFee.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="receipt-divider">--------------------------------</div>

      <div className="receipt-footer">
        <div className="r-line total-line">
          <span>TOTAL:</span>
          <span>₱{transaction.totalFee?.toLocaleString()}</span>
        </div>
        <p className="thank-you">Thank you for your trust!</p>
        <p className="receipt-note">Follow us on Social Media</p>
      </div>
    </div>
  );
};

export default PrintReceipt;