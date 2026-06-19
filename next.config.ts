import type { NextConfig } from "next";

// GitHub Pages(프로젝트 사이트)는 /myuniverse 하위 경로로 서빙되므로
// 빌드 시 NEXT_PUBLIC_BASE_PATH 로 basePath 를 주입한다. (로컬 dev 에서는 비움)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export", // 서버 코드가 없는 완전 정적 앱 → 정적 내보내기
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
