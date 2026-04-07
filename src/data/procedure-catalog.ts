/**
 * 시술 안내 전용 카탈로그 (블로그와 분리).
 * 실제 시행 여부·적응증은 내원 시 의료진 판단.
 */

export type ProcedureItem = {
  name: string;
  note?: string;
  /** procedures 컬렉션 slug — 토픽 아티클 연결용 */
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

export const PROCEDURE_PILLAR_SUMMARIES: {
  id: ProcedurePillar['id'];
  label: string;
  short: string;
  description: string;
}[] = [
  {
    id: 'ebd',
    label: 'EBD · 에너지 기반',
    short: '고주파 · 초음파 · 레이저',
    description: '피부층에 에너지를 전달해 탄력·색소·혈관·제모 등을 다루는 시술군입니다.',
  },
  {
    id: 'injection',
    label: '주사 · 액상 시술',
    short: '보톡스 · 필러 · 부스터 · 수액',
    description: '주입·미세주사·수액 등으로 윤곽·주름·수분·영양을 조절하는 시술군입니다.',
  },
  {
    id: 'oral',
    label: '경구 약물 치료',
    short: '비만 · 탈모 · 여드름 등',
    description: '처방에 따른 경구약으로 대사·피부·모발 등을 장기 관리하는 치료입니다.',
  },
  {
    id: 'topical',
    label: '도포 · 외용제',
    short: '연고 · 크림 · 겔 · 패치',
    description: '국소 도포로 염증·색소·장벽·탈모 등을 보조하는 치료입니다.',
  },
];

export const PROCEDURE_CATALOG: ProcedurePillar[] = [
  {
    id: 'ebd',
    title: 'EBD · 에너지 기반 시술',
    subtitle: '고주파 · 초음파 · 레이저 · 광원',
    intro:
      '전기장·음파·빛 등 에너지를 피부에 전달해 콜라겐 리모델링, 색소, 혈관, 모낭 등을 목표로 합니다. 기기명·출력은 클리닉 장비와 개인 상태에 따라 달라질 수 있습니다.',
    subgroups: [
      {
        title: '고주파(RF) — 탄력 · 지방 윤곽',
        items: [
          { name: '모노폴라 / 바이폴라 RF', note: '진피 가열을 통한 탄력·리프팅 보조', slug: 'monopolar-rf' },
          { name: '집속형·고밀도 RF', note: '지방층 가열을 통한 윤곽·탄력 (브랜드별 상이)', slug: 'focused-rf' },
          { name: '마이크로니들 RF', note: '미세침과 RF 병합 — 모공·흉터·탄력', slug: 'microneedle-rf' },
          { name: '바디 RF', note: '체선·셀룰라이트 보조 (개인차)', slug: 'body-rf' },
          { name: 'RF 미세혈관·홍조 보조', note: '장비별 적응', slug: 'vascular-rf' },
          { name: '라디오주파 절제·응고', note: '소 병변 제거 보조' },
        ],
      },
      {
        title: '초음파 — HIFU · 집속 초음파',
        items: [
          { name: 'HIFU 리프팅', note: 'SMAS·지방막층 수준 에너지 — 윤곽·처짐 보조', slug: 'hifu-lifting' },
          { name: '마이크로포커스 초음파', note: '점상 에너지 — 피부결·탄력' },
          { name: '초음파 보조 지방 관리', note: '기기·프로토콜별 상이' },
        ],
      },
      {
        title: '레이저 — 색소 · 문신',
        items: [
          { name: '레이저 토닝', note: 'QS·피코 등 병합 — 색소·피부톤', slug: 'laser-toning' },
          { name: 'Q-스위치 Nd:YAG', note: '오타·문신·일부 색소' },
          { name: '피코초·나노초 레이저', note: '기미·잡티·문신 세척 등', slug: 'picosecond-laser' },
          { name: 'IPL / 포토페이셜', note: '색소·홍조·피부톤 복합', slug: 'ipl' },
          { name: '롱펄스 피코·QS 복합 프로토콜', note: '진단하에 병합' },
          { name: 'CO₂ / 어븀 프락셔널', note: '깊은 색소·흉터 (다운타임 길 수 있음)' },
          { name: '어븀·티듀얼·비어븀 계열', note: '재생·모공 — 기기명은 병원별 상이' },
          { name: 'Er:YAG 프락셔널', note: '얕은 각질·소흉터' },
        ],
      },
      {
        title: '레이저 — 혈관 · 홍조 · 비립종',
        items: [
          { name: '롱펄스 Nd:YAG', note: '혈관병변·다리혈관 등', slug: 'vascular-laser' },
          { name: 'IPL 혈관 모드', note: '홍조·모세혈관' },
          { name: 'PDL·KTP 등 혈관 레이저', note: '장비 보유 시' },
          { name: 'CO₂ 레이저 비립종·쥐젖 제거', note: '국소' },
        ],
      },
      {
        title: '레이저 · 광 — 제모',
        items: [
          { name: '다이오드 레이저 제모', slug: 'laser-hair-removal' },
          { name: '알렉산드라이트 제모' },
          { name: 'Nd:YAG 롱펄스 제모', note: '진한 피부톤에 상대적 우선 검토' },
          { name: 'IPL 제모', note: '부위·모색에 따라' },
        ],
      },
      {
        title: '레이저 — 모공 · 흉터 · 재생',
        items: [
          { name: '프락셔널 비어븀·티듀얼' },
          { name: '프락셔널 CO₂ / 어븀', slug: 'fractional-laser' },
          { name: 'PN·재생 앰플 병합 포토 프로토콜', note: '내원 시 결정' },
          { name: '플라즈마·아크(기기 보유 시)', note: '각질·소처짐 보조' },
        ],
      },
      {
        title: '광치료 · 기타 에너지',
        items: [
          { name: 'LED 적색·청색·적외', note: '염증·장벽 보조', slug: 'led-pdt' },
          { name: 'PDT(광역동요법)', note: '광감작제 + 광원 — 여드름·새치 등 적응' },
          { name: '엑시머 광선', note: '일부 염증성 피부질환 (진료과 범위)' },
          { name: '고주파 절제·전기소작', note: '비립종 등 소병변' },
          { name: '크라이오테라피', note: '소 병변·진정 보조', slug: 'cryotherapy' },
        ],
      },
    ],
  },
  {
    id: 'injection',
    title: '주사 · 액상 시술',
    subtitle: '보톡스 · 필러 · 스킨부스터 · 수액',
    intro:
      '주사·미세주사·수액으로 근육·부피·진피 환경을 조절합니다. 제품 허가·유통 경로와 시술 간격은 의약품 규정과 개인 상태를 따릅니다.',
    subgroups: [
      {
        title: '보툴리눔 톡신',
        items: [
          { name: '이마·미간·눈가 주름', slug: 'botox-wrinkle' },
          { name: '사각턱(교근) 라인', slug: 'botox-jaw' },
          { name: '침샘(미각·이하선) 볼륨 보조' },
          { name: '다한증(겨드랑이·손바닥 등)', slug: 'botox-hyperhidrosis' },
          { name: '콤플렉스 주름·미세부위', note: '용량·층위는 개별' },
        ],
      },
      {
        title: '필러 · 부피 보충',
        items: [
          { name: '히알루론산(HA) 필러', note: '팔자·입술·턱·이마 등', slug: 'ha-filler' },
          { name: '콜라겐 유도 필러', note: 'PLLA·PCL·CaHA 등 — 상품별 상이', slug: 'collagen-booster' },
          { name: 'PN·폴리뉴클레오타이드 필러', note: '재생·탄력 병합 목적' },
          { name: '지방이식 보조·윤곽', note: '내원 평가 후', slug: 'fat-grafting' },
        ],
      },
      {
        title: '스킨부스터 · 재생 주사',
        items: [
          { name: 'PN·폴리뉴클레오타이드', note: '리쥬란 등 상품군', slug: 'pn-skinbooster' },
          { name: '히알루론산 수분부스터' },
          { name: '멀티부스터·콤보 프로토콜', note: 'HA+비타민+항산화 등' },
          { name: '스킨바이브·수분 마이크로인젝션' },
          { name: '엑소좀·줄기세포 배양액 함유 제품', note: '허가 범위 내', slug: 'exosome' },
          { name: 'PRP·PRF', note: '자가혈 소분', slug: 'prp-prf' },
          { name: '글루타치온·비타민 미세주사', note: '피부톤·피로 보조', slug: 'glutathione-iv' },
        ],
      },
      {
        title: '실 · 매립 리프팅',
        items: [
          { name: 'PDO 모노·코그 실', note: '얼굴선·볼처짐 보조', slug: 'thread-lifting' },
          { name: 'PLLA·PCL 블렌디드 실', note: '콜라겐 유도 실' },
          { name: '복합 실 리프팅', note: '부위·층위별 프로토콜' },
        ],
      },
      {
        title: '지방 · 바디 주사',
        items: [
          { name: '지방분해주사', note: '성분·부위별 — 부종·통증 개인차', slug: 'lipodissolve' },
          { name: '바디 리프팅 보조 주사', note: '콜라겐·지방대사 병합' },
        ],
      },
      {
        title: '메조테라피 · 미세 침습',
        items: [
          { name: '얼굴·목 메조', note: '약물·영양 칵테일', slug: 'mesotherapy' },
          { name: '두피 메조', note: '탈모 보조', slug: 'scalp-prp' },
          { name: '다크서클·눈가 미세주사', slug: 'dark-circle-meso' },
        ],
      },
      {
        title: '수액 · 영양 IV',
        items: [
          { name: '비타민·미네랄 수액' },
          { name: '백온·항산화 콤보 IV', note: '개인 맞춤' },
          { name: '마이어스 칵테일류' },
          { name: '수분·전해질 보충' },
          { name: '피로·컨디션 조절 보조', note: '진단·검사 선행' },
        ],
      },
      {
        title: '두피 · 탈모 주사',
        items: [
          { name: 'PRP·PRF 피부', slug: 'prp-prf' },
          { name: '두피 보조 약물 미세주사', note: '처방·프로토콜별' },
          { name: '엑소좀·성장인자 병합', note: '제품별' },
        ],
      },
    ],
  },
  {
    id: 'oral',
    title: '경구 약물 치료',
    subtitle: '비만 · 탈모 · 여드름 · 색소 · 아토피 등',
    intro:
      '전신 상태·약물 상호작용·부작용을 고려해 처방합니다. 임신·수유·간·신장 이상 시 제한될 수 있으며, 반드시 의료진 상담 후 복용합니다.',
    subgroups: [
      {
        title: '비만 · 대사',
        items: [
          { name: 'GLP-1 수용체 작용제', note: '식욕·체중 관리 — 적응증·금기 엄수', slug: 'glp1-obesity' },
          { name: '지방흡수 억제제(예: 오르리스타트)', note: '소화기 부작용 안내', slug: 'orlistat' },
          { name: '대사증후군 보조 처방', note: '혈압·지질 동반 시 내과 협진' },
        ],
      },
      {
        title: '탈모',
        items: [
          { name: '피나스테리드·두타스테리드', note: '남성형 — 여성 금기·임신 주의', slug: 'finasteride' },
          { name: '미녹시딜(경구)', note: '저용량 처방 — 혈압·부종 모니터', slug: 'minoxidil-oral' },
          { name: '비오틴·아연·철분 등 보조제', note: '결핍 있을 때' },
          { name: '항안드로겐(여성 탈모)', note: '스피로노락톤 등 — 피임·임신 상담' },
        ],
      },
      {
        title: '여드름 · 피지',
        items: [
          { name: '테트라사이클린계(독시·미노)', note: '햇빛·임신 금기', slug: 'tetracycline-acne' },
          { name: '아이소트레티노인', note: '중증 낭종성 — teratogenic, 간기능', slug: 'isotretinoin' },
          { name: '아젤라산·과산화벤조일 병용 경구(드묾)', note: '주로 외용 병행' },
          { name: '항안드로겐(여성)', note: '호르몬성 여드름' },
        ],
      },
      {
        title: '색소 · 피부톤',
        items: [
          { name: '트라넥삼산', note: '기미·홍조 보조', slug: 'tranexamic-acid' },
          { name: 'L-시스테인·글루타치온(경구)', note: '보조적' },
          { name: '비타민C·E 등 항산화', note: '고용량은 신장결석 등 주의' },
        ],
      },
      {
        title: '아토피 · 소양증 · 두드러기',
        items: [
          { name: '항히스타민(1·2세대)', slug: 'antihistamine-atopy' },
          { name: '역조절제(사이클로스포린 등)', note: '중증 — 모니터링' },
          { name: '두피 소양·탈모 동반 시 병용', note: '개별 처방' },
        ],
      },
      {
        title: '기타 내과적 병행',
        items: [
          { name: '갑상선·호르몬 이상 의심 시 협진' },
          { name: '철분·비타민D 결핍 교정' },
          { name: '불면·스트레스 보조(필요 시 정신건강의학과 협진)' },
        ],
      },
    ],
  },
  {
    id: 'topical',
    title: '도포 · 외용제 치료',
    subtitle: '연고 · 크림 · 겔 · 로션 · 패치',
    intro:
      '국소 자극을 최소화하면서 염증·색소·장벽을 조절합니다. 스테로이드 연고는 부위·기간을 엄격히 지켜야 하며, 자가 중단·장기 연용은 피합니다.',
    subgroups: [
      {
        title: '스테로이드 · 면역조절 외용',
        items: [
          { name: '약·중·약도 스테로이드 연고', note: '아토피·습진 — 단계적 감량', slug: 'steroid-topical' },
          { name: '타크로리무스·피메크로리무스', note: '면역억제 연고 — TCI', slug: 'tacrolimus' },
          { name: '비타민D 유사체(칼시포트리올 등)', note: '건선·과다각화' },
        ],
      },
      {
        title: '여드름 · 피지',
        items: [
          { name: '과산화벤조일 겔·크림', slug: 'benzoyl-peroxide' },
          { name: '아다팔렌·트레티노인·타자로텐', note: '자극 적응기', slug: 'retinoid' },
          { name: '클린다마이신·에리스로마이신 외용' },
          { name: '아젤라산 크림', slug: 'azelaic-acid' },
          { name: '살리실산·글리콜산 로션', note: '각질·블랙헤드', slug: 'salicylic-acid' },
        ],
      },
      {
        title: '색소 · 미백',
        items: [
          { name: '히드로퀴논 복합제', note: '기간 제한·자극', slug: 'hydroquinone' },
          { name: '트레티노인·히드로퀴논·스테로이드 삼제(Kligman)', note: '처방 전용' },
          { name: '아젤라산·비타민C 유도체' },
          { name: '알부틴·나이아신아마이드 화장품의약품 경계', note: '의료용 농도는 처방', slug: 'niacinamide' },
        ],
      },
      {
        title: '보습 · 장벽',
        items: [
          { name: '세라마이드·판테놀 크림', slug: 'ceramide-moisturizer' },
          { name: '바세린·시어버터 기반 보호제' },
          { name: '요소(urea) 로션', note: '건조·각질' },
          { name: 'PDRN·재생 앰플 도포 병행', note: '시술 후 프로토콜' },
        ],
      },
      {
        title: '탈모 외용',
        items: [
          { name: '미녹시딜 액제·폼', slug: 'minoxidil-topical' },
          { name: '피나스테리드 외용(허가 제품)' },
          { name: '케토코나졸 샴푸', note: '지루 병행', slug: 'ketoconazole-shampoo' },
        ],
      },
      {
        title: '항진균 · 항바이러스 · 기타',
        items: [
          { name: '이미다졸·테르비나핀 외용', note: '무좀·피부사상균', slug: 'antifungal-topical' },
          { name: '아시클로버 판크림', note: '단순포진', slug: 'acyclovir-topical' },
          { name: '이버멕틴 크림', note: '주사비·모낭충', slug: 'ivermectin-topical' },
          { name: '실리콘 겔·시트', note: '흉터·켈로이드 보조', slug: 'silicone-gel' },
        ],
      },
    ],
  },
];
