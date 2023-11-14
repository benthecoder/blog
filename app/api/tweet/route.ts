import { NextRequest, NextResponse } from 'next/server';
import { queryBuilder } from '../../../lib/planetscale';

export async function POST(request: NextRequest) {
  const body = await request.json();
  await queryBuilder
    .insertInto('tweets')
    .values({
      content: (body.body || '').slice(0, 500),
    })
    .execute();

  return new NextResponse(JSON.stringify({ error: null }), { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  await queryBuilder.deleteFrom('tweets').where('id', '=', body.id).execute();

  return new NextResponse(null, { status: 204 });
}
