import { NextResponse } from 'next/server';
import { verifyReport } from '@/lib/reportsService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const action = body.action === 'confirm_restored' ? 'confirm_restored' : 'confirm_outage';

    const result = await verifyReport(id, action);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, report: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to verify report' }, { status: 500 });
  }
}
