---
layout: post
title: "Feature Flag 설계와 운영 기술 분석"
date: 2025-03-16 12:00:00 +0900
categories: [개발, 시스템설계]
tags: [feature-flag, java, aws, kubernetes, dynamodb]
---

## Feature Flag 시스템 개요

Feature Flag는 코드 수정이나 재배포 없이 특정 기능을 켜거나 끌 수 있는 기법으로, A/B 테스트, 점진적 기능 출시, 긴급 롤백 상황에서 활용되었다. 인턴으로 입사했을 당시, 회사는 단순한 롤아웃/롤백 작업에도 이전 버전 재배포나 새로운 실험 생성이 필요했다. 이 문제를 해결하기 위해 Java 기반의 Feature Flag SDK를 개발했다.

## 데이터 흐름 및 시스템 아키텍처

시스템의 데이터 흐름과 주요 컴포넌트 간의 상호작용은 다음 시퀀스 다이어그램과 같다:

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

Java Reflection API를 활용하여 코드 전반에 흩어진 Feature Flag 변수를 자동으로 수집하고 관리하는 시스템을 구현했다. 구체적으로는 `Class.forName()`, `getDeclaredFields()`, `getAnnotation()` 메서드를 활용해 런타임에 `@FeatureFlag` 어노테이션이 붙은 필드들을 탐색했다. 이 과정에서 접근 제한자(private, protected)가 있는 필드도 `setAccessible(true)`를 통해 접근할 수 있도록 처리했다. 

또한 클래스 로더 계층 구조를 고려하여 애플리케이션의 모든 패키지를 스캔하는 재귀적 알고리즘을 구현했고, 성능 최적화를 위해 스캔 대상 패키지를 설정할 수 있는 필터링 메커니즘도 추가했다. 이렇게 수집된 Feature Flag 정보는 ConcurrentHashMap을 사용해 스레드 안전하게 관리했으며, 주기적으로 백엔드 서버와 동기화되도록 ScheduledExecutorService를 구성했다. 이 접근 방식으로 개발자들은 코드에 어노테이션만 추가하면 자동으로 시스템에 등록되어 관리되는 편리함을 제공할 수 있었다.
## 기술 스택 선정 및 아키텍처

### 코어 SDK: Java 8 (Vanilla Java)
Java 8을 선택한 이유는 회사의 기존 코드베이스와의 호환성도 있었지만, 더 중요한 것은 SDK의 확장성과 유지보수성이었다. 프레임워크 의존성이 가져올 수 있는 문제점을 고민했다. Spring과 같은 프레임워크를 사용할 경우 버전 충돌이 발생할 수 있고, 사용자들이 SDK를 도입할 때 추가적인 설정이 필요해질 수 있다고 판단했다. 순수 Java만으로 구현함으로써 어떤 환경에서도 쉽게 통합될 수 있는 유연성을 확보했고, 이는 실제로 레거시 시스템에서도 문제없이 작동하는 결과로 이어졌다. 특히 Reflection API를 활용한 어노테이션 처리 부분에서는 외부 라이브러리 없이 직접 구현하는 과정이 도전적이었지만, 이를 통해 Java의 메타프로그래밍 기능에 대한 이해도를 크게 높일 수 있었다.

<!-- 
메타프로그래밍(Metaprogramming)이란 코드가 다른 코드를 생성하거나 조작하는 프로그래밍 기법을 말합니다. 
즉, 프로그램이 자기 자신이나 다른 프로그램의 구조와 동작을 분석하고 수정할 수 있게 해주는 기술입니다.
Java에서는 Reflection API가 대표적인 메타프로그래밍 도구로, 런타임에 클래스, 메서드, 필드 등의 
정보를 검사하고 조작할 수 있게 해줍니다. 이를 통해 코드를 직접 작성하지 않고도 동적으로 
프로그램의 동작을 제어할 수 있습니다.
-->

