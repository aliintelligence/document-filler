const { PDFDocument, StandardFonts, rgb, PDFCheckBox, PDFTextField } = require('pdf-lib');
const fs = require('fs');

async function createMembershipPlanPDF() {
  console.log('Creating membership plan PDF with form fields...');

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Standard letter size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Get the form
  const form = pdfDoc.getForm();

  // Title
  page.drawText('Miami Water & Air - Membership Plan Agreement', {
    x: 50,
    y: 720,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Customer Information Section
  page.drawText('Customer Information:', {
    x: 50,
    y: 680,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Create text fields for customer info
  const customerNameField = form.createTextField('CustomerName');
  customerNameField.setText('');
  customerNameField.addToPage(page, { x: 150, y: 650, width: 200, height: 20 });
  page.drawText('Name:', { x: 50, y: 655, size: 12, font });

  const customerAddressField = form.createTextField('CustomerAddress');
  customerAddressField.setText('');
  customerAddressField.addToPage(page, { x: 150, y: 620, width: 300, height: 20 });
  page.drawText('Address:', { x: 50, y: 625, size: 12, font });

  const customerCityField = form.createTextField('CustomerCity');
  customerCityField.setText('');
  customerCityField.addToPage(page, { x: 150, y: 590, width: 150, height: 20 });
  page.drawText('City:', { x: 50, y: 595, size: 12, font });

  const customerStateField = form.createTextField('CustomerState');
  customerStateField.setText('');
  customerStateField.addToPage(page, { x: 350, y: 590, width: 50, height: 20 });
  page.drawText('State:', { x: 310, y: 595, size: 12, font });

  const customerZipField = form.createTextField('CustomerZip');
  customerZipField.setText('');
  customerZipField.addToPage(page, { x: 450, y: 590, width: 80, height: 20 });
  page.drawText('Zip:', { x: 410, y: 595, size: 12, font });

  const customerPhoneField = form.createTextField('CustomerPhone');
  customerPhoneField.setText('');
  customerPhoneField.addToPage(page, { x: 150, y: 560, width: 150, height: 20 });
  page.drawText('Phone:', { x: 50, y: 565, size: 12, font });

  const customerEmailField = form.createTextField('CustomerEmail');
  customerEmailField.setText('');
  customerEmailField.addToPage(page, { x: 150, y: 530, width: 250, height: 20 });
  page.drawText('Email:', { x: 50, y: 535, size: 12, font });

  // Membership Type Section
  page.drawText('Membership Type (Select One):', {
    x: 50,
    y: 490,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Create checkboxes for membership types
  const platinumCheckbox = form.createCheckBox('PlatinumMembership');
  platinumCheckbox.addToPage(page, { x: 50, y: 460, width: 15, height: 15 });
  page.drawText('Platinum Membership (3 Years) - Premium Coverage', {
    x: 70, y: 463, size: 12, font
  });

  const goldCheckbox = form.createCheckBox('GoldMembership');
  goldCheckbox.addToPage(page, { x: 50, y: 435, width: 15, height: 15 });
  page.drawText('Gold Membership (2 Years) - Enhanced Coverage', {
    x: 70, y: 438, size: 12, font
  });

  const silverCheckbox = form.createCheckBox('SilverMembership');
  silverCheckbox.addToPage(page, { x: 50, y: 410, width: 15, height: 15 });
  page.drawText('Silver Membership (1 Year) - Standard Coverage', {
    x: 70, y: 413, size: 12, font
  });

  // Equipment and Service Details
  page.drawText('Equipment/Service Details:', {
    x: 50,
    y: 370,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  const equipmentField = form.createTextField('Equipment');
  equipmentField.setText('');
  equipmentField.addToPage(page, { x: 50, y: 320, width: 500, height: 40 });
  // Note: Equipment field is a larger field for multiple lines

  // Installation and Membership Dates
  page.drawText('Important Dates:', {
    x: 50,
    y: 290,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  const installDateField = form.createTextField('InstallationDate');
  installDateField.setText('');
  installDateField.addToPage(page, { x: 180, y: 260, width: 100, height: 20 });
  page.drawText('Installation Date:', { x: 50, y: 265, size: 12, font });

  const startDateField = form.createTextField('MembershipStartDate');
  startDateField.setText('');
  startDateField.addToPage(page, { x: 180, y: 230, width: 100, height: 20 });
  page.drawText('Membership Start:', { x: 50, y: 235, size: 12, font });

  const endDateField = form.createTextField('MembershipEndDate');
  endDateField.setText('');
  endDateField.addToPage(page, { x: 180, y: 200, width: 100, height: 20 });
  page.drawText('Membership End:', { x: 50, y: 205, size: 12, font });

  // Finance Information
  page.drawText('Finance Information:', {
    x: 50,
    y: 160,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  const totalPriceField = form.createTextField('TotalPrice');
  totalPriceField.setText('');
  totalPriceField.addToPage(page, { x: 180, y: 130, width: 100, height: 20 });
  page.drawText('Total Price:', { x: 50, y: 135, size: 12, font });

  const monthlyPaymentField = form.createTextField('MonthlyPayment');
  monthlyPaymentField.setText('');
  monthlyPaymentField.addToPage(page, { x: 180, y: 100, width: 100, height: 20 });
  page.drawText('Monthly Payment:', { x: 50, y: 105, size: 12, font });

  // Signature Section
  page.drawText('Authorization:', {
    x: 50,
    y: 60,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  const signatureField = form.createTextField('CustomerSignature');
  signatureField.setText('');
  signatureField.addToPage(page, { x: 50, y: 25, width: 200, height: 25 });
  page.drawText('Customer Signature', { x: 50, y: 10, size: 10, font });

  const dateField = form.createTextField('SignatureDate');
  dateField.setText('');
  dateField.addToPage(page, { x: 350, y: 25, width: 100, height: 25 });
  page.drawText('Date', { x: 350, y: 10, size: 10, font });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('/home/matt/document-filler/public/pdfs/membership-plan-test.pdf', pdfBytes);
  console.log('✅ Created membership-plan-test.pdf with form fields');

  // Also backup the original
  fs.renameSync(
    '/home/matt/document-filler/public/pdfs/membership-plan.pdf',
    '/home/matt/document-filler/public/pdfs/membership-plan-original.pdf'
  );
  console.log('✅ Backed up original to membership-plan-original.pdf');

  // Use the new test PDF as the main one
  fs.writeFileSync('/home/matt/document-filler/public/pdfs/membership-plan.pdf', pdfBytes);
  console.log('✅ Replaced membership-plan.pdf with working version');
}

createMembershipPlanPDF().catch(console.error);