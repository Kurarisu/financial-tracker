import { NextResponse } from 'next/server';
import { addReport, getHeatmapPoints } from '@/lib/reportsService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const reports = await getHeatmapPoints();
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { locationName, latitude, longitude, outageType, rawContent } = body;

    if (!locationName || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'locationName, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    const report = await addReport({
      locationName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      outageType: outageType || 'TOTAL_BLACKOUT',
      rawContent,
      sourceType: 'USER_REPORT',
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save report' }, { status: 500 });
  }
}
