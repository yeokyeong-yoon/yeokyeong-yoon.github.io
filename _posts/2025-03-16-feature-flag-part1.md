---
layout: post
title: "Feature Flag 시스템 구축기 (1부): 개념, 설계 고민, 그리고 Java SDK 개발 여정"
date: 2025-03-16 12:00:00 +0900
categories: [개발, 아키텍처]
tags: [feature-flag, java, 시스템설계]
series: feature-flag
series_order: 1
mermaid: true
---

*이 글은 Feature Flag 시스템 구축에 관한 시리즈 중 1부입니다. [2부: 복잡한 엔터프라이즈 환경에서의 기술적 도전기](../feature-flag-part2), [3부: 성능 최적화 및 모니터링](../feature-flag-part3)도 확인해보세요.*

<style>
  /* Custom styles to override theme */
  .post {
    width: 100%;
    max-width: 900px;  /* 데스크톱에서의 최대 너비 */
    margin: 0 auto;
    padding: 20px;     /* 기본 패딩 */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 18px !important;  /* 글씨 크기 키우기 */
    line-height: 1.6 !important;
  }

  p, li, h1, h2, h3, h4, h5, h6 {
    font-size: 120% !important;
  }

  h1 { font-size: 200% !important; }
  h2 { font-size: 170% !important; }
  h3 { font-size: 150% !important; }
  
  code {
    font-size: 110% !important;
  }

  /* 다이어그램 스타일 간소화 - mermaid 사용 대신 이미지 스타일만 정의 */
  .alternative-diagram {
    text-align: center !important;
    margin: 20px auto !important;
  }
  
  .alternative-diagram img {
    max-width: 100% !important;
    height: auto !important;
    border: 1px solid #ddd !important;
    border-radius: 4px !important;
  }

  /* 모바일 최적화 */
  @media screen and (max-width: 767px) {
    .post {
      padding: 10px 5px;
      font-size: 16px !important;
    }
  }
</style>


## 1. Feature Flag 시스템 개요

Feature Flag(기능 플래그)는 코드를 변경하지 않고도 기능을 켜고 끌 수 있게 해주는 소프트웨어 개발 기법이다. 마치 집안의 전등 스위치처럼, 개발자는 기능의 활성화 여부를 간단히 '스위치'로 제어할 수 있다. 이 기법은 코드 배포와 기능 출시를 분리함으로써, 새로운 기능을 안전하게 테스트하고 점진적으로 사용자에게 제공할 수 있게 해준다.

시스템 개발 초기에는 Feature Flag 도입 여부를 두고 많은 고민이 있었다. 기존 배포 프로세스를 개선하자는 의견도 있었지만, 이는 여러 팀과의 협업이 필요한 큰 변화였고 당장의 문제 해결이 어려웠다. 또한 Hackle과 같은 국내 Feature Flag 솔루션 도입도 검토했으나, 회사의 특수한 요구사항과 보안 정책 등을 고려했을 때 자체 개발이 더 적합하다고 판단했다. 결국 Feature Flag 방식을 선택한 이유는 코드 배포와 기능 출시를 완전히 분리하여 비즈니스 부서가 개발팀에 의존하지 않고도 기능을 제어할 수 있게 하기 위함이었다.

## 2. 시스템 아키텍처

시스템의 데이터 흐름과 주요 컴포넌트 간의 상호작용은 다음과 같습니다:

<!-- mermaid 다이어그램을 제거하고 대체 이미지만 사용 -->
<div class="alternative-diagram" style="text-align:center; margin:20px auto;">
  <img src="https://i.imgur.com/KP4LW8f.png" 
       alt="Feature Flag 시스템 시퀀스 다이어그램" 
       style="max-width:100%; height:auto; border:1px solid #ddd; border-radius:4px;">
  <p><small><i>시스템의 주요 컴포넌트 간 상호작용을 보여주는 시퀀스 다이어그램</i></small></p>
</div>

*시스템의 주요 컴포넌트 간 상호작용을 보여주는 시퀀스 다이어그램*

아키텍처 설계 시 중앙집중식과 분산식 접근법을 비교했다. 중앙집중식은 모든 Flag 결정을 중앙 서버에서 처리하는 방식으로, 즉각적인 업데이트와 일관된 제어가 가능하지만 네트워크 지연과 의존성이 증가한다. 분산식은 각 클라이언트가 로컬에서 결정을 내리는 방식으로, 성능은 좋지만 상태 동기화가 어렵다.

