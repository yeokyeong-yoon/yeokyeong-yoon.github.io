---
layout: post
title: "ETL 파이프라인: 확장 가능한 데이터 처리 시스템 구축기"
date: 2025-03-18
categories: [Data Engineering]
tags: [etl, databricks, aws-s3, data-engineering]
mermaid: true
---

<style>
.mermaid {
  width: 100%;
  max-width: 100%;
  margin: 20px auto;
  font-size: 14px;
  font-family: 'Arial', sans-serif;
  overflow: hidden;
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
  font-size: 14px;
  font-weight: 500;
}
.mermaid .edgeLabel {
  font-size: 12px;
  background-color: white;
  padding: 2px 4px;
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
  font-size: 16px;
  font-weight: bold;
}
.mermaid .timeline-event {
  font-size: 14px;
}
.mermaid .journey-section {
  font-size: 14px;
  font-weight: bold;
}

/* 모바일 최적화를 위한 미디어 쿼리 */
@media screen and (max-width: 768px) {
  .mermaid {
    font-size: 12px;
    margin: 15px 0;
  }
  .mermaid .node text {
    font-size: 12px;
  }
  .mermaid .edgeLabel {
    font-size: 10px;
    padding: 1px 2px;
  }
  .mermaid .label {
    font-size: 14px;
  }
  .mermaid .timeline-event,
  .mermaid .journey-section {
    font-size: 12px;
  }
}
</style>

# ETL 파이프라인: 데이터 처리 시스템 구축기 - 초기 단계

## 1. 개요

현재 진행 중인 ETL 파이프라인 프로젝트는 파트너사의 데이터를 효율적으로 처리하고 통합하는 시스템을 구축하는 것이 목표입니다. 이 글에서는 현재 진행 중인 작업의 초기 단계와 그 과정에서 직면한 어려움, 그리고 앞으로의 방향성에 대해 공유하고자 합니다.

### 1.1 현재 진행 중인 작업

- **데이터 소스**: 파트너사의 `.tar.gz` 압축 파일과 `.csv` 파일
- **처리 환경**: Databricks를 활용한 데이터 처리
- **주요 작업**: 
  - 압축 파일 처리 및 데이터 추출
  - 테이블별 데이터 병합
  - 중복 제거 및 데이터 정제
  - Config 테이블(17개)과 Transaction 테이블(3개) 분류

### 1.2 현재 직면한 어려움

#### 1.2.1 현재 파트너사 데이터 품질 이슈
- 데이터 무결성(Integrity) 문제
  - 단순 append 방식으로 저장 불가
  - 과거 데이터부터 스냅샷 형태로 제공
  - 40,000개 이상의 파일을 scatter하게 받아야 함
  - 이를 다시 하나의 테이블로 병합하는 작업 필요
- 데이터 구조의 불일치
  - 파일명과 실제 데이터 구조의 불일치
  - 테이블별 데이터 포맷 차이
  - 누락된 필드나 잘못된 데이터 타입

#### 1.2.2 향후 확장 시 예상되는 어려움
- 데이터 제공 방식의 불확실성
  - API를 통한 실시간 데이터 전송
  - 현재처럼 파일 덤프 방식
  - 다른 형식의 데이터 제공
- 새로운 파트너사별 데이터 품질 이슈
  - 각 파트너사별 다른 데이터 품질 기준
  - 다양한 데이터 포맷과 구조
  - 상이한 데이터 제공 주기

#### 1.2.3 공통적인 기술적 과제
- 처리 효율성 문제
  - 대용량 파일 처리의 어려움
  - 메모리 사용량 최적화 필요
  - 처리 시간 개선 필요
- 시스템 안정성
  - 에러 처리 및 복구 전략
  - 데이터 검증 및 모니터링
  - 시스템 리소스 관리

### 1.3 향후 계획

현재는 가장 기본적인 데이터 수집과 처리 단계에 초점을 맞추고 있습니다. 향후 다음과 같은 발전을 계획하고 있습니다:

- 데이터 품질 관리 강화
- 실시간 데이터 처리 지원
- 머신러닝 파이프라인 통합
- 모니터링 및 알림 시스템 구축

### 1.4 현재의 도전 과제

