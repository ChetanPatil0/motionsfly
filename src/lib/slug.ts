import { slugify } from "@/schemas/product";

type SlugChecker = (candidate: string) => Promise<boolean>; // returns true if taken

export async function generateUniqueSlug(base: string, isTaken: SlugChecker): Promise<string> {
  const baseSlug = slugify(base) || "item";
  let candidate = baseSlug;
  let suffix = 1;

  while (await isTaken(candidate)) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}
