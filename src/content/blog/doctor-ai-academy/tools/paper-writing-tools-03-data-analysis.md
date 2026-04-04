---
title: '논문 제작 툴 시리즈 ③ 데이터 정리·분석·재현성'
description: '스프레드시트·통계 SW·코드·노트북으로 분석을 재현 가능하게 만드는 도구와 습관을 정리합니다.'
date: 2026-04-13
category: doctor-ai
academy_section: tools
academy_order: 9
series: paper-writing-tools
series_order: 3
tags:
  - 논문
  - 통계
  - R
  - 재현성
draft: false
read_time: 13
difficulty: intermediate
type: educational
---

## 3단계에서 할 일

- 원자료를 **분석용 테이블**로 정돈한다(변수명·코딩북).
- **분석 코드**를 남겨 같은 결과를 다시 낼 수 있게 한다.
- 그림·표를 **논문 버전**으로 고정한다(해상도·범례·단위).

## 스프레드시트 vs 분석 전용

- **Excel / Google Sheets**: 코딩·탐색적 확인에는 편리하지만, **버전 관리**가 어렵습니다. “최종분석용_20260413.xlsx”처럼 **읽기 전용 사본**을 남기는 습관이 좋습니다.
- **R + RStudio**, **Python(Jupyter)**, **Stata**, **SPSS**, **SAS**: 논문용 표·그림을 **스크립트로 재생산**하기에 유리합니다.

## 재현성(Reproducibility)

- **한 프로젝트 폴더**에 `data/raw`, `data/clean`, `code`, `output`, `figures`를 나누는 단순 구조만 있어도 협업이 쉬워집니다.
- **R**: `renv`로 패키지 버전 고정, **Python**: `requirements.txt` 또는 `conda env export`.
- 분석 일지(**어떤 제외 기준으로 N이 줄었는지**)를 코드 주석 또는 별도 로그에 남깁니다.

## 도표·시각화

- **ggplot2(R)**, **matplotlib/seaborn(Python)**, **GraphPad** 등: 저널이 요구하는 **벡터 형식(PDF/SVG)**과 **최소 해상도**를 미리 확인합니다.
- 색각 이상을 고려한 **색상 팔레트**(colorbrewer 등)는 점점 기본 요건으로 자리 잡고 있습니다.

## 협업·백업

- **Git / GitHub·GitLab**(비공개 저장소): 코드·스크립트 버전 관리. **식별 가능한 데이터**는 원칙적으로 **올리지 않습니다**.
- 기관 정책이 허용하면 **클라우드 백업**과 **로컬 암호화**를 병행합니다.

## AI를 이 단계에서

- **코드 생성**(“이 검정 R로 짜 줘”)은 **작은 조각**으로 받고, **통계 교과서·패키지 공식 문서**와 대조해 실행합니다.
- **결과 해석**(“유의하니 치료 효과 있다”)은 AI에게 맡기지 말고, **효과크기·신뢰구간·임상적 의미**를 사람이 씁니다.
- 원자료를 클라우드 AI에 **업로드하지 않는** 정책을 유지합니다.

## 체크리스트(③ 마무리)

- [ ] **코딩북**(변수 정의)이 있는가
- [ ] 동일 스크립트로 **주 표·그림**을 다시 만들 수 있는가
- [ ] 제외·탈락 흐름이 **CONSORT/STROBE 도표**와 맞는가(해당 시)

다음 ④에서는 **초고 작성·영문·인용·협업** 툴을 다룹니다.

**이전:** [② 연구설계·방법·표본·등록](/doctor-ai-academy/tools/paper-writing-tools-02-design-methods/) · **다음:** [④ 초고 작성·영문·인용·협업](/doctor-ai-academy/tools/paper-writing-tools-04-drafting-collaboration/)

---

*교육 목적이며 특정 통계 방법의 적합성을 보장하지 않습니다.*
