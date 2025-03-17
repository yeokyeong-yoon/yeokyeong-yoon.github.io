---
layout: post
title: "Node.js Feature Flag 라이브러리 개발: 백엔드 전용 솔루션"
date: 2025-03-17
categories: [개발, 시스템설계]
tags: [feature-flag, nodejs, typescript, decorator, reflection]
---

## Node.js Feature Flag 라이브러리 개발: 백엔드 전용 솔루션

Java SDK로 Feature Flag를 개발한 후, 점차 더 많은 팀이 이 시스템을 사용하길 원했다. 특히 프론트엔드 팀에서도 관심을 보였다. 이렇게 시작된 Node.js 기반 Feature Flag 라이브러리 개발은 완전히 새로운 도전이었다.

그러나 개발 과정에서 이 라이브러리는 Node.js 백엔드 환경에서만 사용 가능하다는 제약이 명확해졌다. 프론트엔드 팀의 관심에도 불구하고, 기술적 특성상 브라우저 환경에서는 사용할 수 없는 백엔드 전용 솔루션이었다.

### TypeScript와 데코레이터 패턴 활용

Java SDK에서는 어노테이션을 활용했던 것처럼, Node.js 환경에서는 TypeScript의 데코레이터 패턴을 활용하여 Feature Flag를 구현했다. 이 접근 방식은 코드의 가독성과 유지보수성을 크게 향상시켰다.

```typescript
// 데코레이터를 사용한 Feature Flag 선언 예시
class ServiceConfig {
  @featureFlag()
  static enableNewAlgorithm = false;
  
  @featureFlag()
  static maxConcurrentRequests = 100;
}
```

이 데코레이터는 내부적으로 `reflect-metadata`를 활용하여 속성의 메타데이터를 관리하고, 런타임에 해당 속성의 값을 Feature Flag 서버에서 가져온 값으로 동적으로 대체한다. 이는 Java의 Reflection API를 활용한 방식과 개념적으로 유사하지만, TypeScript의 특성에 맞게 구현되었다.

### 비동기 처리와 배치 시스템

Node.js 환경의 가장 큰 특징 중 하나는 비동기 처리 모델이다. Feature Flag 라이브러리에서는 이러한 특성을 활용하여 효율적인 배치 처리 시스템을 구현했다.

```typescript
// 배치 처리 시스템의 핵심 부분
export function executeRecursiveVariableBatcher() {
  new Promise((resolve, _reject) => {
    setTimeout(() => {
      variableBatcher();
      resolve('recursive');
    }, 10);
  });
}

async function variableBatcher() {
  const variablesStack = getVariablesStack();
  const variables = [...variablesStack];
  const variablesStackIdxs = variables.map((_value, idx) => idx);

  // 기존 Feature Flag 업데이트 또는 새로운 Flag 생성 로직
  for (const variable of variables) {
    const { featureName, ...currentVariableInfo } = variable;
    // ... 처리 로직
  }

  // 처리된 변수 제거
  setVariablesStack(
    variablesStack.filter((_value, idx) => !variablesStackIdxs.includes(idx))
  );

  // 재귀적 처리 또는 완료 후 서버 동기화
  if (variablesStack.length > 0) {
    executeRecursiveVariableBatcher();
  } else {
    // 서버와 동기화
    if (featureFlagManager.wasBuildCalled()) {
      await postPropertiesToSplitterAPI(/* ... */);
      // ... 추가 동기화 로직
    }
  }
}
```

이 배치 시스템은 여러 Feature Flag 변수를 효율적으로 수집하고, 일괄적으로 서버에 전송하여 네트워크 요청을 최소화한다. 또한 비동기 처리를 통해 Node.js의 이벤트 루프를 차단하지 않고 백그라운드에서 작업을 수행한다.

### 빌더 패턴을 활용한 설정 관리

라이브러리의 사용성을 높이기 위해 빌더 패턴을 도입했다. 이를 통해 사용자는 필요한 설정만 선택적으로 구성할 수 있으며, 체이닝 방식으로 직관적인 API를 제공한다.

```typescript
// 빌더 패턴을 활용한 Feature Flag 매니저 초기화
const manager = featureFlagManager
  .setEnvironment(Environment.PRODUCTION)
  .setGroupId('my-service')
  .setPackageName('backend-service')
  .setSyncPeriod(30000)
  .setIsSync(true)
  .build();
```

이 패턴은 Java SDK에서도 사용했던 방식으로, 두 환경 간의 일관성을 유지하면서도 각 언어의 특성에 맞게 구현했다.

### 자동 동기화 메커니즘

Feature Flag 값의 최신 상태를 유지하기 위해 자동 동기화 메커니즘을 구현했다. 이는 설정된 주기에 따라 서버에서 최신 Flag 값을 가져와 로컬 캐시를 업데이트한다.

```typescript
export const syncPropertiesFromSplitterAPI = async (featureName: string) => {
  try {
    const axiosRequest = featureFlagManager.getFeatureFlagInfoRequest({
      featureName,
    });

    const featureFlagInfo = (
      await axios.get<FeatureFlagResponse>(axiosRequest.url, {})
    ).data;

    // 글로벌 맵 업데이트
    globalMap.set(featureName, featureFlagInfo);
  } catch (err) {
    // 오류 처리 로직
    console.error('Failed to sync properties: ', /* ... */);
  }

  // 자동 동기화 설정
  if (featureFlagManager.getIsSync()) {
    setTimeout(() => {
      syncPropertiesFromSplitterAPI(featureName);
    }, featureFlagManager.getSyncPeriod());
  }
};
```

