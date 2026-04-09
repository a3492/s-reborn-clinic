# English Page — Korean Text Fix Plan

**Date:** 2026-04-10  
**Scope:** All `/en/*` pages still displaying Korean text  
**Priority:** Critical — blocking English site launch

---

## Root Cause Summary

Three layers of Korean text remain on English pages:

| Layer | Root Cause |
|-------|-----------|
| **1. procedure-catalog.ts** | `title`, `subtitle`, `intro`, `subgroups[].title`, `items[].name/note` are Korean-only. No `*En` fields exist on `ProcedurePillar` or `ProcedureSubgroup` or `ProcedureItem`. The template at `procedures/index.astro:131-170` renders these fields directly without locale switching. |
| **2. consts.ts — CLINIC_INFO** | `name`, `director`, `address`, `addressDetail`, `hours` are Korean-only strings used in `Footer.astro` and `about.astro`. No English variants exist. |
| **3. i18n/en.ts** | `langSwitchLabel` value is `'한국어'` (should be `'Korean'`). Also missing 10 keys used by `about.astro` credentials/news sections. |

---

## File-by-File Fix Instructions

---

### FILE 1: `src/data/procedure-catalog.ts`

**Problem:** `ProcedurePillar`, `ProcedureSubgroup`, `ProcedureItem` types have no English fields. The procedures page renders `pillar.title`, `pillar.subtitle`, `pillar.intro`, `sub.title`, `item.name`, `item.note` directly in Korean.

**Fix — Step 1: Update TypeScript types**