### 인프라: Kubernetes on AWS EKS
Feature Flag 시스템을 위한 별도의 인프라를 구축하지 않고, 회사에 이미 구축되어 있던 실험 분기 API에 새로운 엔드포인트를 추가하는 방식으로 개발했다. 이 접근 방식은 빠른 개발과 배포를 가능하게 했지만, 지금 돌이켜보면 독립적인 서비스로 분리했어야 했다는 아쉬움이 남는다. 기존 API에 기능을 추가하면서 Flag 값 변경이 모든 클라이언트에 빠르게 전파되어야 한다는 요구사항을 충족시키기 위해 캐싱 전략과 업데이트 메커니즘을 최적화했다. 이 과정에서 API 설계와 확장성에 대한 중요한 교훈을 얻었으며, 향후에는 처음부터 독립적인 마이크로서비스로 설계하여 Feature Flag 시스템만의 특성에 맞게 최적화된 인프라를 구축하는 것이 더 나은 선택이었을 것이다.

### 배포: Jib & Jenkins
배포 과정에서 가장 큰 고민은 빌드 시간 단축과 안정적인 배포 파이프라인 구축이었다. 기존 Docker 기반 배포에서는 매번 전체 이미지를 다시 빌드하는 비효율이 있었고, 이로 인해 작은 코드 변경에도 배포 시간이 길어지는 문제가 있었다. Jib을 도입함으로써 변경된 클래스 파일만 효율적으로 업데이트하는 방식으로 빌드 시간을 크게 단축할 수 있었다. 또한 Jenkins 파이프라인을 구성하면서 단순 자동화를 넘어 각 단계별 검증 과정을 추가했다. 특히 단위 테스트를 실행하고, 코드 커버리지가 일정 수준 이상일 때만 배포가 진행되도록 설정했다. 이 과정에서 CI/CD 파이프라인의 중요성과 테스트 자동화의 가치를 실감할 수 있었다.

### 데이터 저장소: AWS DynamoDB
데이터 저장소 선택은 Feature Flag 시스템의 성능과 직결되는 중요한 결정이었다. 실험 플랫폼이 SQL과 DynamoDB를 모두 사용하고 있어 어떤 저장소를 선택할지 고민했다. 조사 결과, Feature Flag의 특성상 읽기 작업이 압도적으로 많고 일관된 응답 시간이 중요하다는 점에서 DynamoDB가 더 적합하다고 판단했다. DynamoDB는 읽기 작업에 최적화된 구조를 가지고 있으며, 밀리초 단위의 일관된 응답 시간과 자동 스케일링 기능을 제공한다. 특히 Flag 값을 조회하는 API는 서비스의 핵심 로직 실행 전에 호출되므로, 낮은 지연 시간이 필수적이었기에 DynamoDB를 선택했다.

코드 내에서 DynamoDB를 연결하고, 특히 unit test에서 local DynamoDB로 테스트 환경 구축하는게 꽤 어려웠지만, 이 과정에서 많은 것을 배울 수 있었다. AWS SDK를 사용해 DynamoDB 클라이언트를 구성하고, 테스트 환경에서는 DynamoDBLocal 라이브러리를 활용해 인메모리 데이터베이스를 구축했다. 특히 테스트 코드에서 DynamoDB 테이블을 자동으로 생성하고 삭제하는 과정을 JUnit의 @Before, @After 어노테이션을 활용해 구현했는데, 이 부분이 가장 까다로웠다. 테스트 환경에서 실제 AWS 리소스를 사용하지 않고도 DynamoDB 기능을 테스트할 수 있게 된 것은 큰 성과였다.

처음에는 NoSQL 데이터 모델링이 생소했지만, 다양한 조회 패턴을 지원하기 위해 글로벌 보조 인덱스를 활용하는 방법을 학습하고 적용했다. 이 과정에서 관계형 데이터베이스와 NoSQL의 차이점을 실제 프로젝트를 통해 이해할 수 있었고, 상황에 맞는 데이터베이스 선택의 중요성을 배울 수 있었다.

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

## 개선 필요사항

회사 합병/분사 과정에서 프로젝트가 중단되고 명확한 오너십이 불분명해지면서 계획했던 여러 핵심 기능을 구현하지 못했다. 현재는 기본적인 관리 운영만 담당하는 상태로, 다음과 같은 개선이 필요하다:

