import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('bedrijven').select('id').limit(1);
    
    return NextResponse.json({ 
      status: "online",
      database: error ? "error" : "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      status: "online",
      database: "not_configured",
      timestamp: new Date().toISOString()
    });
  }
}
