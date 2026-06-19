// 정적 배포(GitHub Pages) 시 하위 경로(basePath)를 자동으로 붙인다.
// 빌드 시점에 인라인되는 환경변수이므로 dev/배포 양쪽에서 안전.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const asset = (path: string): string => `${BASE_PATH}${path}`;
