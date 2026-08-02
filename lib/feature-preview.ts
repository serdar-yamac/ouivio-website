export const FEATURE_PREVIEW_HOST = "ouivio-website-git-feat-ouivio-core-foundation-ouivio.vercel.app";

export function isFeaturePreviewHost(location: Pick<Location, "hostname">) {
  return location.hostname === "localhost"
    || location.hostname === "127.0.0.1"
    || location.hostname === FEATURE_PREVIEW_HOST;
}
