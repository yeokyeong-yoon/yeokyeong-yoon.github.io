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
    participant DB as DynamoDB

    Client->>Manager: Flags declared via Annotation (Reflection)
    Manager->>API: Register declared flags (initial execution)
    API->>DB: Store flag definitions
    DB-->>API: Acknowledge storage
    API->>Admin: Send flag registration
    Admin-->>API: Acknowledge registration
    API-->>Manager: Respond with registration acknowledgment

    loop Periodic Update
        Manager->>API: Request latest Flag Treatments
        API->>DB: Query latest flag values
        DB-->>API: Return flag data
        API->>Admin: Fetch latest Treatment values
        Admin-->>API: Return latest Treatment values
        API-->>Manager: Respond with latest Flag values
        Manager->>Cache: Update cache
    end

    Client->>Manager: Request Flag value
    Manager->>Cache: Retrieve cached Flag
    Cache-->>Manager: Return cached value
    Manager-->>Client: Provide Flag value

    Note over Admin,DB: Admin changes are persisted to DynamoDB
    Admin->>API: Update flag value
    API->>DB: Store updated value
    DB-->>API: Acknowledge update
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

### 싱글톤 패턴과 스레드 안전성 확보

Feature Flag Manager는 싱글톤 패턴으로 구현하여 애플리케이션 전체에서 하나의 인스턴스만 존재하도록 설계했다. 싱글톤 패턴을 적용한 명확한 이유는 다음과 같다:

1. **일관된 상태 관리**: Feature Flag의 상태는 애플리케이션 전체에서 일관되게 유지되어야 한다. 여러 인스턴스가 존재할 경우 각각 다른 상태를 가질 수 있어 예측 불가능한 동작이 발생할 위험이 있다.

2. **리소스 효율성**: Flag 정보를 주기적으로 백엔드 서버와 동기화하는 과정에서 네트워크 요청과 메모리 사용이 발생한다. 여러 인스턴스가 각각 동기화를 수행한다면 불필요한 리소스 낭비가 발생할 수 있다.

3. **캐시 효율성 극대화**: LRU 캐시를 통해 Flag 값 조회 성능을 최적화했는데, 여러 인스턴스가 각자의 캐시를 관리한다면 캐시 히트율이 떨어져 성능 이점이 감소한다.

4. **중앙화된 로깅과 모니터링**: 모든 Flag 조회와 변경 이벤트를 단일 지점에서 추적하고 로깅함으로써 디버깅과 모니터링이 용이해진다.

특히 마이크로서비스 환경에서는 각 서비스 인스턴스마다 Feature Flag Manager가 하나씩만 존재하도록 하는 것이 중요했다. 여러 인스턴스가 동시에 백엔드 서버에 연결하여 Flag 값을 업데이트하는 상황을 방지하고, 메모리 사용량을 최적화할 수 있었다.

```java
public class FeatureFlagManager {
    private static volatile FeatureFlagManager instance;
    private final ConcurrentHashMap<String, FeatureFlag> flagRegistry;
    
    private FeatureFlagManager() {
        this.flagRegistry = new ConcurrentHashMap<>();
        // 초기화 로직
    }
    
    public static FeatureFlagManager getInstance() {
        if (instance == null) {
            synchronized (FeatureFlagManager.class) {
                if (instance == null) {
                    instance = new FeatureFlagManager();
                }
            }
        }
        return instance;
    }
    
    // 나머지 메서드들...
}
```

명시적인 락(lock) 메커니즘 대신 `ConcurrentHashMap`을 사용한 이유는 다음과 같다:

1. **성능 최적화**: 명시적인 락은 모든 읽기/쓰기 작업에 대해 동기화를 강제하여 성능 저하를 일으킬 수 있다. Feature Flag 시스템은 읽기 작업이 압도적으로 많은 특성을 가지고 있어, 읽기 작업에 락을 사용하면 불필요한 병목 현상이 발생할 수 있다.

2. **세밀한 동시성 제어**: `ConcurrentHashMap`은 내부적으로 세그먼트 단위의 락을 사용하여 다른 키에 대한 동시 접근을 허용한다. 이는 여러 Flag에 대한 동시 접근 시 전체 맵에 락을 거는 것보다 훨씬 효율적이다.

