import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './printreceipt.css';

const PrintReceipt = ({ transaction }) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const receiptElement = document.getElementById('printable-receipt');
    if (!receiptElement) return;

    html2canvas(receiptElement, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a5');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Receipt-${transaction.name || 'Transaction'}.pdf`);
    });
  };

  const handleSaveAsImage = () => {
    const receiptElement = document.getElementById('printable-receipt');
    if (!receiptElement) return;

    html2canvas(receiptElement, { scale: 2 }).then((canvas) => {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Receipt-${transaction.name || 'Transaction'}.png`;
      link.click();
    });
  };

  return (
    <div className="print-receipt-wrapper">
      {/* ACTION TOOLBAR (Hidden when actually printing) */}
      <div className="receipt-action-toolbar">
        <button className="toolbar-btn print-btn" onClick={handlePrint}>
          🖨️ Print
        </button>
        <button className="toolbar-btn pdf-btn" onClick={handleDownloadPDF}>
          📥 Save PDF
        </button>
        <button className="toolbar-btn img-btn" onClick={handleSaveAsImage}>
          🖼️ Save Image (Messenger)
        </button>
      </div>

      {/* ACTUAL PRINTABLE RECEIPT CARD */}
      <div id="printable-receipt" className="receipt-card">
        <div className="receipt-header">
          <h2>GET NAILED</h2>
          <p>Official Transaction Receipt</p>
          <span className="receipt-date">{transaction.date || new Date().toLocaleDateString()}</span>
        </div>

        <div className="receipt-details">
          <div className="receipt-row">
            <span>Transaction ID:</span>
            <strong>{transaction._id?.toString().slice(-8).toUpperCase()}</strong>
          </div>
          <div className="receipt-row">
            <span>Client Name:</span>
            <strong>{transaction.name}</strong>
          </div>
          <div className="receipt-row">
            <span>Phone:</span>
            <strong>{transaction.phone}</strong>
          </div>
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-items-section">
          <h4>Services Rendered</h4>
          {transaction.services?.map((s, index) => (
            <div key={index} className="receipt-item-row">
              <span>{typeof s === 'object' ? s.name : s}</span>
              <span>₱{typeof s === 'object' ? s.price?.toLocaleString() : ''}</span>
            </div>
          ))}

          {transaction.additionalFee > 0 && (
            <div className="receipt-item-row extra-fee">
              <span>Additional Fee</span>
              <span>₱{transaction.additionalFee.toLocaleString()}</span>
            </div>
          )}

          {transaction.discount?.amount > 0 && (
            <div className="receipt-item-row discount-row">
              <span>Discount ({transaction.discount.type === 'percent' ? `${transaction.discount.value}%` : 'Flat Amount'}):</span>
              <span>-₱{transaction.discount.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-total-section">
          <div className="receipt-row total-row">
            <span>Total Amount Paid:</span>
            <span className="total-amount-val">₱{transaction.totalFee?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
          </div>
        </div>

        <div className="receipt-footer">
          <p>Thank you for choosing Get Nailed!</p>
          <p className="footer-sub">Please keep this receipt for your records.</p>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;