최종적으로 하이브리드 접근법을 채택했다. 클라이언트는 로컬에서 Flag 결정을 처리하지만 주기적으로 중앙 서버와 동기화하여 분산 시스템의 성능 이점과 중앙 관리의 일관성을 균형 있게 조합했다. 이 선택은 특히 네트워크 장애 시에도 기본값으로 작동하는 견고한 시스템을 구축하는 데 중요했다.

## 3. 핵심 설계 원칙과 기술적 구현

### 3.1 Annotation 기반 관리 시스템

```java
@FeatureFlag(flagName="new-search-algorithm")
private static boolean useNewSearchAlgorithm = true;
```

이 설계는 Admin 페이지와 코드 사이의 Splitter API 네트워크 장애 시에도 기능 상태의 일관성을 보장했다. 애플리케이션 시작 시 코드 내 선언된 Flag가 실험 플랫폼에 자동 등록되었으며, 이후 실험 플랫폼에서 상태를 수정할 수 있도록 했다.

이 설계를 선택하기 전에 다음과 같은 대안들을 고려했다. 가장 중요한 요구사항은 "런타임에 코드 수정이나 재배포 없이 변수 값을 동적으로 변경할 수 있어야 한다"는 것이었다. 이 핵심 요구사항을 기준으로 다음 대안들을 평가했다:

1. **Properties 파일 기반 설정**
   ```java
   Properties props = new Properties();
   props.load(new FileInputStream("flags.properties")); 
   boolean useNewAlgorithm = Boolean.parseBoolean(props.getProperty("new-search-algorithm"));
   ```
   - 장점: 설정 변경이 쉽고, 코드 수정 없이 값 변경 가능
   - 단점: 여전히 배포가 필요하여 런타임 변경 불가능
   - 기각 이유: 런타임 동적 변경이라는 핵심 요구사항 충족 실패

2. **데이터베이스 직접 관리**
   ```java
   String sql = "SELECT value FROM feature_flags WHERE name = ?";
   boolean useNewAlgorithm = jdbcTemplate.queryForObject(sql, Boolean.class, "new-search-algorithm");
   ```
   - 장점: 중앙 집중식 관리, 런타임에 실시간 값 변경 가능
   - 단점: 네트워크 장애 시 전체 시스템 영향
   - 기각 이유: 안정성 위험이 너무 큼

3. **REST API 기반 동적 설정**
   ```java
   RestTemplate rest = new RestTemplate();
   FeatureFlag flag = rest.getForObject("/api/flags/new-search-algorithm", FeatureFlag.class);
   boolean useNewAlgorithm = flag.isEnabled();
   ```
   - 장점: 런타임에 유연한 관리와 실시간 업데이트 가능
   - 단점: 네트워크 의존성, 초기값 설정의 어려움
   - 기각 이유: 코드의 의도가 불명확하고 타입 안정성 부족

4. **인터페이스와 구현체를 통한 방식**
   ```java
   public interface SearchAlgorithm { void search(); }
   public class NewSearchAlgorithm implements SearchAlgorithm { ... }
   SearchAlgorithm algorithm = flagEnabled ? new NewSearchAlgorithm() : new OldSearchAlgorithm();
   ```
   - 장점: 런타임에 유연한 기능 제어 가능
   - 단점: 구조가 복잡하고 개발 시간이 오래 걸림
   - 기각 이유: MVP 단계에서는 빠르고 단순한 구현이 우선이었음

5. **환경 변수 활용**
   ```java
   boolean useNewAlgorithm = Boolean.parseBoolean(System.getenv("NEW_SEARCH_ALGORITHM"));
   ```
   - 장점: 배포 환경별 구성 쉬움, 인프라 수준에서 제어 가능
   - 단점: 런타임 변경이 거의 불가능, 모니터링 및 감사 복잡
   - 기각 이유: 런타임 동적 변경이라는 핵심 요구사항 충족 실패
2. **명시적 등록 API**
   - 장점: 간단한 구현, 명확한 작동 방식, 네트워크 장애 시 기본값 명시적 지정 가능
   - 단점: 개발자가 수동으로 각 Flag 등록 필요, 유지관리 부담, 기본값 설정 누락 시 장애 위험
   - 기각 이유: 사용 편의성 감소, Flag 등록 및 기본값 설정 누락 가능성 높음

