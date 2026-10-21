import { NextResponse } from 'next/server';
import { getHeatmapPoints } from '@/lib/reportsService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const points = await getHeatmapPoints();
    return NextResponse.json({
      success: true,
      count: points.length,
      points,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve heatmap points' },
      { status: 500 }
    );
  }
}
