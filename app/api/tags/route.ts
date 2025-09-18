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

    const options: Array<{ label: string; value: string; expandable: boolean; hasChildren: boolean; baseLabel: string }> = [];
    for (const row of rows as any[]) {
      const labels = (row.labels ?? {}) as Record<string, string>;
      const synonyms = (row.synonyms ?? {}) as Record<string, string[]>;
      const synArr = Array.isArray(synonyms?.[lang]) && synonyms[lang].length > 0
        ? synonyms[lang]
        : (Array.isArray(synonyms?.['en']) ? synonyms['en'] : []);

      const filteredSyns = q
        ? synArr.filter((s) => s.toLowerCase().includes(q))
        : synArr;

      if (filteredSyns.length > 0) {
        for (const s of filteredSyns) {
          options.push({ label: s, value: row.keyEn as string, expandable: false, hasChildren: false, baseLabel: (labels[lang] || labels['en'] || row.keyEn) as string });
        }
      } else {
        // Fallback к основному label, если синонимов нет или фильтр отсёк все
        const fallbackLabel = labels[lang] || labels['en'] || row.keyEn;
        if (!q || fallbackLabel.toLowerCase().includes(q) || String(row.keyEn).toLowerCase().includes(q)) {
          options.push({ label: fallbackLabel as string, value: row.keyEn as string, expandable: false, hasChildren: false, baseLabel: fallbackLabel as string });
        }
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


