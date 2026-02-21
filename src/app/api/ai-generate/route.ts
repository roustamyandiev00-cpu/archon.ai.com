import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const geminiApiKey = process.env.GEMINI_API_KEY!;

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const entityType = formData.get('entity_type') as string; // 'offerte', 'factuur', 'project', 'artikel'
    const inputType = formData.get('input_type') as string; // 'text', 'voice', 'document', 'image', 'combined'
    const textInput = formData.get('text_input') as string;
    const files = formData.getAll('files') as File[];

    if (!entityType || !inputType) {
      return NextResponse.json({ error: 'Entity type and input type are required' }, { status: 400 });
    }

    // Create conversation record
    // @ts-ignore - ai_conversations table exists but not in generated types
    const { data: conversation, error: convError } = await supabaseAdmin
    // @ts-expect-error
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        entity_type: entityType,
        input_type: inputType,
        input_content: textInput,
        status: 'processing'
      })
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Process files if any
    let extractedText = '';
    const fileResults: Array<{file_name: string; extracted_text: string}> = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        
        // Upload to storage
        const filePath = `ai-attachments/${user.id}/${conversation.id}/${file.name}`;
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('documents')
          .upload(filePath, arrayBuffer, {
            contentType: file.type,
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        // Extract text based on file type
        let fileExtractedText = '';
        let ocrData: {type: string; confidence: string} | null = null;

        // For images, we would use Gemini vision API - simplified for now
        if (file.type.startsWith('image/')) {
          fileExtractedText = '[Afbeelding geüpload - OCR wordt verwerkt]';
          ocrData = { type: 'image_ocr', confidence: 'high' };
        } else if (file.type === 'application/pdf' || file.type.includes('text')) {
          fileExtractedText = '[Document geüpload - tekst wordt geëxtraheerd]';
        }

        // Store attachment record
        await supabaseAdmin
    // @ts-expect-error
          .from('ai_attachments')
          .insert({
            conversation_id: conversation.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: filePath,
            extracted_text: fileExtractedText,
            ocr_data: ocrData
          });

        fileResults.push({
          file_name: file.name,
          extracted_text: fileExtractedText
        });

        extractedText += `\n\n--- Content from ${file.name} ---\n${fileExtractedText}`;
      }
    }

    // Combine all input
    const combinedInput = `${textInput || ''}\n${extractedText}`.trim();

    // Generate AI response based on entity type using direct API call
    const aiPrompt = buildAIPrompt(entityType, combinedInput);
    
    let aiResponse = '';
    try {
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: aiPrompt }] }]
        })
      });
      
      const geminiData = await geminiResponse.json();
      aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Geen AI response';
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      aiResponse = 'AI generatie mislukt. Probeer het later opnieuw.';
    }

    // Parse AI response into structured data
    let generatedContent;
    try {
      generatedContent = parseAIResponse(entityType, aiResponse);
    } catch (e) {
      generatedContent = { raw_response: aiResponse, parse_error: true };
    }

    // Update conversation with results
    const { data: updatedConversation, error: updateError } = await supabaseAdmin
    // @ts-expect-error
      .from('ai_conversations')
      .update({
        extracted_text: extractedText,
        ai_prompt: aiPrompt,
        ai_response: { text: aiResponse },
        generated_content: generatedContent,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating conversation:', updateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        conversation_id: conversation.id,
        generated_content: generatedContent,
        ai_response: aiResponse,
        files_processed: fileResults.length
      }
    });

  } catch (error) {
    console.error('Error in AI generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildAIPrompt(entityType: string, input: string): string {
  const basePrompt = `Je bent een professionele AI-assistent voor een CRM/ERP systeem. 
Gebruikers kunnen offertes, facturen, projecten en artikelen aanmaken via spraak, tekst, of document uploads.

Hier is de input van de gebruiker:
"""
${input}
"""

`;

  switch (entityType) {
    case 'offerte':
      return basePrompt + `Genereer een complete offerte in JSON formaat met deze velden:
{
  "titel": "string - beschrijvende titel",
  "klant_naam": "string",
  "klant_email": "string",
  "klant_telefoon": "string",
  "items": [
    {
      "omschrijving": "string",
      "aantal": number,
      "prijs_per_stuk": number,
      "btw_percentage": 21
    }
  ],
  "totaal_bedrag": number,
  "valuta": "EUR",
  "geldigheidsduur": "30 dagen",
  "opmerkingen": "string - eventuele extra informatie",
  "betalingsvoorwaarden": "string"
}

Extraheer alle producten/diensten en prijzen uit de input. Als er ontbrekende informatie is, vul dan realistische waarden in of zet deze op null.`;

    case 'factuur':
      return basePrompt + `Genereer een complete factuur in JSON formaat met deze velden:
{
  "factuurnummer": "string - formaat: 2025-XXX",
  "titel": "string",
  "klant_naam": "string",
  "klant_adres": "string",
  "klant_email": "string",
  "factuurdatum": "YYYY-MM-DD",
  "vervaldatum": "YYYY-MM-DD",
  "items": [
    {
      "omschrijving": "string",
      "aantal": number,
      "prijs_per_stuk": number,
      "btw_percentage": 21,
      "totaal": number
    }
  ],
  "subtotaal": number,
  "btw_bedrag": number,
  "totaal_bedrag": number,
  "valuta": "EUR",
  "opmerkingen": "string",
  "betalingsvoorwaarden": "string"
}

Extraheer alle factuurgegevens uit de input. Gebruik de huidige datum als factuurdatum tenzij anders aangegeven.`;

    case 'project':
      return basePrompt + `Genereer een complete projectdefinitie in JSON formaat:
{
  "naam": "string - project naam",
  "beschrijving": "string - gedetailleerde omschrijving",
  "klant_naam": "string",
  "start_datum": "YYYY-MM-DD",
  "eind_datum": "YYYY-MM-DD",
  "budget": number,
  "prioriteit": "laag|medium|hoog",
  "status": "planning|actief|on_hold|afgerond",
  "taken": [
    {
      "titel": "string",
      "beschrijving": "string",
      "duur_uren": number,
      "prioriteit": "laag|medium|hoog"
    }
  ],
  "benodigde_materialen": ["string"],
  "mijlpalen": [
    {
      "titel": "string",
      "datum": "YYYY-MM-DD"
    }
  ]
}`;

    case 'artikel':
      return basePrompt + `Genereer een complete artikel/product definitie in JSON formaat:
{
  "naam": "string - productnaam",
  "sku": "string - artikelnummer",
  "beschrijving": "string - gedetailleerde beschrijving",
  "categorie": "string",
  "prijs": number,
  "inkoopprijs": number,
  "voorraad": number,
  "eenheid": "stuk|kg|meter|liter|etc",
  "leverancier": "string",
  "locatie": "string - opslaglocatie",
  "minimum_voorraad": number,
  "btw_percentage": 21
}`;

    default:
      return basePrompt + `Analyseer de input en genereer een passend antwoord in JSON formaat met relevante velden.`;
  }
}

function parseAIResponse(entityType: string, response: string): any {
  // Try to extract JSON from the response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // If JSON parsing fails, return structured text
    }
  }
  
  // Return as structured object if no JSON found
  return {
    raw_response: response,
    entity_type: entityType,
    parse_method: 'text_extraction'
  };
}

// GET endpoint to retrieve conversation history
export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
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
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabaseAdmin
    // @ts-expect-error
      .from('ai_conversations')
      .select('*, ai_attachments(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data: conversations, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Error in GET AI conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
