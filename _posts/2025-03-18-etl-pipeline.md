---
layout: post
# Start of Selection
title: "ETL 파이프라인: 확장 가능한 데이터 처리 시스템 구축기"
date: 2025-03-18
categories: [Data Engineering, ETL, Databricks]
tags: [ETL, Databricks, Data Engineering, Python, Spark]
mermaid: true
---

## 1. 개요 및 배경

호텔 예약 플랫폼의 다이나믹 프라이싱 서비스를 위한 ETL 파이프라인 구축 프로젝트를 진행했습니다. 현재는 해외 파트너사 1곳의 데이터만 처리하고 있지만, 곧 국내 1곳과 해외 1곳이 추가될 예정입니다. 각 파트너사마다 데이터 스키마와 포맷이 상이하여, 이를 효율적으로 통합 처리할 수 있는 표준화된 파이프라인이 필요했습니다.

이전까지는 주로 애플리케이션 개발에 집중해왔기 때문에, 일일 4만 개 이상의 데이터를 배치 프로세싱으로 처리하는 빅데이터 환경은 새로운 도전이었습니다. 분산 컴퓨팅 시스템을 구축하고, 태스크를 병렬화하며, 대용량 파일을 병합하는 등의 실제 문제를 해결하면서 실질적인 데이터 엔지니어링 경험을 쌓을 수 있었습니다.

> 이 글은 완성된 솔루션을 제시하는 것이 아니라, 대규모 데이터 엔지니어링과 배치 프로세싱 도입 과정에서 겪은 시행착오와 교훈을 기록한 학습 여정입니다.

## 2. 프로젝트 배경 상세

호텔 예약 플랫폼의 핵심 서비스인 다이나믹 프라이싱 시스템을 운영하고 있습니다. 이 서비스는 실시간으로 시장 상황과 경쟁사 가격을 분석하여 최적의 가격을 결정하는 시스템으로, 향후 다양한 파트너사로 서비스 제공을 확대할 계획입니다.

기존 데이터 파이프라인의 주요 문제점:
1. **스키마 종속성**: 레거시 시스템 전용 스키마로 타 파트너사 데이터 재활용 불가
2. **스토리지 비용 상승**: 지속적인 원본 데이터 적재로 관리 비용과 스토리지 비용 증가
3. **비효율적인 인제스트 방식**: 변경 감지 메커니즘 부재로 중복 적재 및 리소스 낭비
4. **DQA 체계 부재**: 실시간/배치 기반 데이터 품질 검증 체계 미흡

현재 파트너사의 데이터는 CSV 파일로 단편화되어 있고, 테이블명과 컬럼이 불명확하여 의미를 파악하기 어렵습니다. NULL 값과 중복 레코드가 다수 존재하며, 프라이머리 키 충돌이 빈번하여 데이터 무결성이 떨어져 증분 적재(incremental append)도 불가능하고 일일 스냅샷으로 전체 데이터를 오버라이트하고 있는 상황입니다.

### 1.5 Dynamic Pricing Solution 구조
```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px'}}}%%
graph LR
    subgraph "Dynamic Pricing Solution"
        direction LR
        Data[데이터 수집]
        ML[ML 모델]
        Price[가격 결정]
        Analytics[비즈니스 분석]
    end
    
    Data --> ML
    ML --> Price
    Price --> Analytics
```

Dynamic Pricing Solution은 실시간으로 시장 상황과 경쟁사 가격을 분석하여 최적의 가격을 결정하는 시스템입니다. 시스템의 핵심은 정확하고 신뢰할 수 있는 데이터입니다.

### 1.6 ETL 파이프라인의 필요성
```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px'}}}%%
graph LR
    subgraph "데이터 소스"
        direction LR
        Partner[파트너사 데이터]
        Market[시장 데이터]
        Internal[내부 데이터]
    end
    
    subgraph "ETL 파이프라인"
        direction LR
        Extract[데이터 추출]
        Transform[데이터 변환]
        Load[데이터 적재]
    end
    
    subgraph "ML 모델"
        direction LR
        Training[모델 학습]
        Prediction[가격 예측]
    end
    
    Partner --> Extract
    Market --> Extract
    Internal --> Extract
    
    Extract --> Transform
    Transform --> Load
    Load --> Training
    Training --> Prediction
```

