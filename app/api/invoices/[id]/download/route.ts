import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
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

    const htmlContent = generateInvoiceHTML(invoice)

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.html"`,
      },
    })
  } catch (error) {
    console.error("Download invoice error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateInvoiceHTML(invoice: any) {
  const items = invoice.order?.items || []

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #333; padding-bottom: 30px; margin-bottom: 30px; }
        .title { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .invoice-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 14px; }
        .info-block { }
        .info-label { font-weight: bold; color: #666; margin-bottom: 5px; }
        .section-title { font-size: 16px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f0f0f0; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .total-section { text-align: right; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; }
        .total-row { font-size: 18px; font-weight: bold; color: #333; display: flex; justify-content: flex-end; gap: 10px; }
        .amount { color: #00aa00; font-size: 24px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">INVOICE</div>
        </div>

        <div class="invoice-info">
          <div class="info-block">
            <div class="info-label">Invoice Number</div>
            <div>${invoice.invoiceNumber}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Status</div>
            <div>${invoice.status}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Issue Date</div>
            <div>${new Date(invoice.issueDate).toLocaleDateString()}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Due Date</div>
            <div>${new Date(invoice.dueDate).toLocaleDateString()}</div>
          </div>
        </div>

        <div class="section-title">Bill To</div>
        <div style="margin-bottom: 30px;">
          <strong>${invoice.user?.name || "N/A"}</strong><br>
          ${invoice.user?.company ? invoice.user.company + "<br>" : ""}
          ${invoice.user?.email || ""}
        </div>

        ${
          items.length > 0
            ? `
          <div class="section-title">Items</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item: any) => `
                <tr>
                  <td>${item.product?.name || "Product"}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">$${item.unitPrice.toFixed(2)}</td>
                  <td style="text-align: right;">$${item.totalPrice.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        `
            : ""
        }

        <div class="total-section">
          <div class="total-row">
            <span>Total Amount Due:</span>
            <span class="amount">$${invoice.total.toFixed(2)}</span>
          </div>
        </div>

        ${
          invoice.notes
            ? `
          <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 4px solid #ddd; border-radius: 4px;">
            <strong>Notes:</strong><br>
            ${invoice.notes}
          </div>
        `
            : ""
        }

        <div class="footer">
          <p>This invoice was generated on ${new Date().toLocaleDateString()}</p>
          ${invoice.paidAt ? `<p>Paid on ${new Date(invoice.paidAt).toLocaleDateString()}</p>` : ""}
        </div>
      </div>
    </body>
    </html>
  `
}