1. **분석 및 로깅 시스템 구축**: 현재 Feature Flag 변경에 대한 로깅 기능이 전혀 없어, Flag 변경의 영향을 분석할 수 없는 상황이다. 이로 인해 Feature Flag는 단순히 점진적 롤아웃 용도로만 사용되고 있으며, 실험 플랫폼처럼 데이터 수집 및 분석까지 이어지지 못하고 있다. EventListener 인터페이스와 AWS CloudWatch 통합을 통해 Flag 변경 이력을 추적하고, 이를 실험 플랫폼과 연동하여 비즈니스 지표에 미치는 영향을 정량적으로 분석할 수 있는 시스템이 필요하다.

2. **트래픽 세그먼테이션**: 사용자 속성(국가, 디바이스, 앱 버전 등)에 따라 다른 Flag 값을 제공할 수 있는 기능이 필요하다. 이를 통해 특정 사용자 그룹에 대해서만 새로운 기능을 테스트하거나 출시할 수 있다.

3. **점진적 롤아웃 기능**: 새로운 기능을 처음부터 모든 사용자에게 제공하는 것이 아니라, 트래픽의 일정 비율(예: 5%, 10%, 50%)에 대해 단계적으로 적용할 수 있는 기능이 필요하다. 이를 통해 새 기능의 안정성을 검증하며 리스크를 최소화할 수 있다.

4. **조건부 Flag 활성화**: 특정 조건(시간, 서버 부하, 다른 Flag 상태 등)에 따라 자동으로 Flag 값이 변경되는 규칙 기반 시스템이 있으면 더욱 유연한 기능 관리가 가능하다.

5. **실험 플랫폼과의 통합**: Feature Flag 시스템과 A/B 테스트 플랫폼을 통합하여, Flag 변경이 자동으로 실험으로 등록되고 결과가 분석되는 워크플로우를 구축할 필요가 있다. 이를 통해 단순한 기능 전환을 넘어 데이터 기반 의사결정으로 확장할 수 있다.

6. **Flag 종속성 관리**: 여러 Flag 간의 종속성을 관리할 수 있는 기능이 필요하다. 특정 Flag가 활성화되면 다른 Flag도 자동으로 활성화되거나 비활성화되는 규칙을 설정할 수 있다면, 복잡한 기능 출시 시나리오를 더 안전하게 관리할 수 있다.

이러한 개선 사항들이 구현된다면, 현재의 기본적인 Feature Flag 시스템에서 한 단계 발전하여 전사적인 실험 및 기능 관리 플랫폼으로 발전할 수 있을 것이다.

## 결론

Feature Flag 시스템을 구축함으로써 배포 속도를 개선하고 기능을 유연하게 관리할 수 있는 환경을 성공적으로 만들었다. 이를 통해 개발팀은 코드 배포와 기능 출시를 분리할 수 있게 되었고, 여러 팀에서 이 시스템을 적극적으로 활용하고 있다. 

아쉽게도 여러 상황으로 인해 프로젝트가 계획대로 완료되지 못하면서, 로깅 기능과 같은 핵심 요소가 구현되지 못했다. 특히 실험 플랫폼과의 통합을 통한 데이터 수집 및 분석 기능이 구현되었다면, PM이나 비개발자도 쉽게 실험을 제어하고 그 결과를 분석할 수 있었을 것이다. 이는 단순한 기능 개선을 넘어 전사적인 데이터 기반 의사결정 문화를 강화하는 데 크게 기여했을 것이라는 점이 아쉽다.

현재는 유지보수 위주로 운영되고 있지만, 앞으로 명확한 인수인계와 함께 새로운 주인의식을 가진 팀에 의해 발전되길 바란다. 로깅 시스템과 트래픽 세그먼테이션 같은 기능이 추가된다면, 이 Feature Flag 시스템은 훨씬 더 강력하고 가치 있는 도구로 발전할 수 있을 것이다. 이 시스템이 단순히 기능을 켜고 끄는 도구를 넘어, 전사적 데이터 기반 의사결정의 핵심 인프라로 자리매김하는 모습을 기대해본다.