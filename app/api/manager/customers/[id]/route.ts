import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "MANAGER") {
      return new Response("Unauthorized", { status: 401 })
    }

    await db.user.delete({
      where: { id: (await params).id },
    })

    return Response.json({ message: "Customer deleted" })
  } catch (error) {
    console.error("Customer delete error:", error)
    return Response.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
