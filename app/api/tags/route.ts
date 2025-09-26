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
    const keyParam = (searchParams.get('key') || '').trim();

    // Determine hierarchy context
    // If search contains '/', infer parent from prefix unless parent provided explicitly
    const hasSlash = rawSearch.includes('/');
    const inferredParent = hasSlash
      ? rawSearch.split('/').slice(0, -1).join('/')
      : '';
    const parent = (parentParam || inferredParent).replace(/^\/+|\/+$/g, '');
    const parentDepth = parent ? parent.split('/').length : 0;
    const needle = (hasSlash ? rawSearch.split('/').slice(-1)[0] : rawSearch).toLowerCase();

    // If key specified, return a single tag row with labels and synonyms
    if (keyParam) {
      const rows = await database.select().from(tagsTable);
      const found = (rows as any[]).find((r) => String(r.keyEn || '') === keyParam);
      if (!found) return new Response('Not Found', { status: 404 });
      return new Response(
        JSON.stringify({
          keyEn: found.keyEn,
          labels: found.labels ?? {},
          synonyms: found.synonyms ?? {},
          isPublic: Boolean(found.isPublic),
          createdByUserId: found.createdByUserId ?? null,
        }),
        { headers: { 'content-type': 'application/json' } },
      );
    }

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

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const parent: string = typeof body?.parent === 'string' ? body.parent.trim().replace(/^\/+|\/+$/g, '') : '';
    const slug: string | undefined = typeof body?.slug === 'string' ? body.slug.trim().replace(/^\/+|\/+$/g, '') : undefined;
    const keyEnBody: string | undefined = typeof body?.keyEn === 'string' ? body.keyEn.trim().replace(/^\/+|\/+$/g, '') : undefined;
    const labels: Record<string, string> = (body?.labels && typeof body.labels === 'object') ? body.labels : {};
    const synonyms: Record<string, string[]> = (body?.synonyms && typeof body.synonyms === 'object') ? body.synonyms : {};
    const isPublic: boolean = Boolean(body?.isPublic ?? true);

    const keyEn = keyEnBody || (parent ? `${parent}/${slug}` : (slug || ''));
    if (!keyEn) return new Response('keyEn or slug required', { status: 400 });
    const valid = /^[a-z0-9_\-/]{1,128}$/i.test(keyEn);
    if (!valid) return new Response('Invalid keyEn format', { status: 400 });

    const existing = await database.select().from(tagsTable);
    if ((existing as any[]).some((r) => String(r.keyEn || '').toLowerCase() === keyEn.toLowerCase())) {
      return new Response('Already exists', { status: 409 });
    }

    const defaultLabels = Object.keys(labels).length > 0 ? labels : { en: keyEn };
    await database.insert(tagsTable).values({
      keyEn,
      labels: defaultLabels,
      synonyms,
      isPublic,
    } as any);

    return new Response(JSON.stringify({ keyEn }), { headers: { 'content-type': 'application/json' } });
  } catch (error) {
    const message = parseError(error);
    return new Response(message, { status: 400 });
  }
};

export const PATCH = async (req: Request) => {
  try {
    const body = await req.json();
    const keyEn: string = String(body?.keyEn || '').trim();
    if (!keyEn) return new Response('keyEn required', { status: 400 });
    const set: Record<string, any> = (body?.set && typeof body.set === 'object') ? body.set : {};
    const newKeyEn: string | undefined = typeof set?.newKeyEn === 'string' ? set.newKeyEn.trim().replace(/^\/+|\/+$/g, '') : undefined;
    const cascade: boolean = Boolean(set?.cascade);

    const rows = await database.select().from(tagsTable);
    const byKey = new Map((rows as any[]).map((r) => [String(r.keyEn || ''), r]));
    const target = byKey.get(keyEn);
    if (!target) return new Response('Not Found', { status: 404 });

    const hasChildren = (rows as any[]).some((r) => String(r.keyEn || '').startsWith(keyEn + '/'));

    if (newKeyEn && newKeyEn !== keyEn) {
      const valid = /^[a-z0-9_\-/]{1,128}$/i.test(newKeyEn);
      if (!valid) return new Response('Invalid newKeyEn format', { status: 400 });
      const exists = (rows as any[]).some((r) => String(r.keyEn || '').toLowerCase() === newKeyEn.toLowerCase());
      if (exists) return new Response('newKeyEn already exists', { status: 409 });
      if (hasChildren && !cascade) {
        return new Response('Has children. Use cascade to rename recursively.', { status: 409 });
      }
      if (cascade) {
        const toUpdate = (rows as any[]).filter((r) => String(r.keyEn || '') === keyEn || String(r.keyEn || '').startsWith(keyEn + '/'));
        for (const row of toUpdate) {
          const oldK = String(row.keyEn || '');
          const nextK = oldK === keyEn ? newKeyEn : newKeyEn + oldK.slice(keyEn.length);
          await database.update(tagsTable).set({ keyEn: nextK } as any).where(ilike(tagsTable.keyEn as any, oldK));
        }
      } else {
        await database.update(tagsTable).set({ keyEn: newKeyEn } as any).where(ilike(tagsTable.keyEn as any, keyEn));
      }
    }

    const updateSet: Record<string, any> = {};
    if (set.labels && typeof set.labels === 'object') updateSet.labels = set.labels;
    if (set.synonyms && typeof set.synonyms === 'object') updateSet.synonyms = set.synonyms;
    if (typeof set.isPublic === 'boolean') updateSet.isPublic = set.isPublic;
    if (Object.keys(updateSet).length > 0) {
      const currentKey = newKeyEn || keyEn;
      await database.update(tagsTable).set(updateSet as any).where(ilike(tagsTable.keyEn as any, currentKey));
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    const message = parseError(error);
    return new Response(message, { status: 400 });
  }
};

export const DELETE = async (req: Request) => {
  try {
    const body = await req.json();
    const keyEn: string = String(body?.keyEn || '').trim();
    const cascade: boolean = Boolean(body?.cascade);
    if (!keyEn) return new Response('keyEn required', { status: 400 });

    const rows = await database.select().from(tagsTable);
    const hasChildren = (rows as any[]).some((r) => String(r.keyEn || '').startsWith(keyEn + '/'));
    if (hasChildren && !cascade) return new Response('Has children. Use cascade to delete.', { status: 409 });

    if (cascade) {
      const toDelete = (rows as any[]).filter((r) => String(r.keyEn || '') === keyEn || String(r.keyEn || '').startsWith(keyEn + '/'));
      for (const row of toDelete) {
        const oldK = String(row.keyEn || '');
        await database.delete(tagsTable).where(ilike(tagsTable.keyEn as any, oldK));
      }
    } else {
      await database.delete(tagsTable).where(ilike(tagsTable.keyEn as any, keyEn));
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = parseError(error);
    return new Response(message, { status: 400 });
  }
};