현재 직면한 주요 과제는 다음과 같습니다:

- 대용량 압축 파일 처리의 효율성
- 데이터 병합 과정의 안정성
- 메모리 사용량 최적화
- 에러 처리 및 복구 전략
- 데이터 품질 이슈 해결

이러한 과제들을 해결하면서, 앞으로 더 견고한 ETL 파이프라인을 구축해 나갈 계획입니다.

## 2. 아키텍처 설계

### 2.1 전체 아키텍처

현재 구축 중인 ETL 파이프라인의 전체 아키텍처는 다음과 같습니다:

```mermaid
graph TD
    %% Define nodes
    S3[(S3 Bucket<br>{masked-bucket-name})]
    Extraction[Data Extraction]
    Validation[File Validation]
    TableExtraction[Table Name Extraction]
    Integration[Data Integration]
    Standardization[Data Standardization]
    Transformation[Data Transformation]
    Storage[Storage]
    
    %% Subgraphs
    subgraph "S3 Source Layer"
        S3
    end
    
    subgraph "ETL Pipeline"
        subgraph "Extraction Phase"
            Extraction --> Validation
            Validation --> TableExtraction
        end
        
        subgraph "Processing Phase"
            Integration --> Standardization
            Standardization --> Transformation
        end
    end
    
    subgraph "Storage Layer"
        Storage
    end
    
    %% Connections
    S3 -->|"data/YYYY/MM/DD/*.tar.gz<br>data/YYYY/MM/DD/*.csv"| Extraction
    
    Extraction -->|"Filter files by date"| Validation
    Validation -->|"Verify file format<br>.tar.gz or .csv"| TableExtraction
    TableExtraction -->|"Extract table names<br>using flexible patterns"| Integration
    
    Integration -->|"Merge data by table<br>from multiple files"| Standardization
    Transformation -->|"Processed tables"| Storage
    
    Storage -->|"processed/partner/YYYY/MM/DD/"| S3
    
    %% Notes
    classDef process fill:#f9f,stroke:#333,stroke-width:2px;
    classDef data fill:#bbf,stroke:#33c,stroke-width:2px;
    classDef source fill:#bfb,stroke:#3c3,stroke-width:2px;
    
    class Extraction,Validation,TableExtraction,Integration,Standardization,Transformation process;
    class S3,Storage data;
```

### 2.2 데이터 처리 흐름

```mermaid
graph TD
    %% Define nodes
    S3Input[(S3 Input<br>{masked-bucket-name}/data/YYYY/MM/DD/)]
    FileFilter[File Filter]
    FormatValidation[Format Validation]
    
    TarGzProcess[TAR.GZ Processing]
    CsvProcess[CSV Processing]
    TableNameExtract[Table Name Extraction]
    DataMerge[Data Merge]
    Deduplication[Deduplication]
    
    ConfigTables[(Configuration Tables)]
    TransactionTables[(Transaction Tables)]
    
    S3Output[(S3 Output<br>processed/partner/YYYY/MM/DD/)]
    
    %% Flow connections
    S3Input --> FileFilter
    
    FileFilter -->|"List S3 Objects"| FormatValidation
    
    FormatValidation -->|".tar.gz files"| TarGzProcess
    FormatValidation -->|".csv files"| CsvProcess
    
    TarGzProcess -->|"Extract CSVs<br>from archive"| TableNameExtract
    CsvProcess -->|"Direct<br>processing"| TableNameExtract
    
    TableNameExtract -->|"Match with<br>known tables"| DataMerge
    
    DataMerge -->|"Merge by<br>table name"| Deduplication
    
    Deduplication -->|"Config tables"| ConfigTables
    Deduplication -->|"Transaction tables"| TransactionTables
    
    ConfigTables --> S3Output
    TransactionTables --> S3Output
    
    %% Style classes
    classDef process fill:#f9f,stroke:#333,stroke-width:2px;
    classDef data fill:#bbf,stroke:#33c,stroke-width:2px;
    classDef note fill:#fffbd6,stroke:#ccc,stroke-width:1px,stroke-dasharray: 5 5;
    
    class FileFilter,FormatValidation,TarGzProcess,CsvProcess,TableNameExtract,DataMerge,Deduplication process;
    class S3Input,ConfigTables,TransactionTables,S3Output data;
```

