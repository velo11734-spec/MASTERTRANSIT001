'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function OfficeContactStep() {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('You must be logged in to onboard your company.');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('companies')
        .update({
          address,
          city,
          state,
          phone,
        })
        .eq('owner_id', user.id);

      if (error) throw error;
      router.push('/en/company/onboarding/step-3');
    } catch (error: any) {
      console.error('Step 2 Error:', error);
      alert(error.message || 'Failed to save office/contact info');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-4">
      <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">Company Onboarding – Step 2</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 bg-gray-800 rounded-xl p-6 shadow-lg">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="address">Address</label>
          <input id="address" type="text" required value={address} onChange={e => setAddress(e.target.value)} className="w-full rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="city">City</label>
          <input id="city" type="text" required value={city} onChange={e => setCity(e.target.value)} className="w-full rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="state">State</label>
          <input id="state" type="text" required value={state} onChange={e => setState(e.target.value)} className="w-full rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone</label>
          <input id="phone" type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : 'Continue to Next Step'}
        </button>
      </form>
    </section>
  );
}
