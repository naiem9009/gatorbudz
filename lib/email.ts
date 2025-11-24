import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface InvoiceEmailProps {
  to: string
  invoiceNumber: string
  customerName: string
  companyName?: string
  orderId: string
  totalAmount: number
  dueDate: Date
  orderDate?: Date
  items: Array<{
    name: string
    strain?: string // Added strain field
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  invoiceUrl?: string
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
      orderId, 
      totalAmount, 
      dueDate, 
      items,
      orderDate,
      invoiceUrl = `${process.env.NEXTAUTH_URL}/dashboard/invoices-payment?id=${invoiceNumber}`
    } = props
    
    const displayName = companyName ? `${customerName} (${companyName})` : customerName
    
    // Format currency values
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${invoiceNumber} - GatorBudz</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            background: #1f2937;
            color: white; 
            padding: 25px 20px; 
            text-align: center; 
          }
          .logo-container {
            margin-bottom: 15px;
          }
          .logo {
            max-width: 180px;
            height: auto;
          }
          .content { 
            padding: 30px; 
          }
          .footer { 
            background: #1f2937; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            font-size: 14px;
          }
          .invoice-details { 
            background: #f8fafc; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px; 
            border-left: 4px solid #1f2937;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          .items-table th {
            text-align: left;
            padding: 12px;
            background: #f1f5f9;
            border-bottom: 2px solid #e5e7eb;
          }
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .strain-badge {
            background: #10b981;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            margin-left: 8px;
          }
          .total { 
            font-size: 18px; 
            font-weight: bold; 
            text-align: right; 
            margin-top: 20px; 
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
          }
          .button {
            background: #1f2937;
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: 600;
            margin: 10px 5px;
            transition: background-color 0.2s;
          }
          .button:hover {
            background: #4338CA;
            color: white;
          }
          .due-date {
            color: #dc2626;
            font-weight: bold;
          }
          .text-center {
            text-align: center;
          }
          .customer-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          @media (max-width: 600px) {
            .content { padding: 20px; }
            .button { display: block; text-align: center; margin: 10px 0; }
            .items-table { font-size: 14px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-container">
              <img src="https://test.gatorbudz.com/logo.png" alt="GatorBudz" class="logo">
            </div>
            <h1 style="margin: 0 0 10px 0; font-size: 24px;">Invoice</h1>
            <p style="margin: 0; opacity: 0.9;">Invoice #${invoiceNumber}</p>
          </div>
          
          <div class="content">
            <p>Dear ${displayName},</p>
            <p>Thank you for your order with GatorBudz! Your order <strong>#${orderId}</strong> has been approved. Please find your invoice details below:</p>
            
            <div class="customer-info">
              <p style="margin: 5px 0;"><strong>Customer:</strong> ${displayName}</p>
              <p style="margin: 5px 0;"><strong>Order Date:</strong> ${orderDate ? new Date(orderDate).toLocaleDateString() : 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Payment Due:</strong> <span class="due-date">${dueDate.toLocaleDateString()}</span></p>
            </div>
            
            <div class="invoice-details">
              <h3 style="margin-top: 0; color: #374151;">Order Summary</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td>
                        ${item.name}
                        ${item.strain ? `<span class="strain-badge">${item.strain}</span>` : ''}
                      </td>
                      <td>${item.quantity}</td>
                      <td>${formatCurrency(item.unitPrice)}</td>
                      <td>${formatCurrency(item.totalPrice)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="total">
                Total Amount: ${formatCurrency(totalAmount)}
              </div>
            </div>

            <p>You can view and pay this invoice directly from your dashboard:</p>
            
            <div class="text-center">
              <a href="${invoiceUrl}" class="button">
                Pay Invoice Now
              </a>
              
              <a href="${process.env.NEXTAUTH_URL}/dashboard/orders" class="button" style="background: #1f2937;">
                View Orders
              </a>
            </div>
            
            <p style="margin-top: 25px;">If you have any questions about this invoice, please don't hesitate to contact our support team.</p>
          </div>
          
          <div class="footer">
            <div style="margin-bottom: 15px;">
              <img src="https://test.gatorbudz.com/logo.png" alt="GatorBudz" style="max-width: 120px; height: auto; opacity: 0.8;">
            </div>
            <p style="margin: 0 0 10px 0;">Thank you for choosing GatorBudz!</p>
            <p style="margin: 0; opacity: 0.8;">GatorBudz Team</p>
            <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.6;">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject: `Invoice #${invoiceNumber} - Your GatorBudz Order`,
      html,
    })

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
      }).format(amount)
    }

    const subject = isFinalReminder 
      ? `FINAL REMINDER: Overdue Invoice #${invoiceNumber} - Action Required`
      : isOverdue
      ? `Reminder: Overdue Invoice #${invoiceNumber}`
      : `Reminder: Upcoming Invoice #${invoiceNumber}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header { 
              background: ${isFinalReminder ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'linear-gradient(135deg, #4F46E5, #7E69E5)'}; 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .content { 
              padding: 30px; 
            }
            .footer { 
              background: #1f2937; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              font-size: 14px;
            }
            .invoice-details { 
              background: #f8fafc; 
              padding: 20px; 
              margin: 20px 0; 
              border-radius: 8px; 
              border-left: 4px solid ${isFinalReminder ? '#dc2626' : '#4F46E5'};
            }
            .button {
              background: ${isFinalReminder ? '#dc2626' : '#4F46E5'}; 
              color: white; 
              padding: 14px 28px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block;
              font-weight: 600;
              margin: 10px 5px;
              transition: background-color 0.2s;
            }
            .button:hover {
              background: ${isFinalReminder ? '#b91c1c' : '#4338CA'};
            }
            .due-date {
              color: #dc2626;
              font-weight: bold;
            }
            .urgent {
              background: #fef2f2;
              border: 1px solid #fecaca;
              color: #dc2626;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .text-center {
              text-align: center;
            }
            @media (max-width: 600px) {
              .content { padding: 20px; }
              .button { display: block; text-align: center; margin: 10px 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0 0 10px 0;">
                ${isFinalReminder ? 'Final Reminder' : 'Invoice Reminder'}
              </h1>
              <p style="margin: 0; opacity: 0.9;">Invoice #${invoiceNumber}</p>
            </div>
            
            <div class="content">
              <p>Dear ${displayName},</p>
              
              ${isFinalReminder ? `
                <div class="urgent">
                  <h3 style="margin: 0; color: #dc2626;">URGENT: FINAL NOTICE</h3>
                  <p style="margin: 10px 0 0 0;">Your invoice is ${daysOverdue} days overdue. Immediate payment is required to avoid account suspension.</p>
                </div>
              ` : isOverdue ? `
                <p>This is a friendly reminder that your invoice <strong>#${invoiceNumber}</strong> is <strong>${daysOverdue} days overdue</strong>.</p>
              ` : `
                <p>This is a friendly reminder that your invoice <strong>#${invoiceNumber}</strong> is due on <strong>${dueDate.toLocaleDateString()}</strong>.</p>
              `}
              
              <div class="invoice-details">
                <h3 style="margin-top: 0; color: #374151;">Invoice Details</h3>
                <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                <p><strong>Due Date:</strong> <span class="due-date">${dueDate.toLocaleDateString()}</span></p>
                <p><strong>Amount Due:</strong> ${formatCurrency(totalAmount)}</p>
                ${isOverdue ? `<p><strong>Days Overdue:</strong> ${daysOverdue}</p>` : ''}
              </div>

              <p>Please settle your invoice at your earliest convenience:</p>
              
              <div class="text-center">
                <a href="${invoiceUrl}" class="button">
                  ${isFinalReminder ? 'Pay Now - Final Notice' : 'Pay Invoice Now'}
                </a>
              </div>

              ${isFinalReminder ? `
                <div class="urgent" style="margin-top: 20px;">
                  <p style="margin: 0;"><strong>Important:</strong> Failure to pay within 48 hours may result in temporary suspension of your account and services.</p>
                </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0;">Thank you for your prompt attention to this matter.</p>
              <p style="margin: 0; opacity: 0.8;">GatorBudz Team</p>
              <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.6;">
                If you have already made this payment, please disregard this message.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: 'GatorBudz <onboarding@resend.dev>',
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