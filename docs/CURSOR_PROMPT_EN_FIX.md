# Cursor Prompt — Fix Korean Text on English Pages

## Context

This is an Astro static site for S-Reborn Clinic. It has Korean (`/ko/`) and English (`/en/`) routes. Most pages are now in English, but one large area still has Korean text: the **Procedures page** (`/en/procedures/`).

The detailed fix plan is in `docs/EN_KOREAN_TEXT_FIX_PLAN.md`. This prompt covers the one remaining large task.

---

## Task: Add English translations to `src/data/procedure-catalog.ts`

### What needs to be done

The file `src/data/procedure-catalog.ts` contains a `PROCEDURE_CATALOG` array with ~60 treatment items, all in Korean. The TypeScript types need English optional fields, and all data objects need English translations added.

**The types have already been updated** (see `Fix — Step 1` in the plan). You need to add the `*En` fields to the data.

### Step 1 — Update the TypeScript types

In `src/data/procedure-catalog.ts`, update the three types:

```typescript
export type ProcedureItem = {
  name: string;
  nameEn?: string;
  note?: string;
  noteEn?: string;
  slug?: string;
};

export type ProcedureSubgroup = {
  title: string;
  titleEn?: string;
  items: ProcedureItem[];
};

export type ProcedurePillar = {
  id: 'ebd' | 'injection' | 'oral' | 'topical';
  title: string;
  titleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  intro: string;
  introEn?: string;
  subgroups: ProcedureSubgroup[];
};
```

### Step 2 — Add English data to all 4 pillars

Add `titleEn`, `subtitleEn`, `introEn` to each pillar, `titleEn` to each subgroup, and `nameEn` + `noteEn` to each item. Use the translations in `docs/EN_KOREAN_TEXT_FIX_PLAN.md` (FILE 1 section) as your source.

**Pattern for each item:**
```typescript
{ name: '모노폴라 / 바이폴라 RF', nameEn: 'Monopolar / Bipolar RF', note: '진피 가열을 통한 탄력·리프팅 보조', noteEn: 'Dermal heating for firming and lifting support', slug: 'monopolar-rf' },
```

**For items without a `note`, translate the name only:**
```typescript
{ name: '써마지 FLX', nameEn: 'Thermage FLX', slug: 'thermage' },
```

### Step 3 — Update `src/pages/en/procedures/index.astro`

Apply locale-aware rendering at 6 locations (see FILE 2 in the fix plan):

1. `pillar.subtitle` → `pillar.subtitleEn ?? pillar.subtitle`
2. `pillar.title` → `pillar.titleEn ?? pillar.title`
3. `pillar.intro` → `pillar.introEn ?? pillar.intro`
4. `aria-label={pillar.title}` → locale-aware
5. `sub.title` → `sub.titleEn ?? sub.title`
6. `item.name` and `item.note` → locale-aware

The exact before/after code for each location is in `docs/EN_KOREAN_TEXT_FIX_PLAN.md` under FILE 2.

### Files to edit

1. `src/data/procedure-catalog.ts` — add `*En` type fields + English data (~60 items)
2. `src/pages/en/procedures/index.astro` — locale-aware rendering at 6 locations

### Already done (do NOT re-do these)

- `src/consts.ts` — `CLINIC_INFO.nameEn`, `directorEn`, `addressEn`, `addressDetailEn` added ✓
- `src/components/Footer.astro` — uses English CLINIC_INFO fields for `locale === 'en'` ✓
- `src/pages/en/about.astro` — uses `CLINIC_INFO.directorEn` and `CLINIC_INFO.addressEn` ✓
- `src/i18n/en.ts` — `langSwitchLabel` fixed to `'Korean'`, 10 about keys added ✓
- `src/data/blog-nav.ts` — `blogPillarLabel()` now accepts locale param, `BLOG_PILLAR_NAV` includes `labelEn` ✓
- `src/pages/en/blog/index.astro` — `pillarLabels` now uses `labelEn`, card badges use locale ✓
- All 134 blog markdown files — have `title_en` and `description_en` ✓

### Test after changes

```bash
npm run build
```

Check:
- `/en/procedures/` → all pillar titles, subtitles, intros in English
- `/en/procedures/?p=ebd` → EBD panel shows English subgroup names and item names
- `/en/procedures/?p=injection` → Injectables panel in English