3. **스프링 프레임워크 통합**
   - 장점: 기존 스프링 애플리케이션과 통합 용이, 풍부한 생태계
   - 단점: 스프링 의존성 발생, 비스프링 환경 지원 어려움
   - 기각 이유: 프레임워크 중립성 손상, 레거시 시스템 지원 제한

Reflection 기반 접근법은 이러한 대안들과 비교했을 때 가장 균형 잡힌 선택이었다. 런타임에 약간의 오버헤드가 있지만, 개발자 경험을 최우선으로 고려했을 때 코드에 어노테이션만 추가하면 되는 간편함이 큰 장점이었다. 다만 Reflection 스캐닝 범위가 넓을수록 초기화 시간과 메모리 사용량이 증가하므로, 가이드에서는 Feature Flag가 사용되는 패키지 범위를 명시적으로 지정하도록 권장했다. 이를 통해 프레임워크 의존성 없이 순수 Java로 구현하면서도 효율적인 SDK를 만들 수 있었다.

중요한 제약사항으로, Feature Flag 필드는 반드시 `static`으로 선언해야 했다. 여기서 Java의 주요 키워드들을 구분해보면:

- `static`: 클래스 수준에서 공유되는 필드로, 인스턴스 생성 없이 접근 가능하다. 모든 인스턴스가 같은 값을 공유한다.
- `final`: 한 번 할당된 후 값을 변경할 수 없는 상수를 선언할 때 사용한다. 
- `static final`: 클래스 상수를 선언할 때 사용하며, 모든 인스턴스가 공유하는 변경 불가능한 값이다.

Feature Flag는 런타임에 값이 변경되어야 하므로 `final`은 사용할 수 없고, 인스턴스 없이 접근해야 하므로 `static`만 사용한다. 예를 들어:

이러한 제약사항은 Feature Flag의 핵심 요구사항과 직접적으로 연관된다:

1. **런타임 변경 가능성**: Feature Flag의 값은 서비스 실행 중에도 변경될 수 있어야 한다. `final` 키워드를 사용하면 이 요구사항을 충족할 수 없다.

2. **전역 접근성**: 애플리케이션의 어느 부분에서든 Feature Flag에 쉽게 접근할 수 있어야 한다. `static` 키워드를 통해 인스턴스 생성 없이도 직접 접근이 가능하다.

다음은 이러한 제약사항을 고려한 구체적인 예시이다:

```java
// 올바른 사용법 - static 필드
@FeatureFlag(flagName = "new-search-algorithm", defaultValue = false)
public static boolean useNewSearchAlgorithm = false;

// 잘못된 사용법 - 인스턴스 필드 (작동하지 않음)
@FeatureFlag(flagName = "premium-feature", defaultValue = false)
private boolean premiumFeatureEnabled = false;
```
또한 Feature Flag 시스템의 핵심 동작을 위해 다음과 같은 기술적 요소들을 구현했다:

1. **클래스 스캐닝**: 
   - Java의 클래스 로더를 활용하여 애플리케이션의 모든 클래스를 검색
   - 성능을 위해 특정 패키지만 스캔하도록 필터링 옵션 제공
   - 예: "com.myapp.features" 패키지 내의 클래스만 스캔

2. **Flag 정보 저장**:
   - `ConcurrentHashMap`을 사용하여 Flag 정보를 메모리에 저장
   - 여러 스레드가 동시에 접근해도 안전하게 동작
   - 키: Flag 이름 (예: "new-search-feature")
   - 값: Flag 상태와 설정 정보

3. **서버와의 동기화**:
   - `ScheduledExecutorService`를 사용하여 주기적으로 서버와 Flag 값 동기화
   - 예: 30초마다 한 번씩 서버에서 최신 Flag 값을 가져옴

서버와의 동기화 방식을 선택할 때 다음 세 가지 방법을 고려했다:

1. **WebSocket 방식**
   - 장점: Flag 값이 변경되면 즉시 반영
   - 단점: 
     - 서버와 지속적인 연결 유지 필요
     - 구현이 복잡하고 서버 자원 많이 사용
     - 네트워크 문제 시 재연결 로직 필요

