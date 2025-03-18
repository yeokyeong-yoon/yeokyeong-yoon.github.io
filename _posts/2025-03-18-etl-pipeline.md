---
layout: post
title: "ETL 파이프라인: Databricks와 PySpark를 활용한 데이터 처리 시스템"
date: 2025-03-17 12:00:00 +0900
categories: [개발, 데이터엔지니어링]
tags: [etl, databricks, pyspark, aws-s3, data-engineering]
mermaid: true
---

<style>
.mermaid {
  width: 100%;
  max-width: 1200px;
  margin: 40px auto;
  font-size: 18px;
  font-family: 'Arial', sans-serif;
  overflow: visible;
}
.mermaid .node rect, 
.mermaid .node circle, 
.mermaid .node ellipse, 
.mermaid .node polygon, 
.mermaid .node path {
  fill: #f5f9ff;
  stroke: #4a6da7;
  stroke-width: 1.5px;
}
.mermaid .node text {
  font-size: 18px;
  font-weight: 500;
}
.mermaid .edgeLabel {
  font-size: 16px;
  background-color: white;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.mermaid .cluster rect {
  fill: #f0f8ff;
  stroke: #4a6da7;
  stroke-width: 1px;
  rx: 8px;
  ry: 8px;
}
.mermaid .label {
  font-size: 20px;
  font-weight: bold;
}
.mermaid .timeline-event {
  font-size: 16px;
}
.mermaid .journey-section {
  font-size: 18px;
  font-weight: bold;
}
</style>

## 1. 개요

최근 수요 예측과 가격 최적화 모델을 위한 데이터 처리 시스템 개발을 담당하게 되었다. 초기에는 내부 팀과 외부 업체 1곳의 데이터만을 처리하는 소규모 시스템으로 시작하였으나, 향후 다수의 데이터 소스를 수용해야 할 것으로 예상되어 확장성 있는 시스템 설계가 필수적이었다.

현재 수집되는 데이터를 분석한 결과, 데이터 품질에 있어 여러 문제점이 발견되었다. 누락된 정보, ID 중복, 비정상적인 값과 미처리된 null 값 등이 주요 이슈였으며, 이러한 데이터 품질 문제 해결이 최우선 과제로 대두되었다.

시스템 설계 과정에서 상세한 설계 문서를 작성하고, Raw 데이터 통합을 위한 초기 프로토타입을 구현하였다. 이 과정에서 다양한 기술적 검토와 심도 있는 분석이 요구되었다. 현재 프로젝트가 진행 중이지만, 지금까지의 개발 경험과 인사이트를 공유하고자 했다.

### 핵심 요구사항

- **확장성**: 데이터 제공 업체가 늘어나도 유연하게 대응할 수 있는 구조
- **데이터 품질**: 믿을 수 있고 일관된 데이터 제공
- **자동화**: 사람이 직접 개입하는 과정을 최소화한 데이터 처리
- **표준화**: 다양한 형식의 데이터를 일관된 형태로 변환

### 기대효과

데이터 처리 시스템을 구축함으로써 다음과 같은 효과를 기대할 수 있다:

- **수동 데이터 수집 과정 자동화**: 작업 효율 향상 및 사람의 실수 감소
- **일관된 데이터 처리 규칙 적용**: 데이터 품질 향상
- **체계적인 데이터 검증**: 신뢰할 수 있는 데이터 확보
- **재현 가능한 데이터 처리**: 투명성 및 추적 가능성 확보
- **모델링 시간 단축**: 데이터 준비 시간을 줄여 실제 분석 모델 개발에 집중

## 2. 아키텍처 설계

### 2.1 핵심 구성요소

- **AWS S3 (데이터 저장소)**: 원본 데이터와 처리된 데이터를 저장하는 공간이다. 대용량 데이터를 안정적으로 저장하고 필요할 때 쉽게 접근할 수 있다.

- **Databricks (처리 환경)**: 대규모 데이터 처리와 머신러닝을 위한 플랫폼으로, 팀원들이 함께 코드를 작성하고 실행할 수 있는 환경을 제공한다.

- **PySpark (데이터 처리 도구)**: 여러 컴퓨터에 데이터 처리 작업을 분산하여 대용량 데이터를 빠르게 처리할 수 있게 해주는 Python 라이브러리이다.

- **Parquet (데이터 저장 형식)**: 데이터를 효율적으로 압축하고 빠르게 읽을 수 있는 파일 형식으로, 데이터의 구조 정보도 함께 저장하여 일관성을 유지한다.

<div class="mermaid">
flowchart LR
    classDef storage fill:#f9f7ed,stroke:#d4b483,stroke-width:2px
    classDef process fill:#e1f0fa,stroke:#4a6fa5,stroke-width:2px
    classDef data fill:#ebf5ee,stroke:#58a4b0,stroke-width:2px
    
    S3["AWS S3<br><small>데이터 저장소</small>"]:::storage
    DB["Databricks<br><small>처리 환경</small>"]:::process
    PS["PySpark<br><small>데이터 처리</small>"]:::process
    ML["ML 모델<br><small>가격 최적화</small>"]:::data
    
    S3 --> |"원본 데이터"| DB
    DB --> |"처리"| PS
    PS --> |"변환된 데이터"| S3
    S3 --> |"학습 데이터"| ML
    
    style S3 font-size:18px,font-weight:bold
    style DB font-size:18px,font-weight:bold
    style PS font-size:18px,font-weight:bold
    style ML font-size:18px,font-weight:bold
</div>

*이 플로우차트는 ETL 파이프라인의 주요 구성 요소(AWS S3, Databricks, PySpark, ML 모델) 간의 데이터 흐름을 보여줍니다. 각 구성 요소는 서로 다른 색상으로 구분되어 역할을 명확히 합니다.*

### 2.2 데이터 흐름도

<div class="mermaid">
timeline
    title ETL 파이프라인 처리 흐름
    section 데이터 수집
        원본 데이터 도착 : 업체 파일 수신
        초기 점검 : 파일 형식 및 구조 검증
    section 데이터 처리
        변환 : 표준 형식으로 변환
        검증 : 품질 검사 적용
        보강 : 파생 속성 추가
    section 데이터 저장
        저장소 적재 : Parquet 파일로 저장
        분할 : 날짜 및 출처별 구성
    section 데이터 활용
        분석 : 분석 쿼리 지원
        ML 모델 : 가격 최적화 모델 학습
</div>

*이 타임라인 다이어그램은 ETL 과정의 주요 단계(데이터 수집, 처리, 저장, 활용)를 시간 순서에 따라 표현합니다.*

데이터 흐름은 다음과 같은 단계로 이루어진다:

1. **데이터 수집**: 각 업체의 데이터가 매일 일정 시간에 AWS S3에 저장된다.
2. **데이터 불러오기**: 저장된 데이터를 Databricks 환경으로 가져온다.
3. **데이터 처리 및 변환**: PySpark를 사용해 데이터의 품질을 검증하고, 일관된 형식으로 변환한다.
4. **결과 저장 및 활용**: 처리된 데이터를 Parquet 형식으로 저장하고, 이를 가격 최적화 모델과 다양한 분석에 활용한다.

## 3. 데이터 처리 파이프라인

### 3.1 데이터 수집 전략

#### 소스 데이터 종류 및 형식

외부 업체에서 제공하는 데이터는 다음과 같은 형식으로 제공된다:

- **구조화된 데이터**: CSV, JSON 같은 일반적인 형식의 거래 데이터
- **파일 전송 방식**: 매일 정해진 시간에 안전한 파일 전송 방식으로 전달
- **데이터 종류**: 상품 가격, 재고 정보, 예약 현황, 할인 정보 등

#### 수집 주기 및 방법

- **수집 주기**: 하루에 한 번, 주로 새벽 시간대에 처리
- **업체별 데이터 변환기**: 각 업체의 데이터 형식에 맞는 맞춤형 변환 프로그램 개발
- **메타데이터 관리**: 파일 도착 시간, 처리 상태, 데이터 품질 점수 등의 부가 정보 관리

### 3.2 데이터 검증 프로세스

데이터 품질을 보장하기 위해 4단계로 구성된 체계적인 검증 과정을 구현한다:

<div class="mermaid">
stateDiagram-v2
    [*] --> 기본검증
    
    state 기본검증 {
        빈값확인
        데이터유형확인
        값범위확인
        형식확인
    }
    
    기본검증 --> 업종특화검증
    
    state 업종특화검증 {
        가격합리성확인
        재고관리검증
        예약충돌확인
        시즌별가격검증
        할인규칙확인
        날짜패턴확인
    }
    
    업종특화검증 --> 이상패턴감지
    
    state 이상패턴감지 {
        통계적이상감지
        시간패턴분석
        급격한변동감지
        계절패턴적용
    }
    
    이상패턴감지 --> 문제대응
    
    state 문제대응 {
        심각도분류
        업체알림
        내부팀알림
        자동수정적용
        수동검토요청
        문제추적관리
    }
    
    문제대응 --> [*]
</div>

*이 상태 다이어그램은 데이터 검증 프로세스의 4단계(기본 검증, 업종 특화 검증, 이상 패턴 감지, 문제 대응)와 각 단계 내의 세부 작업을 보여줍니다.*

#### 검증 실패 시 대응 방안

데이터 검증에 실패했을 때는 문제의 심각도에 따라 다음과 같이 대응한다:

1. **매우 심각**: 데이터 처리 중단, 담당자에게 즉시 알림
2. **심각**: 처리는 계속하되 결과에 문제 표시, 담당자에게 알림
3. **중간**: 미리 정의된 규칙에 따라 자동 수정, 처리 기록 남김
4. **경미**: 경고 메시지 기록, 정기 보고서에 포함

### 3.3 데이터 변환 및 처리

#### PySpark 변환 로직

주요 데이터 처리 로직의 예시이다:

```python
# 주중/주말 가격 패턴 검증 예시
def validate_pricing_pattern(df):
    # 요일 정보 추출
    df['day_of_week'] = df['date'].dt.dayofweek
    
    # 주중/주말 구분
    weekday_prices = df[df['day_of_week'].isin([0,1,2,3,4])]['price']
    weekend_prices = df[df['day_of_week'].isin([5,6])]['price']
    
    # 평균 가격 계산
    avg_weekday = weekday_prices.mean()
    avg_weekend = weekend_prices.mean()
    
    # 일반적인 패턴 검증
    if avg_weekend < avg_weekday * 0.8:
        raise_alert(
            severity="High",
            message=f"비정상 가격 패턴 감지: 주말 평균 {avg_weekend}이 주중 평균 {avg_weekday}의 80% 미만",
            metrics={"weekend_avg": avg_weekend, "weekday_avg": avg_weekday, "ratio": avg_weekend/avg_weekday}
        )
```

#### 배치 처리 전략

- **계층적 데이터 관리**: 원본(Bronze), 검증(Silver), 집계(Gold) 단계로 데이터를 구분하여 관리
- **증분 처리**: 매일 새로운 데이터만 처리하여 작업 효율 높임
- **데이터 분할**: 날짜와 업체 ID를 기준으로 데이터를 나누어 검색 성능 향상

#### 성능 최적화 방안

- **중간 결과 저장**: 자주 사용하는 중간 계산 결과를 임시 저장하여 반복 계산 방지
- **병렬 처리**: 업체별로 독립적인 병렬 처리로 속도 향상
- **데이터 이동 최소화**: 데이터 이동이 적은 효율적인 결합 방법 선택
- **처리 단위 최적화**: 적절한 데이터 분할 단위 설정으로 분산 처리 효율 향상

## 4. 개발 및 운영 전략

<div class="mermaid">
journey
    title ETL 파이프라인 운영 여정
    section 추출(Extract)
        데이터 도착 확인: 5: ETL 시스템
        데이터 수집: 5: ETL 시스템
    section 변환(Transform)
        기본 검증: 3: ETL 시스템, 데이터 품질팀
        업종별 검증: 4: ETL 시스템, 비즈니스 분석가
        표준화: 5: ETL 시스템
    section 적재(Load)
        데이터 적재: 5: ETL 시스템
        적재 후 검증: 4: ETL 시스템, 데이터 품질팀
</div>

*이 여정 다이어그램은 ETL 과정의 각 단계별 작업과 해당 작업의 난이도(1-5점 척도), 그리고 담당 시스템이나 팀을 보여줍니다.*

<div class="mermaid">
journey
    title ETL 파이프라인 발전 로드맵
    section 현재
        데이터 수집 자동화: 5: 완료
        기본 ETL 파이프라인: 5: 완료
        데이터 품질 관리: 4: 진행중
    section 단기 계획
        추가 데이터 소스 통합: 3: 계획
        성능 최적화: 2: 검토중
        모니터링 개선: 3: 계획
    section 장기 계획
        실시간 처리 도입: 1: 아이디어
        ML 파이프라인 연동: 1: 아이디어
        클라우드 확장: 2: 검토중
</div>

*이 로드맵은 ETL 파이프라인의 현재 상태와 향후 발전 계획을 보여줍니다. 현재 완료된 작업, 진행 중인 작업, 그리고 단기/장기 계획으로 구분되어 있습니다.*

### ETL 파이프라인 운영 단계 설명

ETL 파이프라인의 운영은 크게 세 단계로 나뉘며, 각 단계별로 중요한 작업과 담당자가 있습니다:

1. **추출(Extract) 단계**:
   - **데이터 도착 확인**: 외부 업체로부터 데이터가 정해진 시간에 도착했는지 확인합니다. ETL 시스템이 자동으로 수행하며, 중요도가 매우 높습니다(5점).
   - **데이터 수집**: S3 버킷에서 Databricks 환경으로 데이터를 가져오는 작업입니다. 역시 ETL 시스템에 의해 자동으로 수행되며 중요도가 높습니다(5점).

2. **변환(Transform) 단계**:
   - **기본 검증**: 데이터 형식, 범위, 필수값 존재 여부 등을 확인합니다. ETL 시스템과 데이터 품질팀이 함께 담당하며, 난이도는 보통 수준입니다(3점).
   - **업종별 검증**: 비즈니스 규칙에 맞는 데이터인지 검증합니다. ETL 시스템과 비즈니스 분석가가 협업하며, 난이도가 높은 편입니다(4점).
   - **표준화**: 다양한 형식의 데이터를 일관된 형태로 변환합니다. ETL 시스템이 담당하며 중요도가 매우 높습니다(5점).

3. **적재(Load) 단계**:
   - **데이터 적재**: 변환된 데이터를 Parquet 형식으로 S3에 저장합니다. ETL 시스템이 자동으로 수행하며 중요도가 높습니다(5점).
   - **적재 후 검증**: 저장된 데이터의 정합성을 최종 확인합니다. ETL 시스템과 데이터 품질팀이 협업하며 난이도가 높습니다(4점).

이러한 단계적 접근을 통해 데이터 처리의 신뢰성과 효율성을 확보할 수 있습니다. 특히 각 단계마다 담당자를 명확히 하여 문제 발생 시 신속한 대응이 가능하도록 설계했습니다.

### 4.1 개발 환경
