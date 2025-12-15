import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface InvoiceEmailProps {
  to: string;
  invoiceNumber: string;
  customerName: string;
  companyName?: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    weight?: number; 
  }>;
  invoiceDate: string | Date;
  shippingCost?: number;
  billToAddress?: string;
}

interface InvoiceReminderProps {
  to: string
  invoiceNumber: string
  customerName: string
  companyName?: string
  totalAmount: number
  dueDate: Date
  invoiceUrl?: string
  isFinalReminder?: boolean
  daysOverdue?: number
}

export async function sendInvoiceEmail(props: InvoiceEmailProps) {
  try {
    const { 
      to, 
      invoiceNumber, 
      customerName, 
      companyName,
      totalAmount, 
      items,
      invoiceDate,
      shippingCost = 0,
      billToAddress
    } = props
    
    const displayName = companyName ? `${customerName} (${companyName})` : customerName
    
    // Format currency values
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(amount)
    }

    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
    
    // Calculate total pounds
    const totalPounds = items.reduce((sum, item) => sum + (item.weight || item.quantity), 0)

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Invoice #${invoiceNumber} - GatorBudz</title>
        <style>
          /* RESET */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.5; 
            color: #333333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            width: 100% !important;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
          }
          
          img {
            max-width: 100%;
            height: auto;
            border: 0;
            line-height: 100%;
            outline: none;
            text-decoration: none;
          }
          
          a {
            text-decoration: none;
          }
          
          /* CONTAINER */
          .email-wrapper {
            width: 100%;
            margin: 0 auto;
            padding: 0;
            background-color: #f5f5f5;
          }
          
          .container {
            max-width: 600px;
            width: 100%;
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          
          /* HEADER */
          .header { 
            background: #1f2937;
            color: #ffffff; 
            padding: 25px 20px; 
            text-align: center; 
          }
          
          .logo-container {
            margin-bottom: 15px;
            text-align: center;
          }
          
          .logo {
            max-width: 180px;
            height: auto;
            display: inline-block;
          }
          
          /* CONTENT */
          .content { 
            padding: 30px; 
          }
          
          /* FOOTER */
          .footer { 
            background: #1f2937; 
            color: #ffffff; 
            padding: 25px 20px; 
            text-align: center; 
            font-size: 14px;
          }
          
          /* INVOICE HEADER */
          .invoice-header {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .company-info {
            flex: 1;
            min-width: 250px;
            margin-bottom: 20px;
          }
          
          .invoice-info {
            flex: 1;
            min-width: 200px;
            text-align: right;
          }
          
          .invoice-title {
            font-size: 28px;
            font-weight: 700;
            color: #1f2937;
            margin: 0 0 15px 0;
          }
          
          .company-address {
            color: #666666;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 8px;
          }
          
          .contact-info {
            color: #666666;
            font-size: 14px;
            line-height: 1.6;
          }
          
          /* BILL TO SECTION */
          .bill-to-section {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #1f2937;
          }
          
          .bill-to-title {
            margin: 0 0 15px 0;
            color: #1f2937;
            font-size: 18px;
            font-weight: 600;
          }
          
          /* ITEMS TABLE */
          .items-section {
            margin: 30px 0;
          }
          
          .section-title {
            color: #1f2937;
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 600;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
          }
          
          .items-table th {
            text-align: left;
            padding: 14px 12px;
            background: #1f2937;
            color: #ffffff;
            font-weight: 600;
            border: none;
          }
          
          .items-table td {
            padding: 14px 12px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }
          
          .items-table tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          .items-table tr:last-child td {
            border-bottom: 2px solid #1f2937;
          }
          
          /* TOTALS SECTION */
          .totals-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
          }
          
          .total-row {
            display: flex;
            justify-content: flex-end;
            margin: 10px 0;
            padding: 0 10px;
          }
          
          .total-label {
            width: 120px;
            text-align: right;
            padding-right: 20px;
            font-weight: 600;
            color: #4b5563;
          }
          
          .total-value {
            width: 120px;
            text-align: right;
            font-weight: 500;
            color: #1f2937;
          }
          
          .grand-total {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            border-top: 2px solid #1f2937;
            padding-top: 15px;
            margin-top: 15px;
          }
          
          .grand-total .total-label {
            color: #1f2937;
          }
          
          /* PAYMENT INFO */
          .payment-info {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
          }
          
          .payment-title {
            margin: 0 0 15px 0;
            color: #856404;
            font-size: 16px;
            font-weight: 600;
          }
          
          .payment-details {
            margin: 12px 0;
            line-height: 1.6;
            color: #856404;
          }
          
          /* THANKS SECTION */
          .thanks-section {
            text-align: center;
            padding: 25px 20px;
            background: #f8fafc;
            border-radius: 8px;
            margin: 30px 0;
          }
          
          .thanks-message {
            font-style: italic;
            color: #4b5563;
            line-height: 1.6;
            margin: 8px 0;
          }
          
          /* FOOTER STYLES */
          .footer-logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
            opacity: 0.9;
          }
          
          .footer-company {
            margin: 0 0 15px 0;
            font-weight: 600;
            font-size: 16px;
          }
          
          .footer-contact {
            margin-top: 10px;
            font-size: 13px;
            line-height: 1.5;
            opacity: 0.8;
          }
          
          .footer-line {
            margin: 5px 0;
          }
          
          /* MOBILE RESPONSIVE */
          @media screen and (max-width: 640px) {
            .container {
              max-width: 100% !important;
              width: 100% !important;
              box-shadow: none;
            }
            
            .content {
              padding: 20px 15px !important;
            }
            
            .header {
              padding: 20px 15px !important;
            }
            
            .footer {
              padding: 20px 15px !important;
            }
            
            .invoice-header {
              flex-direction: column;
              text-align: left !important;
            }
            
            .invoice-info {
              text-align: left !important;
              margin-top: 0 !important;
            }
            
            .invoice-title {
              font-size: 24px;
            }
            
            .company-info, 
            .invoice-info {
              min-width: 100%;
            }
            
            .items-table {
              font-size: 13px;
            }
            
            .items-table th,
            .items-table td {
              padding: 10px 8px !important;
            }
            
            .items-table th:nth-child(1),
            .items-table td:nth-child(1) {
              width: 40px;
              min-width: 40px;
            }
            
            .items-table th:nth-child(2),
            .items-table td:nth-child(2) {
              min-width: 120px;
            }
            
            .items-table th:nth-child(3),
            .items-table td:nth-child(3),
            .items-table th:nth-child(4),
            .items-table td:nth-child(4),
            .items-table th:nth-child(5),
            .items-table td:nth-child(5) {
              min-width: 80px;
            }
            
            .total-row {
              flex-direction: column;
              align-items: flex-end;
              text-align: right;
              padding: 0;
            }
            
            .total-label,
            .total-value {
              width: auto;
              display: block;
              text-align: right;
              padding: 2px 0;
            }
            
            .total-label {
              padding-right: 0;
              margin-bottom: 2px;
              font-size: 14px;
            }
            
            .grand-total .total-label,
            .grand-total .total-value {
              font-size: 16px;
            }
            
            .bill-to-section,
            .payment-info,
            .thanks-section {
              padding: 15px !important;
            }
            
            .section-title {
              font-size: 16px;
            }
            
            .payment-details {
              font-size: 14px;
              word-break: break-word;
            }
            
            .footer-contact {
              font-size: 12px;
            }
          }
          
          @media screen and (max-width: 480px) {
            .items-table {
              display: block;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }
            
            .items-table th,
            .items-table td {
              white-space: nowrap;
              min-width: 100px;
            }
            
            .company-address,
            .contact-info {
              font-size: 13px;
            }
            
            .thanks-message {
              font-size: 14px;
            }
            
            .footer {
              font-size: 13px;
            }
          }
          
          /* OUTLOOK FIXES */
          .ExternalClass {
            width: 100%;
          }
          
          .ExternalClass,
          .ExternalClass p,
          .ExternalClass span,
          .ExternalClass font,
          .ExternalClass td,
          .ExternalClass div {
            line-height: 100%;
          }
          
          /* GMAIL FIXES */
          u + .body .gmail {
            display: none;
          }
          
          /* DARK MODE SUPPORT */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1a1a1a !important;
              color: #ffffff !important;
            }
            
            .container {
              background-color: #2d2d2d !important;
              color: #ffffff !important;
            }
            
            .header,
            .footer {
              background-color: #000000 !important;
            }
            
            .bill-to-section,
            .thanks-section,
            .items-table tr:nth-child(even) {
              background-color: #3d3d3d !important;
            }
            
            .invoice-title,
            .section-title,
            .bill-to-title,
            .total-value,
            .grand-total {
              color: #ffffff !important;
            }
            
            .company-address,
            .contact-info,
            .thanks-message {
              color: #cccccc !important;
            }
            
            .items-table th {
              background-color: #000000 !important;
            }
            
            .items-table td {
              border-bottom-color: #4d4d4d !important;
              color: #ffffff !important;
            }
            
            .payment-info {
              background-color: #5d4c1a !important;
              border-color: #7a631b !important;
              color: #ffffff !important;
            }
            
            .payment-title,
            .payment-details {
              color: #ffffff !important;
            }
          }
        </style>
      </head>
      <body class="body" style="margin: 0; padding: 0; background-color: #f5f5f5; width: 100%;">
        <div class="email-wrapper" style="width: 100%; padding: 20px 0;">
          <div class="container">
            <!-- HEADER -->
            <div class="header">
              <div class="logo-container">
                <img src="https://test.gatorbudz.com/my-logo.png" alt="GatorBudz" class="logo" style="max-width: 180px; height: auto;">
              </div>
            </div>
            
            <!-- CONTENT -->
            <div class="content">
              <!-- INVOICE HEADER -->
              <div class="invoice-header">
                <div class="company-info">
                  <h1 class="invoice-title">INVOICE</h1>
                  <div class="company-address">
                    GATOR BUDZ<br>
                    2981 SE Dominica Terr Unit 5<br>
                    Stuart Florida 34997<br>
                    U.S.A.
                  </div>
                  <div class="contact-info">
                    7727081338<br>
                    admin@gatorbudz.com
                  </div>
                </div>
                
                <div class="invoice-info">
                  <div style="margin-bottom: 15px;">
                    <strong>Invoice #:</strong><br>
                    ${invoiceNumber}
                  </div>
                  <div>
                    <strong>Invoice Date:</strong><br>
                    ${new Date(invoiceDate).toLocaleDateString('en-US', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
              
              <!-- BILL TO -->
              <div class="bill-to-section">
                <h3 class="bill-to-title">Bill To</h3>
                <p style="margin: 0 0 8px 0; font-weight: 600;">${displayName}</p>
                ${billToAddress ? `<p style="margin: 0; color: #666666; line-height: 1.6;">${billToAddress.replace(/\n/g, '<br>')}</p>` : ''}
              </div>
              
              <!-- PRODUCTS -->
              <div class="items-section">
                <h3 class="section-title">Products</h3>
                <table class="items-table" cellpadding="0" cellspacing="0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map((item, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${item.name}</td>
                        <td>${item.quantity.toFixed(2)}</td>
                        <td>${formatCurrency(item.unitPrice)}</td>
                        <td>${formatCurrency(item.totalPrice)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              
              </div>
              
              <!-- TOTALS -->
              <div class="totals-section">
                <div class="total-row">
                  <span class="total-label">Sub Total:</span>
                  <span class="total-value">${formatCurrency(subtotal)}</span>
                </div>
                ${shippingCost > 0 ? `
                  <div class="total-row">
                    <span class="total-label">Shipping Cost:</span>
                    <span class="total-value">${formatCurrency(shippingCost)}</span>
                  </div>
                ` : ''}
                <div class="total-row grand-total">
                  <span class="total-label">Total:</span>
                  <span class="total-value">${formatCurrency(totalAmount)}</span>
                </div>
              </div>
              
              <!-- PAYMENT INFO -->
              <div class="payment-info">
                <h3 class="payment-title">PAYMENT INFORMATION</h3>
                <p class="payment-details" style="margin: 0 0 12px 0;">
                  <strong>PLEASE SEND PAYMENT VIA ZELLE TO:</strong><br>
                  support@smaugsvault.com
                </p>
                <p class="payment-details" style="margin: 0;">
                  <strong>ACH INSTRUCTIONS:</strong><br>
                  ACCOUNT - 485016575092<br>
                  ROUTING - 323070380
                </p>
                <p class="payment-details" style="margin: 0;">
                  <strong>WIRE INSTRUCTIONS:</strong><br>
                  ACCOUNT - 485016575092<br>
                  ROUTING - 02009593
                </p>
              </div>
              
              <!-- THANKS SECTION -->
              <div class="thanks-section">
                <p class="thanks-message" style="margin: 0 0 12px 0;">Thanks for your business.</p>
                <p class="thanks-message" style="margin: 0;">
                  Thank you for your valued business. We greatly value your trust and confidence and sincerely appreciate your loyalty to our business.
                </p>
              </div>
            </div>
            
            <!-- FOOTER -->
            <div class="footer">
              <div style="margin-bottom: 15px;">
                <img src="https://test.gatorbudz.com/my-logo.png" alt="GatorBudz" class="footer-logo" style="max-width: 120px; height: auto;">
              </div>
              <p class="footer-company" style="margin: 0 0 15px 0;">GATOR BUDZ</p>
              <div class="footer-contact">
                <p class="footer-line" style="margin: 5px 0;">2981 SE Dominica Terr Unit 5, Stuart Florida 34997, U.S.A.</p>
                <p class="footer-line" style="margin: 5px 0;">7727081338 | admin@gatorbudz.com</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: 'GatorBudz <no-reply@gatorbudz.com>',
      to,
      subject: `Invoice #${invoiceNumber} - GatorBudz`,
      html,
    });

    if (error) {
      throw error
    }

    console.log(`Invoice email sent to ${to}`, { emailId: data?.id })
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('Failed to send invoice email:', error)
    throw error
  }
}

