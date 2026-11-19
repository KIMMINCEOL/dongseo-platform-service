import { NextRequest, NextResponse } from 'next/server';
import { scrapeDongseoNotices } from '@/lib/dongseo-crawler';
import { NoticeCategory } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get('category') || '전체') as NoticeCategory;
  const q = searchParams.get('q') || '';

  try {
    let notices = await scrapeDongseoNotices(category);

    if (q) {
      const qLower = q.toLowerCase();
      notices = notices.filter(
        n =>
          n.title.toLowerCase().includes(qLower) ||
          (n.contentText && n.contentText.toLowerCase().includes(qLower)) ||
          n.author.toLowerCase().includes(qLower)
      );
    }

    return NextResponse.json({ success: true, data: notices });
  } catch (error) {
    return NextResponse.json({ success: false, error: '공지사항을 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
