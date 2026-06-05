'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function IdentityVerificationStep() {
  const [idFile, setIdFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idFile) {
      alert('Please upload your ID document');
      return;
    }
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('You must be logged in.');
        setLoading(false);
        return;
      }

      // Fetch company id
      const { data: company, error: companyErr } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (companyErr || !company) {
        throw new Error('Company not found. Please complete Step 1 first.');
      }

      // Upload file to Supabase storage bucket 'company_ids'
      const fileName = `${company.id}/${Date.now()}_${idFile.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('company_ids')
        .upload(fileName, idFile);

      if (storageError) {
        throw new Error('Failed to upload ID document: ' + storageError.message);
      }

      // Get public URL of file
      const { data: { publicUrl } } = supabase.storage
        .from('company_ids')
        .getPublicUrl(fileName);

      // Save record in company_verifications table
      const { error: dbError } = await supabase.from('company_verifications').insert({
        company_id: company.id,
        doc_type: 'owner_id',
        file_url: publicUrl,
        verified_at: null,
      });

      if (dbError) throw dbError;
      router.push('/en/company/onboarding/step-4');
    } catch (error: any) {
      console.error('Step 3 Error:', error);
      alert(error.message || 'Failed to save verification info');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-4">
      <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
        Company Onboarding – Step 3
      </h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 bg-gray-800 rounded-xl p-6 shadow-lg">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="idFile">Identity Document (PDF, JPG, PNG)</label>
          <input
            id="idFile"
            type="file"
            accept="application/pdf,image/*"
            required
            onChange={e => setIdFile(e.target.files ? e.target.files[0] : null)}
            className="w-full rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Continue to Next Step'}
        </button>
      </form>
    </section>
  );
}