### 2.3 핵심 컴포넌트

1. **데이터 소스**: 
   - S3 버킷: `{masked-bucket-name}`
   - 기본 경로: `data`
   - 날짜별 경로: `data/YYYY/MM/DD/`

2. **파일 형식**:
   - CSV 파일을 포함한 TAR.GZ 아카이브
   - 직접 CSV 파일

3. **파일 명명 패턴**:
   - `{provider}_TABLENAME_DATE.tar.gz`
   - `{provider}_TABLENAME_DATE.csv`
   - `TABLENAME_YYYYMMDD.csv`
   - 날짜 패턴이 있는 파일: YYYY/MM/DD, YYYY-MM-DD, YYYYMMDD

4. **테이블 카테고리**:
   - **설정 테이블 (17개)**: 설정 정보를 저장하는 테이블
   - **거래 테이블 (3개)**: 거래 정보를 저장하는 테이블

5. **처리 단계**:
   - 파일 검증 (확장자 확인)
   - 유연한 패턴 매칭을 통한 테이블명 추출
   - 여러 파일의 데이터 통합
   - 레코드 중복 제거
   - 설정 및 거래 테이블로 분류

6. **출력**:
   - 처리된 데이터는 S3의 `processed/partner/YYYY/MM/DD/`에 저장
   - 테이블명별로 데이터 구성

## 3. 데이터 처리 파이프라인

### 3.1 데이터 추출 (Extract)

#### 3.1.1 파일 처리
- **S3 파일 접근**
  ```python
  s3_path = f"s3://{masked-bucket-name}/data/{date}"
  files = dbutils.fs.ls(s3_path)
  ```

- **파일 필터링**
  ```python
  tar_files = [f for f in files if f.name.endswith('.tar.gz')]
  csv_files = [f for f in files if f.name.endswith('.csv')]
  ```

#### 3.1.2 데이터 검증
- 파일 형식 검증
- 테이블명 추출 및 검증
- 데이터 구조 검증

### 3.2 데이터 변환 (Transform)

#### 3.2.1 압축 파일 처리
- `.tar.gz` 파일 압축 해제
- CSV 파일 추출 및 검증

#### 3.2.2 테이블 분류
- 설정 테이블 (17개) 분류
- 거래 테이블 (3개) 분류

#### 3.2.3 데이터 병합
- 테이블별 데이터 병합
- 중복 제거
- 데이터 정제

### 3.3 데이터 로드 (Load)

#### 3.3.1 저장 경로 구조
```
processed/partner/YYYY/MM/DD/
├── config/
│   └── {table_name}/
└── transaction/
    └── {table_name}/
```

#### 3.3.2 데이터 저장
- 테이블별 데이터 저장
- 메타데이터 기록
- 처리 결과 로깅

### 3.4 현재 구현 상태와 향후 방향

#### 3.4.1 현재 구현 상태
현재는 파트너사 데이터 처리에 집중하여 다음과 같은 기능을 구현했습니다:

- **기본 데이터 처리**
  - `.tar.gz` 파일 처리
  - CSV 파일 처리
  - 테이블별 데이터 분류

- **데이터 정제**
  - 중복 제거
  - 데이터 포맷 검증
  - 누락 데이터 처리

#### 3.4.2 향후 구현 방향
앞으로 다음과 같은 구조로 발전시키고자 합니다:

```python
# 향후 구현하고자 하는 구조의 예시
class DataProcessor:
    def __init__(self, provider_name):
        self.provider_name = provider_name
        self.file_patterns = self._load_file_patterns()
        self.table_mappings = self._load_table_mappings()
    
    def process_files(self, files):
        # 파일 처리 로직
        pass
```

```python
# 향후 구현하고자 하는 구조의 예시
class CommonProcessor:
    def __init__(self):
        self.validators = self._load_validators()
        self.transformers = self._load_transformers()
    
    def validate_data(self, data):
        # 데이터 검증 로직
        pass
```

이러한 구조로 발전시키면 다음과 같은 이점이 있을 것으로 기대됩니다:

1. **코드 재사용성 향상**
   - 공통 기능의 모듈화
   - 중복 코드 제거

