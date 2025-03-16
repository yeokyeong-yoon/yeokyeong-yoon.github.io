---
layout: post
title: "Feature Flag 설계와 운영 기술 분석"
date: 2024-03-16 12:00:00 +0900
categories: [개발, 시스템설계]
tags: [feature-flag, java, aws, kubernetes, dynamodb]
---

## Feature Flag 시스템 개요

Feature Flag는 코드 수정이나 재배포 없이 특정 기능을 켜거나 끌 수 있는 기법으로, A/B 테스트, 점진적 기능 출시, 긴급 롤백 상황에서 활용되었다. 인턴으로 입사했을 당시, 회사는 단순한 롤아웃/롤백 작업에도 이전 버전 재배포나 새로운 실험 생성이 필요했다. 이 문제를 해결하기 위해 Java 기반의 Feature Flag SDK를 개발했다.

## 데이터 흐름 및 시스템 아키텍처

시스템의 데이터 흐름과 주요 컴포넌트 간의 상호작용은 다음 시퀀스 다이어그램과 같습니다:

<div class="mermaid">
sequenceDiagram
    participant Client as Client Application
    participant Manager as Feature Flag Manager
    participant Cache as LRU Cache
    participant API as Splitter API
    participant Admin as Admin Page

    Client->>Manager: Flags declared via Annotation (Reflection)
    Manager->>API: Register declared flags (initial execution)
    API->>Admin: Send flag registration
    Admin-->>API: Acknowledge registration
    API-->>Manager: Respond with registration acknowledgment

    loop Periodic Update
        Manager->>API: Request latest Flag Treatments
        API->>Admin: Fetch latest Treatment values
        Admin-->>API: Return latest Treatment values
        API-->>Manager: Respond with latest Flag values
        Manager->>Cache: Update cache
    end

    Client->>Manager: Request Flag value
    Manager->>Cache: Retrieve cached Flag
    Cache-->>Manager: Return cached value
    Manager-->>Client: Provide Flag value
</div>

## 핵심 설계 원칙과 기술적 구현

### Annotation 기반 관리 시스템

```java
@FeatureFlag(flagName="new-search-algorithm", defaultValue=false)
private boolean useNewSearchAlgorithm;
```

이 설계는 Admin 페이지와 코드 사이의 Splitter API 네트워크 장애 시에도 기능 상태의 일관성을 보장했다. 애플리케이션 시작 시 코드 내 선언된 Flag가 실험 플랫폼에 자동 등록되었으며, 이후 실험 플랫폼에서 상태를 수정할 수 있도록 했다.

### Reflection 기반 자동 등록 메커니즘

Java Reflection API를 활용하여 코드 전반에 흩어진 Feature Flag 변수를 자동으로 수집하고 관리했다. Reflection을 활용함으로써 코드 수정 없이도 새로운 플래그를 등록하고 관리할 수 있도록 했으며, 런타임 시점에서 선언된 모든 Feature Flag를 탐색하여 자동으로 시스템에 반영할 수 있도록 했다. 이를 통해 개발자가 수동으로 관리할 필요 없이 기존 코드 내에서 자연스럽게 Feature Flag가 적용되도록 만들었다.

## 기술 스택 선정 및 아키텍처

### 코어 SDK: Java 8 (Vanilla Java)
회사 서비스의 Java 기반 특성과 하위 호환성을 고려했으며, 프레임워크 의존성을 최소화하여 다양한 환경에서의 통합이 용이하도록 했다. 추가적으로 Vanilla Java를 선택하여 경량성을 확보하고, 불필요한 의존성을 줄여 SDK 자체의 안정성을 높였다.

### 인프라: Kubernetes on AWS EKS
트래픽 증가 시 자동 확장과 빠른 장애 복구를 지원하며, AWS 관리형 서비스로 운영 부담을 최소화했다. EKS를 활용하여 컨테이너 기반의 서비스 배포와 운영을 자동화하고, 기존 AWS 환경과의 통합성을 강화했다. 또한, 서비스의 확장성을 높이기 위해 Rolling Update 전략을 적용하여 배포 중에도 서비스 중단이 발생하지 않도록 했다.

### 배포: Jib & Jenkins
Dockerfile 없이 컨테이너 이미지 생성이 가능하며, Jenkins 파이프라인 자동화로 CI/CD 효율성을 극대화했다. Jib을 활용함으로써 애플리케이션을 빠르게 빌드하고 컨테이너화할 수 있었으며, 기존의 Docker 기반 배포 방식보다 간소화된 과정을 통해 배포 속도를 최적화했다. Jenkins와의 통합을 통해 코드 변경이 발생하면 자동으로 컨테이너 이미지를 빌드하고 배포하는 프로세스를 구축했다.

### 데이터 저장소: AWS DynamoDB
높은 조회 성능과 자동 확장성으로 대규모 요청에도 안정적인 서비스가 가능하도록 했다. AWS DynamoDB는 분산 스토리지 아키텍처를 활용하여 실시간으로 Feature Flag의 변경 사항을 반영할 수 있도록 구성했으며, 높은 가용성과 내구성을 보장했다. 이를 통해 Feature Flag의 값이 빠르게 업데이트되고 조회될 수 있도록 최적화했다.

## 엔드포인트 목록
- `GET /feature-flags`
- `PUT /feature-flags/{flagName}`
- `DELETE /feature-flags/{flagName}`

## SDK 통합 코드

### 호출 예시
```java
FeatureFlagManager manager = FeatureFlagManager.builder()
                .setPackageNames(new String[]{"your.package.names"})
                .setEnvironment(ExpEnv.QA)
                .setClassLoader(classLoader)
                .build();
```

### 선언 예시
```java
@FeatureFlag(flagName = "Test2")
public static int privateField = 3;
```

## 기술적 한계 및 개선 필요 사항

1. **분석 및 로깅 기능 부재**: Flag 변경 영향 분석이 불가능했다.
   - 개선 필요: EventListener 인터페이스 + AWS CloudWatch 통합을 통해 실험 및 플래그 변경 내역을 추적하고, 각 플래그의 사용 현황과 성능을 분석할 수 있도록 해야 한다.

2. **고급 기능 미구현**: 프로젝트가 중단되었으며, 인수인계 예정으로 관리 운영만 하게 되었다.
   - 트래픽 세그먼테이션 및 조건부 플래그 기능을 개발할 계획이 있었으나, 개발 진행 중단으로 인해 운영만 지속하게 되었다. 향후 유지보수를 담당하는 팀이 추가적인 기능 개발을 진행할 가능성이 있다.

3. **오너십 문제**: 회사 합병/분사 과정에서 프로젝트 오너십이 불분명해졌다.
   - 개선 방향: 명확한 책임자 지정 및 개발 로드맵 수립이 필요하며, 장기적으로 프로젝트를 지속적으로 유지보수할 팀을 배정해야 한다.

## 결론

Feature Flag 시스템을 구축하면서 배포 속도를 개선하고 기능을 유연하게 관리할 수 있는 환경을 만들었다. 실험을 손쉽게 진행할 수 있도록 했고, 여러 팀에서 적극적으로 활용하고 있다. 다만 프로젝트가 중단되면서 추가 개발은 어렵게 되었고, 지금은 유지보수 위주로 운영되고 있다. 앞으로 실험 로깅이나 트래픽 세그먼테이션 같은 기능이 더해지면 훨씬 강력한 시스템이 될 것 같다.

 