ML 모델의 효과적인 학습을 위해서는 다양한 출처에서 수집된 데이터를 정제하고 통합하는 과정이 필수적입니다. 이를 통해 데이터의 품질을 높이고, 모델의 예측 정확도를 향상시킬 수 있습니다. 이러한 데이터 정제 및 통합 과정을 자동화하고 효율적으로 관리하기 위해 ETL 파이프라인을 구축하게 되었습니다. 여기서 시장 데이터는 예약 내역을 포함하며, 내부 데이터는 호텔 정보, 국가 설정 등 다양한 설정 데이터를 포함합니다.

### 1.7 Common Pipeline이 필요한 이유
```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px'}}}%%
graph LR
    subgraph "현재"
        Current[해외 파트너사 1]
    end
    
    subgraph "향후"
        direction LR
        New1[국내 파트너사 1]
        New2[해외 파트너사 2]
    end
    
    subgraph "Common Pipeline"
        direction LR
        Standard[표준화된 처리]
        Quality[품질 관리]
        Monitor[모니터링]
    end
    
    Current --> Standard
    New1 --> Standard
    New2 --> Standard
    
    Standard --> Quality
    Quality --> Monitor
```

현재 해외 파트너사 1곳의 데이터를 처리하고 있으며, 향후 국내 파트너사 1곳과 추가 해외 파트너사 1곳이 추가될 예정입니다. 각 파트너사마다 데이터 제공 방식과 품질 기준이 상이합니다. 이러한 다양한 데이터 소스를 효율적으로 통합 관리하기 위해서는 표준화된 Common Pipeline이 필수적입니다.

## 3. 단계적 접근 전략

이 프로젝트는 문제를 모듈화하여 단계적으로 접근했습니다:

| Phase | 설명 |
|------|------|
| **Phase 1** | SFTP → S3 → 병합 파이프라인 마이그레이션<br>- 기존 Airflow 기반 SFTP 수신 및 S3 저장 파이프라인을 Databricks로 마이그레이션<br>- 40,000개 이상의 파일을 효율적으로 처리하는 병합 작업 구현 |
| **Phase 2** | 데이터 인제스트, 스키마 정규화, 스토리지 최적화<br>- 다양한 파트너사의 데이터 인제스트 방식을 수용할 수 있도록 파이프라인 리팩토링<br>- 스키마 처리 로직을 유연하게 설계하여 이기종 데이터 구조 대응 |
| **Phase 3** | DQA(Data Quality Assurance) 및 데이터 인제스트 표준화<br>- 데이터 품질 검증 프로세스 구현 및 자동화<br>- 다양한 파트너사의 데이터 인제스트 방식을 표준화된 방식으로 통합 |
| **Phase 4** | 스키마 통합 및 최적화<br>- 파트너사별 상이한 스키마를 통합된 형태로 정규화<br>- 데이터 사이언티스트들과 협력하여 최적의 스키마 설계 |

## 4. 현재 파트너사의 데이터 특성

현재 해외 파트너사로부터 수신하는 데이터는 다음과 같은 특성을 갖고 있습니다:

- **데이터 볼륨**
  - 일일 약 40,000개 이상의 `.tar.gz` 압축 파일 수신
  - 각 압축 파일은 약 100MB~500MB 크기
  - 압축 파일 내부에는 테이블별 `.csv` 파일 수십만 개 포함

- **데이터 스키마**
  - 파일명 패턴: `{table_name}_{date}_{batch_id}.csv` 형식으로 제공
  - 테이블마다 스키마와 컬럼 수가 상이 → 병합시 스키마 불일치 이슈
  - 일부 테이블은 일자별 스키마 변동 가능성으로 다이나믹 스키마 핸들링 필요

- **데이터 품질 관리 요건**
  - 데이터 누락/오류 발생 시 ML 파이프라인에 치명적 영향
  - 데이터 정합성과 처리 효율성을 위한 표준화된 프로세싱 필요

## 5. 문제 정의와 구조 개선 과정

### 5.1 초기 접근의 실패

