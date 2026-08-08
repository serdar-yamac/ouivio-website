const featurePreviewBranch = "feat/ouivio-core-foundation";
// This is Vercel's persistent branch link. Manual preview redeploys inherit it,
// while the older `git-feat-...` alias can stay pinned to an obsolete build.
const featurePreviewOrigin = "https://ouivio-website-serdar-yamac-ouivio.vercel.app";

function normalizeOrigin(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Die OAuth-Rücksprungadresse muss HTTP oder HTTPS verwenden.");
  return url.origin;
}

/**
 * OAuth providers accept only explicitly registered callback URLs. Vercel creates
 * a new immutable preview URL for every commit, so this feature branch always
 * uses its stable branch alias unless an environment-specific origin is set.
 */
export function oauthCallbackOrigin(requestOrigin: string) {
  const configured = process.env.OAUTH_CALLBACK_ORIGIN;
  if (configured) return normalizeOrigin(configured);
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === featurePreviewBranch) return featurePreviewOrigin;
  return normalizeOrigin(requestOrigin);
}

export function oauthCallbackUrl(provider: string, requestOrigin: string) {
  return new URL(`/api/calendar/${provider}/callback`, oauthCallbackOrigin(requestOrigin)).toString();
}
