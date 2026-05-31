'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/client'
import { useState, useTransition } from 'react'

// Dummy dynamic travel trip details matching our postgres relational tables
const initialTrips = [
  {
    id: 'trip-1',
    company: 'ABC Transport',
    logo: '✨',
    rating: 4.8,
    class: 'Executive Bus',
    departure: '08:00 AM',
    arrival: '04:00 PM',
    duration: '8h 00m',
    seats: 12,
    price: 35000,
    currency: 'NGN',
    amenities: ['AC', 'WiFi', 'Charging Ports', 'Refreshments'],
  },
  {
    id: 'trip-2',
    company: 'Chisco Transport',
    logo: '⭐',
    rating: 4.5,
    class: 'Luxury Coach',
    departure: '07:30 AM',
    arrival: '05:30 PM',
    duration: '10h 00m',
    seats: 24,
    price: 28000,
    currency: 'NGN',
    amenities: ['AC', 'Charging Ports', 'Movies'],
  },
  {
    id: 'trip-3',
    company: 'God is Good (GIGM)',
    logo: '🚀',
    rating: 4.9,
    class: 'Premium Minibus',
    departure: '09:00 AM',
    arrival: '03:30 PM',
    duration: '6h 30m',
    seats: 4,
    price: 45000,
    currency: 'NGN',
    amenities: ['AC', 'WiFi', 'Charging Ports', 'Individual screens'],
  },
]

export default function SearchPage() {
  const t = useTranslations('search')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<number>(50000)
  const [trips, setTrips] = useState(initialTrips)

  const filteredTrips = trips.filter((trip) => {
    const matchesClass = selectedClass === 'all' || trip.class.toLowerCase().includes(selectedClass.toLowerCase())
    const matchesPrice = trip.price <= priceRange
    return matchesClass && matchesPrice
  })

  return (
    <div className="min-h-screen bg-[#080812] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight mb-8 font-outfit bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
          {t('title')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-gray-800 h-fit space-y-6">
            <h2 className="text-lg font-bold text-gray-200 border-b border-gray-800 pb-3">
              {t('filters')}
            </h2>

            {/* Price Filter */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Max Price</span>
                <span className="text-amber-400 font-bold">₦ {priceRange.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="50000"
                step="2000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Class Filter */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider block">
                {t('filter_class')}
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-[#131320] border border-gray-800 text-gray-300 rounded-xl py-2.5 px-3 outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]"
              >
                <option value="all">All Classes</option>
                <option value="luxury">Luxury Coach</option>
                <option value="executive">Executive Bus</option>
                <option value="premium">Premium Minibus</option>
              </select>
            </div>
          </div>

          {/* Search Result Cards List */}
          <div className="lg:col-span-3 space-y-6">
            {filteredTrips.length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-2xl border border-gray-800">
                <p className="text-gray-400 text-lg mb-4">{t('no_results')}</p>
              </div>
            ) : (
              filteredTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="glass-panel p-6 rounded-2xl border border-gray-800 hover:border-indigo-500/40 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{trip.logo}</span>
                      <div>
                        <h3 className="text-lg font-bold text-white font-outfit">
                          {trip.company}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                          ⭐ {trip.rating}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-gray-900/60 pt-4">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Departure</div>
                        <div className="text-base font-bold text-gray-200">{trip.departure}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Duration</div>
                        <div className="text-base font-bold text-gray-200">{trip.duration}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Arrival</div>
                        <div className="text-base font-bold text-gray-200">{trip.arrival}</div>
                      </div>
                    </div>

                    {/* Amenities list */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {trip.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price & Action Widget */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 min-w-[150px] border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-6">
                    <div>
                      <span className="text-xs text-gray-500 block uppercase tracking-wider md:text-right">
                        {t('from')}
                      </span>
                      <span className="text-2xl font-extrabold text-amber-400 font-outfit">
                        ₦ {trip.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 block md:text-right">
                        {trip.seats} {t('available_seats')}
                      </span>
                    </div>

                    <Link
                      href={`/trips/${trip.id}`}
                      className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aec] hover:from-[#6366f1] hover:to-[#8b5cf6] text-white font-bold py-2.5 px-6 rounded-xl transition-all duration-200 shadow-md shadow-indigo-500/10 text-sm whitespace-nowrap"
                    >
                      {t('book_now')}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
