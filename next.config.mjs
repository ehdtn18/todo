/** @type {import('next').NextConfig} */
const nextConfig = {
  // 참고 앱은 명령형 DOM 조작(contenteditable, innerHTML)을 그대로 이식하므로
  // StrictMode 이중 실행으로 인한 중복 초기화를 피하기 위해 비활성화한다.
  reactStrictMode: false,
  // [영구 유지] 개발 모드 화면 구석의 Next.js 뱃지(dev indicator) 숨김.
  // 사용자 요청: 어떤 업데이트에서도 이 설정을 절대 제거하지 말 것.
  devIndicators: false,
};

export default nextConfig;