처음에는 문제를 단순하게 접근했습니다. "파일을 읽어서 병합하면 되겠지"라는 생각으로 시작했지만, 실제로는 여러 기술적 한계에 부딪혔습니다.

로컬 환경에서 간단한 Python 스크립트로 접근했으나, 데이터 볼륨이 과도하여 처리 시간이 지나치게 길어지고 리소스 부족으로 프로세스가 종료되는 이슈가 발생했습니다. 확장성을 고려한 복잡한 로직을 구현하다 보니 실행조차 되지 않는 코드만 늘어나는 문제에 직면했습니다.

마침 데이터팀 전체가 Airflow에서 Databricks로 워크플로우 플랫폼을 마이그레이션하는 중이었기 때문에, 이 기회에 바로 Databricks 환경으로 개발을 전환했습니다.

- **메모리 제한**: Python `pandas`로 4만 개 파일 처리 시도 → OOM(Out of Memory) 오류 발생
- **병렬화 시도**: `multiprocessing` 도입 → 프로세스 간 메모리 공유 제약으로 성능 향상 미미
- **Spark 도입**: `coalesce(1)`로 모든 테이블 일괄 병합 시도 → Driver 메모리 부족으로 Job 실패

### 5.2 구조 개선 과정

초기 실패를 통해 다음과 같은 인사이트를 얻었습니다:

1. **워크로드 특성 차이**
   - `.tar.gz` 압축 해제: CPU-bound 작업
   - 파일 병합: IO-bound + Spark shuffle 오퍼레이션
   - 상이한 특성을 가진 작업은 분리 필요

2. **디버깅 복잡성**
   - 단일 Notebook에서 모든 로직 실행
   - 오류 발생 시 근본 원인 분석 어려움
   - 높은 결합도로 인한 부분 수정 어려움

3. **장애 복구 비효율성**
   - 병합 작업 실패 시 압축 해제부터 재실행 필요
   - 이미 성공한 작업도 반복 실행

### 5.2.2 Task 분리 아키텍처 도입
```mermaid
classDiagram
    class DataSource {
        SFTP 서버
        .tar.gz 파일
    }
    
    class Extraction {
        완료 파일 센서
        압축 해제 프로세스
        S3 업로드
    }
    
    class Merge {
        테이블별 병합
        스키마 검증
        정합성 로깅
    }
    
    class Summary {
        summary.txt 생성
        S3 업로드
    }
    
    DataSource --> Extraction : 파일 전송
    Extraction --> Merge : 데이터 전달
    Merge --> Summary : 결과 전달
```

### 5.3 Task 분리 아키텍처 도입

문제 해결을 위해 파이프라인을 독립적인 Task들로 분리했습니다:

- **압축 해제 Task**: Python `tarfile` 모듈 활용, S3에 직접 업로드하여 중간 스토리지 최소화
- **병합 Task**: 테이블별 메타데이터 파일(`table_metadata.json`) 생성하여 스키마 정보 공유
- **Task 간 독립성**: 각 Task는 독립적인 Databricks 클러스터에서 실행, 리소스 경합 방지
- **느슨한 결합(Loose Coupling)**: Task 간 데이터는 S3 경로를 파라미터로 전달

### 5.4 Workflow 기반 전환

Task 분리 후, 더 나은 관리와 자동화를 위해 Databricks Workflow로 전환했습니다:

- **Workflow 구성 세부사항**
  - `pre_set_date`: process_date 파라미터가 미설정 시 어제 날짜로 디폴트 설정
  - `wait_for_all_sources`: 모든 소스 파일 Readiness 체크
  - `batch_extract`: .tar.gz 파일 압축 해제 및 S3 업로드
  - 각 테이블별 `merge_*` task: 독립적인 병합 작업 수행
  - `merge_summary`: 모든 병합 완료 후 summary.txt 생성
  - `post_merge_check`: 최종 결과 검증

- **Workflow 전환의 이점**
  - 병렬 프로세싱 최적화: 각 테이블 병합을 독립적으로 실행하여 전체 처리 시간 단축
  - 장애 복구 효율화: 실패한 task만 선택적 재실행 가능
  - 모니터링 고도화: 태스크별 상태 실시간 트래킹
  - 유지보수성 향상: 태스크별 책임 명확화
  - 스케일 아웃: 새로운 테이블 통합 용이성