3. **코드 복잡성 감소**: 명시적인 락 메커니즘을 구현하려면 읽기/쓰기 락, 데드락 방지 등 복잡한 동시성 제어 로직이 필요하다. `ConcurrentHashMap`을 사용함으로써 이러한 복잡성을 크게 줄일 수 있었다.

4. **원자적 연산 지원**: `ConcurrentHashMap`은 `putIfAbsent`, `computeIfAbsent` 등의 원자적 연산을 제공하여 락 없이도 안전한 업데이트가 가능하다.

사실 `ConcurrentHashMap`은 이 프로젝트를 통해 처음 알게 된 개념이었다. 동시성 문제를 해결하기 위해 자료구조를 찾아보던 중 발견했는데, 기존의 `HashMap`과 달리 스레드 안전성을 보장하면서도 `Collections.synchronizedMap()`보다 훨씬 뛰어난 성능을 제공한다는 점이 인상적이었다. 

`ConcurrentHashMap`의 주요 특징을 요약하자면:

- **분할 락(Segmented Locking)**: 맵 전체가 아닌 일부 세그먼트에만 락을 적용하여 동시성 성능 향상
- **락 스트라이핑(Lock Striping)**: 여러 개의 락을 사용하여 다른 버킷에 대한 동시 접근 허용
- **비차단 읽기(Non-blocking Reads)**: 읽기 작업은 락을 획득하지 않고 수행되어 높은 처리량 제공
- **약한 일관성(Weak Consistency)**: 완전한 동기화 대신 실용적인 일관성 모델 채택
- **원자적 연산**: `putIfAbsent()`, `replace()` 등 복합 연산의 원자성 보장

이 설계 결정을 내리는 과정에서 시니어 엔지니어들에게 조언을 구하고 다양한 온라인 리소스를 참고했다. 그 결과, 복잡한 커스텀 락 메커니즘보다는 Java에서 제공하는 검증된 동시성 컬렉션을 활용하는 것이 더 안정적이고 유지보수하기 쉽다는 결론에 도달했다. "최대한 심플하게 구성하라"는 조언이 가장 큰 영향을 미쳤는데, 이는 특히 여러 팀이 사용하는 공통 SDK에서 중요한 원칙이었다. 복잡한 동시성 제어 로직은 버그 발생 가능성을 높이고 디버깅을 어렵게 만들 수 있기 때문에, 검증된 라이브러리의 기능을 최대한 활용하는 방향으로 설계했다.

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

코드 내에서 DynamoDB를 연결하고, 특히 unit test에서 local DynamoDB로 테스트 환경 구축하는게 꽤 어려웠지만, 이 과정에서 많은 것을 배울 수 있었다. (이 부분은 feature flag 자체가 아니라, 실험 플랫폼인 admin 페이지와 연결된 API에서 구현한 것이다.) AWS SDK를 사용해 DynamoDB 클라이언트를 구성하고, 테스트 환경에서는 DynamoDBLocal 라이브러리를 활용해 인메모리 데이터베이스를 구축했다. 특히 테스트 코드에서 DynamoDB 테이블을 자동으로 생성하고 삭제하는 과정을 JUnit의 @Before, @After 어노테이션을 활용해 구현했는데, 이 부분이 가장 까다로웠다. 테스트 환경에서 실제 AWS 리소스를 사용하지 않고도 DynamoDB 기능을 테스트할 수 있게 된 것은 큰 성과였다.


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
## 개선 필요사항 및 기술적 아쉬움

회사 합병/분사 과정에서 팀이 바뀌고 프로젝트가 인수인계 되기로 결정되면서 여러 핵심 기능을 구현하지 못했습니다. 현재는 기본적인 관리 운영만 담당하고 있으며, 다음과 같은 개선이 필요합니다:

1. **분석 및 로깅 시스템 구축**: 현재 Feature Flag 변경에 대한 로깅 기능이 없어 Flag 변경의 영향을 분석할 수 없는 상황입니다. EventListener와 AWS CloudWatch 통합을 통해 변경 이력을 추적하고, 이를 실험 플랫폼과 연동하여 비즈니스 지표에 미치는 영향을 정량적으로 분석할 수 있는 시스템이 필요합니다.