이 메커니즘은 네트워크 오류에 대한 복원력을 갖추고 있으며, 오류 발생 시에도 기본값을 사용하여 시스템이 계속 작동할 수 있도록 설계되었다.

### 백엔드 서비스에 적용

Feature Flag 라이브러리가 가장 큰 가치를 발휘한 사례는 회사의 핵심 백엔드 서비스 리팩토링 프로젝트였다. 기존 모놀리식 아키텍처에서 마이크로서비스로 전환하는 과정에서, 점진적인 기능 전환이 필요했다.

```typescript
// 서비스 라우팅 코드의 일부
async function routeRequest(req, res) {
  if (ServiceConfig.useNewRoutingAlgorithm) {
    return await newRoutingService.processRequest(req, res);
  } else {
    return await legacyRoutingService.processRequest(req, res);
  }
}

// 데이터 처리 로직의 일부
async function processData(data) {
  const batchSize = ServiceConfig.processingBatchSize;
  const useParallelProcessing = ServiceConfig.enableParallelProcessing;
  
  if (useParallelProcessing) {
    return await processInParallel(data, batchSize);
  } else {
    return await processSequentially(data, batchSize);
  }
}
```

이 접근 방식을 통해 새로운 마이크로서비스로 트래픽을 점진적으로 전환할 수 있었고, 문제가 발생하면 즉시 이전 서비스로 롤백할 수 있었다. 또한 성능 최적화를 위한 다양한 설정을 런타임에 조정할 수 있어, 시스템 부하에 따라 유연하게 대응할 수 있었다.

### 모니터링과 분석: 데이터 기반 의사결정

Java SDK에서 부족했던 부분 중 하나는 모니터링 기능이었는데, Node.js Feature Flag 라이브러리에서는 이 부분을 강화했다.

```typescript
// 이벤트 추적 기능 추가
featureFlag.on('flagEvaluated', ({ flagName, value, serviceId }) => {
  metrics.record('FeatureFlagEvaluation', {
    flagName,
    value,
    serviceId,
    timestamp: Date.now()
  });
});
```

Flag가 호출될 때마다 이벤트를 발생시키고, 이를 모니터링 시스템과 연동했다. 이를 통해 "어떤 서비스에서 어떤 기능이 얼마나 자주 사용되는지", "특정 설정이 성능에 어떤 영향을 미치는지" 등의 데이터 기반 의사결정이 가능해졌다.

### 주요 교훈: 플랫폼 사고의 중요성

이 과정에서 가장 중요한 교훈은 **플랫폼 사고방식**이었다. 처음에는 내부 도구로 시작한 Feature Flag 라이브러리가 점차 회사의 핵심 인프라로 자리잡았고, 다양한 팀과 환경을 지원해야 했다.

1. **환경별 최적화**: 다양한 Node.js 서비스와 환경에 맞는 최적화가 필요했다.
2. **개발자 경험**: 기능성뿐만 아니라 개발자가 쉽게 사용할 수 있는 API 설계가 중요했다.
3. **확장성 고려**: 시스템이 성장함에 따라 성능과 확장성이 중요해졌다. 초기 설계 단계부터 이러한 요소를 고려하는 것이 중요하다.
4. **기술적 제약 인정**: 모든 환경에서 동일한 솔루션이 작동하지 않을 수 있다는 점을 인정하는 것이 중요하다. 이 라이브러리는 백엔드에서만 작동했지만, 그 영역에서는 탁월한 성능을 발휘했다.

### 성과와 성장

Node.js Feature Flag 라이브러리 프로젝트는 개발자로서의 성장을 가져다 준 중요한 경험이었다. TypeScript와 데코레이터 패턴, 비동기 프로그래밍에 대한 이해를 넓히면서, 다른 관점에서 문제를 바라보는 능력을 키울 수 있었다.

특히 주목할 만한 성과는 대규모 백엔드 리팩토링 프로젝트의 성공적인 완료였다. 기존 방식으로는 위험 부담이 큰 전환이 필요했을 것이나, Feature Flag 라이브러리를 통해 점진적이고 안정적인 마이그레이션이 가능했다. 백엔드 팀에서 이 라이브러리의 가치를 높이 평가했으며, 이는 개발 과정에서 큰 보람을 느끼게 했다.

## 결론: 기술과 사용자 간의 연결

Feature Flag 라이브러리를 개발하면서 얻은 가장 중요한 통찰은 기술이 궁극적으로 사용자를 위한 것이라는 점이다. 아무리 우수한 기술이라도 실제 사용자(이 경우에는 다른 개발자들)의 요구사항을 충족시키지 못한다면 그 가치가 제한적이다.

Java SDK에서 Node.js 라이브러리로의 확장 과정을 통해, 단순한 코드 작성자에서 플랫폼을 설계하고 다양한 팀의 요구사항을 조율하는 역할로 성장할 수 있었다. 또한 모든 환경에서 완벽하게 작동하는 단일 솔루션을 만드는 것보다, 특정 환경에 최적화된 솔루션을 제공하는 것이 때로는 더 가치 있을 수 있다는 것을 배웠다.

이러한 경험은 개발자 경력에 있어 중요한 이정표가 되었으며, 기술적 영역을 넓히는 과정에서 얻는 인사이트는 장기적으로 큰 가치를 지닌다.