## 6. 성능 최적화 전략

### 6.1 Spark 분산 처리 아키텍처

- **문제**: `pandas` 기반 병합 시 4만 개 파일은 메모리 한계 초과, Spark도 23개 테이블 일괄 처리 시 Driver 과부하로 종료

- **솔루션**:
  - 병합 작업을 **테이블 단위로 샤딩**
  - 테이블별 개별 `SparkSession` 생성
  - Spark에서 `coalesce(1)`로 단일 CSV로 저장하되, 읽기/셔플은 분산 처리 유지

- **Spark 튜닝 파라미터**:
  - `spark.default.parallelism`: Executor 코어 수의 2배로 설정하여 병렬성 극대화
  - `spark.sql.shuffle.partitions`: 데이터 볼륨에 최적화된 파티션 수로 동적 조정
  - `spark.memory.fraction`: 0.8로 상향 조정하여 셔플 메모리 할당 최적화
  - `spark.sql.adaptive.enabled=true`: AQE(Adaptive Query Execution) 활성화로 동적 최적화

### 6.1.2 Spark 분산 처리 아키텍처 상세 다이어그램
```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'fontSize': '20px',
    'fontFamily': 'arial',
    'lineHeight': '1.5',
    'textAlignment': 'center'
  },
  'flowchart': {
    'nodeSpacing': 50,
    'rankSpacing': 100,
    'padding': 20,
    'width': '100%',
    'height': '100%'
  }
}}%%
graph LR
    subgraph "Driver 노드"
        direction LR
        D1[Spark Driver<br/>작업 관리] --> D2[테이블별<br/>병합 작업<br/>스케줄링]
    end
    
    subgraph "Executor 노드들"
        direction LR
        E1[Executor 1<br/>파일 읽기/처리]
        E3[Executor 2<br/>파일 읽기/처리]
        E5[Executor N<br/>파일 읽기/처리]
    end
    
    subgraph "S3 저장소"
        direction LR
        S1[병합된<br/>CSV 파일] --> S2[_SUCCESS<br/>파일]
    end
    
    D2 --> E1
    D2 --> E3
    D2 --> E5
    
    E1 --> S1
    E3 --> S1
    E5 --> S1
    
    style D1 fill:#f9f,stroke:#333,stroke-width:4px
    style D2 fill:#f9f,stroke:#333,stroke-width:4px
    style E1 fill:#bbf,stroke:#333,stroke-width:4px
    style E3 fill:#bbf,stroke:#333,stroke-width:4px
    style E5 fill:#bbf,stroke:#333,stroke-width:4px
    style S1 fill:#bfb,stroke:#333,stroke-width:4px
    style S2 fill:#bfb,stroke:#333,stroke-width:4px
```

### 6.2 리소스 최적화

- **솔루션**:
  - `min_workers=2, max_workers=4`의 Auto-scaling Databricks 클러스터 구성
  - 워크로드 증가 시 자동 스케일 아웃
  - 비용 효율성과 성능 사이의 균형점 확보

- **클러스터 컨피그레이션**:
  - 인스턴스 타입: 표준 VM (32GB RAM, 8 코어)로 설정하여 비용 대비 성능 최적화
  - 오토스케일링 트리거: CPU 사용률 70% 이상 지속 5분 초과 시 스케일 아웃
  - 스케일 다운 지연: 10분으로 설정하여 일시적 부하 변동 시 불필요한 스케일 다운 방지
  - 스팟 인스턴스: 비용 절감을 위해 스팟 인스턴스 50% 비율로 구성

