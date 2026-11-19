-- 동서대학교 스마트 캠퍼스 학식 한줄평 테이블 생성
CREATE TABLE IF NOT EXISTS public.meal_reviews (
  id TEXT PRIMARY KEY,
  "menuId" TEXT NOT NULL,
  restaurant TEXT NOT NULL,
  date TEXT NOT NULL,
  "studentEmailMasked" TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.meal_reviews ENABLE ROW LEVEL SECURITY;

-- 익명 사용자(anon) 및 모든 사용자가 리뷰를 조회할 수 있는 정책
CREATE POLICY "Allow public read access to meal_reviews"
ON public.meal_reviews
FOR SELECT
TO public
USING (true);

-- 익명 사용자(anon) 및 모든 사용자가 리뷰를 추가할 수 있는 정책 (웹메일 인증은 백엔드 API에서 검증)
CREATE POLICY "Allow public insert access to meal_reviews"
ON public.meal_reviews
FOR INSERT
TO public
WITH CHECK (true);