2. **트래픽 세그먼테이션**: 사용자 속성(국가, 디바이스 등)에 따라 다른 Flag 값을 제공할 수 있는 기능이 필요합니다. 이를 통해 특정 사용자 그룹에만 새로운 기능을 테스트할 수 있습니다.

3. **점진적 롤아웃 기능**: 트래픽의 일정 비율(5%, 10%, 50%)에 대해 단계적으로 기능을 적용할 수 있는 기능이 필요합니다. 이를 통해 새 기능의 안정성을 검증하며 리스크를 최소화할 수 있습니다.

4. **조건부 Flag 활성화**: 특정 조건(시간, 서버 부하 등)에 따라 자동으로 Flag 값이 변경되는 규칙 기반 시스템이 있으면 더욱 유연한 기능 관리가 가능합니다.

5. **실험 플랫폼과의 통합**: Feature Flag 시스템과 A/B 테스트 플랫폼을 통합하여 데이터 기반 의사결정으로 확장할 수 있습니다. 이를 통해 PM이나 비개발자도 쉽게 실험을 제어하고 그 결과를 분석할 수 있었을 것입니다.

6. **Flag 종속성 관리**: 여러 Flag 간의 종속성을 관리할 수 있는 기능이 필요합니다. 특정 Flag가 활성화되면 다른 Flag도 자동으로 변경되는 규칙을 설정할 수 있다면 복잡한 기능 출시를 더 안전하게 관리할 수 있습니다.

7. **아키텍처 개선**: 독립적인 마이크로서비스로 설계했다면 확장성과 유지보수성이 더 좋았을 것입니다. 또한 Circuit Breaker 패턴을 적용하여 서버 장애 시 대응력을 높이고, 감사(Audit) 기능을 추가하여 Flag 값 변경 이력을 추적할 수 있었다면 더 안정적인 시스템이 되었을 것입니다.

8. **성능 최적화**: Reflection API 사용으로 인한 성능 영향을 최소화하고, 더 정교한 캐시 무효화 메커니즘을 구현했다면 더 효율적이었을 것입니다. 특히 Flag 값이 변경되었을 때 즉시 모든 클라이언트에 전파되는 실시간 업데이트 메커니즘이 있었다면 좋았을 것입니다.
## 결론

Feature Flag 시스템을 구축함으로써 배포 속도를 개선하고 기능을 유연하게 관리할 수 있는 환경을 성공적으로 만들었다. 이를 통해 개발팀은 코드 배포와 기능 출시를 분리할 수 있게 되었고, 여러 팀에서 이 시스템을 적극적으로 활용하고 있다. 

특히 주목할 만한 성과로는 JavaScript SDK 프로젝트를 성공적으로 이끈 것이 있다. 사내 Feature Flag 시스템 오너로서, Node.js SDK를 사용하는 FE(앱 개발 등 B2C side) 팀과 협업하여 실험 환경을 확장했다. 이를 통해 리브랜딩, 홈 리뉴얼, 멤버십 통합 등 대규모 프로젝트에서도 점진적 배포 및 실험이 안정적으로 운영될 수 있도록 기여했다.

Feature Flag 시스템 개발 과정에서 가장 큰 아쉬움은 회사 구조 변경으로 인해 계획했던 개선 및 확장 프로젝트가 완료되지 못한 점이다. 특히 로깅 기능과 같은 핵심 요소를 구현하지 못했는데, 이는 시스템의 완성도와 활용성에 직접적인 영향을 미쳤다. 실험 플랫폼과의 통합을 통한 데이터 수집 및 분석 기능이 구현되었다면, 기술팀뿐만 아니라 PM이나 비개발자도 실험을 직접 제어하고 결과를 분석할 수 있는 환경이 조성되었을 것이다.

이 시스템이 단순히 기능을 켜고 끄는 도구를 넘어, 전사적 데이터 기반 의사결정의 핵심 인프라로 자리매김하는 모습을 기대해본다. 로깅 시스템과 트래픽 세그먼테이션 같은 기능이 추가된다면, 이 Feature Flag 시스템은 훨씬 더 강력하고 가치 있는 도구로 발전할 수 있을 것이다.