```typescript
// BEFORE
export type ProcedureItem = {
  name: string;
  note?: string;
  slug?: string;
};

export type ProcedureSubgroup = {
  title: string;
  items: ProcedureItem[];
};

export type ProcedurePillar = {
  id: 'ebd' | 'injection' | 'oral' | 'topical';
  title: string;
  subtitle: string;
  intro: string;
  subgroups: ProcedureSubgroup[];
};

// AFTER
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

**Fix — Step 2: Add English fields to PROCEDURE_CATALOG data**

For each pillar (`ebd`, `injection`, `oral`, `topical`) add `titleEn`, `subtitleEn`, `introEn`. For each subgroup add `titleEn`. For each item add `nameEn` and `noteEn` where applicable.

**English translations to add:**

#### EBD Pillar
```
titleEn: 'EBD · Energy-Based Procedures'
subtitleEn: 'RF · Ultrasound · Laser · Light'
introEn: 'These treatments deliver electrical, acoustic, or light energy to the skin to target collagen remodeling, pigmentation, vascular concerns, and hair follicles. Device names and output levels vary by clinic equipment and individual condition.'
```

Subgroups:
```
'고주파(RF) — 탄력 · 지방 윤곽'      → titleEn: 'RF (Radiofrequency) — Firming & Contouring'
'초음파 — HIFU · 집속 초음파'         → titleEn: 'Ultrasound — HIFU & Focused Ultrasound'
'레이저 — 색소 · 문신'                → titleEn: 'Laser — Pigmentation & Tattoo'
'레이저 — 혈관 · 홍조 · 비립종'      → titleEn: 'Laser — Vascular, Redness & Milia'
'레이저 · 광 — 제모'                  → titleEn: 'Laser & Light — Hair Removal'
'레이저 — 모공 · 흉터 · 재생'        → titleEn: 'Laser — Pores, Scars & Rejuvenation'
'광치료 · 기타 에너지'                → titleEn: 'Phototherapy & Other Energy'
```

Items (examples — apply pattern to all):
```
'모노폴라 / 바이폴라 RF'  nameEn: 'Monopolar / Bipolar RF'  noteEn: 'Dermal heating for firming and lifting support'
'집속형·고밀도 RF'         nameEn: 'Focused / High-Density RF'  noteEn: 'Fat layer heating for contouring (varies by brand)'
'마이크로니들 RF'          nameEn: 'Microneedle RF'  noteEn: 'Combined microneedles + RF — pores, scars, firming'
'HIFU 리프팅'              nameEn: 'HIFU Lifting'  noteEn: 'SMAS/superficial fat layer energy — contouring and lifting support'
'레이저 토닝'              nameEn: 'Laser Toning'  noteEn: 'QS/picosecond combined — pigmentation and skin tone'
'IPL / 포토페이셜'         nameEn: 'IPL / Photofacial'  noteEn: 'Pigmentation, redness, and skin tone combined'
```
*(Continue this pattern for all ~60 items)*

#### Injectables Pillar
```
titleEn: 'Injectables & Liquid Procedures'
subtitleEn: 'Botox · Filler · Skin Booster · IV Drip'
introEn: 'Injections, micro-injections, and IV drips to adjust muscle movement, volume, dermal hydration, and nutrition. Product approvals and treatment intervals follow pharmaceutical regulations and individual health status.'
```

Subgroups:
```
'보톡스 · 신경독소'                    → titleEn: 'Botox & Neurotoxins'
'필러 · 부피 보충'                     → titleEn: 'Filler & Volume Restoration'
'스킨부스터 · 수분 주사'               → titleEn: 'Skin Booster & Hydration Injections'
'지방 용해 · 윤곽 주사'                → titleEn: 'Fat-Dissolving & Contouring Injections'
'재생 주사 · 세포 치료'                → titleEn: 'Regenerative Injections & Cell Therapy'
'수액 · 영양 주사'                     → titleEn: 'IV Drip & Nutrient Injections'
'실 · 매립 리프팅'                     → titleEn: 'Thread Lifting'
'기타 액상 시술'                       → titleEn: 'Other Injectable Procedures'
```

#### Oral Medications Pillar
```
titleEn: 'Oral Medication Treatments'
subtitleEn: 'Weight Management · Hair Loss · Acne · Pigmentation · Atopy'
introEn: 'Prescribed medications considering systemic health, drug interactions, and side effects. Use may be restricted during pregnancy, breastfeeding, or with liver/kidney conditions. Always consult a physician before starting.'
```

#### Topical Treatments Pillar
```
titleEn: 'Topical Treatments'
subtitleEn: 'Ointment · Cream · Gel · Patch'
introEn: 'Topical formulations to manage inflammation, pigmentation, barrier function, and hair loss with minimal systemic absorption. Steroid creams require strict adherence to indicated area and duration — do not self-discontinue or use long-term without guidance.'
```

---

### FILE 2: `src/pages/en/procedures/index.astro`

**Problem:** Lines 131–170 render pillar title/subtitle/intro and subgroup/item names directly without locale switching.

**Fix:** Apply locale-aware rendering:

```astro
// BEFORE (line 131-133)
<p class="proc-hero-badge">{pillar.subtitle}</p>
<h1 class="proc-hero-title">{pillar.title}</h1>
<p class="proc-hero-lead">{pillar.intro}</p>

// AFTER
<p class="proc-hero-badge">{locale === 'en' ? (pillar.subtitleEn ?? pillar.subtitle) : pillar.subtitle}</p>
<h1 class="proc-hero-title">{locale === 'en' ? (pillar.titleEn ?? pillar.title) : pillar.title}</h1>
<p class="proc-hero-lead">{locale === 'en' ? (pillar.introEn ?? pillar.intro) : pillar.intro}</p>
```

```astro
// BEFORE (line 155)
<span class="proc-tree-leaf-title">{sub.title}</span>

// AFTER
<span class="proc-tree-leaf-title">{locale === 'en' ? (sub.titleEn ?? sub.title) : sub.title}</span>
```

```astro
// BEFORE (lines 164-170)
{item.name}
{item.note && <span class="proc-item-note">{item.note}</span>}

