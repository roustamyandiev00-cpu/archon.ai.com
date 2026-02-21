import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from '@/lib/admin'

// GET /api/modules - List all modules
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    
    let query = (supabase.from('modules') as any).select('*');
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query.order('sort_order', { ascending: true });

    if (error) {
      console.error("Error fetching modules:", error);
      return NextResponse.json(
        { success: false, error: "Kon modules niet ophalen" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json(
      { success: false, error: "Interne server fout" },
      { status: 500 }
    );
  }
}

// POST /api/modules - Create new module
export async function POST(request: NextRequest) {
  // Only admins can create modules
  const authCheck = await requireAdmin(request)
  if (!(authCheck as any).ok) return authCheck as NextResponse

  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { name, slug, description, price, features, isActive, sortOrder } = body;

    if (!name || !slug || price === undefined) {
      return NextResponse.json(
        { success: false, error: "Naam, slug en prijs zijn vereist" },
        { status: 400 }
      );
    }

    const { data, error } = await (supabase.from('modules') as any).insert({
      name,
      slug,
      description,
      price,
      stripe_price_id: body.stripePriceId,
      features: JSON.stringify(features || []),
      is_active: isActive ?? true,
      sort_order: sortOrder ?? 0,
    }).select().single();

    if (error) {
      console.error("Error creating module:", error);
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: "Slug bestaat al" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Kon module niet aanmaken" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error creating module:", error);
    return NextResponse.json(
      { success: false, error: "Interne server fout" },
      { status: 500 }
    );
  }
}

// PUT /api/modules - Update module
export async function PUT(request: NextRequest) {
  // Only admins can update modules
  const authCheck = await requireAdmin(request)
  if (!(authCheck as any).ok) return authCheck as NextResponse

  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { id, name, slug, description, price, features, isActive, sortOrder } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Module ID is vereist" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (body.stripePriceId !== undefined) updateData.stripe_price_id = body.stripePriceId;
    if (features !== undefined) updateData.features = JSON.stringify(features);
    if (isActive !== undefined) updateData.is_active = isActive;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;

    const { data, error } = await (supabase.from('modules') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating module:", error);
      return NextResponse.json(
        { success: false, error: "Kon module niet bijwerken" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error updating module:", error);
    return NextResponse.json(
      { success: false, error: "Interne server fout" },
      { status: 500 }
    );
  }
}

// DELETE /api/modules - Delete module
export async function DELETE(request: NextRequest) {
  // Only admins can delete modules
  const authCheck = await requireAdmin(request)
  if (!(authCheck as any).ok) return authCheck as NextResponse

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Module ID is vereist" },
        { status: 400 }
      );
    }

    const { error } = await (supabase.from('modules') as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting module:", error);
      return NextResponse.json(
        { success: false, error: "Kon module niet verwijderen" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Module verwijderd",
    });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json(
      { success: false, error: "Interne server fout" },
      { status: 500 }
    );
  }
}
