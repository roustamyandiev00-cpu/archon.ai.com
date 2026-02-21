import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from 'next/server';
import { pdfGenerator, OfferteData, FactuurData } from '@/lib/pdf/PDFGenerator';


export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entity_type, entity_id, template, data } = body;

    if (!entity_type || !entity_id || !data) {
      return NextResponse.json({ 
        error: 'Entity type, entity ID, and data are required' 
      }, { status: 400 });
    }

    // Get user's preferred template if not specified
    let selectedTemplate = template;
    if (!selectedTemplate) {
      const { data: userSettings } = await supabaseAdmin
    // @ts-expect-error
        .from('user_settings')
        .select('pdf_template_choice')
        .eq('user_id', user.id)
        .single();
      
      selectedTemplate = userSettings?.pdf_template_choice || 'modern';
    }

    // Generate PDF
    let pdfBytes: Uint8Array;
    const fileName = `${entity_type}_${entity_id}_${Date.now()}.pdf`;

    if (entity_type === 'offerte') {
      pdfBytes = await pdfGenerator.generateOfferte(data as OfferteData, selectedTemplate);
    } else if (entity_type === 'factuur') {
      pdfBytes = await pdfGenerator.generateFactuur(data as FactuurData, selectedTemplate);
    } else {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const filePath = `pdfs/${user.id}/${fileName}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('documents')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('documents')
      .getPublicUrl(filePath);

    // Record in database
    const { data: pdfRecord, error: dbError } = await supabaseAdmin
      .from('pdf_generations')
      .insert({
        user_id: user.id,
        entity_type: entity_type,
        entity_id: entity_id,
        template_used: selectedTemplate,
        file_path: filePath,
        file_size: pdfBytes.length,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error recording PDF generation:', dbError);
    }

    return NextResponse.json({
      success: true,
      data: {
        pdf_url: publicUrl,
        file_name: fileName,
        file_size: pdfBytes.length,
        template_used: selectedTemplate,
        generation_id: pdfRecord?.id
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to retrieve PDF generation history
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabaseAdmin
      .from('pdf_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data: generations, error } = await query;

    if (error) {
      console.error('Error fetching PDF generations:', error);
      return NextResponse.json({ error: 'Failed to fetch PDF generations' }, { status: 500 });
    }

    // Add public URLs
    const generationsWithUrls = generations.map(gen => {
      const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('documents')
        .getPublicUrl(gen.file_path);
      
      return {
        ...gen,
        public_url: publicUrl
      };
    });

    return NextResponse.json({ success: true, data: generationsWithUrls });
  } catch (error) {
    console.error('Error in GET PDF generations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
