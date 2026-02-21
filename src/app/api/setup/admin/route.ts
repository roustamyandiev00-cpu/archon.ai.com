import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const ADMIN_EMAIL = "roustamyandiev00@gmail.com";
const ADMIN_PASSWORD = "admin123";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Check if user already exists in auth
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      return NextResponse.json({ 
        success: false, 
        error: "Could not list users: " + listError.message 
      }, { status: 500 });
    }

    const existingUser = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

    if (existingUser) {
      // User exists - make sure they're admin in users table
      const { error: updateError } = await (supabase
        .from("users") as any)
        .update({ role: "admin" })
        .eq("id", existingUser.id);

      if (updateError) {
        return NextResponse.json({ 
          success: false, 
          error: "Could not update role: " + updateError.message 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Existing user upgraded to admin",
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        existing: true
      });
    }

    // Create new auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: "System Admin",
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ 
        success: false, 
        error: "Auth creation failed: " + (authError?.message || "Unknown error") 
      }, { status: 500 });
    }

    const userId = authData.user.id;

    // Create user record
    const { error: userError } = await (supabase.from("users") as any).insert({
      id: userId,
      email: ADMIN_EMAIL,
      name: "System Admin",
      role: "admin",
      is_blocked: false,
      tokens_used: 0,
      tokens_limit: 100000,
    });

    if (userError) {
      // Cleanup auth user
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ 
        success: false, 
        error: "User record creation failed: " + userError.message 
      }, { status: 500 });
    }

    // Create default integrations
    const integrations = [
      { user_id: userId, provider: "slack", is_enabled: false, is_connected: false },
      { user_id: userId, provider: "google_calendar", is_enabled: false, is_connected: false },
      { user_id: userId, provider: "microsoft_teams", is_enabled: false, is_connected: false },
      { user_id: userId, provider: "dropbox", is_enabled: false, is_connected: false },
      { user_id: userId, provider: "zapier", is_enabled: false, is_connected: false },
      { user_id: userId, provider: "quickbooks", is_enabled: false, is_connected: false },
    ];

    await (supabase.from("user_integrations") as any).insert(integrations);

    return NextResponse.json({ 
      success: true, 
      message: "Admin account created successfully",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      existing: false
    });

  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error: " + (error as Error).message 
    }, { status: 500 });
  }
}