### 6.2.2 데이터 처리 최적화 상세 다이어그램
```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px'}}}%%
graph LR
    subgraph "초기 접근"
        direction LR
        A1[단일 Python 스크립트] --> A2[로컬 파일 시스템 사용] --> A3[메모리 부족 오류]
    end
    
    subgraph "Spark 도입"
        direction LR
        B1[Spark 기반 병합] --> B2[Driver OOM 오류] --> B3[테이블별 분리 필요성 발견]
    end
    
    subgraph "Task 분리"
        direction LR
        C1[압축 해제 Task] --> C2[병합 Task] --> C3[요약 Task]
    end
    
    subgraph "Workflow 전환"
        direction LR
        D1[Databricks Workflow] --> D2[파라미터 전달 문제] --> D3[경로 구성 오류]
    end
    
    subgraph "최종 구현"
        direction LR
        E1[병렬 처리 최적화] --> E2[데이터 품질 검증] --> E3[자동화된 Workflow]
    end
    
    A3 --> B1
    B3 --> C1
    C3 --> D1
    D3 --> E1
    
    style A3 fill:#f99,stroke:#333,stroke-width:2px
    style B2 fill:#f99,stroke:#333,stroke-width:2px
    style D2 fill:#f99,stroke:#333,stroke-width:2px
    style D3 fill:#f99,stroke:#333,stroke-width:2px
    style E3 fill:#9f9,stroke:#333,stroke-width:2px
```

## 7. 데이터 품질 검증 및 summary 로깅

### 7.1 데이터 품질 검증

데이터 품질 검증의 중요성:
- ML 모델 학습 데이터 품질은 예측 정확도에 직결
- 파트너사 데이터 제공 방식 변경 시 자동 감지 필요
- 데이터 누락/오류는 의사결정에 치명적 영향 가능

데이터 품질 관리의 실제 도전 과제:
- **품질 차원의 다양성**: NULL 값, 컬럼 누락 외에도 데이터 타입 불일치, 비즈니스 룰 위반, 이상치(outlier) 등 다양한 품질 이슈 존재
- **품질 메트릭의 컨텍스트 종속성**: 비즈니스 컨텍스트에 따라 품질 기준이 상이함
- **시계열적 품질 변동**: 파트너사 데이터 제공 패턴 변화로 예측 불가능한 품질 이슈 발생
- **대규모 데이터 검증의 오버헤드**: 수만 개 파일의 자동화된 검증 체계 구축 난이도

### 7.1.3 데이터 품질 검증 프로세스
```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px'}}}%%
graph LR
    subgraph "데이터 소스"
        direction LR
        S1[병합된 CSV 파일]
        S2[원본 파일 목록]
    end
    
    subgraph "데이터 품질 검증"
        direction LR
        V1[헤더 불일치 검사]
        V2[null 비율 체크]
        V3[파일 개수 누락 여부]
        V4[데이터 타입 검증]
    end
    
    subgraph "결과 처리"
        direction LR
        R1[summary.txt 생성]
        R2[경고/오류 로깅]
        R3[알림 트리거]
    end
    
    S1 --> V1
    S1 --> V2
    S1 --> V4
    S2 --> V3
    
    V1 --> R1
    V2 --> R1
    V3 --> R1
    V4 --> R1
    
    R1 --> R2 --> R3
    
    style V1 fill:#f9f,stroke:#333,stroke-width:2px
    style V2 fill:#f9f,stroke:#333,stroke-width:2px
    style V3 fill:#f9f,stroke:#333,stroke-width:2px
    style V4 fill:#f9f,stroke:#333,stroke-width:2px
    style R1 fill:#bbf,stroke:#333,stroke-width:2px
```

### 7.2 Summary 로깅

Summary 로깅은 전체 ETL 프로세스의 실행 메트릭과 성능을 모니터링하기 위한 메타데이터를 수집하고 기록하는 프로세스입니다:

- **파일 카운트 집계**: 원본 및 병합 후 파일 수 검증
- **레이턴시 측정**: 단계별 처리 소요 시간 트래킹
- **오류/경고 집계**: 모든 예외 상황 및 경고 로깅
- **알람 트리거링**: 임계치 초과 시 담당자 자동 알림

