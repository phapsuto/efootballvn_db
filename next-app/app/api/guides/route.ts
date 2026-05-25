import { NextRequest, NextResponse } from 'next/server';

import { createGuide, listGuides } from '@/lib/data/repository';

export async function GET() {
  try {
    const guides = await listGuides();
    return NextResponse.json(guides);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, title, summary, content, diagramUrl } = body;
    
    if (!category || !title || !summary || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newGuide = await createGuide({
      category: category.trim(),
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      diagramUrl: diagramUrl ? diagramUrl.trim() : undefined
    });

    if (!newGuide) {
      return NextResponse.json({ error: 'Failed to create guide in database' }, { status: 500 });
    }

    return NextResponse.json(newGuide, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