export async function sendInvoiceReminder(props: InvoiceReminderProps) {
  try {
    const {
      to,
      invoiceNumber,
      customerName,
      companyName,
      totalAmount,
      dueDate,
      invoiceUrl = `${process.env.NEXTAUTH_URL}/dashboard/invoices-payment?id=${invoiceNumber}`,
      isFinalReminder = false,
      daysOverdue = 0
    } = props

    const displayName = companyName ? `${customerName} (${companyName})` : customerName
    const isOverdue = new Date() > dueDate
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(amount)
    }

    const subject = isFinalReminder 
      ? `FINAL REMINDER: Overdue Invoice #${invoiceNumber} - Action Required`
      : isOverdue
      ? `Reminder: Overdue Invoice #${invoiceNumber} - GatorBudz`
      : `Reminder: Upcoming Invoice #${invoiceNumber} - GatorBudz`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${subject}</title>
        <style>
          /* RESET */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.5; 
            color: #333333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            width: 100% !important;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
          }
          
          img {
            max-width: 100%;
            height: auto;
            border: 0;
            line-height: 100%;
            outline: none;
            text-decoration: none;
          }
          
          a {
            text-decoration: none;
          }
          
          /* CONTAINER */
          .email-wrapper {
            width: 100%;
            margin: 0 auto;
            padding: 0;
            background-color: #f5f5f5;
          }
          
          .container {
            max-width: 600px;
            width: 100%;
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          
          /* HEADER */
          .header { 
            background: ${isFinalReminder ? '#dc2626' : (isOverdue ? '#dc2626' : '#1f2937')};
            color: #ffffff; 
            padding: 25px 20px; 
            text-align: center; 
          }
          
          .logo-container {
            margin-bottom: 15px;
            text-align: center;
          }
          
          .logo {
            max-width: 180px;
            height: auto;
            display: inline-block;
          }
          
          /* CONTENT */
          .content { 
            padding: 30px; 
          }
          
          /* FOOTER */
          .footer { 
            background: #1f2937; 
            color: #ffffff; 
            padding: 25px 20px; 
            text-align: center; 
            font-size: 14px;
          }
          
          /* REMINDER HEADER */
          .reminder-header {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .company-info {
            flex: 1;
            min-width: 250px;
            margin-bottom: 20px;
          }
          
          .invoice-info {
            flex: 1;
            min-width: 200px;
            text-align: right;
          }
          
          .reminder-title {
            font-size: 28px;
            font-weight: 700;
            color: ${isFinalReminder ? '#dc2626' : (isOverdue ? '#dc2626' : '#1f2937')};
            margin: 0 0 15px 0;
          }
          
          .company-address {
            color: #666666;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 8px;
          }
          
          .contact-info {
            color: #666666;
            font-size: 14px;
            line-height: 1.6;
          }
          
          /* CUSTOMER SECTION */
          .customer-section {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid ${isFinalReminder ? '#dc2626' : (isOverdue ? '#dc2626' : '#1f2937')};
          }
          
          .customer-title {
            margin: 0 0 15px 0;
            color: #1f2937;
            font-size: 18px;
            font-weight: 600;
          }
          
          /* INVOICE DETAILS */
          .invoice-details {
            background: #f8fafc;
            padding: 20px;
            margin: 30px 0;
            border-radius: 8px;
            border-left: 4px solid ${isFinalReminder ? '#dc2626' : (isOverdue ? '#dc2626' : '#1f2937')};
          }
          
          .details-title {
            color: #1f2937;
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 600;
          }
          
          .detail-row {
            display: flex;
            margin: 12px 0;
            padding: 0 10px;
          }
          
          .detail-label {
            width: 120px;
            font-weight: 600;
            color: #4b5563;
          }
          
          .detail-value {
            flex: 1;
            font-weight: 500;
            color: #1f2937;
          }
          
          .due-date-value {
            color: ${isFinalReminder ? '#dc2626' : (isOverdue ? '#dc2626' : '#1f2937')};
            font-weight: 700;
          }
          
          /* PAYMENT INFO */
          .payment-info {
            background: ${isFinalReminder ? '#fef2f2' : '#fff3cd'};
            border: 1px solid ${isFinalReminder ? '#fecaca' : '#ffeaa7'};
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
          }
          
          .payment-title {
            margin: 0 0 15px 0;
            color: ${isFinalReminder ? '#991b1b' : '#856404'};
            font-size: 16px;
            font-weight: 600;
          }
          
          .payment-details {
            margin: 12px 0;
            line-height: 1.6;
            color: ${isFinalReminder ? '#991b1b' : '#856404'};
          }
          
          /* ACTION BUTTON */
          .action-section {
            text-align: center;
            margin: 30px 0;
          }
          
          .pay-button {
            background: ${isFinalReminder ? '#dc2626' : (isOverdue ? '#dc2626' : '#1f2937')};
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.2s;
          }
          
          .pay-button:hover {
            background: ${isFinalReminder ? '#b91c1c' : (isOverdue ? '#b91c1c' : '#374151')};
          }
          
          /* URGENT NOTICE */
          .urgent-notice {
            background: #fef2f2;
            border: 2px solid #dc2626;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
          }
          
          .urgent-title {
            color: #dc2626;
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 700;
          }
          
          .urgent-message {
            color: #991b1b;
            line-height: 1.6;
            margin: 0;
          }
          
          /* THANKS SECTION */
          .thanks-section {
            text-align: center;
            padding: 25px 20px;
            background: #f8fafc;
            border-radius: 8px;
            margin: 30px 0;
          }
          
          .thanks-message {
            font-style: italic;
            color: #4b5563;
            line-height: 1.6;
            margin: 8px 0;
          }
          
          /* FOOTER STYLES */
          .footer-logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
            opacity: 0.9;
          }
          
          .footer-company {
            margin: 0 0 15px 0;
            font-weight: 600;
            font-size: 16px;
          }
          
          .footer-contact {
            margin-top: 10px;
            font-size: 13px;
            line-height: 1.5;
            opacity: 0.8;
          }
          
          .footer-line {
            margin: 5px 0;
          }
          
          /* MOBILE RESPONSIVE */
          @media screen and (max-width: 640px) {
            .container {
              max-width: 100% !important;
              width: 100% !important;
              box-shadow: none;
            }
            
            .content {
              padding: 20px 15px !important;
            }
            
            .header {
              padding: 20px 15px !important;
            }
            
            .footer {
              padding: 20px 15px !important;
            }
            
            .reminder-header {
              flex-direction: column;
              text-align: left !important;
            }
            
            .invoice-info {
              text-align: left !important;
              margin-top: 0 !important;
            }
            
            .reminder-title {
              font-size: 24px;
            }
            
            .company-info, 
            .invoice-info {
              min-width: 100%;
            }
            
            .detail-row {
              flex-direction: column;
              padding: 0;
            }
            
            .detail-label,
            .detail-value {
              width: auto;
              display: block;
            }
            
            .detail-label {
              margin-bottom: 5px;
              font-size: 14px;
            }
            
            .pay-button {
              display: block;
              text-align: center;
              padding: 12px 20px;
            }
            
            .customer-section,
            .invoice-details,
            .payment-info,
            .urgent-notice,
            .thanks-section {
              padding: 15px !important;
            }
            
            .details-title {
              font-size: 16px;
            }
            
            .payment-details {
              font-size: 14px;
              word-break: break-word;
            }
            
            .footer-contact {
              font-size: 12px;
            }
          }
          
          @media screen and (max-width: 480px) {
            .company-address,
            .contact-info {
              font-size: 13px;
            }
            
            .thanks-message {
              font-size: 14px;
            }
            
            .footer {
              font-size: 13px;
            }
          }
          
          /* OUTLOOK FIXES */
          .ExternalClass {
            width: 100%;
          }
          
          .ExternalClass,
          .ExternalClass p,
          .ExternalClass span,
          .ExternalClass font,
          .ExternalClass td,
          .ExternalClass div {
            line-height: 100%;
          }
          
          /* GMAIL FIXES */
          u + .body .gmail {
            display: none;
          }
          
          /* DARK MODE SUPPORT */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1a1a1a !important;
              color: #ffffff !important;
            }
            
            .container {
              background-color: #2d2d2d !important;
              color: #ffffff !important;
            }
            
            .header {
              background-color: ${isFinalReminder ? '#7f1d1d' : (isOverdue ? '#7f1d1d' : '#000000')} !important;
            }
            
            .footer {
              background-color: #000000 !important;
            }
            
            .customer-section,
            .invoice-details,
            .thanks-section {
              background-color: #3d3d3d !important;
            }
            
            .reminder-title,
            .details-title,
            .customer-title,
            .detail-value {
              color: #ffffff !important;
            }
            
            .company-address,
            .contact-info,
            .thanks-message {
              color: #cccccc !important;
            }
            
            .payment-info {
              background-color: ${isFinalReminder ? '#5d1a1a' : '#5d4c1a'} !important;
              border-color: ${isFinalReminder ? '#7f1d1d' : '#7a631b'} !important;
              color: #ffffff !important;
            }
            
            .payment-title,
            .payment-details {
              color: #ffffff !important;
            }
            
            .urgent-notice {
              background-color: #5d1a1a !important;
              border-color: #7f1d1d !important;
              color: #ffffff !important;
            }
            
            .urgent-title,
            .urgent-message {
              color: #ffffff !important;
            }
          }
        </style>
      </head>
      <body class="body" style="margin: 0; padding: 0; background-color: #f5f5f5; width: 100%;">
        <div class="email-wrapper" style="width: 100%; padding: 20px 0;">
          <div class="container">
            <!-- HEADER -->
            <div class="header">
              <div class="logo-container">
                <img src="https://test.gatorbudz.com/my-logo.png" alt="GatorBudz" class="logo" style="max-width: 180px; height: auto;">
              </div>
            </div>
            
            <!-- CONTENT -->
            <div class="content">
              <!-- REMINDER HEADER -->
              <div class="reminder-header">
                <div class="company-info">
                  <h1 class="reminder-title">
                    ${isFinalReminder ? 'FINAL REMINDER' : (isOverdue ? 'OVERDUE INVOICE' : 'INVOICE REMINDER')}
                  </h1>
                  <div class="company-address">
                    GATOR BUDZ<br>
                    2981 SE Dominica Terr Unit 5<br>
                    Stuart Florida 34997<br>
                    U.S.A.
                  </div>
                  <div class="contact-info">
                    7727081338<br>
                    admin@gatorbudz.com
                  </div>
                </div>
                
                <div class="invoice-info">
                  <div style="margin-bottom: 15px;">
                    <strong>Invoice #:</strong><br>
                    ${invoiceNumber}
                  </div>
                  <div>
                    <strong>Reminder Date:</strong><br>
                    ${new Date().toLocaleDateString('en-US', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
              
              <!-- CUSTOMER SECTION -->
              <div class="customer-section">
                <h3 class="customer-title">Dear ${displayName}</h3>
                <p style="margin: 0; color: #666666; line-height: 1.6;">
                  ${isFinalReminder 
                    ? `This is a FINAL REMINDER that your invoice <strong>#${invoiceNumber}</strong> is <strong>${daysOverdue} days overdue</strong>. Immediate payment is required.`
                    : isOverdue
                    ? `This is a friendly reminder that your invoice <strong>#${invoiceNumber}</strong> is <strong>${daysOverdue} days overdue</strong>.`
                    : `This is a friendly reminder that your invoice <strong>#${invoiceNumber}</strong> is due on <strong>${dueDate.toLocaleDateString()}</strong>.`
                  }
                </p>
              </div>
              
              <!-- INVOICE DETAILS -->
              <div class="invoice-details">
                <h3 class="details-title">Invoice Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Invoice Number:</span>
                  <span class="detail-value">${invoiceNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Due Date:</span>
                  <span class="detail-value due-date-value">${dueDate.toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Amount Due:</span>
                  <span class="detail-value">${formatCurrency(totalAmount)}</span>
                </div>
                ${isOverdue ? `
                  <div class="detail-row">
                    <span class="detail-label">Days Overdue:</span>
                    <span class="detail-value">${daysOverdue}</span>
                  </div>
                ` : ''}
              </div>
              
              <!-- URGENT NOTICE (for final reminder) -->
              ${isFinalReminder ? `
                <div class="urgent-notice">
                  <h3 class="urgent-title">URGENT: FINAL NOTICE</h3>
                  <p class="urgent-message">
                    Your account is at risk of suspension. Please make payment immediately to avoid interruption of service.
                  </p>
                </div>
              ` : ''}
              
              <!-- PAYMENT INFO -->
              <div class="payment-info">
                <h3 class="payment-title">PAYMENT INFORMATION</h3>
                <p class="payment-details" style="margin: 0 0 12px 0;">
                  <strong>PLEASE SEND PAYMENT VIA ZELLE TO:</strong><br>
                  support@smaugsvault.com
                </p>
                <p class="payment-details" style="margin: 0;">
                  <strong>ACH INSTRUCTIONS:</strong><br>
                  ACCOUNT - 485016575092<br>
                  ROUTING - 323070380
                </p>
                <p class="payment-details" style="margin: 0;">
                  <strong>WIRE INSTRUCTIONS:</strong><br>
                  ACCOUNT - 485016575092<br>
                  ROUTING - 02009593
                </p>
              </div>
              
              <!-- ACTION BUTTON -->
              <div class="action-section">
                <a href="${invoiceUrl}" class="pay-button">
                  ${isFinalReminder ? 'PAY NOW - FINAL NOTICE' : (isOverdue ? 'PAY OVERDUE INVOICE' : 'PAY INVOICE NOW')}
                </a>
              </div>
              
              ${isFinalReminder ? `
                <div class="urgent-notice">
                  <p class="urgent-message" style="margin: 0;">
                    <strong>Important:</strong> Failure to pay within 48 hours may result in temporary suspension of your account and services.
                  </p>
                </div>
              ` : ''}
              
              <!-- THANKS SECTION -->
              <div class="thanks-section">
                <p class="thanks-message" style="margin: 0 0 12px 0;">Thank you for your prompt attention to this matter.</p>
                <p class="thanks-message" style="margin: 0;">
                  If you have already made this payment, please disregard this message.
                </p>
              </div>
            </div>
            
            <!-- FOOTER -->
            <div class="footer">
              <div style="margin-bottom: 15px;">
                <img src="https://test.gatorbudz.com/my-logo.png" alt="GatorBudz" class="footer-logo" style="max-width: 120px; height: auto;">
              </div>
              <p class="footer-company" style="margin: 0 0 15px 0;">GATOR BUDZ</p>
              <div class="footer-contact">
                <p class="footer-line" style="margin: 5px 0;">2981 SE Dominica Terr Unit 5, Stuart Florida 34997, U.S.A.</p>
                <p class="footer-line" style="margin: 5px 0;">(772) 708-1338 | admin@gatorbudz.com</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: 'GatorBudz <no-reply@gatorbudz.com>',
      to,
      subject,
      html,
    })

    if (error) {
      throw error
    }

    console.log(`Invoice reminder sent to ${to}`, { 
      emailId: data?.id, 
      isFinalReminder,
      daysOverdue 
    })
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('Failed to send invoice reminder:', error)
    throw error
  }
}


