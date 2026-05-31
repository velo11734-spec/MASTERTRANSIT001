'use client'

import { useTranslations } from 'next-intl'
import QRCode from 'react-qr-code'

export interface TicketData {
  id: string
  passengerName: string
  from: string
  to: string
  departureDate: string
  departureTime: string
  seatNumber: string
  vehicleName: string
  plateNumber: string
  companyName: string
  status: 'UNUSED' | 'CHECKED_IN' | 'USED' | 'EXPIRED'
}

export default function DigitalTicket({ ticket }: { ticket: TicketData }) {
  const t = useTranslations('ticket')

  const statusColors = {
    UNUSED: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    CHECKED_IN: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    USED: 'bg-gray-500/10 border-gray-800 text-gray-500',
    EXPIRED: 'bg-red-500/10 border-red-500/30 text-red-450',
  }

  return (
    <div className="max-w-md mx-auto bg-[#0f0f1a] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Decorative side ticket notches */}
      <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-[#080812] border-r border-gray-800" />
      <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-[#080812] border-l border-gray-800" />

      {/* Header banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 p-6 text-center text-white relative">
        <span className="text-sm font-bold uppercase tracking-widest block opacity-75">
          Boarding Pass
        </span>
        <span className="text-xl font-extrabold font-outfit mt-1 block">
          {ticket.companyName}
        </span>
      </div>

      {/* Ticket Details Panel */}
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider block">
              {t('booking_id')}
            </span>
            <span className="text-sm font-bold font-mono text-gray-200 uppercase">
              #{ticket.id}
            </span>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              statusColors[ticket.status] || ''
            }`}
          >
            {ticket.status}
          </span>
        </div>

        {/* Passenger Information */}
        <div className="border-t border-gray-900/60 pt-4">
          <span className="text-xs text-gray-500 uppercase tracking-wider block">
            {t('passenger')}
          </span>
          <span className="text-base font-bold text-white font-outfit">
            {ticket.passengerName}
          </span>
        </div>

        {/* Departure -> Destination */}
        <div className="grid grid-cols-2 gap-4 border-t border-gray-900/60 pt-4">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider block">
              {t('from')}
            </span>
            <span className="text-sm font-bold text-gray-200">{ticket.from}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider block">
              {t('to')}
            </span>
            <span className="text-sm font-bold text-gray-200">{ticket.to}</span>
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-4 border-t border-gray-900/60 pt-4">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider block">
              {t('departure')}
            </span>
            <span className="text-sm font-bold text-gray-200">
              {ticket.departureDate} @ {ticket.departureTime}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider block">
              {t('seat')}
            </span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              {ticket.seatNumber}
            </span>
          </div>
        </div>

        {/* QR Code Validation wrapper */}
        <div className="border-t border-dashed border-gray-800 pt-6 flex flex-col items-center gap-4">
          <div className="bg-white p-3 rounded-2xl">
            <QRCode
              value={`https://mastertransit.africa/qr-check-in/${ticket.id}`}
              size={120}
              level="H"
            />
          </div>
          <span className="text-xs text-gray-500 text-center uppercase tracking-wider">
            {t('scan_qr')}
          </span>
        </div>
      </div>
    </div>
  )
}
