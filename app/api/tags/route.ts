import { parseError } from '@/lib/error/parse';
import { database } from '@/lib/database';
import { tags as tagsTable } from '@/schema';
import { ilike } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const lang = (searchParams.get('lang') || 'en').toLowerCase();
    const rawSearch = (searchParams.get('search') || '').trim();
    const parentParam = (searchParams.get('parent') || '').trim();

    // Determine hierarchy context
    // If search contains '/', infer parent from prefix unless parent provided explicitly
    const hasSlash = rawSearch.includes('/');
    const inferredParent = hasSlash
      ? rawSearch.split('/').slice(0, -1).join('/')
      : '';
    const parent = (parentParam || inferredParent).replace(/^\/+|\/+$/g, '');
    const parentDepth = parent ? parent.split('/').length : 0;
    const needle = (hasSlash ? rawSearch.split('/').slice(-1)[0] : rawSearch).toLowerCase();

    // Load all tags (we may add smarter filtering later)
    const allRows = await database.select().from(tagsTable);

    type Option = {
      label: string;
      value: string; // path up to this segment (e.g., "style/realism") or full tag key for leaf
      expandable: boolean;
      hasChildren: boolean;
      baseLabel?: string;
      isLeaf?: boolean;
    };

    const keyToRow = new Map<string, any>();
    for (const r of allRows as any[]) keyToRow.set(r.keyEn as string, r);

    // Build children of a parent by next segment of keyEn treated as path
    const childrenMap = new Map<string, { hasChildren: boolean; isLeaf: boolean }>();

    for (const row of allRows as any[]) {
      const key = String(row.keyEn || '');
      if (!key) continue;
      const segs = key.split('/');

      if (!parent) {
        // root: child is segs[0]
        const childSeg = segs[0];
        const childPath = childSeg;
        const hasChildren = allRows.some((r: any) => String(r.keyEn || '').startsWith(childPath + '/'));
        const isLeaf = keyToRow.has(childPath);
        const entry = childrenMap.get(childPath) || { hasChildren: false, isLeaf: false };
        childrenMap.set(childPath, { hasChildren: entry.hasChildren || hasChildren, isLeaf: entry.isLeaf || isLeaf });
      } else if (key === parent || key.startsWith(parent + '/')) {
        const childSeg = segs[parentDepth];
        if (!childSeg) continue; // parent itself, no deeper seg
        const childPath = parent + '/' + childSeg;
        const hasChildren = allRows.some((r: any) => String(r.keyEn || '').startsWith(childPath + '/'));
        const isLeaf = keyToRow.has(childPath);
        const entry = childrenMap.get(childPath) || { hasChildren: false, isLeaf: false };
        childrenMap.set(childPath, { hasChildren: entry.hasChildren || hasChildren, isLeaf: entry.isLeaf || isLeaf });
      }
    }

    // Convert to options, apply filtering by needle
    const options: Option[] = [];
    for (const [path, meta] of childrenMap.entries()) {
      const seg = parent ? path.slice(parent.length + 1) : path; // last segment
      if (needle) {
        const segLc = seg.toLowerCase();
        // Try matching by segment itself or by localized label/synonym for exact path (if exists)
        let matches = segLc.startsWith(needle);
        if (!matches) {
          const exactRow = keyToRow.get(path);
          if (exactRow) {
            const labels = (exactRow.labels ?? {}) as Record<string, string>;
            const synonyms = (exactRow.synonyms ?? {}) as Record<string, string[]>;
            const label = (labels[lang] || labels['en'] || '') as string;
            const synArr = Array.isArray(synonyms?.[lang]) && synonyms[lang].length > 0
              ? synonyms[lang]
              : (Array.isArray(synonyms?.['en']) ? synonyms['en'] : []);
            const pool = [label, ...synArr].filter(Boolean).map((s) => s.toLowerCase());
            matches = pool.some((s) => s.includes(needle));
          }
        }
        if (!matches) continue;
      }

      const exactRow = keyToRow.get(path);
      const labels = (exactRow?.labels ?? {}) as Record<string, string>;
      const display = (labels?.[lang] || labels?.['en'] || seg) as string;
      const baseLabel = (labels?.[lang] || labels?.['en'] || exactRow?.keyEn) as string | undefined;

      options.push({
        label: display,
        value: path,
        expandable: Boolean(meta.hasChildren),
        hasChildren: Boolean(meta.hasChildren),
        baseLabel,
        isLeaf: Boolean(meta.isLeaf),
      });
    }

    // If no parent specified and needle provided (legacy search behavior),
    // also include synonym-based flat options as a fallback for discoverability
    if (!parent && options.length === 0) {
      const rows = rawSearch
        ? await database
            .select()
            .from(tagsTable)
            .where(ilike(tagsTable.keyEn, `%${rawSearch}%`))
        : await database.select().from(tagsTable);

      for (const row of rows as any[]) {
        const labels = (row.labels ?? {}) as Record<string, string>;
        const synonyms = (row.synonyms ?? {}) as Record<string, string[]>;
        const synArr =
          Array.isArray(synonyms?.[lang]) && synonyms[lang].length > 0
            ? synonyms[lang]
            : (Array.isArray(synonyms?.['en']) ? synonyms['en'] : []);

        if (synArr.length > 0) {
          for (const s of synArr) {
            options.push({
              label: s,
              value: row.keyEn as string,
              expandable: false,
              hasChildren: false,
              baseLabel: (labels[lang] || labels['en'] || row.keyEn) as string,
              isLeaf: true,
            });
          }
        } else {
          const fallbackLabel = (labels[lang] || labels['en'] || row.keyEn) as string;
          options.push({
            label: fallbackLabel,
            value: row.keyEn as string,
            expandable: false,
            hasChildren: false,
            baseLabel: fallbackLabel,
            isLeaf: true,
          });
        }
      }
    }

    // Sort: non-expandable (leaves) last; alphabetically by label
    options.sort((a, b) => {
      if (a.expandable !== b.expandable) return a.expandable ? -1 : 1;
      return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
    });

    return new Response(
      JSON.stringify({ parent: parent || 'root', options }),
      { headers: { 'content-type': 'application/json' } },
    );
  } catch (error) {
    const message = parseError(error);
    return new Response(message, { status: 400 });
  }
};