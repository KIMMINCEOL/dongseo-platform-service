import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '동서대학교 스마트 캠퍼스 플랫폼',
  description: '동서대학교 학식 정보, 학우들의 생생 한줄평, 공식 공지사항 모아보기 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="bg-slate-50 text-slate-800 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