// AFTER
{locale === 'en' ? (item.nameEn ?? item.name) : item.name}
{item.note && (
  <span class="proc-item-note">
    {locale === 'en' ? (item.noteEn ?? item.note) : item.note}
  </span>
)}
```

Also line 150 and 173 — replace bare `{pillar.title}` and `{item.name}` with locale-aware versions:
```astro
// line 150
<section class="proc-pillar" aria-label={locale === 'en' ? (pillar.titleEn ?? pillar.title) : pillar.title}>

// line 173
aria-label={locale === 'en' ? `${item.nameEn ?? item.name} subtopics` : `${item.name} 세부 주제`}
```

---

### FILE 3: `src/consts.ts`

**Problem:** `CLINIC_INFO` object has Korean-only values for `name`, `director`, `address`, `addressDetail`, `hours`.

**Fix:** Add English variants to the `CLINIC_INFO` object:

```typescript
// ADD these fields to CLINIC_INFO:
export const CLINIC_INFO = {
  // existing Korean fields...
  name: '에스리본의원',
  nameEn: 'S-Reborn Clinic',
  director: '김도위 대표원장',
  directorEn: 'Dr. Kim Do-wi, Chief Physician',
  address: '서울특별시 마포구 양화로 162, 좋은사람들빌딩 8층',
  addressEn: '162 Yanghwa-ro, Mapo-gu, Seoul · Joeun Saramdeul Bldg. 8F',
  addressDetail: '(동교동, 홍대입구역 8·9번 출구 도보 2~3분)',
  addressDetailEn: '(2–3 min walk from Hongdae Station Exit 8/9)',
  hours: [
    { days: '월·화·수·금', daysEn: 'Mon · Tue · Wed · Fri', open: '10:00', close: '19:00' },
    { days: '목 (야간진료)', daysEn: 'Thu (Evening)', open: '13:00', close: '21:00' },
    { days: '토', daysEn: 'Sat', open: '10:00', close: '16:00' },
    { days: '일·공휴일', daysEn: 'Sun · Holidays', open: null, close: null, closed: true, closedEn: 'Closed' },
  ],
  // ... rest unchanged
};
```

---

### FILE 4: `src/components/Footer.astro`

**Problem:** Line 28 renders Korean clinic name and director name regardless of locale.

**Fix:**
```astro
// BEFORE
{CLINIC_INFO.name} · {t(locale, 'footer.directorLabel')} {CLINIC_INFO.director}

// AFTER
{locale === 'en' ? CLINIC_INFO.nameEn : CLINIC_INFO.name} · {t(locale, 'footer.directorLabel')} {locale === 'en' ? CLINIC_INFO.directorEn : CLINIC_INFO.director}
```

Apply same pattern wherever `CLINIC_INFO.address`, `CLINIC_INFO.addressDetail`, `CLINIC_INFO.hours[].days` are used in Footer.

---

### FILE 5: `src/pages/en/about.astro`

**Problem:** Lines 50, 64 render Korean `CLINIC_INFO.director` and `CLINIC_INFO.address` directly.

**Fix:**
```astro
// line 50 — BEFORE
{CLINIC_INFO.director}
// AFTER
{CLINIC_INFO.directorEn}

// line 64 — BEFORE  
{CLINIC_INFO.address}
// AFTER
{CLINIC_INFO.addressEn}
```

---

### FILE 6: `src/i18n/en.ts`

**Problem 1:** `langSwitchLabel: '한국어'` — shows Korean text on the language toggle button.

**Fix:**
```typescript
// BEFORE
langSwitchLabel: '한국어',
// AFTER
langSwitchLabel: 'Korean',
```

**Problem 2:** Missing 10 keys for about page credentials/news sections.

**Fix — Add these keys:**
```typescript
// Add to the 'about' section in en.ts:
'about.doctorPhilosophy': 'From treatment planning to follow-up care, the chief physician handles everything personally.',
'about.credentialsTitle': 'Official Certifications & Credentials',
'about.credentialThermage': 'Thermage Key Doctor',
'about.credentialThermageDesc': 'Officially designated by Tentech, the manufacturer of Thermage and Tencera devices.',
'about.credentialSylfirm': 'Sylfirm Key Doctor',
'about.credentialSylfirmDesc': 'Recognized for expertise in energy-based skin regeneration treatments.',
'about.credentialEdu': 'International Medical Education',
'about.credentialEduDesc': 'Provided lifting procedure training for domestic and international medical professionals.',
'about.newsTitle': 'Clinic News',
'about.newsMore': 'More News →',
```

---

---

### FILE 7: `src/pages/en/blog/index.astro`

**Problem:** Line 19 builds `pillarLabels` using `p.label` (Korean). This object is passed to the inline `<script>` and used for filter chip labels and page titles.

```typescript
// Line 19 — BEFORE
const pillarLabels = Object.fromEntries(BLOG_PILLAR_NAV.map((p) => [p.id, p.label]));

