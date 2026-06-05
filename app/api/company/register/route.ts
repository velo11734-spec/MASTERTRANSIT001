import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { name, cac_number } = await request.json();

  // In production, validate user auth first
  const supabase = await createClient();

  // Validate inputs
  if (!name || !cac_number) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase.from('companies').insert({
    name,
    cac_number,
    status: 'pending'
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