2. **유지보수 용이성**
   - 명확한 책임 분리
   - 버그 수정의 용이성

3. **확장성**
   - 새로운 데이터 제공자 추가 용이
   - 새로운 처리 규칙 추가 용이

4. **테스트 용이성**
   - 단위 테스트 작성 용이
   - 통합 테스트 구현 용이

## 4. 개발 및 운영 전략

### 4.1 개발 환경

#### 4.1.1 현재 개발 환경
- **Databricks 클러스터**
  - Driver: 4코어, 32GB 메모리
  - Worker: 8코어, 64GB 메모리
  - Worker 노드: 최소 2개, 최대 4개

- **기본 라이브러리**
  - Python 3.x
  - pandas, numpy
  - Databricks 유틸리티

#### 4.1.2 향후 개선 방향
앞으로 다음과 같은 구조로 코드를 정리하고자 합니다:

```
etl_pipeline/
├── config/
│   ├── providers/
│   │   └── provider_config.yaml  # 파트너사별 설정
│   └── tables/
│       ├── config_tables.yaml
│       └── transaction_tables.yaml
├── utils/
│   ├── processors/
│   │   └── data_processor.py  # 데이터 처리기
│   └── validators/
│       └── data_validator.py
└── jobs/
    └── daily_etl.py  # ETL 작업
```

### 4.2 ETL 파이프라인 운영 프로세스

#### 4.2.1 일일 처리 프로세스
1. **데이터 수집**
   - S3 파일 확인
   - 파일 무결성 검증

2. **데이터 처리**
   - 압축 파일 처리
   - 테이블 분류 및 병합
   - 데이터 정제

3. **결과 저장**
   - 테이블별 데이터 저장
   - 처리 결과 로깅

#### 4.2.2 모니터링 및 알림
- **처리 상태 모니터링**
  - 작업 완료 여부
  - 레코드 수 확인
  - 오류 발생 여부

- **알림 설정**
  - 작업 실패 알림
  - 데이터 품질 이슈 알림
  - 처리 지연 알림

### 4.3 오류 처리 및 복구 전략

#### 4.3.1 오류 유형별 대응
- **파일 처리 오류**
  - 압축 해제 실패
  - 형식 불일치
  - 데이터 구조 오류

- **데이터 처리 오류**
  - 메모리 부족
  - 병합 실패
  - 중복 데이터 처리

#### 4.3.2 복구 프로세스
- **자동 복구**
  - 실패한 작업 재시도
  - 부분 실패 후 계속 처리

- **수동 개입**
  - 심각한 오류 발생 시
  - 데이터 무결성 이슈 발생 시

### 4.4 모듈화된 구조 운영

#### 4.4.1 데이터 제공자 관리
- **새로운 제공자 추가**
  1. 설정 파일 생성 (`config/providers/new_provider.yaml`)
  2. 테이블 매핑 정의 (`config/tables/new_provider_tables.yaml`)
  3. 특수 처리 규칙 추가 (필요한 경우)

- **제공자별 모니터링**
  - 처리 성능 지표
  - 오류 발생 빈도
  - 데이터 품질 메트릭

#### 4.4.2 공통 처리기 운영
- **검증 규칙 관리**
  - 규칙 버전 관리
  - 규칙 적용 범위 설정
  - 규칙 테스트 및 검증

- **변환 규칙 관리**
  - 표준화 규칙 업데이트
  - 성능 최적화
  - 호환성 유지

#### 4.4.3 설정 관리
- **설정 버전 관리**
  - Git을 통한 설정 파일 관리
  - 변경 이력 추적
  - 롤백 프로세스

- **환경별 설정**
  - 개발/테스트/운영 환경 분리
  - 환경별 특수 규칙 적용
  - 설정 검증 프로세스

## 5. 확장성 및 향후 계획

### 5.1 현재 시스템의 확장성

#### 5.1.1 데이터 처리 확장성
- **클러스터 자동 스케일링**
  - 작업 부하에 따른 Worker 노드 수 조정
  - 메모리 사용량 최적화

- **병렬 처리 최적화**
  - 테이블별 독립적 처리
  - 리소스 효율적 분배

