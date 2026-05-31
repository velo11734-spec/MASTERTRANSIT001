'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

// Mock seating grid layout (12 seats total for minibus or executive bus)
const mockSeats = [
  { id: 'A1', row: 1, col: 1, status: 'AVAILABLE' },
  { id: 'A2', row: 1, col: 2, status: 'AVAILABLE' },
  { id: 'A3', row: 1, col: 3, status: 'BOOKED' },
  { id: 'B1', row: 2, col: 1, status: 'RESERVED' },
  { id: 'B2', row: 2, col: 2, status: 'AVAILABLE' },
  { id: 'B3', row: 2, col: 3, status: 'AVAILABLE' },
  { id: 'C1', row: 3, col: 1, status: 'AVAILABLE' },
  { id: 'C2', row: 3, col: 2, status: 'AVAILABLE' },
  { id: 'C3', row: 3, col: 3, status: 'BOOKED' },
  { id: 'D1', row: 4, col: 1, status: 'AVAILABLE' },
  { id: 'D2', row: 4, col: 2, status: 'AVAILABLE' },
  { id: 'D3', row: 4, col: 3, status: 'AVAILABLE' },
]

export default function TripDetailPage({ params }: { params: any }) {
  const t = useTranslations('booking')
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const basePricePerSeat = 35000

  const toggleSeat = (seatId: string, currentStatus: string) => {
    if (currentStatus !== 'AVAILABLE') return
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    )
  }

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat to continue.')
      return
    }
    alert(
      `Booking Confirmed!\nSeats: ${selectedSeats.join(
        ', '
      )}\nPassenger: ${fullName}\nAmount Paid: ₦ ${(
        selectedSeats.length * basePricePerSeat
      ).toLocaleString()}`
    )
  }

  return (
    <div className="min-h-screen bg-[#080812] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Seat Map Selector */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-gray-800 space-y-8">
          <div>
            <h2 className="text-xl font-extrabold font-outfit text-white mb-2">
              {t('select_seat')}
            </h2>
            <p className="text-sm text-gray-400">
              Click on available seats to add them to your reservation list.
            </p>
          </div>

          {/* Seat Status Color Guide */}
          <div className="flex flex-wrap gap-4 justify-between bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#131320] border border-gray-700" />
              <span>{t('seat_available')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500/30 border border-amber-500" />
              <span>{t('seat_selected')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/50 text-yellow-500/70" />
              <span>{t('seat_reserved')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/50 text-red-500/70" />
              <span>{t('seat_booked')}</span>
            </div>
          </div>

          {/* Interactive Seat Grid Container */}
          <div className="flex flex-col items-center bg-[#0d0d18] border border-gray-900 rounded-3xl p-8 max-w-sm mx-auto relative overflow-hidden">
            <div className="absolute top-0 w-32 h-1.5 bg-indigo-500/40 rounded-b-full shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-8">
              FRONT / DRIVER
            </span>

            <div className="grid grid-cols-3 gap-6 w-full">
              {mockSeats.map((seat) => {
                const isSelected = selectedSeats.includes(seat.id)
                let btnStyle = 'bg-[#131320] border border-gray-800 hover:border-indigo-500 text-gray-400'
                
                if (seat.status === 'BOOKED') {
                  btnStyle = 'bg-red-500/10 border border-red-500/30 text-red-500/50 cursor-not-allowed'
                } else if (seat.status === 'RESERVED') {
                  btnStyle = 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500/50 cursor-not-allowed'
                } else if (isSelected) {
                  btnStyle = 'bg-amber-500/20 border border-amber-500 text-amber-400 font-extrabold shadow-lg shadow-amber-500/10'
                }

                return (
                  <button
                    key={seat.id}
                    disabled={seat.status !== 'AVAILABLE'}
                    onClick={() => toggleSeat(seat.id, seat.status)}
                    className={`h-12 w-full rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-200 ${btnStyle}`}
                  >
                    {seat.id}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Passenger Form Info & Calculation Panel */}
        <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-gray-800 h-fit space-y-6">
          <div>
            <h2 className="text-xl font-extrabold font-outfit text-white mb-2">
              {t('passenger_details')}
            </h2>
            <p className="text-sm text-gray-400">
              Provide booking contact information to receive ticketing details.
            </p>
          </div>

          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                {t('full_name')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Feranmi Ajibade"
                className="w-full bg-[#131320] border border-gray-800 focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] text-white rounded-xl py-2.5 px-4 outline-none transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                {t('phone')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 80 1234 5678"
                className="w-full bg-[#131320] border border-gray-800 focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] text-white rounded-xl py-2.5 px-4 outline-none transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="feranmi@example.com"
                className="w-full bg-[#131320] border border-gray-800 focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] text-white rounded-xl py-2.5 px-4 outline-none transition-all duration-200"
                required
              />
            </div>

            {/* Calculations widget */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Selected Seats ({selectedSeats.length})</span>
                <span className="text-gray-200 font-semibold">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Seat Price</span>
                <span className="text-gray-200 font-semibold">₦ {basePricePerSeat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-850 pt-3.5 mt-2">
                <span className="text-base font-bold text-gray-200">{t('total')}</span>
                <span className="text-xl font-extrabold text-amber-400 font-outfit">
                  ₦ {(selectedSeats.length * basePricePerSeat).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={selectedSeats.length === 0}
              className="w-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aec] hover:from-[#6366f1] hover:to-[#8b5cf6] disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25"
            >
              {t('pay_now')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
