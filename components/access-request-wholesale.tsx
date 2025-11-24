"use client"
import { useAuth } from '@/lib/auth-context'
import React from 'react'

const AccessRequestWholesale = () => {
    const {user, isAuthenticated} = useAuth()
  return (
    <div>
      {(isAuthenticated && user?.role === "PUBLIC" || !isAuthenticated) &&(
        <div className='text-center py-8'>
            <h2 className="md:text-2xl text-md font-bold mb-4 text-yellow-400 uppercase">
                Email: <a href="mailtro:admin@gatorbudz.com" className='text-[#dc2e86] underline'>admin@gatorbudz.com</a> to request Access
            </h2>
            <p className='uppercase text-white text-sm md:text-xl'>Wholesale buyers only - hemp license required</p>
        </div>
      )}
    </div>
  )
}

export default AccessRequestWholesale