2. **Server-Sent Events 방식**
   - 장점: WebSocket보다 구현이 간단
   - 단점: 여전히 실시간 연결 필요

3. **주기적 HTTP 요청 방식** (선택한 방식)
   - 장점:
     - 구현이 매우 단순 (일반 HTTP GET 요청)
     - 서버 부하 적음
     - 네트워크 문제에 강함
   - 단점: 
     - 실시간 반영은 어려움
     - Flag 값 변경 후 최대 30초 지연 가능

주기적 HTTP 요청 방식을 선택한 이유:

1. **단순성**: 
   - 복잡한 연결 관리 로직이 필요 없음
   - 일반적인 HTTP 클라이언트 라이브러리로 구현 가능

2. **안정성**:
   - 네트워크 문제가 발생해도 다음 주기에 자연스럽게 재시도
   - 서버 장애 시에도 로컬 캐시된 값으로 계속 동작 가능

3. **효율성**:
   - 여러 Flag 값 변경을 한 번에 가져올 수 있음
   - 서버와 클라이언트 모두 자원 사용량 예측 가능

4. **캐시 활용**:
   - 업데이트 주기 사이에는 로컬 메모리 캐시 사용
   - 매 요청마다 서버에 접근할 필요 없음
   - 빠른 응답 시간 보장

이러한 설계를 통해:
- 개발자는 코드에 `@FeatureFlag` 어노테이션만 추가하면 됨
- 시스템이 자동으로 Flag를 감지하고 관리
- 안정적이고 효율적인 Flag 값 동기화
- 간단하면서도 강력한 Feature Flag 시스템 구현

추가로 고려했던 설정 방식들:
- XML 파일 기반 설정: 코드와 설정이 분리되어 관리가 어려움
- 프로그래밍 방식 등록: 코드가 길어지고 실수할 가능성 높음
- 외부 캐시(Redis/Memcached): 추가 인프라 관리 부담

### 3.3 싱글톤 패턴과 스레드 안전성 확보

Feature Flag Manager는 싱글톤 패턴으로 구현하여 애플리케이션 전체에서 하나의 인스턴스만 존재하도록 설계했다. 싱글톤 패턴을 적용한 명확한 이유는 다음과 같다:

1. **일관된 상태 관리**: Feature Flag의 상태는 애플리케이션 전체에서 일관되게 유지되어야 한다. 여러 인스턴스가 존재할 경우 각각 다른 상태를 가질 수 있어 예측 불가능한 동작이 발생할 위험이 있다.

2. **리소스 효율성**: Flag 정보를 주기적으로 백엔드 서버와 동기화하는 과정에서 네트워크 요청과 메모리 사용이 발생한다. 여러 인스턴스가 각각 동기화를 수행한다면 불필요한 리소스 낭비가 발생할 수 있다.

3. **캐시 효율성 극대화**: LRU 캐시를 통해 Flag 값 조회 성능을 최적화했는데, 여러 인스턴스가 각자의 캐시를 관리한다면 캐시 히트율이 떨어져 성능 이점이 감소한다.

4. **중앙화된 로깅과 모니터링**: 모든 Flag 조회와 변경 이벤트를 단일 지점에서 추적하고 로깅함으로써 디버깅과 모니터링이 용이해진다.

## 3.4 동시성 제어를 위한 고민

학부 운영체제 수업에서 Lock을 배웠지만, 실제 프로덕션 환경에서 동시성 제어를 구현하는 것은 처음이었다. 특히 여러 서버에서 동시에 Feature Flag 값을 읽고 쓰는 상황에서 데이터 일관성을 어떻게 보장할지 고민이 컸다. 시니어 엔지니어들과 논의를 통해 여러 방안을 검토했는데, 결국 복잡한 커스텀 락 메커니즘보다는 Java에서 제공하는 `ConcurrentHashMap`을 활용하기로 결정했다.

이 결정의 핵심에는 "최대한 심플하게 구성하라"는 시니어 엔지니어의 조언이 있었다. 특히 여러 팀이 사용하는 공통 SDK에서는 단순성이 매우 중요한 원칙이었다. 복잡한 동시성 제어 로직은 버그 발생 가능성을 높이고 디버깅을 어렵게 만들 수 있기 때문에, 검증된 라이브러리의 기능을 최대한 활용하는 것이 더 안정적이고 유지보수하기 쉽다는 결론에 도달했다.

