# Databricks 활용 가이드 (PI 팀)

## 목차

1. [개요](#1-개요)
2. [환경 설정](#2-환경-설정)
   - [접속 정보](#21-접속-정보)
   - [프로젝트 구조](#22-프로젝트-구조)
   - [클러스터 구성](#23-클러스터-구성)
3. [핵심 구성 요소](#3-핵심-구성-요소)
   - [Delta Lake](#31-delta-lake)
   - [Unity Catalog](#32-unity-catalog)
   - [Feature Store](#33-feature-store)
   - [Workflows](#34-workflows)
4. [데이터 파이프라인](#4-데이터-파이프라인)
   - [Bronze 레이어](#41-bronze-레이어)
   - [Silver 레이어](#42-silver-레이어)
   - [Gold 레이어](#43-gold-레이어)
5. [AWS 연동](#5-aws-연동)
   - [S3 접근 구조](#51-s3-접근-구조)
   - [교차 계정 접근](#52-교차-계정-접근)
6. [개발 및 운영](#6-개발-및-운영)
   - [개발 워크플로우](#61-개발-워크플로우)
   - [작업 스케줄링](#62-작업-스케줄링)
   - [MLOps 적용](#63-mlops-적용)
7. [모범 사례](#7-모범-사례)
   - [파이프라인 최적화](#71-파이프라인-최적화)
   - [비용 최적화](#72-비용-최적화)
   - [팀 협업](#73-팀-협업)
8. [기존 솔루션과 비교](#8-기존-솔루션과-비교)
   - [전통적 데이터 처리 vs Databricks](#81-전통적-데이터-처리-vs-databricks)
   - [Airflow vs Workflows](#82-airflow-vs-workflows)
   - [기존 ML 개발 vs Databricks](#83-기존-ml-개발-vs-databricks)
   - [저장 형식 비교](#84-저장-형식-비교)
   - [메타데이터 관리 비교](#85-메타데이터-관리-비교)
   - [Feature Store 비교](#86-feature-store-비교)

## 1. 개요

Databricks는 빅데이터 처리, 머신러닝 모델 개발 및 배포를 위한 통합 플랫폼입니다. 이 문서는 PI 팀원들이 Databricks와 AWS 환경을 효과적으로 활용할 수 있도록 작성되었습니다.

### 주요 장점

- **통합 환경**: 데이터 수집부터 모델 배포까지 단일 플랫폼에서 관리
- **협업 효율화**: 노트북 공유, 실시간 협업, 버전 관리 통합
- **관리 부담 감소**: 인프라 관리 없이 데이터와 모델에 집중
- **비용 효율화**: 자동 스케일링과 클러스터 자동 종료

> 상세 가이드는 [Y-NEXT Databricks 공식 문서](https://docs.google.com/document/d/1ZsHEtJCZmf7bvaUzoouNEqa7pAkbdDOXlaInkRpUOQc/edit?tab=t.nle4og35ays7)를 참조하세요.

## 2. 환경 설정

### 2.1 접속 정보

- **개발 환경**: https://dbc-eaa44ee2-0280.cloud.databricks.com
- **운영 환경**: https://dbc-5e36b67f-88ec.cloud.databricks.com
- **지원 채널**: 
  - #next_databricks (환경 관련)
  - #ext-yanolja-databricks (기능 관련)
- **그룹**: databricks_next_pi

### 2.2 프로젝트 구조

```
/Shared/pi/
├── development/           # 개발 환경
│   ├── etl/              # 데이터 수집/검증
│   ├── feature_engineering/
│   ├── model_training/
│   ├── price_generation/
│   └── monitoring/
├── production/           # 운영 환경 (버전 관리)
│   ├── etl/
│   ├── feature_engineering/
│   ├── model_training/
│   ├── price_generation/
│   └── monitoring/
├── libraries/           # 공유 코드
│   ├── data_validation.py
│   ├── feature_utils.py
│   ├── model_utils.py
│   └── monitoring_utils.py
└── config/             # 환경 설정
    ├── dev_config.json
    └── prod_config.json
```

### 2.3 클러스터 구성

#### 개발용 공유 클러스터 (All-purpose)

- **이름**: `pi_team_development_cluster`
- **스펙**: Standard_DS3_v2 (4 vCPU, 14GB RAM)
- **설정**:
  - 자동 종료: 120분 (비활성 시)
  - 자동 스케일링: 2-4 노드
- **태그**: 
  ```
  BillingGroup=databricks_next_pi
  Team=next
  Product=YPrice
  ```

#### 운영용 Job 클러스터

- **특징**: 작업 실행 시에만 생성
- **노드**: 작업별 최적화된 인스턴스 선택
- **관리**: 워크플로우 종료 후 자동 종료
- **태그**: 개발용과 동일

## 3. 핵심 구성 요소

### 3.1 Delta Lake

**특징**:
- ACID 트랜잭션 지원으로 데이터 일관성 보장
- 데이터 버전 관리 및 Time Travel (이전 버전 복원)
- 스키마 강제화 및 진화 지원
- 최적화된 읽기 성능

**기존 CSV/Parquet 대비 장점**:
- **데이터 일관성**: 일반 CSV/Parquet은 변경 중 읽기 오류 발생 가능, Delta는 ACID 트랜잭션으로 항상 일관된 데이터 보장
- **버전 관리**: 실수로 데이터를 삭제하거나 변경해도 이전 버전으로 복원 가능 (기존 파일 형식은 불가능)
- **스키마 진화**: 스키마 변경 시 기존 데이터와의 호환성 자동 관리 (기존 방식은 수동 관리 필요)
- **성능 최적화**: 자동 인덱싱 및 파일 압축으로 쿼리 성능 10배 이상 향상
- **업데이트/삭제 지원**: UPDATE, DELETE, MERGE 등 SQL 문 지원 (CSV/Parquet은 불가)

**사용 예시**:
```python
# Delta 테이블 읽기
df = spark.read.format("delta").load("/path/to/delta/table")

# 특정 버전의 데이터 읽기 (Time Travel)
df_old = spark.read.format("delta").option("versionAsOf", 5).load("/path/to/delta/table")

# 데이터 업데이트 (CSV/Parquet에서는 불가능)
spark.sql("""
UPDATE my_delta_table
SET price = price * 1.1
WHERE category = 'premium'
""")
```

### 3.2 Unity Catalog

**특징**:
- **계층 구조**: Catalog > Schema > Table 형태로 구성
- **중앙화된 거버넌스**: 모든 데이터(구조화/비구조화), AI 모델, Notebook, 대시보드를 단일 플랫폼에서 관리
- **세분화된 접근 제어**: 테이블, 컬럼, 행 단위로 정밀한 권한 관리 가능
- **데이터 계보 추적**: 데이터의 출처와 변환 과정을 자동으로 추적
- **크로스 클라우드 호환성**: AWS, Azure, GCP 등 멀티 클라우드 환경에서 통합 정책 적용 가능

**기존 방식 대비 장점**:
- **통합 메타데이터 관리**: 기존에는 여러 시스템(Hive Metastore, 별도 문서, 위키 등)에 분산된 메타데이터를 단일 시스템에서 관리
- **데이터 발견성 향상**: "어떤 테이블이 있는지", "어떤 컬럼이 무슨 의미인지" 쉽게 탐색 가능 (기존에는 개인 지식이나 문서에 의존)
- **거버넌스 간소화**: 접근 권한 관리, 감사 로그, 데이터 계보를 한 곳에서 관리 (기존에는 여러 도구로 분산 관리)
- **협업 효율화**: 팀 간 데이터 공유와 재사용이 용이해져 중복 작업 감소 (50%까지 개발 시간 단축 가능)
- **자동화된 규정 준수**: 데이터 접근, 변경 내역이 자동 기록되어 규제 준수 용이 (기존에는 별도 로깅 설정 필요)

**사용 예시**:
```sql
-- PI 팀 전용 테이블 생성
CREATE TABLE next_prod.pi_schema.price_predictions
USING DELTA
LOCATION 's3://data-yanolja-general/data/t1/ezee/gold/price_predictions';

-- 다른 팀의 테이블 참조
SELECT * FROM next_prod.other_schema.shared_data;

-- 테이블 메타데이터 정의 (기존에는 별도 문서화 필요)
COMMENT ON TABLE next_prod.pi_schema.price_predictions IS '호텔 가격 예측 결과 테이블';
COMMENT ON COLUMN next_prod.pi_schema.price_predictions.price IS '예측된 객실 가격 (KRW)';

-- 상세 권한 관리 (기존에는 복잡한 IAM 정책 필요)
GRANT SELECT ON TABLE next_prod.pi_schema.price_predictions TO `data_scientists`;
GRANT SELECT ON COLUMN next_prod.pi_schema.price_predictions.hotel_id TO `analysts`;
```

**실무적 이점**:
1. **데이터 검색 간소화**: 태그와 메타데이터로 필요한 데이터를 검색 시간 90% 단축
2. **워크스페이스 간 자원 공유**: 물리적 데이터 복제 없이 안전한 데이터 공유로 스토리지 비용 절감
3. **규정 준수 및 감사**: 자동화된 감사 로그로 보안 감사 시간 75% 단축
4. **데이터 품질 향상**: 표준화된 메타데이터 관리로 사용자 에러 40% 감소

### 3.3 Feature Store

**개념 및 핵심 기능**:
- **피처 재사용성**: 팀 전체에서 피처를 검색/공유할 수 있는 중앙 저장소
- **트레이닝-서빙 일관성**: 모델 개발과 프로덕션 환경에서 동일한 피처 계산 로직 보장
- **Offline/Online Store 분리**: 배치 처리와 실시간 서빙을 위한 저장소 통합 관리
- **MLflow 통합**: 모델 학습 시 사용된 피처 메타데이터를 자동으로 패키징
- **시간 기반 조회**: 시계열 데이터에 대한 정확한 Point-in-Time 피처 조회 지원

**기존 방식 대비 장점**:
- **피처 중복 제거**: 기존에는 각 데이터 과학자가 유사한 피처를 개별 생성하여 코드/계산 중복 발생, Feature Store로 60% 코드 중복 제거
- **학습-서빙 불일치 해소**: 기존에는 훈련 시 생성한 피처와 서빙 시 생성한 피처의 차이로 모델 성능 저하 발생, Feature Store로 완전한 일관성 보장
- **개발 사이클 단축**: 검증된 피처 재사용으로 모델 개발 시간 최대 70% 단축
- **피처 품질 향상**: 중앙화된 피처 검증 및 모니터링으로 데이터 품질 이슈 60% 감소
- **운영 부담 감소**: 피처 계산 로직 유지보수의 중앙화로 운영 부담 50% 감소
- **규모 확장 용이**: 피처 계산 로직을 독립적으로 확장 가능, 모델 증가에도 피처 파이프라인은 선형적 증가 아님

**Y-Price 활용 시나리오**:
```python
# Feature Store 클라이언트 초기화
from databricks.feature_store import FeatureStoreClient
fs = FeatureStoreClient()

# 특성 테이블 생성
price_features = fs.create_table(
    name="next_prod.pi_schema.price_features",
    primary_keys=["property_id", "room_type_id", "date"],
    path="s3://data-yanolja-general/data/t1/ezee/features/price_features"
)

# 특성 저장 (매일 자동 업데이트)
fs.write_table(
    df=features_df,
    name="next_prod.pi_schema.price_features",
    mode="merge"
)

# 모델 학습용 특성 검색 (시점별 올바른 피처 자동 조회)
training_data = fs.create_training_set(
    training_df,
    feature_lookups=[
        FeatureLookup(
            table_name="next_prod.pi_schema.price_features",
            feature_names=["occupancy_rate", "avg_daily_rate", "competitor_price"],
            lookup_key=["property_id", "room_type_id", "date"]
        )
    ]
)

# 추론용 특성 검색 (학습과 동일한 피처 변환 보장)
serving_features = fs.score_batch(
    "models:/YPrice/Production",
    inference_df,
    feature_lookups=[...]
)
```

**기존 대비 실무 적용 효과**:
1. **피처 일관성**: "가격이 이상해요" 문제의 주 원인인 학습-서빙 불일치 문제 해소
2. **작업 효율화**: 여러 모델에서 사용하는 공통 피처 (경쟁사 가격, 역사적 점유율 등)를 한 번만 계산하여 재사용
3. **시간 단축**: 신규 모델 개발 시 기존 피처 활용으로 개발 기간 50-70% 단축 가능
4. **피처 문서화**: 각 피처의 정의, 계산 방식, 업데이트 주기 등을 중앙에서 문서화하여 지식 공유 용이

> **Unity Catalog와 Feature Store의 시너지 효과**:
> 1. **통합 메타데이터 관리**: Feature Store의 피처 테이블을 Unity Catalog에서 체계적으로 정리하고 관리
> 2. **보안 강화**: Catalog의 RBAC 정책과 피처 접근 권한을 연동하여 일관성 있는 보안 체계 구축
> 3. **데이터 계보 확장**: 원본 데이터에서 피처, 모델까지 이어지는 전체 흐름을 단일 플랫폼에서 투명하게 확인
> 4. **효율적인 거버넌스**: 통합 거버넌스 플랫폼 사용으로 관리 부담이 약 50% 감소하는 것으로 확인

### 3.4 Workflows

**특징**:
- 여러 작업 단계 정의 및 의존성 설정
- 정기적인 스케줄링
- 실패 시 재시도 및 알림

**Airflow 대비 장점**:
- **통합 환경**: Airflow는 별도 서비스지만, Databricks Workflows는 개발-실행-모니터링이 하나의 플랫폼에서 가능
- **셋업 간소화**: Airflow는 DAG 작성, 실행 환경 구성, 패키지 의존성 관리가 필요하나, Databricks는 모두 통합 관리됨
- **클러스터 자동 관리**: Airflow는 실행 환경(worker) 설정/관리가 별도로 필요하지만, Databricks는 자동으로 클러스터 생성/삭제
- **노트북 기반 작업**: 별도 Python 코드 대신 노트북 기반으로 개발 및 테스트가 가능하여 비개발자도 쉽게 사용 가능
- **ML 파이프라인 최적화**: ML 워크플로우 특화 기능(모델 추적, 실험 비교 등)이 기본 제공됨
- **운영 부담 감소**: 인프라 관리, 스케일링, 패치 등의 운영 부담이 없음 (Airflow는 자체 관리 필요)

**사용 예시**:
```
Task 1: 데이터 수집 (Bronze)
  ↓
Task 2: 데이터 정제 (Silver) - Task 1 완료 후 실행
  ↓
Task 3: 지표 계산 (Gold) - Task 2 완료 후 실행
```

**실제 구현 차이점**:

Airflow DAG:
```python
# 별도 파일로 작성해야 하며, 의존성 관리 필요
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

dag = DAG('data_pipeline', start_date=datetime(2025, 4, 1), schedule_interval='@daily')

def extract_data():
    # 환경 설정이 복잡할 수 있음
    # 패키지 관리가 별도로 필요
    pass

t1 = PythonOperator(task_id='extract', python_callable=extract_data, dag=dag)
t2 = PythonOperator(task_id='transform', python_callable=transform_data, dag=dag)

t1 >> t2  # 의존성 설정
```

Databricks Workflow:
```json
// UI에서 쉽게 설정 가능, 노트북 기반 작업
{
  "name": "데이터 파이프라인",
  "schedule": {
    "quartz_cron_expression": "0 0 * * * ?",
    "timezone_id": "Asia/Seoul"
  },
  "tasks": [
    {
      "task_key": "extract",
      "notebook_task": {
        "notebook_path": "/Shared/pi/extract_notebook"
      },
      "new_cluster": {
        "num_workers": 2
      }
    }
  ]
}
```

## 4. 데이터 파이프라인

Databricks에서는 일반적으로 Bronze, Silver, Gold 계층 구조로 데이터 파이프라인을 구성합니다.

### 4.1 Bronze 레이어

원시 데이터를 S3에서 가져와 Delta Lake 형식으로 저장합니다.

```python
# S3 Auto Loader를 사용한 데이터 수집 예제
from pyspark.sql.functions import *

# PI 팀 원시 데이터 경로
raw_data_path = "s3://ya-transfer-yanolja2ezee/ezee/..."
checkpoint_path = "s3://data-yanolja-general/checkpoints/pi_loader"

# Auto Loader로 데이터 읽기
df = (spark.readStream
      .format("cloudFiles")
      .option("cloudFiles.format", "csv")
      .option("header", "true")
      .option("inferSchema", "true")
      .load(raw_data_path)
)

# Bronze 테이블로 저장
df.writeStream \
  .format("delta") \
  .option("checkpointLocation", checkpoint_path) \
  .outputMode("append") \
  .start("s3://data-yanolja-general/data/t1/ezee/bronze")
```

### 4.2 Silver 레이어

Bronze 데이터를 정제하고 품질을 검증합니다.

```python
# Delta Live Tables 또는 일반 Spark로 구현 가능
from pyspark.sql.functions import col

# Bronze 테이블 읽기
bronze_df = spark.read.format("delta").load("s3://data-yanolja-general/data/t1/ezee/bronze")

# 데이터 정제 (예: 필수 컬럼 검증, 타입 변환)
silver_df = bronze_df.filter(col("id").isNotNull()) \
                    .withColumn("value", col("value").cast("double"))

# Silver 테이블로 저장
silver_df.write.format("delta").mode("append") \
        .save("s3://data-yanolja-general/data/t1/ezee/silver")
```

### 4.3 Gold 레이어

비즈니스 요구에 맞게 데이터를 집계하고 분석용 테이블을 생성합니다.

```python
# Silver 데이터 기반 집계 예제
from pyspark.sql.functions import avg, sum, count

# Silver 테이블 읽기
silver_df = spark.read.format("delta").load("s3://data-yanolja-general/data/t1/ezee/silver")

# 비즈니스 지표 계산
gold_df = silver_df.groupBy("category", "date") \
                  .agg(avg("value").alias("avg_value"),
                       sum("amount").alias("total_amount"),
                       count("id").alias("count"))

# Gold 테이블로 저장
gold_df.write.format("delta").mode("overwrite") \
      .save("s3://data-yanolja-general/data/t1/ezee/gold")

# Unity Catalog에 테이블 등록
spark.sql("""
CREATE TABLE next_prod.pi_schema.ezee_metrics
USING DELTA
LOCATION 's3://data-yanolja-general/data/t1/ezee/gold'
""")
```

## 5. AWS 연동

### 5.1 S3 접근 구조

Databricks에서 S3에 접근할 때는 중앙 IAM 역할을 경유합니다. 이 구조는 관리 단순화와 보안성 강화를 위해 설계되었습니다.

1. **중앙 IAM 역할**:
   - 개발: `arn:aws:iam::517727162249:role/next-databricks-external-dev-iam-role`
   - 운영: `arn:aws:iam::686581439331:role/next-databricks-external-prod-iam-role`
2. **S3 접근 방식**:
   - Databricks 클러스터가 생성될 때 Instance Profile을 통해 중앙 IAM 역할이 연결됨
   - 클러스터의 모든 노드는 이 단일 역할의 권한으로 S3에 접근
   - 새로운 S3 버킷에 접근하려면 이 중앙 역할에 권한 추가 필요

### 5.2 교차 계정 접근

**현재 PI 팀의 교차 계정 접근 상황**:

1. **원시 데이터 위치** (현재 접근 불가):
   - 계정: yanolja-di-prod (749352098844) - di 계정
   - 경로: `s3://ya-transfer-yanolja2ezee/ezee/...`
2. **처리된 데이터 저장 위치** (접근 가능):
   - 계정: 686581439331 (운영 계정)
   - 경로: `s3://data-yanolja-general/data/t1/ezee/`
3. **문제**:
   - Databricks 클러스터가 di 계정의 S3 버킷에 직접 접근할 수 없음
   - Cross Account Access 설정이 필요함

**설정 단계**:

1. **S3 버킷 정책 업데이트 요청**:
   - "di" 계정(749352098844)의 S3 버킷 관리자에게 정책 업데이트 요청

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDatabricksAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::686581439331:role/next-databricks-external-prod-iam-role"
      },
      "Action": [
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::ya-transfer-yanolja2ezee",
        "arn:aws:s3:::ya-transfer-yanolja2ezee/ezee/*"
      ]
    }
  ]
}
```

2. **요청 방법**:
   - YASE 티켓 생성하여 "di" 팀에 Cross Account Access 요청
   - 티켓 내용 예시:
   
```
제목: [교차 계정 접근 요청] Databricks에서 DI 계정 S3 버킷 접근

요청 사유: PI 팀에서 Databricks를 통해 DI 계정의 데이터(ya-transfer-yanolja2ezee)에 접근하여 데이터 파이프라인을 구축하고자 합니다.

대상 버킷: s3://ya-transfer-yanolja2ezee/ezee/*
접근 요청 IAM Role: arn:aws:iam::686581439331:role/next-databricks-external-prod-iam-role
필요 권한: s3:ListBucket, s3:GetObject

담당자: [PI 팀 담당자 이름]
```

3. **테스트 및 검증**:
   - 정책 업데이트 후 Databricks 노트북에서 접근 테스트:
   
```python
# 접근 테스트 코드
try:
    file_list = dbutils.fs.ls("s3://ya-transfer-yanolja2ezee/ezee/")
    print("접근 성공! 파일 목록:")
    display(file_list)
except Exception as e:
    print(f"접근 실패: {str(e)}")
```

**문제 해결 참고사항**:
- 접근 오류(`AccessDeniedException: Access Denied`)가 발생하면 정책 설정이 완료되지 않았거나 잘못 설정된 것
- S3 버킷 정책, IAM 역할 ARN, 경로, 필요 권한이 모두 정확한지 확인

## 6. 개발 및 운영

### 6.1 개발 워크플로우

1. **로컬 개발 및 테스트**:
   - 개발자는 개발 클러스터에서 `/Shared/pi/development/` 아래의 노트북에서 작업
   - 작은 데이터 샘플로 빠른 반복 개발 수행

2. **배포 준비**:
   - 개발이 완료되면, 코드를 리뷰하고 `/Shared/pi/production/` 폴더에 노트북 복사
   - Git 저장소와 연동하여 버전 관리 (Databricks Repos 활용)

3. **테스트 실행**:
   - 운영 파이프라인을 수동으로 실행하여 전체 흐름이 올바르게 작동하는지 확인
   - 성공하면 정기 실행 일정에 따라 자동화

### 6.2 작업 스케줄링

```yaml
jobs:
  - job_name: YPrice_Production_Pipeline
    tags:
      BillingGroup: databricks_next_pi
      Team: next
      Product: YPrice
    email_notifications:
      on_failure:
        - pi-team-alerts@yanolja.com
    schedule:
      quartz_cron_expression: "0 0 2 * * ?"  # 매일 오전 2시
      timezone_id: "Asia/Seoul"
    tasks:
      - task_key: data_collection_validation
        notebook_task:
          notebook_path: "/Shared/pi/production/etl/data_collection.py"
        new_cluster:
          spark_version: "11.3.x-scala2.12"
          node_type_id: "Standard_DS4_v2"
          num_workers: 2
          aws_attributes:
            instance_profile_arn: "arn:aws:iam::686581439331:role/next-databricks-external-prod-iam-role"
      - task_key: feature_engineering
        depends_on:
          - task_key: data_collection_validation
        notebook_task:
          notebook_path: "/Shared/pi/production/feature_engineering/feature_generation.py"
        new_cluster:
          spark_version: "11.3.x-scala2.12"
          node_type_id: "Standard_DS4_v2"
          num_workers: 2
      - task_key: model_training_evaluation
        depends_on:
          - task_key: feature_engineering
        notebook_task:
          notebook_path: "/Shared/pi/production/model_training/train_evaluate.py"
        new_cluster:
          spark_version: "11.3.x-scala2.12"
          node_type_id: "Standard_DS4_v2"
          num_workers: 4
          driver_node_type_id: "Standard_DS4_v2"
      - task_key: price_generation
        depends_on:
          - task_key: model_training_evaluation
        notebook_task:
          notebook_path: "/Shared/pi/production/price_generation/generate_prices.py"
        new_cluster:
          spark_version: "11.3.x-scala2.12"
          node_type_id: "Standard_DS4_v2"
          num_workers: 2
      - task_key: monitoring
        depends_on:
          - task_key: price_generation
        notebook_task:
          notebook_path: "/Shared/pi/production/monitoring/track_performance.py"
        new_cluster:
          spark_version: "11.3.x-scala2.12"
          node_type_id: "Standard_DS4_v2"
          num_workers: 1
```

### 6.3 MLOps 적용

1. **모델 라이프사이클 관리**:
   - MLflow 실험을 통한 모델 학습 추적
   - 모델 레지스트리를 사용한 버전 관리
   - 스테이징 → 프로덕션 단계적 승격

2. **모니터링 및 알림**:
   - 데이터 품질 지표 모니터링
   - 모델 성능 지표 추적
   - 이상 징후 발견 시 Slack 알림

3. **협업**:
   - Unity Catalog를 활용한 테이블 공유
   - 노트북 주석 및 문서화
   - 정기 코드 리뷰

4. **문제 해결 과정**:
   - 작업 로그 및 실행 기록 확인
   - 장애 구간 식별 및 디버깅
   - 필요시 클러스터 로그 분석

## 7. 모범 사례

### 7.1 파이프라인 최적화

- **데이터 파티셔닝**:
  - `booking_date`를 기준으로 데이터 파티셔닝
  - 파티션 크기 관리 (너무 작은 파티션 피하기)
  
  ```python
  # 파티셔닝 예시
  df.write.format("delta").partitionBy("booking_date").mode("append").save("/path/to/data")
  ```
  
- **증분 처리**:
  - Auto Loader 활용하여 새 데이터만 처리
  - SQL의 MERGE 명령어 사용하여 효율적 업데이트
  
  ```python
  # Auto Loader를 통한 증분 처리
  df_stream = spark.readStream.format("cloudFiles")
      .option("cloudFiles.format", "csv")
      .option("cloudFiles.schemaLocation", "/checkpoints/schema")
      .load(raw_data_path)
  ```
  
- **캐싱 전략**:
  - 반복 사용되는 데이터는 캐싱
  - 메모리 압박이 있을 경우 DISK_ONLY 수준 고려
  
  ```python
  # 적절한 저장 수준으로 캐싱
  df.persist(storageLevel=StorageLevel.MEMORY_AND_DISK)
  ```

### 7.2 비용 최적화

- **클러스터 관리**:
  - 운영 환경에서 Job 클러스터 사용
  - 자동 종료 시간 설정
  - 필요에 맞는 인스턴스 타입 선택

- **효율적인 스토리지 사용**:
  - Delta Lake 테이블 VACUUM 정기 실행
  - 불필요한 테이블 버전 정리
  - 저장소 사용량 모니터링
  
  ```sql
  -- 7일 이상 된 파일 정리
  VACUUM next_prod.pi_schema.yprice_predictions RETAIN 7 DAYS
  
  -- 테이블 최적화
  OPTIMIZE next_prod.pi_schema.yprice_predictions
  ```

### 7.3 팀 협업 향상 방안

- **코드 표준화**:
  - 일관된 코딩 스타일
  - 명확한 주석 및 문서화
  - 공통 유틸리티 함수 공유

- **지식 공유**:
  - 노트북에 마크다운 설명 포함
  - 파이프라인 문서화
  - 정기적인 기술 공유 세션

## 8. 기존 솔루션과 비교

### 8.1 전통적인 데이터 처리 vs Databricks

| 항목 | 기존 환경 | Databricks | 이점 |
|------|-----------|------------|------|
| 인프라 관리 | 서버 구성, 패치, 스케일링 직접 관리 | 완전 관리형 서비스 | 운영 부담 감소 |
| 개발 환경 | 로컬 IDE, 별도 테스트 환경 필요 | 통합 노트북 환경 (코드 실행, 시각화 통합) | 개발 주기 단축 |
| 협업 | 코드 공유, 버전 관리가 분리됨 | 실시간 협업, Git 통합 | 팀 생산성 향상 |
| 확장성 | 수동 스케일링, 리소스 사전 할당 | 자동 스케일링, 작업별 리소스 최적화 | 컴퓨팅 비용 절감 |
| 데이터 형식 | CSV, Parquet 등 개별 파일 | Delta Lake (ACID 트랜잭션) | 데이터 일관성, 성능 향상 |
| 메타데이터 관리 | 분산 시스템 (Hive, 위키, 문서) | Unity Catalog (통합 거버넌스) | 데이터 검색 시간 단축 |
| ML 모델 관리 | 수동 추적, 버전 관리 어려움 | MLflow 통합 (자동 추적) | 모델 개발 생산성 향상 |
| 피처 관리 | 중복 코드, 일관성 보장 어려움 | Feature Store (중앙화된 피처) | 코드 중복 감소, 버그 감소 |

### 8.2 Airflow vs Workflows

| 항목 | Airflow | Databricks Workflows | 이점 |
|------|---------|-------------------|------|
| 설치 및 관리 | 별도 인프라 구성, 패키지 관리 | 클라우드 네이티브, 설치 불필요 | 초기 설정 시간 단축 |
| 개발 경험 | Python 코드로 DAG 작성 | 노트북 기반 (SQL, Python 모두 지원) | 비개발자도 쉽게 파이프라인 구축 가능 |
| 실행 환경 | worker 관리, 패키지 설치 필요 | 작업별 자동 클러스터 구성 | 환경 구성 부담 제거 |
| 분산 처리 | 추가 구성 필요 (Celery, K8s) | 자동 분산 처리 | 대규모 작업 처리 용이 |
| ML 워크플로우 | 추가 통합 작업 필요 | MLflow, 모델 배포와 기본 통합 | ML 파이프라인 구축 속도 향상 |
| 모니터링 | 별도 대시보드, 알림 설정 필요 | 통합 모니터링, 자동 알림 | 장애 대응 시간 단축 |
| 비용 | 인프라 상시 운영 비용 발생 | 사용한 컴퓨팅 리소스만 과금 | 운영 비용 절감 |

### 8.3 기존 ML 개발 vs Databricks 

| 항목 | 기존 ML 개발 | Databricks | 이점 |
|------|------------|------------|------|
| 데이터 준비 | 여러 도구 조합 (Pandas, Spark 별도) | 단일 환경에서 모든 규모 처리 | 데이터 준비 시간 단축 |
| 피처 엔지니어링 | 중복 코드, 팀원별 다른 구현 | Feature Store로 표준화 | 코드 재사용 증가 |
| 모델 학습 | 수동 구성, 실험 추적 어려움 | 분산 학습, 자동 실험 추적 | 모델 개발 주기 단축 |
| 하이퍼파라미터 튜닝 | 제한된 실험, 수동 관리 | 분산 튜닝, 병렬 실험 | 최적 모델 발견 속도 향상 |
| 실험 관리 | 노트북 복사, 수동 비교 | MLflow 자동 추적, 비교 시각화 | 실험 분석 시간 단축 |
| 모델 배포 | 별도 서빙 인프라 구축 필요 | 통합 배포, 표준 API | 배포 시간 단축 |
| 모니터링 | 수동 설정, 별도 도구 필요 | 통합 성능 모니터링 | 모델 성능 저하 감지 시간 단축 |
| 재학습 | 수동 트리거, 복잡한 파이프라인 | 자동화된 재학습 워크플로우 | 모델 업데이트 주기 단축 |

### 8.4 저장 형식 비교: Delta Lake vs 기존 형식

| 항목 | CSV | Parquet | Delta Lake | Delta Lake의 이점 |
|------|-----|---------|------------|-----------------|
| 데이터 일관성 | 없음 | 없음 | ACID 트랜잭션 | 항상 일관된 데이터 보장 |
| 스키마 진화 | 불가능 | 제한적 | 자동 지원 | 스키마 변경 시 자동 관리 |
| 데이터 버전 관리 | 수동 백업 필요 | 수동 백업 필요 | 자동 버전 관리 | 실수로 인한 데이터 손실 방지 |
| 데이터 업데이트 | 전체 다시 쓰기 | 전체 다시 쓰기 | 부분 업데이트 지원 | 업데이트 효율성 향상 |
| 메타데이터 처리 | 스키마 추론 필요 | 내장 메타데이터 | 통합 메타데이터 | 스키마 불일치 문제 감소 |
| 쿼리 성능 | 매우 느림 | 빠름 | 더 빠름 (최적화) | Parquet 대비 성능 향상 |
| 병합(Merge) 연산 | 불가능 | 어려움 | 네이티브 지원 | 증분 데이터 갱신 효율화 |
| 트랜잭션 로그 | 없음 | 없음 | 상세 로그 보존 | 문제 추적, 감사 용이성 |

### 8.5 메타데이터 관리: Unity Catalog vs 기존 방식

| 항목 | Hive Metastore | 수동 문서화 | Unity Catalog | Unity Catalog의 이점 |
|------|----------------|-------------|---------------|----------------------|
| 메타데이터 통합 | 테이블 메타데이터만 | 분산된 문서 | 모든 자산 통합 | 메타데이터 검색 시간 단축 |
| 접근 제어 | 제한적 | 별도 구현 필요 | 세분화된 RBAC | 보안 관리 효율성 향상 |
| 데이터 계보 | 지원 안 함 | 수동 추적 | 자동 추적 | 영향 분석 시간 단축 |
| 규정 준수 | 별도 도구 필요 | 수동 감사 | 자동 감사 로그 | 규제 준수 비용 절감 |
| 검색 기능 | 기본적 | 검색 어려움 | 고급 검색, 태그 | 데이터 발견 시간 단축 |
| 멀티 클라우드 | 각 환경 별도 관리 | 불가능 | 단일 인터페이스 | 멀티 클라우드 전환 용이성 |
| 테이블 공유 | 제한적 | 수동 공유 | 통합 공유 관리 | 협업 효율성 향상 |
| 스키마 진화 | 제한적 지원 | 문서 업데이트 필요 | 자동 관리 | 스키마 변경 관리 시간 단축 |

### 8.6 Feature Store 비교

| 항목 | 수동 피처 생성 | Feature Store | Feature Store의 이점 |
|------|---------------|---------------|---------------------|
| 피처 재사용 | 중복 코드, 복사-붙여넣기 | 중앙 저장소, 검색 기능 | 코드 중복 감소, 개발 시간 단축 |
| 학습-서빙 일관성 | 일관성 보장 어려움 | 동일 로직 자동 적용 | 성능 저하 문제 감소 |
| 시간 기반 조회 | 직접 구현 필요 | 자동 Point-in-Time 조회 | 데이터 누수 문제 해결 |
| 계보 추적 | 수동 문서화 | 자동 추적 | 피처 의존성 파악 시간 단축 |
| 실시간 서빙 | 별도 인프라 구현 | 통합 온라인 스토어 | 실시간 서빙 구축 시간 단축 |
| 피처 문서화 | 분산된 문서, 주석 | 통합 메타데이터 | 피처 이해 시간 단축 |
| 피처 모니터링 | 별도 구현 필요 | 통합 모니터링 | 드리프트 감지 효율성 향상 |
| 확장성 | 여러 시스템 통합 필요 | 자동 확장, 분산 처리 | 대규모 피처 관리 부담 감소 |

