import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: (await params).id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        user: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (session.user.role === "VERIFIED" && invoice.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Generate HTML content with your email template design
    const htmlContent = generateInvoiceHTML(invoice)

    // Return HTML as response
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNumber}.html"`,
      },
    })
  } catch (error) {
    console.error("Download invoice error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateInvoiceHTML(invoice: any) {
  const items = invoice.order?.items || []
  const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
  const totalAmount = invoice.total || subtotal
  const shippingCost = totalAmount - subtotal

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice #${invoice.invoiceNumber} - GatorBudz</title>
      <style>
        /* CSS Reset */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        /* Screen Styles */
        @media screen {
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #333333;
            padding: 20px;
            background-color: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
          }
          
          .container {
            width: 210mm; /* A4 width */
            min-height: 297mm; /* A4 height */
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
            position: relative;
          }
          
          .print-button-container {
            text-align: center;
            margin: 30px auto;
            max-width: 210mm;
          }
          
          .print-button {
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            color: white;
            border: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(31, 41, 55, 0.2);
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          
          .print-button:hover {
            background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(31, 41, 55, 0.25);
          }
          
          .print-button:active {
            transform: translateY(0);
          }
        }
        
        /* Print Styles - A4 Specific */
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            font-family: Arial, Helvetica, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .container {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            overflow: visible !important;
          }
          
          .print-button-container {
            display: none !important;
          }
          
          /* Force background colors to print */
          .header, .footer {
            background-color: #1f2937 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .items-table th {
            background-color: #1f2937 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .payment-info {
            background-color: #fff3cd !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Remove any gaps */
          * {
            max-height: none !important;
            min-height: 0 !important;
          }
        }
        
        /* Common Styles */
        .container {
          max-width: 210mm; /* A4 width */
          background: #ffffff;
        }
        
        /* Header */
        .header {
          background: #1f2937;
          color: #ffffff;
          padding: 20mm 20mm 15mm 20mm;
          text-align: center;
          position: relative;
        }
        
        .logo-container {
          margin-bottom: 15px;
        }
        
        .logo {
          max-width: 180px;
          height: auto;
          display: inline-block;
        }
        
        /* Content */
        .content {
          padding: 15mm 20mm 20mm 20mm;
        }
        
        /* Footer */
        .footer {
          background: #1f2937;
          color: #ffffff;
          padding: 15mm 20mm;
          text-align: center;
          font-size: 12px;
          position: relative;
        }
        
        /* Invoice Header */
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .company-info {
          flex: 1;
        }
        
        .invoice-info {
          flex: 1;
          text-align: right;
        }
        
        .invoice-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 15px;
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
        
        /* Bill To Section */
        .bill-to-section {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid #1f2937;
        }
        
        .bill-to-title {
          margin-bottom: 15px;
          color: #1f2937;
          font-size: 18px;
          font-weight: 600;
        }
        
        /* Items Table */
        .items-section {
          margin: 30px 0;
        }
        
        .section-title {
          color: #1f2937;
          margin-bottom: 15px;
          font-size: 18px;
          font-weight: 600;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 14px;
          table-layout: fixed;
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
          word-wrap: break-word;
        }
        
        .items-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        
        .items-table tr:last-child td {
          border-bottom: 2px solid #1f2937;
        }
        
        /* Table column widths */
        .items-table th:nth-child(1),
        .items-table td:nth-child(1) {
          width: 10%;
        }
        
        .items-table th:nth-child(2),
        .items-table td:nth-child(2) {
          width: 40%;
        }
        
        .items-table th:nth-child(3),
        .items-table td:nth-child(3) {
          width: 15%;
          text-align: center;
        }
        
        .items-table th:nth-child(4),
        .items-table td:nth-child(4) {
          width: 17.5%;
          text-align: right;
        }
        
        .items-table th:nth-child(5),
        .items-table td:nth-child(5) {
          width: 17.5%;
          text-align: right;
        }
        
        /* Totals Section */
        .totals-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }
        
        .total-row {
          display: flex;
          justify-content: flex-end;
          margin: 10px 0;
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
        
        /* Payment Info */
        .payment-info {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
          page-break-inside: avoid;
        }
        
        .payment-title {
          margin-bottom: 15px;
          color: #856404;
          font-size: 16px;
          font-weight: 600;
        }
        
        .payment-details {
          margin: 12px 0;
          line-height: 1.6;
          color: #856404;
        }
        
        /* Thanks Section */
        .thanks-section {
          text-align: center;
          padding: 25px 20px;
          background: #f8fafc;
          border-radius: 8px;
          margin: 30px 0;
          page-break-inside: avoid;
        }
        
        .thanks-message {
          font-style: italic;
          color: #4b5563;
          line-height: 1.6;
          margin: 8px 0;
        }
        
        /* Footer Styles */
        .footer-logo {
          max-width: 120px;
          height: auto;
          margin-bottom: 15px;
          opacity: 0.9;
          filter: brightness(0) invert(1);
        }
        
        .footer-company {
          margin-bottom: 15px;
          font-weight: 600;
          font-size: 16px;
        }
        
        .footer-contact {
          margin-top: 10px;
          font-size: 12px;
          line-height: 1.5;
          opacity: 0.8;
        }
        
        .footer-line {
          margin: 5px 0;
        }
        
        /* Utility classes */
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .mb-10 {
          margin-bottom: 10px;
        }
        
        .mb-20 {
          margin-bottom: 20px;
        }
        
        /* Page break control */
        .page-break {
          page-break-before: always;
        }
        
        .avoid-break {
          page-break-inside: avoid;
        }
      </style>
      <script>
        function printInvoice() {
          // Add a small delay to ensure styles are loaded
          setTimeout(() => {
            window.print();
          }, 100);
        }
        
        function downloadAsPDF() {
          alert('To save as PDF, use "Print" and choose "Save as PDF" in the print dialog.');
          printInvoice();
        }
        
        // Auto-print option (uncomment if needed)
        // window.onload = function() {
        //   // Auto-print after 1 second
        //   // setTimeout(printInvoice, 1000);
        // };
      </script>
    </head>
    <body>
      <div class="print-button-container">
        <button class="print-button" onclick="printInvoice()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Print / Save as PDF
        </button>
        <p style="margin-top: 10px; color: #666; font-size: 14px;">
          Tip: In print dialog, select "Save as PDF" to download
        </p>
      </div>
      
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <div class="logo-container">
            <img src="https://test.gatorbudz.com/my-logo.png" alt="GatorBudz" class="logo">
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
                ${invoice.invoiceNumber}
              </div>
              <div>
                <strong>Invoice Date:</strong><br>
                ${new Date(invoice.issueDate).toLocaleDateString('en-US', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </div>
              ${invoice.dueDate ? `
                <div style="margin-top: 10px;">
                  <strong>Due Date:</strong><br>
                  ${new Date(invoice.dueDate).toLocaleDateString('en-US', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- BILL TO -->
          <div class="bill-to-section">
            <h3 class="bill-to-title">Bill To</h3>
            <p style="margin: 0 0 8px 0; font-weight: 600;">${invoice.user?.name || "N/A"}</p>
            ${invoice.user?.company ? `<p style="margin: 0 0 8px 0;">${invoice.user.company}</p>` : ''}
            <p style="margin: 0; color: #666666; line-height: 1.6;">${invoice.user?.email || ""}</p>
          </div>
          
          <!-- PRODUCTS -->
          ${items.length > 0 ? `
            <div class="items-section">
              <h3 class="section-title">Products</h3>
              <table class="items-table">
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
                  ${items.map((item: any, index: number) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${item.product?.name || "Product"}</td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                      <td class="text-right">${formatCurrency(item.totalPrice)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
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
          

          

        </div>

      </div>
      
      <script>
        // Add print event listeners
        window.addEventListener('beforeprint', () => {
          console.log('Printing invoice...');
        });
        
        window.addEventListener('afterprint', () => {
          console.log('Print completed');
        });
      </script>
    </body>
    </html>
  `
}