이러한 결정을 내린 구체적인 이유는 다음과 같다:

1. **성능 최적화**: 명시적인 락은 모든 읽기/쓰기 작업에 대해 동기화를 강제하여 성능 저하를 일으킬 수 있다. Feature Flag 시스템은 읽기 작업이 압도적으로 많은 특성을 가지고 있어, 읽기 작업에 락을 사용하면 불필요한 병목 현상이 발생할 수 있다.

2. **세밀한 동시성 제어**: `ConcurrentHashMap`은 내부적으로 세그먼트 단위의 락을 사용하여 다른 키에 대한 동시 접근을 허용한다. 이는 여러 Flag에 대한 동시 접근 시 전체 맵에 락을 거는 것보다 훨씬 효율적이다.

3. **코드 복잡성 감소**: 명시적인 락 메커니즘을 구현하려면 읽기/쓰기 락, 데드락 방지 등 복잡한 동시성 제어 로직이 필요하다. `ConcurrentHashMap`을 사용함으로써 이러한 복잡성을 크게 줄일 수 있었다.

4. **원자적 연산 지원**: `ConcurrentHashMap`은 `putIfAbsent`, `computeIfAbsent` 등의 원자적 연산을 제공하여 락 없이도 안전한 업데이트가 가능하다.

동시성 관리를 위한 다른 대안들도 검토했다:

1. **Synchronized Collections**
   ```java
   Map<String, FeatureFlag> flagRegistry = Collections.synchronizedMap(new HashMap<>());
   ```
   - 장점: 구현 간단, Java 표준 라이브러리 활용
   - 단점: 메서드 호출마다 전체 컬렉션에 락 적용, 확장성 제한
   - 기각 이유: 읽기 작업이 많은 시스템에서 성능 병목 현상 발생

2. **ReentrantReadWriteLock**
   ```java
   private final Map<String, FeatureFlag> flagRegistry = new HashMap<>();
   private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
   
   public FeatureFlag getFlag(String name) {
       rwLock.readLock().lock();
       try {
           return flagRegistry.get(name);
       } finally {
           rwLock.readLock().unlock();
       }
   }
   
   public void updateFlag(String name, FeatureFlag flag) {
       rwLock.writeLock().lock();
       try {
           flagRegistry.put(name, flag);
       } finally {
           rwLock.writeLock().unlock();
       }
   }
   ```
   - 장점: 읽기/쓰기 작업 구분, 읽기 작업 동시성 향상
   - 단점: 코드 복잡성 증가, 락 획득/해제 관리 필요
   - 기각 이유: 명시적 락 관리의 복잡성과 오류 가능성

이러한 대안들을 검토한 결과, `ConcurrentHashMap`은 성능과 코드 단순성을 최적으로 균형 잡는 선택이었다. 특히 Java 5부터 제공되는 안정적인 API로, 다양한 환경에서 호환성이 보장되고 잘 검증된 구현체라는 장점이 있었다. 실제 성능 테스트에서도 읽기 작업이 많은 우리 시스템에서 가장 좋은 결과를 보여주었다.

`ConcurrentHashMap`의 주요 특징을 요약하자면:

- **분할 락(Segmented Locking)**: 맵 전체가 아닌 일부 세그먼트에만 락을 적용하여 동시성 성능 향상
- **락 스트라이핑(Lock Striping)**: 여러 개의 락을 사용하여 다른 버킷에 대한 동시 접근 허용
- **비차단 읽기(Non-blocking Reads)**: 읽기 작업은 락을 획득하지 않고 수행되어 높은 처리량 제공
- **약한 일관성(Weak Consistency)**: 완전한 동기화 대신 실용적인 일관성 모델 채택
- **원자적 연산**: `putIfAbsent()`, `replace()` 등 복합 연산의 원자성 보장

검증된 동시성 컬렉션을 활용하는 것이 더 안정적이고 유지보수하기 쉽다는 결론에 도달했다. "최대한 심플하게 구성하라"는 조언이 가장 큰 영향을 미쳤는데, 이는 특히 여러 팀이 사용하는 공통 SDK에서 중요한 원칙이었다. 복잡한 동시성 제어 로직은 버그 발생 가능성을 높이고 디버깅을 어렵게 만들 수 있기 때문에, 검증된 라이브러리의 기능을 최대한 활용하는 방향으로 설계했다.
