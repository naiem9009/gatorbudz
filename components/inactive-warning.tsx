"use client"

import { useAuth } from '@/lib/auth-context'


const InactiveWarning = () => {
      const { user } = useAuth()
  return (
    <>
      {user?.role === "PUBLIC" && (
        <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-800 px-4 py-3 text-center text-sm md:text-base sticky top-0">
          <strong className="font-medium">Notice:</strong> Your wholesale account is not verified yet. <a className="underline text-red-400" href="mailto:admin@gatorbudz.com">Contact Support</a>
        </div>
      )}
    </>
  )
}

export default InactiveWarning