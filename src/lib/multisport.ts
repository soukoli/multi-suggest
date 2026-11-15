// Official "My MultiSport" app (Benefit Systems). my.multisport.cz publishes
// apple-app-site-association + assetlinks.json for /mobile/*, so a tap on this
// link opens the installed app on iOS and Android (universal / app link).
export const OFFICIAL_APP_LINK = "https://my.multisport.cz/mobile/";
export const APP_STORE = "https://apps.apple.com/cz/app/my-multisport/id1616481894";
export const PLAY_STORE =
  "https://play.google.com/store/apps/details?id=pl.benefitsystems.multisport.mymultisport";
export const ANDROID_INTENT =
  "intent://my.multisport.cz/mobile/#Intent;scheme=https;package=pl.benefitsystems.multisport.mymultisport;S.browser_fallback_url=" +
  encodeURIComponent(PLAY_STORE) +
  ";end";

export function cardLink(): string {
  return /Android/i.test(navigator.userAgent) ? ANDROID_INTENT : OFFICIAL_APP_LINK;
}
