import React from 'react';
import { format } from 'date-fns';
import './PrintReceipt.css';

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
        <div className="r-line">
          <span>Date:</span>
          <span>{format(new Date(), 'MM/dd/yyyy HH:mm')}</span>
        </div>
        <div className="r-line">
          <span>ID:</span>
          <span>{transaction.id?.toString().slice(-6).toUpperCase() || 'N/A'}</span>
        </div>
        <div className="r-line">
          <span>Client:</span>
          <span>{transaction.name}</span>
        </div>
      </div>

      <div className="receipt-divider">--------------------------------</div>

      <div className="receipt-services">
        <p><strong>Services:</strong></p>
        {transaction.services?.map((s, index) => (
          <div key={index} className="r-line service-item">
            <span>• {s}</span>
          </div>
        ))}
      </div>

      <div className="receipt-divider">--------------------------------</div>

      <div className="receipt-footer">
        <div className="r-line total-line">
          <span>TOTAL:</span>
          <span>₱{transaction.totalFee?.toLocaleString()}</span>
        </div>
        <p className="thank-you">Thank you for visiting!</p>
      </div>
    </div>
  );
};

export default PrintReceipt;