#### 5.1.2 저장소 확장성
- **S3 기반 스토리지**
  - 무제한 스토리지 확장
  - 비용 최적화를 위한 데이터 수명 주기 관리

### 5.2 향후 개선 계획

#### 5.2.1 단기 개선사항
- **데이터 품질 강화**
  - 자동화된 데이터 검증
  - 품질 메트릭 모니터링

- **성능 최적화**
  - 처리 속도 개선
  - 리소스 사용 효율화

#### 5.2.2 중장기 계획
- **기능 확장**
  - 실시간 데이터 처리 지원
  - 다양한 데이터 소스 통합

- **운영 효율화**
  - 자동화된 모니터링
  - 예측적 유지보수

### 5.3 모듈화된 구조 확장

#### 5.3.1 새로운 데이터 제공자 통합
- **통합 프로세스**
  1. 제공자 분석 및 요구사항 정의
  2. 설정 파일 생성 및 검증
  3. 테스트 환경에서 검증
  4. 운영 환경 배포

- **검증 체계**
  - 데이터 품질 검증
  - 성능 테스트
  - 안정성 검증

#### 5.3.2 공통 처리기 확장
- **새로운 검증 규칙 추가**
  - 비즈니스 규칙 통합
  - 데이터 품질 규칙 확장
  - 자동화된 규칙 테스트

- **변환 규칙 확장**
  - 새로운 데이터 형식 지원
  - 표준화 규칙 확장
  - 성능 최적화

#### 5.3.3 모니터링 시스템 확장
- **제공자별 모니터링**
  - 처리 성능 지표
  - 오류 발생 추적
  - 데이터 품질 메트릭

- **시스템 전반 모니터링**
  - 리소스 사용량
  - 처리 시간
  - 오류율

### 5.4 기술 스택 발전 방향

#### 5.4.1 현재 기술 스택
- **핵심 기술**
  - Databricks
  - AWS S3
  - Python

#### 5.4.2 도입 검토 기술
- **데이터 품질 관리**
  - Great Expectations
  - dbt

- **모니터링 및 로깅**
  - Datadog
  - ELK Stack

### 5.5 확장성 고려사항

#### 5.5.1 아키텍처 확장성
- **모듈화된 구조**
  - 독립적인 컴포넌트 설계
  - 느슨한 결합 유지
  - 명확한 인터페이스 정의

- **설정 관리**
  - 중앙화된 설정 관리
  - 버전 관리
  - 환경별 설정 분리

#### 5.5.2 운영 확장성
- **자동화**
  - 배포 자동화
  - 테스트 자동화
  - 모니터링 자동화

- **유지보수**
  - 모듈별 독립적 업데이트
  - 롤백 프로세스
  - 버전 관리

## 6. 개인적인 소감 및 배운 점

### 6.1 파이프라인 구축과 데이터 품질의 중요성

파이프라인을 만드는 것이 주요 작업일 것이라고 생각했는데, 실제로는 데이터 품질 관리(DQA)가 훨씬 더 큰 작업이었다. 코드 몇 줄로 데이터를 A에서 B로 옮기는 것은 상대적으로 쉽지만, 그 데이터가 신뢰할 수 있고 일관된 것인지 확인하는 과정에 더 많은 노력이 필요했다. 특히 업종에 대한 지식을 활용한 검증 규칙을 만드는 것은 단순한 기술적 문제를 넘어, 비즈니스 규칙에 대한 깊은 이해가 필요한 작업이었다.

### 6.2 확장성과 과도한 설계 사이의 균형

아직 추가되지도 않은 데이터 소스들을 미리 고려하면서 설계하는 것이 생각보다 어려웠다. 코드를 나중에 적게 수정할 수 있도록 만들려고 했는데, 오히려 각 데이터 출처별로 맞춤형 변환기를 만드는 방식을 선택하니 코드가 계속 늘어나는 것 같았다. 이런 접근법에는 장단점이 있다고 느꼈다. 확실히 추가될 요소라면 미리 구현하되, 불확실한 미래를 위해 너무 복잡한 설계를 하는 것은 과감히 포기하는 것도 필요하다는 교훈을 얻었다. 실용성과 확장성 사이에서 적절한 균형을 찾는 것이 매우 중요하다는 점을 배웠다.

