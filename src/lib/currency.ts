import type { Currency } from "@prisma/client";

/** India -> INR, everything else -> USD. */
export function resolveCurrencyFromCountry(countryCode: string | undefined | null): Currency {
  return countryCode?.toUpperCase() === "IN" ? "INR" : "USD";
}

/**
 * Resolves the active currency taking into account explicit user override cookie
 * first, then geo country cookies / headers, defaulting to INR for India and USD for international.
 */
export function resolveActiveCurrency(
  cookiesStore?: { get: (key: string) => { value: string } | undefined },
  headersList?: { get: (key: string) => string | null }
): Currency {
  const userPref = cookiesStore?.get("mf_currency_view")?.value;
  if (userPref === "INR" || userPref === "USD") {
    return userPref;
  }

  const countryCookie = cookiesStore?.get("mf_country")?.value;
  if (countryCookie) {
    return resolveCurrencyFromCountry(countryCookie);
  }

  if (headersList) {
    const geo =
      headersList.get("cf-ipcountry") ||
      headersList.get("x-vercel-ip-country") ||
      headersList.get("x-country");
    if (geo) {
      return resolveCurrencyFromCountry(geo);
    }
  }

  return "INR";
}

export function priceForCurrency(
  entity: { priceINR: number; priceUSD: number },
  currency: Currency
): number {
  return currency === "INR" ? entity.priceINR : entity.priceUSD;
}

