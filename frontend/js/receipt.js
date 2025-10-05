// PDF receipt generation using jsPDF
function generateReceiptPDF(transaction) {
    // Use the global jsPDF object from CDN
    const { jsPDF } = window.jspdf;
    
    // Create new PDF document
    const doc = new jsPDF();
    const date = new Date(transaction.timestamp);
    const total = transaction.amount * transaction.quantity;
    
    // Set initial y position
    let yPos = 20;
    
    // Company Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MobilePOS Lite', 105, yPos, { align: 'center' });
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('123 Business Street', 105, yPos, { align: 'center' });
    
    yPos += 5;
    doc.text('City, State 12345', 105, yPos, { align: 'center' });
    
    yPos += 5;
    doc.text('Tel: (555) 123-4567', 105, yPos, { align: 'center' });
    
    yPos += 10;
    
    // Receipt Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SALES RECEIPT', 105, yPos, { align: 'center' });
    
    yPos += 15;
    
    // Transaction Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Date:', 20, yPos);
    doc.text(date.toLocaleDateString(), 60, yPos);
    
    yPos += 6;
    doc.text('Time:', 20, yPos);
    doc.text(date.toLocaleTimeString(), 60, yPos);
    
    yPos += 6;
    doc.text('Receipt #:', 20, yPos);
    doc.text(transaction.local_id.substring(0, 8), 60, yPos);
    
    yPos += 15;
    
    // Line separator
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Product Header
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 20, yPos);
    doc.text('Amount', 180, yPos, { align: 'right' });
    
    yPos += 8;
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Product Details
    doc.setFont('helvetica', 'normal');
    
    // Product name and quantity
    doc.text(transaction.product_name, 20, yPos);
    doc.text(`Qty: ${transaction.quantity}`, 120, yPos);
    
    yPos += 6;
    
    // Unit price and total
    doc.text(`Unit Price: $${transaction.amount.toFixed(2)}`, 20, yPos);
    doc.text(`$${total.toFixed(2)}`, 180, yPos, { align: 'right' });
    
    yPos += 15;
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 20, yPos);
    doc.text(`$${total.toFixed(2)}`, 180, yPos, { align: 'right' });
    
    yPos += 10;
    doc.line(20, yPos, 190, yPos);
    yPos += 15;
    
    // Payment Method
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Method:', 20, yPos);
    doc.text(transaction.payment_type.toUpperCase(), 60, yPos);
    
    yPos += 20;
    
    // Footer
    doc.setFontSize(8);
    doc.text('Thank you for your business!', 105, yPos, { align: 'center' });
    
    yPos += 5;
    doc.text('*** RECEIPT ***', 105, yPos, { align: 'center' });
    
    yPos += 10;
    doc.text('This is a computer-generated receipt', 105, yPos, { align: 'center' });
    yPos += 4;
    doc.text('No signature required', 105, yPos, { align: 'center' });
    
    // Save the PDF
    const fileName = `receipt-${transaction.local_id.substring(0, 8)}-${date.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

// Export for global use
window.generateReceiptPDF = generateReceiptPDF;