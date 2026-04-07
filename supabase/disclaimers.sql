-- 면책 고지 (블로그 카테고리별) — 적용 후 Supabase SQL Editor 또는 migration 으로 실행

CREATE TABLE IF NOT EXISTS disclaimers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  body text NOT NULL,
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE disclaimers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon read active"
  ON disclaimers FOR SELECT TO anon
  USING (is_active = true);

-- service_role 은 RLS 우회 — 어드민 API(PATCH)에서만 사용

INSERT INTO disclaimers (category, body) VALUES
  ('general', '이 글은 정보 제공 목적으로 작성되었으며, 의학적 진단이나 치료를 대체하지 않습니다. 개인 건강 문제는 반드시 담당 의사와 상담하세요.'),
  ('ai', '이 글에서 소개하는 AI 도구는 의학적 판단을 보조하는 용도이며, 최종 임상 결정은 의료인이 내려야 합니다.'),
  ('legal', '이 글의 내용은 법적 조언이 아닙니다. 구체적인 법적 문제는 전문가와 상담하세요.')
ON CONFLICT (category) DO NOTHING;
