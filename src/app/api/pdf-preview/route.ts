import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/admin'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Niet geautoriseerd' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, template } = body // type: 'offerte' | 'factuur', template: 'modern' | 'classic' | 'minimal'

    // For now, return a mock PDF URL - in production this would generate actual PDFs
    const mockPdfUrl = `/api/pdf-preview/sample-${type}-${template}.pdf`

    return NextResponse.json({
      success: true,
      previewUrl: mockPdfUrl,
      message: `${type} preview met ${template} template gegenereerd`
    })
  } catch (error) {
    console.error('Error in /api/pdf-preview POST:', error)
    return NextResponse.json(
      { success: false, error: 'Server fout' },
      { status: 500 }
    )
  }
}