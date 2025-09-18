import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Extract hashtags that start with # and contain letters/numbers/-/_ (unicode aware basic)
export const extractHashtags = (text: string): string[] => {
  if (!text) return [];
  // Match #тег, allow unicode letters and digits, dash and underscore
  const regex = /(^|\s)(#([\p{L}\p{N}_-]{1,64}))/gu;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const tag = m[3];
    if (tag) out.push(tag);
  }
  // dedupe
  return Array.from(new Set(out));
};

// Normalize localized tag label to canonical EN by mapping dictionary
export const normalizeTagsToEn = async (
  localized: string[],
  mapper: (input: string) => Promise<string | null>
): Promise<string[]> => {
  const results = await Promise.all(
    localized.map(async (t) => (await mapper(t)) || null)
  );
  return Array.from(new Set(results.filter((v): v is string => Boolean(v))));
};

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
