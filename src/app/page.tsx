'use client';

import React, { useState, useEffect } from 'react';
import { CafeteriaMenu, MealReview, Notice, NoticeCategory, RestaurantType } from '@/types';

const BOOKMARK_STORAGE_KEY = 'dsu_bookmarked_notices';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'meals' | 'notices'>('meals');

  // 식당 상태
  const [restaurant, setRestaurant] = useState<RestaurantType>('학생식당');
  const [menus, setMenus] = useState<CafeteriaMenu[]>([]);
  const [reviews, setReviews] = useState<MealReview[]>([]);
  const [isMealsLoading, setIsMealsLoading] = useState<boolean>(true);
  const [isReviewsLoading, setIsReviewsLoading] = useState<boolean>(true);

  // 공지사항 상태
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticeCategory, setNoticeCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isNoticesLoading, setIsNoticesLoading] = useState<boolean>(true);

  // 모달 상태
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [reviewEmail, setReviewEmail] = useState<string>('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // 공지 상세 모달
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isLoadingNoticeDetail, setIsLoadingNoticeDetail] = useState<boolean>(false);

  // 날짜 표시
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  useEffect(() => {
    const today = new Date();
    const str = today.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
    setCurrentDateStr(str);

    // 북마크 로컬스토리지 불러오기
    try {
      const saved = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (saved) {
        setBookmarkedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load bookmarks', e);
    }
  }, []);

  // 식단 불러오기
  const fetchMenus = async (rest: RestaurantType) => {
    setIsMealsLoading(true);
    try {
      const res = await fetch(`/api/cafeteria?restaurant=${encodeURIComponent(rest)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMenus(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch menus', err);
    } finally {
      setIsMealsLoading(false);
    }
  };

  // 리뷰 불러오기
  const fetchReviews = async (rest: RestaurantType) => {
    setIsReviewsLoading(true);
    try {
      const res = await fetch(`/api/cafeteria/reviews?restaurant=${encodeURIComponent(rest)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setReviews(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus(restaurant);
    fetchReviews(restaurant);
  }, [restaurant]);

  // 공지사항 불러오기
  const fetchNotices = async (cat: string, q: string) => {
    setIsNoticesLoading(true);
    try {
      const categoryParam = cat === 'all' || cat === 'bookmarks' ? '전체' : cat;
      const url = `/api/notices?category=${encodeURIComponent(categoryParam)}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotices(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch notices', err);
    } finally {
      setIsNoticesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'notices') {
      const timer = setTimeout(() => {
        fetchNotices(noticeCategory, searchQuery);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activeTab, noticeCategory, searchQuery]);

  // 북마크 토글 함수
  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds(prev => {
      let updated: string[];
      if (prev.includes(id)) {
        updated = prev.filter(item => item !== id);
      } else {
        updated = [...prev, id];
      }
      try {
        localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage error', err);
      }
      return updated;
    });
  };

  // 리뷰 작성 제출
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewEmail.trim().toLowerCase().endsWith('@dongseo.ac.kr')) {
      alert('동서대학교 웹메일(@dongseo.ac.kr) 계정으로 인증된 학우만 한줄평을 작성할 수 있습니다.');
      return;
    }
    if (reviewComment.trim().length < 2) {
      alert('최소 2자 이상의 한줄평을 입력해 주세요.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/cafeteria/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuId: selectedMenuId || (menus[0] ? menus[0].id : 'caf-1'),
          restaurant,
          email: reviewEmail.trim(),
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(`성공적으로 한줄평이 등록되었습니다! (${json.data.studentEmailMasked} 으로 안전하게 등록됨)`);
        setIsReviewModalOpen(false);
        setReviewComment('');
        fetchReviews(restaurant);
      } else {
        alert(json.error || '리뷰 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error('Review submit error', err);
      alert('서버와 통신하는 중 문제가 발생했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // 공지 상세 모달 열기
  const handleOpenNotice = async (notice: Notice) => {
    setSelectedNotice(notice);
    setIsLoadingNoticeDetail(true);
    try {
      const res = await fetch(`/api/notices/${notice.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedNotice(json.data);
      }
    } catch (err) {
      console.warn('Failed to load full detail, showing basic', err);
    } finally {
      setIsLoadingNoticeDetail(false);
    }
  };

  // 필터된 공지사항 리스트 계산
  const displayedNotices = notices.filter(n => {
    if (noticeCategory === 'bookmarks') {
      return bookmarkedIds.includes(n.id);
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* 상단 네비게이션 헤더 */}
      <header className="bg-dongseo-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-dongseo-700 font-black text-xl shadow">
              DSU
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">동서대학교 스마트 캠퍼스</h1>
              <p className="text-xs text-dongseo-200">학식 정보 · 한줄평 리뷰 · 공지사항 모아보기</p>
            </div>
          </div>

          {/* 탭 스위처 */}
          <nav className="flex space-x-1 bg-dongseo-800/60 p-1 rounded-xl text-sm font-medium">
            <button
              onClick={() => setActiveTab('meals')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'meals'
                  ? 'bg-white text-dongseo-700 shadow font-semibold'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <i className="fa-solid fa-utensils mr-1.5"></i>학식 & 리뷰
            </button>
            <button
              onClick={() => setActiveTab('notices')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'notices'
                  ? 'bg-white text-dongseo-700 shadow font-semibold'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <i className="fa-solid fa-bullhorn mr-1.5"></i>공지사항 & 북마크
            </button>
          </nav>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        {/* 1. 학식 및 리뷰 탭 */}
        {activeTab === 'meals' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            {/* 식당 선택 및 오늘 일자 안내 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-dongseo-50 text-dongseo-700 border border-dongseo-200">
                    오늘의 식단
                  </span>
                  <span className="text-slate-500 text-sm">{currentDateStr}</span>
                </div>
                <h2 className="text-xl font-bold mt-1 text-slate-900">
                  {restaurant} 메뉴 및 학우 평가
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={restaurant}
                  onChange={(e) => setRestaurant(e.target.value as RestaurantType)}
                  className="bg-slate-100 border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-dongseo-700 outline-none"
                >
                  <option value="학생식당">학생식당 (스튜던트 플라자)</option>
                  <option value="교직원식당">교직원식당</option>
                  <option value="기숙사식당">기숙사(누리관) 식당</option>
                </select>
                <button
                  onClick={() => {
                    setSelectedMenuId(menus[0]?.id || '');
                    setIsReviewModalOpen(true);
                  }}
                  className="bg-dongseo-700 hover:bg-dongseo-800 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition flex items-center space-x-1.5"
                >
                  <i className="fa-solid fa-pen-nib"></i>
                  <span>리뷰 작성</span>
                </button>
              </div>
            </div>

            {/* 메뉴 카드 목록 */}
            {isMealsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                    <div className="h-12 bg-slate-100 rounded"></div>
                  </div>
                ))}
              </div>
            ) : menus.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
                해당 식당에 등록된 식단 정보가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {menus.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="bg-slate-100/70 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-semibold text-dongseo-700 bg-dongseo-50 px-2 py-0.5 rounded border border-dongseo-200">
                          {m.cornerName}
                        </span>
                        <span className="text-sm font-bold text-slate-800">{m.price || '5,000원'}</span>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-slate-900 text-base mb-2">
                          {m.menuItems[0] || '메뉴명'}
                        </h4>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {m.menuItems.slice(1).map((item, idx) => (
                            <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                        <span className="text-amber-500 font-bold flex items-center gap-1">
                          <i className="fa-solid fa-star"></i> {m.rating ? m.rating.toFixed(1) : '4.5'}
                          <span className="text-slate-400 font-normal">({m.reviewCount || 0}개)</span>
                        </span>
                        <button
                          onClick={() => {
                            setSelectedMenuId(m.id);
                            setIsReviewModalOpen(true);
                          }}
                          className="text-dongseo-700 hover:text-dongseo-800 font-semibold hover:underline"
                        >
                          한줄평 남기기 →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 실시간 한줄평 섹션 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-slate-900">학우들의 생생 한줄평</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                    {reviews.length}개
                  </span>
                </div>
                <p className="text-xs text-dongseo-700 font-medium">
                  <i className="fa-solid fa-shield-halved mr-1"></i>동서대 웹메일(@dongseo.ac.kr) 인증 완료
                </p>
              </div>

              {isReviewsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  아직 등록된 한줄평이 없습니다. 첫 후기를 남겨보세요!
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-amber-400 text-xs flex">
                            {Array.from({ length: r.rating }).map((_, idx) => (
                              <i key={idx} className="fa-solid fa-star"></i>
                            ))}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">{r.studentEmailMasked}</span>
                          <span className="text-[11px] text-slate-400">· {r.createdAt || '방금 전'}</span>
                        </div>
                        <p className="text-sm text-slate-800 font-medium">{r.comment}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-500 font-medium whitespace-nowrap">
                        {r.restaurant}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 2. 공지사항 탭 */}
        {activeTab === 'notices' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">동서대학교 공식 공지사항</h2>
                <p className="text-xs text-slate-500 mt-0.5">학교 홈페이지 실시간 스크래핑 및 관심 공지 북마크</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 카테고리 필터 */}
                <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                  {[
                    { key: 'all', label: '전체' },
                    { key: '학사', label: '학사' },
                    { key: '장학', label: '장학/등록' },
                    { key: '취업', label: '취업/진로' },
                    { key: 'bookmarks', label: '내 북마크', icon: 'fa-star text-amber-500' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setNoticeCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-md transition ${
                        noticeCategory === cat.key
                          ? 'bg-white text-dongseo-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat.icon && <i className={`fa-solid ${cat.icon} mr-1`}></i>}
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* 검색창 */}
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="공지 검색..."
                    className="pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-dongseo-700 w-48"
                  />
                </div>
              </div>
            </div>

            {/* 공지사항 리스트 테이블 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {isNoticesLoading ? (
                <div className="divide-y divide-slate-100">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 flex items-center justify-between animate-pulse">
                      <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-5 bg-slate-100 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : displayedNotices.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  {noticeCategory === 'bookmarks'
                    ? '북마크된 공지사항이 없습니다. 별표를 눌러 보관해보세요!'
                    : '표시할 공지사항이 없습니다.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {displayedNotices.map((n) => {
                    const isBookmarked = bookmarkedIds.includes(n.id);
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleOpenNotice(n)}
                        className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0 ${
                              n.category === '장학'
                                ? 'bg-amber-100 text-amber-800'
                                : n.category === '취업'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-dongseo-50 text-dongseo-700'
                            }`}
                          >
                            {n.category}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 truncate">
                              {n.isPinned && (
                                <span className="text-dongseo-700 font-bold mr-1.5">[중요]</span>
                              )}
                              {n.title}
                            </h4>
                            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                              <span>{n.author}</span>
                              <span>·</span>
                              <span>{n.date}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => toggleBookmark(n.id, e)}
                          className={`p-2 transition ${
                            isBookmarked ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'
                          }`}
                          title="북마크 토글"
                        >
                          <i className={`${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-star text-base`}></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* 리뷰 작성 모달 */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <div className="flex items-center space-x-2 text-dongseo-700 mb-1">
              <i className="fa-solid fa-utensils"></i>
              <span className="text-xs font-bold uppercase tracking-wider">Meal Review</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">학식 한줄평 남기기</h3>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  리뷰 대상 식당 / 메뉴
                </label>
                <select
                  value={selectedMenuId}
                  onChange={(e) => setSelectedMenuId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-dongseo-700"
                >
                  {menus.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.restaurant}] {m.menuItems[0] || m.cornerName}
                    </option>
                  ))}
                  {menus.length === 0 && <option value="general">[{restaurant}] 전체 일반 메뉴</option>}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">동서대학교 웹메일</label>
                  <span className="text-[11px] text-dongseo-600 font-medium">자동 마스킹 저장</span>
                </div>
                <input
                  type="email"
                  required
                  value={reviewEmail}
                  onChange={(e) => setReviewEmail(e.target.value)}
                  placeholder="student@dongseo.ac.kr"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-dongseo-700"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  ※ @dongseo.ac.kr 메일만 작성 가능하며, &apos;stu***@dongseo.ac.kr&apos;로 암호화 표기됩니다.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">별점</label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setReviewRating(val)}
                      className={`text-2xl transition ${
                        val <= reviewRating ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      <i className="fa-solid fa-star"></i>
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">{reviewRating}점</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  한줄평 (최소 2자)
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="맛, 양, 가성비 등에 대한 솔직한 후기를 남겨주세요."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-dongseo-700"
                ></textarea>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-100 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 py-2.5 bg-dongseo-700 hover:bg-dongseo-800 text-white text-sm font-semibold rounded-lg shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingReview ? '등록 중...' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 공지사항 상세 모달 */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedNotice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <div className="border-b border-slate-100 pb-4 pr-8">
              <span className="inline-block text-xs font-bold text-dongseo-700 bg-dongseo-50 px-2 py-0.5 rounded-full mb-1">
                {selectedNotice.category}
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {selectedNotice.title}
              </h3>
              <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2">
                <span>
                  <i className="fa-regular fa-calendar mr-1"></i>
                  {selectedNotice.date}
                </span>
                <span>
                  <i className="fa-regular fa-user mr-1"></i>
                  {selectedNotice.author}
                </span>
                {selectedNotice.views !== undefined && (
                  <span>
                    <i className="fa-regular fa-eye mr-1"></i>조회 {selectedNotice.views}
                  </span>
                )}
              </div>
            </div>

            <div className="py-5 overflow-y-auto text-sm text-slate-700 leading-relaxed flex-1 whitespace-pre-line">
              {isLoadingNoticeDetail ? (
                <div className="py-8 text-center text-slate-400 animate-pulse">
                  공지사항 본문을 불러오는 중입니다...
                </div>
              ) : (
                <>
                  {selectedNotice.contentText || selectedNotice.contentHtml || '내용이 없습니다.'}

                  {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <h5 className="text-xs font-bold text-slate-800 mb-2">첨부파일</h5>
                      <div className="space-y-1.5">
                        {selectedNotice.attachments.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-2 text-xs bg-slate-100 hover:bg-dongseo-50 text-dongseo-700 px-3 py-1.5 rounded-md border border-slate-200 transition"
                          >
                            <i className="fa-solid fa-paperclip"></i>
                            <span>{file.name}</span>
                            {file.size && <span className="text-slate-400">({file.size})</span>}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => toggleBookmark(selectedNotice.id)}
                className={`text-sm px-4 py-2 rounded-lg border flex items-center gap-1.5 transition ${
                  bookmarkedIds.includes(selectedNotice.id)
                    ? 'border-amber-300 bg-amber-50 text-amber-700 font-semibold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <i
                  className={`${
                    bookmarkedIds.includes(selectedNotice.id)
                      ? 'fa-solid fa-star text-amber-500'
                      : 'fa-regular fa-star'
                  }`}
                ></i>
                {bookmarkedIds.includes(selectedNotice.id) ? '북마크 보관됨' : '북마크 저장'}
              </button>

              <div className="flex space-x-2">
                {selectedNotice.url && (
                  <a
                    href={selectedNotice.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                  >
                    <span>원문 링크</span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  </a>
                )}
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="bg-slate-900 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-slate-800 transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>동서대학교(Dongseo University) 스마트 캠퍼스 포털 서비스</p>
        <p className="mt-1">
          버건디 테마(#9e1b32) · 웹메일 마스킹 인증 · 크롤러 & Supabase 연동 시스템
        </p>
      </footer>
    </div>
  );
}