export async function sendOrderStatusEmail({
    to,
    customerName,
    orderId,
    oldStatus,
    newStatus,
    items,
    totalAmount
}: {
    to: string;
    customerName: string;
    orderId: string;
    oldStatus: string;
    newStatus: string;
    items: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    totalAmount: number;
}) {
    // Use your email service (Resend, Nodemailer, etc.)
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: [to],
        subject: `Order #${orderId} Status Updated to ${newStatus}`,
        html: `
            <h1>Order Status Updated</h1>
            <p>Dear ${customerName},</p>
            <p>The status of your order <strong>#${orderId}</strong> has been updated.</p>
            <p><strong>Previous Status:</strong> ${oldStatus}</p>
            <p><strong>New Status:</strong> ${newStatus}</p>
            
            <h2>Order Summary</h2>
            <ul>
                ${items.map(item => `
                    <li>
                        ${item.name} - ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${item.totalPrice.toFixed(2)}
                    </li>
                `).join('')}
            </ul>
            <p><strong>Total Amount: $${totalAmount.toFixed(2)}</strong></p>
            
            <p>Thank you for your business!</p>
        `,
    });

    if (error) {
        throw error;
    }

    return data;
}

// Email notification function
export async function sendNewUserAdminNotification(newUser: any) {
  try {
    const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.split(',') || []
    
    if (adminEmails.length === 0) {
      console.log("No admin emails configured for notification")
      return
    }

    // Use Resend for sending emails
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>New User Registration - GatorBudz</title>
        <style>
          /* RESET */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.5; 
            color: #333333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            width: 100% !important;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
          }
          
          img {
            max-width: 100%;
            height: auto;
            border: 0;
            line-height: 100%;
            outline: none;
            text-decoration: none;
          }
          
          /* CONTAINER */
          .email-wrapper {
            width: 100%;
            margin: 0 auto;
            padding: 20px 0;
            background-color: #f5f5f5;
          }
          
          .container {
            max-width: 600px;
            width: 100%;
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          
          /* HEADER */
          .header { 
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            color: #ffffff; 
            padding: 30px 20px; 
            text-align: center; 
          }
          
          .logo-container {
            margin-bottom: 15px;
            text-align: center;
          }
          
          .logo {
            max-width: 180px;
            height: auto;
            display: inline-block;
          }
          
          .header-title {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 10px 0;
            color: #ffffff;
          }
          
          .header-subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin: 0;
          }
          
          /* CONTENT */
          .content { 
            padding: 30px; 
          }
          
          /* USER INFO CARD */
          .user-info-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            border-left: 4px solid #1f2937;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .card-title {
            color: #1f2937;
            margin: 0 0 20px 0;
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .card-title:before {
            content: "👤";
            font-size: 24px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .info-item {
            margin-bottom: 10px;
          }
          
          .info-label {
            font-weight: 600;
            color: #4b5563;
            font-size: 14px;
            margin-bottom: 4px;
          }
          
          .info-value {
            color: #1f2937;
            font-weight: 500;
            font-size: 15px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            background-color: #10b981;
            color: white;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            margin-left: 10px;
          }
          
          /* ADDRESS SECTION */
          .address-section {
            margin: 25px 0;
          }
          
          .section-title {
            color: #1f2937;
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .address-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }
          
          .address-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0 0 15px 0;
            color: #374151;
            font-weight: 600;
          }
          
          .address-title:before {
            content: "📍";
            font-size: 20px;
          }
          
          .shipping-title:before {
            content: "📦";
          }
          
          .address-line {
            margin: 5px 0;
            color: #4b5563;
            line-height: 1.6;
          }
          
          /* ACTION BUTTON */
          .action-section {
            text-align: center;
            margin: 35px 0 25px 0;
          }
          
          .action-btn {
            display: inline-block;
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            color: #ffffff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px -1px rgba(0, 0, 0, 0.15);
          }
          
          /* FOOTER */
          .footer { 
            background: #1f2937; 
            color: #ffffff; 
            padding: 25px 20px; 
            text-align: center; 
            font-size: 14px;
          }
          
          .footer-logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
            opacity: 0.9;
          }
          
          .footer-company {
            margin: 0 0 15px 0;
            font-weight: 600;
            font-size: 16px;
          }
          
          .footer-contact {
            margin-top: 10px;
            font-size: 13px;
            line-height: 1.5;
            opacity: 0.8;
          }
          
          .footer-line {
            margin: 5px 0;
          }
          
          /* NOTIFICATION NOTE */
          .notification-note {
            text-align: center;
            padding: 20px;
            margin: 20px 0;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            color: #856404;
          }
          
          /* MOBILE RESPONSIVE */
          @media screen and (max-width: 640px) {
            .container {
              max-width: 100% !important;
              width: 100% !important;
              box-shadow: none;
            }
            
            .content {
              padding: 20px 15px !important;
            }
            
            .header {
              padding: 25px 15px !important;
            }
            
            .footer {
              padding: 20px 15px !important;
            }
            
            .header-title {
              font-size: 22px;
            }
            
            .user-info-card,
            .address-card {
              padding: 20px !important;
            }
            
            .info-grid {
              grid-template-columns: 1fr;
              gap: 10px;
            }
            
            .action-btn {
              padding: 12px 24px;
              font-size: 15px;
              display: block;
              margin: 0 auto;
            }
            
            .card-title,
            .section-title {
              font-size: 18px;
            }
            
            .footer-contact {
              font-size: 12px;
            }
          }
          
          @media screen and (max-width: 480px) {
            .user-info-card,
            .address-card {
              padding: 15px !important;
            }
            
            .card-title,
            .section-title {
              font-size: 16px;
            }
            
            .header-title {
              font-size: 20px;
            }
            
            .header-subtitle {
              font-size: 14px;
            }
            
            .footer {
              font-size: 13px;
            }
          }
          
          /* DARK MODE SUPPORT */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1a1a1a !important;
              color: #ffffff !important;
            }
            
            .container {
              background-color: #2d2d2d !important;
              color: #ffffff !important;
            }
            
            .header,
            .footer {
              background-color: #000000 !important;
            }
            
            .user-info-card {
              background: linear-gradient(135deg, #3d3d3d 0%, #4d4d4d 100%);
              border-left-color: #ffffff;
            }
            
            .address-card {
              background-color: #3d3d3d !important;
              border-color: #4d4d4d !important;
            }
            
            .card-title,
            .section-title,
            .info-value,
            .address-title {
              color: #ffffff !important;
            }
            
            .info-label,
            .address-line {
              color: #cccccc !important;
            }
            
            .notification-note {
              background-color: #5d4c1a !important;
              border-color: #7a631b !important;
              color: #ffffff !important;
            }
            
            .action-btn {
              background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            }
          }
          
          /* OUTLOOK FIXES */
          .ExternalClass {
            width: 100%;
          }
          
          .ExternalClass,
          .ExternalClass p,
          .ExternalClass span,
          .ExternalClass font,
          .ExternalClass td,
          .ExternalClass div {
            line-height: 100%;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <!-- HEADER -->
            <div class="header">
              <div class="logo-container">
                <img src="https://test.gatorbudz.com/my-logo.png" alt="GatorBudz" class="logo" style="max-width: 180px; height: auto;">
              </div>
              <h1 class="header-title">🚀 New User Registration</h1>
            </div>
            
            <!-- CONTENT -->
            <div class="content">
              <!-- USER INFO -->
              <div class="user-info-card">
                <h2 class="card-title">User Information</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Full Name</div>
                    <div class="info-value">${newUser.name}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email Address</div>
                    <div class="info-value">${newUser.email}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Company Name</div>
                    <div class="info-value">${newUser.company || 'Not provided'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Phone Number</div>
                    <div class="info-value">${newUser.phone || 'Not provided'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Registration Date</div>
                    <div class="info-value">${new Date(newUser.createdAt).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Account Status</div>
                    <div class="info-value">
                      ${newUser.accountStatus}
                      <span class="status-badge">NEW</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- ADDRESSES -->
              <div class="address-section">
                <h3 class="section-title">Contact Information</h3>
                
                <!-- Billing Address -->
                <div class="address-card">
                  <h4 class="address-title">Billing Address</h4>
                  <div class="address-line">${newUser.billingAddress1}</div>
                  ${newUser.billingAddress2 ? `<div class="address-line">${newUser.billingAddress2}</div>` : ''}
                  <div class="address-line">${newUser.billingCity}, ${newUser.billingState} ${newUser.billingPostalCode}</div>
                  <div class="address-line">${newUser.billingCountry}</div>
                </div>
                
                <!-- Shipping Address (if different) -->
                ${newUser.shippingAddress1 && 
                  (newUser.shippingAddress1 !== newUser.billingAddress1 ||
                   newUser.shippingCity !== newUser.billingCity) ? `
                  <div class="address-card">
                    <h4 class="address-title shipping-title">Shipping Address</h4>
                    <div class="address-line">${newUser.shippingAddress1}</div>
                    ${newUser.shippingAddress2 ? `<div class="address-line">${newUser.shippingAddress2}</div>` : ''}
                    <div class="address-line">${newUser.shippingCity}, ${newUser.shippingState} ${newUser.shippingPostalCode}</div>
                    <div class="address-line">${newUser.shippingCountry}</div>
                  </div>
                  ` : ''}
              </div>
              
              <!-- NOTIFICATION NOTE -->
              <div class="notification-note">
                <p><strong>Note:</strong> This user registration requires review and approval in the admin panel.</p>
              </div>
              
              <!-- ACTION BUTTON -->
              <div class="action-section">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin-dashboard/users/${newUser.id}" class="action-btn">
                  👁️ Review User in Admin Panel
                </a>
              </div>
            </div>
            
            <!-- FOOTER -->
            <div class="footer">
              <div style="margin-bottom: 15px;">
                <img src="https://test.gatorbudz.com/my-logo.png" alt="GatorBudz" class="footer-logo" style="max-width: 120px; height: auto;">
              </div>
              <p class="footer-company">GATOR BUDZ</p>
              <div class="footer-contact">
                <p class="footer-line">2981 SE Dominica Terr Unit 5, Stuart Florida 34997, U.S.A.</p>
                <p class="footer-line">(772) 708-1338 | admin@gatorbudz.com</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Send to all admin emails
    const sendPromises = adminEmails.map(async (adminEmail) => {
      try {
        const { data, error } = await resend.emails.send({
          from: 'GatorBudz Notifications <no-reply@gatorbudz.com>',
          to: adminEmail.trim(),
          subject: '🚀 New User Registration - GatorBudz',
          html: htmlContent,
        });

        if (error) {
          console.error(`Failed to send admin notification to ${adminEmail}:`, error);
          return { success: false, email: adminEmail, error };
        }

        console.log(`Admin notification email sent to ${adminEmail}`, { emailId: data?.id });
        return { success: true, email: adminEmail, emailId: data?.id };
      } catch (error) {
        console.error(`Error sending admin notification to ${adminEmail}:`, error);
        return { success: false, email: adminEmail, error };
      }
    });

    const results = await Promise.all(sendPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (failed.length > 0) {
      console.warn(`Failed to send admin notifications to ${failed.length} recipients:`, 
        failed.map(f => f.email));
    }

    return { 
      success: failed.length === 0, 
      total: results.length, 
      successful: successful.length, 
      failed: failed.length,
      details: results 
    };

  } catch (error) {
    console.error('Error in sendAdminNotification function:', error);
    throw error;
  }
}


export async function sendAccountUnderReviewEmail(user: { email: string; name: string }) {
  try {
    const { email, name } = user;
    
    const subject = `Your GatorBudz Account is Under Review`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Account Under Review - GatorBudz</title>
        <style>
          /* RESET */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.5; 
            color: #333333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            width: 100% !important;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
          }
          
          img {
            max-width: 100%;
            height: auto;
            border: 0;
            line-height: 100%;
            outline: none;
            text-decoration: none;
          }
          
          a {
            text-decoration: none;
          }
          
          /* CONTAINER */
          .email-wrapper {
            width: 100%;
            margin: 0 auto;
            padding: 0;
            background-color: #f5f5f5;
          }
          
          .container {
            max-width: 600px;
            width: 100%;
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          
          /* HEADER */
          .header { 
            background: #1f2937;
            color: #ffffff; 
            padding: 30px 20px; 
            text-align: center; 
          }
          
          .logo-container {
            margin-bottom: 15px;
            text-align: center;
          }
          
          .logo {
            max-width: 180px;
            height: auto;
            display: inline-block;
          }
          
          .review-title {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin: 15px 0 10px 0;
          }
          
          .review-subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin: 0;
          }
          
          /* CONTENT */
          .content { 
            padding: 30px; 
          }
          
          /* GREETING SECTION */
          .greeting-section {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .greeting-text {
            color: #4b5563;
            line-height: 1.6;
            margin: 0;
          }
          
          /* REVIEW INFO CARD */
          .review-info-card {
            background: #fffbeb;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid #f59e0b;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .card-title {
            color: #92400e;
            margin: 0 0 20px 0;
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .card-title:before {
            content: "⏳";
            font-size: 24px;
          }
          
          .process-list {
            margin: 0;
            padding-left: 20px;
          }
          
          .process-item {
            margin-bottom: 15px;
            color: #92400e;
            line-height: 1.6;
          }
          
          .process-item strong {
            color: #78350f;
          }
          
          /* TIMELINE SECTION */
          .timeline-section {
            margin: 30px 0;
          }
          
          .section-title {
            color: #1f2937;
            margin: 0 0 20px 0;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .section-title:before {
            content: "📋";
            font-size: 20px;
          }
          
          .timeline {
            position: relative;
            padding-left: 30px;
          }
          
          .timeline:before {
            content: "";
            position: absolute;
            left: 10px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #e5e7eb;
          }
          
          .timeline-item {
            position: relative;
            margin-bottom: 25px;
          }
          
          .timeline-item:last-child {
            margin-bottom: 0;
          }
          
          .timeline-icon {
            position: absolute;
            left: -30px;
            top: 0;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #f59e0b;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
          }
          
          .timeline-content {
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          
          .timeline-title {
            color: #1f2937;
            margin: 0 0 10px 0;
            font-size: 16px;
            font-weight: 600;
          }
          
          .timeline-description {
            color: #4b5563;
            margin: 0;
            line-height: 1.6;
          }
          
          /* NEXT STEPS */
          .next-steps-section {
            background: #f0f9ff;
            border: 1px solid #e0f2fe;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
          }
          
          .next-steps-title {
            color: #0369a1;
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .next-steps-title:before {
            content: "✅";
            font-size: 20px;
          }
          
          .next-steps-list {
            margin: 0;
            padding-left: 20px;
          }
          
          .next-steps-item {
            margin-bottom: 12px;
            color: #0369a1;
            line-height: 1.6;
          }
          
          /* SUPPORT SECTION */
          .support-section {
            text-align: center;
            padding: 25px 20px;
            background: #f8fafc;
            border-radius: 8px;
            margin: 30px 0;
          }
          
          .support-title {
            color: #1f2937;
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 600;
          }
          
          .contact-info {
            color: #4b5563;
            line-height: 1.6;
            margin: 8px 0;
          }
          
          .contact-link {
            color: #1f2937;
            font-weight: 600;
            text-decoration: underline;
          }
          
          /* FOOTER */
          .footer { 
            background: #1f2937; 
            color: #ffffff; 
            padding: 25px 20px; 
            text-align: center; 
            font-size: 14px;
          }
          
          .footer-logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
            opacity: 0.9;
          }
          
          .footer-company {
            margin: 0 0 15px 0;
            font-weight: 600;
            font-size: 16px;
          }
          
          .footer-contact {
            margin-top: 10px;
            font-size: 13px;
            line-height: 1.5;
            opacity: 0.8;
          }
          
          .footer-line {
            margin: 5px 0;
          }
          
          /* MOBILE RESPONSIVE */
          @media screen and (max-width: 640px) {
            .container {
              max-width: 100% !important;
              width: 100% !important;
              box-shadow: none;
            }
            
            .content {
              padding: 20px 15px !important;
            }
            
            .header {
              padding: 25px 15px !important;
            }
            
            .footer {
              padding: 20px 15px !important;
            }
            
            .review-title {
              font-size: 24px;
            }
            
            .review-info-card,
            .next-steps-section,
            .support-section {
              padding: 20px !important;
            }
            
            .timeline {
              padding-left: 25px;
            }
            
            .timeline:before {
              left: 8px;
            }
            
            .timeline-icon {
              left: -25px;
              width: 18px;
              height: 18px;
              font-size: 10px;
            }
            
            .timeline-content {
              padding: 12px;
            }
            
            .card-title,
            .section-title,
            .next-steps-title,
            .support-title {
              font-size: 18px;
            }
            
            .footer-contact {
              font-size: 12px;
            }
          }
          
          @media screen and (max-width: 480px) {
            .review-title {
              font-size: 22px;
            }
            
            .review-subtitle {
              font-size: 14px;
            }
            
            .review-info-card,
            .next-steps-section,
            .support-section {
              padding: 15px !important;
            }
            
            .card-title,
            .section-title,
            .next-steps-title,
            .support-title {
              font-size: 16px;
            }
            
            .footer {
              font-size: 13px;
            }
          }
          
          /* OUTLOOK FIXES */
          .ExternalClass {
            width: 100%;
          }
          
          .ExternalClass,
          .ExternalClass p,
          .ExternalClass span,
          .ExternalClass font,
          .ExternalClass td,
          .ExternalClass div {
            line-height: 100%;
          }
          
          /* GMAIL FIXES */
          u + .body .gmail {
            display: none;
          }
          
          /* DARK MODE SUPPORT */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1a1a1a !important;
              color: #ffffff !important;
            }
            
            .container {
              background-color: #2d2d2d !important;
              color: #ffffff !important;
            }
            
            .header {
              background-color: #78350f !important;
            }
            
            .footer {
              background-color: #000000 !important;
            }
            
            .greeting-text {
              color: #cccccc !important;
            }
            
            .review-info-card {
              background-color: #422006 !important;
              border-left-color: #f59e0b !important;
            }
            
            .card-title,
            .process-item,
            .process-item strong {
              color: #fef3c7 !important;
            }
            
            .section-title,
            .timeline-title,
            .support-title,
            .contact-link {
              color: #ffffff !important;
            }
            
            .timeline-content {
              background-color: #3d3d3d !important;
              border-color: #4d4d4d !important;
            }
            
            .timeline-description {
              color: #cccccc !important;
            }
            
            .next-steps-section {
              background-color: #0c4a6e !important;
              border-color: #0369a1 !important;
            }
            
            .next-steps-title,
            .next-steps-item {
              color: #e0f2fe !important;
            }
            
            .support-section {
              background-color: #3d3d3d !important;
            }
            
            .contact-info {
              color: #cccccc !important;
            }
            
            .timeline:before {
              background: #4d4d4d !important;
            }
          }
        </style>
      </head>
      <body class="body" style="margin: 0; padding: 0; background-color: #f5f5f5; width: 100%;">
        <div class="email-wrapper" style="width: 100%; padding: 20px 0;">
          <div class="container">
            <!-- HEADER -->
            <div class="header">
              <div class="logo-container">
                <img src="https://test.gatorbudz.com/my-logo.png" alt="GatorBudz" class="logo" style="max-width: 180px; height: auto;">
              </div>
              <h1 class="review-title">Account Under Review</h1>
              <p class="review-subtitle">We're manually reviewing your registration</p>
            </div>
            
            <!-- CONTENT -->
            <div class="content">
              <!-- GREETING -->
              <div class="greeting-section">
                <p class="greeting-text">
                  Dear <strong>${name}</strong>,<br><br>
                  Thank you for registering with GatorBudz! We've received your account registration and it is currently under review.
                </p>
              </div>
              
              <!-- REVIEW INFO -->
              <div class="review-info-card">
                <h2 class="card-title">Manual Review Process</h2>
                <ul class="process-list">
                  <li class="process-item">
                    <strong>Why manual review?</strong> We verify all new accounts to ensure security and provide the best service to our customers.
                  </li>
                  <li class="process-item">
                    <strong>Typical review time:</strong> 1-2 business days (Monday-Friday, 9AM-5PM EST)
                  </li>
                  <li class="process-item">
                    <strong>What we check:</strong> Company information, contact details, and account legitimacy
                  </li>
                  <li class="process-item">
                    <strong>Notification:</strong> You'll receive an email as soon as your account is approved
                  </li>
                </ul>
              </div>
              
              <!-- THANK YOU -->
              <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
                <p style="color: #4b5563; margin: 0; line-height: 1.6; font-style: italic;">
                  Thank you for your patience and for choosing GatorBudz. We're excited to have you as part of our community!
                </p>
              </div>
            </div>
            
            <!-- FOOTER -->
            <div class="footer">
              <div style="margin-bottom: 15px;">
                <img src="https://test.gatorbudz.com/my-logo.png" alt="GatorBudz" class="footer-logo" style="max-width: 120px; height: auto;">
              </div>
              <p class="footer-company">GATOR BUDZ</p>
              <div class="footer-contact">
                <p class="footer-line">2981 SE Dominica Terr Unit 5, Stuart Florida 34997, U.S.A.</p>
                <p class="footer-line">772-708-1338 | admin@gatorbudz.com</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'GatorBudz <no-reply@gatorbudz.com>',
      to: email,
      subject,
      html,
    });

    if (error) {
      throw error;
    }

    console.log(`Account review email sent to ${email}`, { emailId: data?.id });
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Failed to send account review email:', error);
    throw error;
  }
}