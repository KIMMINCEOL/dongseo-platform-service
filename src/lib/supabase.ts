import { createClient } from '@supabase/supabase-js';
import { MealReview, RestaurantType } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// 인메모리 및 로컬 보존용 기본 리뷰 시드 데이터
let memoryReviews: MealReview[] = [
  {
    id: 'rev-1',
    menuId: 'caf-1',
    restaurant: '학생식당',
    date: '2026-09-27',
    studentEmailMasked: 'kim***@dongseo.ac.kr',
    rating: 5,
    comment: '돈까스 바삭하고 소스도 진해서 오늘 완전 최고였습니다! 가성비 짱',
    createdAt: '2026-09-27 12:30',
  },
  {
    id: 'rev-2',
    menuId: 'caf-1',
    restaurant: '학생식당',
    date: '2026-09-27',
    studentEmailMasked: 'lee***@dongseo.ac.kr',
    rating: 4,
    comment: '미니 우동 국물이 조금 짰지만 돈까스는 매우 만족스러웠어요.',
    createdAt: '2026-09-27 12:45',
  },
  {
    id: 'rev-3',
    menuId: 'caf-2',
    restaurant: '학생식당',
    date: '2026-09-27',
    studentEmailMasked: 'park***@dongseo.ac.kr',
    rating: 4,
    comment: '김치찌개 고기 듬뿍 들어있어서 든든하게 먹었습니다.',
    createdAt: '2026-09-27 13:10',
  },
  {
    id: 'rev-4',
    menuId: 'caf-4',
    restaurant: '교직원식당',
    date: '2026-09-27',
    studentEmailMasked: 'pro***@dongseo.ac.kr',
    rating: 5,
    comment: '갈비탕 국물이 깊고 버섯전도 따뜻해서 매우 훌륭했습니다.',
    createdAt: '2026-09-27 13:20',
  }
];

export async function getMealReviews(menuId?: string, restaurant?: string): Promise<MealReview[]> {
  if (supabase) {
    try {
      let query = supabase.from('meal_reviews').select('*').order('createdAt', { ascending: false });
      if (restaurant) query = query.eq('restaurant', restaurant);
      if (menuId) query = query.eq('menuId', menuId);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as MealReview[];
      }
    } catch (e) {
      console.warn('[Supabase Fallback] Falling back to memory reviews:', e);
    }
  }

  let result = [...memoryReviews];
  if (restaurant) {
    result = result.filter(r => r.restaurant === restaurant);
  }
  if (menuId) {
    result = result.filter(r => r.menuId === menuId);
  }
  return result;
}

export async function addMealReview(newRev: {
  menuId: string;
  restaurant: RestaurantType;
  date: string;
  studentEmailMasked: string;
  rating: number;
  comment: string;
}): Promise<MealReview> {
  const item: MealReview = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...newRev,
    createdAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('meal_reviews').insert([item]).select().single();
      if (!error && data) {
        memoryReviews.unshift(data as MealReview);
        return data as MealReview;
      }
    } catch (e) {
      console.warn('[Supabase Fallback] Insert fallback to memory:', e);
    }
  }

  memoryReviews.unshift(item);
  return item;
}