// AFTER
const pillarLabels = Object.fromEntries(
  BLOG_PILLAR_NAV.map((p) => [p.id, locale === 'en' ? (p.labelEn ?? p.label) : p.label])
);
```

**Note:** `BLOG_PILLAR_NAV` derives from `PROCEDURE_PILLAR_SUMMARIES` which already has `labelEn` fields — no data changes needed, just use the right field.

Also line 92 — `blogPillarLabel()` returns Korean labels for post card badges:

```astro
// Line 92 — BEFORE
<span class="blog-post-card-pillar">{blogPillarLabel(post.data.pillar)}</span>

// AFTER
<span class="blog-post-card-pillar">
  {locale === 'en'
    ? (BLOG_PILLAR_NAV.find(p => p.id === post.data.pillar)?.labelEn ?? blogPillarLabel(post.data.pillar))
    : blogPillarLabel(post.data.pillar)}
</span>
```

Or simpler — update `blogPillarLabel()` in `blog-nav.ts` to accept a locale param:

```typescript
// blog-nav.ts
export function blogPillarLabel(id: string | undefined, locale?: string): string | undefined {
  if (!id) return undefined;
  const p = BLOG_PILLAR_NAV.find((p) => p.id === id);
  if (!p) return undefined;
  return locale === 'en' ? (p.labelEn ?? p.label) : p.label;
}
```

Then in `blog/index.astro` line 92:
```astro
<span class="blog-post-card-pillar">{blogPillarLabel(post.data.pillar, locale)}</span>
```

---

## Summary Checklist

| # | File | Change | Effort |
|---|------|--------|--------|
| 1 | `src/data/procedure-catalog.ts` | Add `*En` fields to all 3 types + add English data for all pillars/subgroups/items (~60 items) | Large |
| 2 | `src/pages/en/procedures/index.astro` | Wrap 6 render locations with locale-aware logic | Small |
| 3 | `src/consts.ts` | Add `*En` fields to `CLINIC_INFO` | Small |
| 4 | `src/components/Footer.astro` | Use `*En` fields when `locale === 'en'` | Small |
| 5 | `src/pages/en/about.astro` | Use `*En` fields for director and address | Small |
| 6 | `src/i18n/en.ts` | Fix `langSwitchLabel` + add 10 missing keys | Small |
| 7 | `src/pages/en/blog/index.astro` + `src/data/blog-nav.ts` | Use `labelEn` for pillar labels; add locale param to `blogPillarLabel()` | Small |

**Estimated total:** ~210 lines changed. `procedure-catalog.ts` is the heaviest file (bulk data entry).

---

## Testing After Fix

```bash
npm run build
# Check these URLs after build:
# /en/procedures/           → all text in English
# /en/procedures/?p=ebd     → EBD pillar title/subtitle/intro in English
# /en/about/                → director name and address in English
# /en/                      → footer shows "S-Reborn Clinic", English director name
# /en/blog/                 → pillar badges on cards show English (e.g. "EBD · Energy-Based")
# /en/blog/?pillar=ebd      → filter chip shows "EBD · Energy-Based" not Korean
```
