export interface LogoConfig {
  light: string | null;
  dark: string | null;
}

/**
 * Parses the storeLogo field from StoreSetting.
 * Supports legacy single string URLs as well as JSON containing { light, dark }.
 */
export function parseLogo(storeLogo: string | null | undefined): LogoConfig {
  if (!storeLogo) {
    return { light: null, dark: null };
  }

  const trimmed = storeLogo.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      const light = parsed.light || parsed.storeLogo || null;
      const dark = parsed.dark || parsed.light || null;
      return { light, dark };
    } catch {
      return { light: trimmed, dark: trimmed };
    }
  }

  return { light: trimmed, dark: trimmed };
}

/**
 * Serializes logo config into a JSON string to be stored in the storeLogo column.
 */
export function serializeLogo(config: { light?: string | null; dark?: string | null }): string {
  return JSON.stringify({
    light: config.light ?? null,
    dark: config.dark ?? null,
  });
}