### 6.3 데이터 품질 관리의 어려움

#### 6.3.1 현재 파트너사 데이터 품질 이슈
현재 처리 중인 파트너사의 데이터는 예상보다 훨씬 더 큰 도전 과제였다. 특히 데이터 무결성 문제로 인해 단순한 append 방식으로는 데이터를 저장할 수 없었고, 과거 데이터부터 스냅샷 형태로 제공되는 상황에서 40,000개 이상의 파일을 처리해야 하는 상황이었다. 이러한 상황에서 데이터를 효율적으로 병합하고 정제하는 과정이 매우 복잡하고 시간이 많이 소요되었다. 이는 단순한 기술적 문제를 넘어 비즈니스 프로세스와 데이터 관리 방식에 대한 깊은 이해가 필요한 작업이었다.

#### 6.3.2 향후 확장 시 예상되는 데이터 품질 이슈
앞으로 새로운 파트너사들이 추가될 때마다 각각 다른 데이터 품질 기준과 제공 방식을 고려해야 할 것이다. API를 통한 실시간 데이터 전송부터 파일 덤프 방식까지, 다양한 데이터 제공 방식에 대응할 수 있는 유연한 시스템을 구축하는 것이 중요하다. 각 파트너사별로 다른 데이터 포맷과 구조, 그리고 상이한 데이터 제공 주기를 고려한 설계가 필요하다.

### 6.4 데이터를 통한 비즈니스 인사이트

ETL 파이프라인을 구축하면서 가장 흥미로웠던 점은 데이터를 통해 비즈니스의 작동 방식을 들여다볼 수 있다는 것이었다. 수많은 변수들이 실시간으로 데이터에 영향을 미치는 것을 보면서, 비즈니스 규칙들이 실제로 어떻게 동작하는지 목격하는 것 같았다. 특히 데이터 패턴과 트렌드가 명확하게 드러나는 것을 보며 놀라웠다. 기술을 통해 비즈니스의 숨겨진 패턴을 발견하고 이해하는 과정이 마치 퍼즐을 맞추는 것처럼 즐거웠다. 이런 경험은 내가 단순한 개발자가 아닌, 비즈니스와 기술의 접점에서 일하는 엔지니어라는 것을 실감하게 해주었다.

### 6.5 기술적 인사이트

#### 6.5.1 데이터 처리 최적화
- **파일 처리 효율성**
  - 대용량 압축 파일 처리 시 메모리 관리의 중요성
  - 병렬 처리와 리소스 분배의 균형

- **데이터 품질 관리**
  - 검증 단계의 중요성
  - 자동화된 품질 검증의 필요성

#### 6.5.2 시스템 설계
- **모듈화의 중요성**
  - 기능별 명확한 분리
  - 재사용 가능한 컴포넌트 설계

- **확장성 고려**
  - 미래 요구사항을 고려한 설계
  - 유연한 구조의 필요성

## 용어 정리

### ETL 관련
- **ETL (Extract, Transform, Load)**: 데이터를 추출하고 변환하여 저장하는 과정
- **데이터 파이프라인**: 데이터를 한 지점에서 다른 지점으로 이동하고 처리하는 시스템
- **데이터 품질 검증**: 데이터의 정확성, 완전성, 일관성을 확인하는 과정

### 데이터 처리 관련
- **Config 테이블**: 설정 정보를 저장하는 테이블 (17개)
- **Transaction 테이블**: 거래 정보를 저장하는 테이블 (3개)
- **데이터 병합**: 여러 파일의 데이터를 하나로 통합하는 과정
- **중복 제거**: 동일한 데이터의 중복을 제거하는 과정

### 기술 스택 관련
- **Databricks**: 대규모 데이터 처리와 분석을 위한 통합 플랫폼
- **AWS S3**: 클라우드 기반 객체 스토리지 서비스
- **Python**: 프로그래밍 언어

### 운영 관련
- **모니터링**: 시스템의 상태와 성능을 지속적으로 관찰하는 과정
- **로깅**: 시스템의 동작과 이벤트를 기록하는 과정
- **자동화**: 수동 작업을 자동으로 처리하는 과정