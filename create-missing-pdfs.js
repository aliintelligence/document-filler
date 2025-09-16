const fs = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function createMissingPDFs() {
  console.log('Creating missing PDF templates...');

  // Create Membership Package PDF
  const membershipDoc = await PDFDocument.create();
  const page1 = membershipDoc.addPage([612, 792]); // Standard letter size
  const font = await membershipDoc.embedFont(StandardFonts.Helvetica);

  page1.drawText('Membership Package Contract', {
    x: 50,
    y: 700,
    size: 20,
    font: font,
    color: rgb(0, 0, 0),
  });

  page1.drawText('Customer Name: __________________________________', {
    x: 50,
    y: 650,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page1.drawText('Customer Address: __________________________________', {
    x: 50,
    y: 620,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page1.drawText('Customer Signature: _________________________ Date: _____________', {
    x: 50,
    y: 550,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  const membershipPdfBytes = await membershipDoc.save();
  fs.writeFileSync('/home/matt/document-filler/public/pdfs/membership-package.pdf', membershipPdfBytes);
  console.log('✅ Created membership-package.pdf');

  // Create Credit Authorization PDF
  const creditDoc = await PDFDocument.create();
  const page2 = creditDoc.addPage([612, 792]);

  page2.drawText('Credit Authorization Form', {
    x: 50,
    y: 700,
    size: 20,
    font: font,
    color: rgb(0, 0, 0),
  });

  page2.drawText('Customer Name: __________________________________', {
    x: 50,
    y: 650,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page2.drawText('Credit Card Number: __________________________________', {
    x: 50,
    y: 620,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page2.drawText('Expiration Date: ____________ CVV: ____________', {
    x: 50,
    y: 590,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page2.drawText('Customer Signature: _________________________ Date: _____________', {
    x: 50,
    y: 520,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  const creditPdfBytes = await creditDoc.save();
  fs.writeFileSync('/home/matt/document-filler/public/pdfs/credit-authorization.pdf', creditPdfBytes);
  console.log('✅ Created credit-authorization.pdf');

  console.log('\n🎉 All missing PDF templates created successfully!');
}

createMissingPDFs().catch(console.error);