### 7.2.2 Summary 로깅 상세 다이어그램
```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '16px'}}}%%
graph LR
    subgraph "데이터 소스"
        direction LR
        S1[병합된 CSV 파일]
        S2[원본 파일 목록]
    end
    
    subgraph "Summary 생성"
        direction LR
        L1[파일 수 집계]
        L2[처리 시간 기록]
        L3[오류/경고 수집]
    end
    
    subgraph "결과 저장"
        direction LR
        R1[summary.txt 생성]
        R2[S3 업로드]
        R3[알림 발송]
    end
    
    S1 --> L1
    S1 --> L2
    S2 --> L1
    
    L1 --> R1
    L2 --> R1
    L3 --> R1
    
    R1 --> R2 --> R3
    
    style L1 fill:#f9f,stroke:#333,stroke-width:2px
    style L2 fill:#f9f,stroke:#333,stroke-width:2px
    style L3 fill:#f9f,stroke:#333,stroke-width:2px
    style R1 fill:#bbf,stroke:#333,stroke-width:2px
```

## 8. 얻은 교훈

### 8.1 기술적 교훈

- 초기 아키텍처 설계 시 스케일링 요소 간과가 주요 실패 원인
- 모놀리식 구조는 SRP(Single Responsibility Principle) 위반으로 유지보수성 저하
- 퍼포먼스 테스트 부족: 실제 워크로드의 10% 샘플링으로만 테스트하여 프로덕션 배포 시 이슈 발생
- 익셉션 핸들링 미흡: 장애 상황에 대한 명확한 Recovery 전략 부재

구체적 사례:
- **메모리 관리 실패**: 초기에는 단일 프로세스 접근법으로 4만 파일 처리 시도 → OOM 발생
- **Spark 튜닝 부족**: 코어 설정값을 데이터 특성에 맞게 최적화하지 않아 퍼포먼스 저하
- **리소스 할당 불균형**: Driver 노드에 과도한 메모리 할당으로 Executor 리소스 부족
- **병렬화 전략 오류**: 모든 테이블 동시 처리 시도가 Driver OOM의 근본 원인

### 8.2 프로세스 개선 교훈

실제 적용:
- **DQA 자동화**: 헤더 불일치, NULL 비율, 레코드 카운트 등 자동 검증 파이프라인 구현
- **표준화된 인제스트 프로세스**: 이기종 파트너사 데이터 통합을 위한 표준 검증 Flow 적용
- **모니터링 체계**: 처리 레이턴시, 에러율, 데이터 품질 지표 등을 실시간 트래킹하는 대시보드 구축
- **알람 시스템**: 데이터 품질 이슈 발생 시 즉시 알림을 받을 수 있는 체계 구축

### 8.3 팀 협업 교훈

개선 사례:
- **크로스 펑셔널 협업**: DE팀과 ML팀 간 데이터 품질 SLA 정의 및 공유 프로세스 확립
- **파트너사 인터페이스 정립**: 데이터 제공 방식 및 품질 기준에 대한 명확한 스펙 문서화
- **지식 레포지토리 구축**: 트러블슈팅 및 레슨런 문서화를 통한 팀 내 지식 공유 체계 확립
- **정기 리뷰**: 주간 아키텍처 리뷰를 통한 지속적 개선 사이클 구현

## 9. 향후 계획

- 스토리지 레이어 고도화 (Delta Lake 등 검토)
- 테이블 간 레퍼런셜 인테그리티 검증 강화
- 데이터 품질 모니터링 대시보드 고도화
- 스키마 변동에 탄력적으로 대응하는 ELT 아키텍처 구현
- 액세스 패턴 기반 최적화된 파티셔닝 전략 수립

## 10. 결론

이 프로젝트를 통해 대규모 데이터 처리의 복잡성과 도전 과제를 경험했습니다. 초기의 단순한 접근에서 시작하여, 문제를 단계별로 해결하면서 확장성 있는 ETL 파이프라인을 구축하는 과정에서 많은 기술적 교훈과 인사이트를 얻었습니다. 특히 대규모 데이터 처리에서는 단계적인 접근과 모듈화된 설계가 핵심이라는 점을 확인했습니다.

파이프라인의 스케일아웃 능력과 유지보수성을 강화함으로써, 향후 추가될 파트너사의 데이터 통합에도 유연하게 대응할 수 있는 기반을 마련했습니다. 데이터 품질 관리는 단순한 엔지니어링 이슈가 아니라 지속적인 모니터링과 개선이 필요한 복합적 프로세스임을 인식하고, 이를 위한 체계적인 접근 방식을 발전시켜 나갈 계획입니다.