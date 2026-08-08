Warning: truncated output (original token count: 21650)
Total output lines: 416

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The partner workspace is an authenticated, fast-changing application view.
// It must not be restored from a browser's back/forward cache after a preview
// deployment; otherwise partners can keep seeing an earlier dashboard bundle.
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("CDN-Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/partner/:path*"],
};
