import { parseError } from '@/lib/error/parse';
import { database } from '@/lib/database';
import { tags as tagsTable } from '@/schema';

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const lang = (searchParams.get('lang') || 'en').toLowerCase();
    const q = (searchParams.get('search') || '').trim().toLowerCase();

    const rows = await database.select().from(tagsTable);

    // Фильтруем только по key_en (регистронезависимо). Больше ни по каким полям не ищем
    const keyFiltered = q
      ? (rows as any[]).filter((row) => String(row.keyEn).toLowerCase().includes(q))
      : (rows as any[]);

    const options: Array<{ label: string; value: string; expandable: boolean; hasChildren: boolean; baseLabel: string }> = [];
    for (const row of keyFiltered) {
      const labels = (row.labels ?? {}) as Record<string, string>;
      const synonyms = (row.synonyms ?? {}) as Record<string, string[]>;
      const synArr = Array.isArray(synonyms?.[lang]) && synonyms[lang].length > 0
        ? synonyms[lang]
        : (Array.isArray(synonyms?.['en']) ? synonyms['en'] : []);

      // Не фильтруем список синонимов по запросу: возвращаем их все для данного key_en
      if (synArr.length > 0) {
        for (const s of synArr) {
          options.push({ label: s, value: row.keyEn as string, expandable: false, hasChildren: false, baseLabel: (labels[lang] || labels['en'] || row.keyEn) as string });
        }
      } else {
        // Если синонимов нет — возвращаем базовый label
        const fallbackLabel = (labels[lang] || labels['en'] || row.keyEn) as string;
        options.push({ label: fallbackLabel, value: row.keyEn as string, expandable: false, hasChildren: false, baseLabel: fallbackLabel });
      }
    }

    return new Response(
      JSON.stringify({ parent: 'root', options }),
      { headers: { 'content-type': 'application/json' } },
    );
  } catch (error) {
    const message = parseError(error);
    return new Response(message, { status: 400 });
  }
};


