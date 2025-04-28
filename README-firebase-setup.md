# Firebase 설정 가이드

이 문서는 Firebase를 사용하여 블로그 방문자 통계를 추적하는 방법을 설명합니다.

## 설치 및 설정 방법

1. `assets/js/firebase-config.template.js` 파일을 `assets/js/firebase-config.js`로 복사합니다.
2. Firebase 콘솔에서 웹 앱 설정을 복사하여 `firebase-config.js` 파일에 붙여넣습니다.
3. `.gitignore` 파일에 `assets/js/firebase-config.js`가 있는지 확인합니다. (이미 설정되어 있습니다)

## 환경 변수로 API 키 관리하기

프로덕션 환경에서는 API 키를 노출하지 않도록 환경 변수를 사용하는 것이 좋습니다.

### Jekyll 환경 변수 사용 방법

1. 로컬 개발 환경에서는 `.env` 파일을 생성하여 API 키를 저장합니다.

```bash
# .env 파일 예시
FIREBASE_API_KEY=AIzaSyC4XvOHbMnPNyjR3IbU0fZkNWKExMI6dEE
FIREBASE_AUTH_DOMAIN=yeokyeongyy.firebaseapp.com
FIREBASE_PROJECT_ID=yeokyeongyy
FIREBASE_STORAGE_BUCKET=yeokyeongyy.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=113030891564
FIREBASE_APP_ID=1:113030891564:web:a08ea569a7fb93a5c46989
FIREBASE_MEASUREMENT_ID=G-TP6F1R7FD3
```

2. `_config.yml` 파일에 Firebase 구성을 추가합니다:

```yaml
firebase:
  api_key: <%= ENV['FIREBASE_API_KEY'] %>
  auth_domain: <%= ENV['FIREBASE_AUTH_DOMAIN'] %>
  project_id: <%= ENV['FIREBASE_PROJECT_ID'] %>
  storage_bucket: <%= ENV['FIREBASE_STORAGE_BUCKET'] %>
  messaging_sender_id: <%= ENV['FIREBASE_MESSAGING_SENDER_ID'] %>
  app_id: <%= ENV['FIREBASE_APP_ID'] %>
  measurement_id: <%= ENV['FIREBASE_MEASUREMENT_ID'] %>
```

3. `.gitignore` 파일에 `.env`를 추가합니다. (이미 설정되어 있습니다)

4. 배포 환경(GitHub Pages, Netlify, Vercel 등)에서는 환경 변수를 설정합니다.

## Firebase 구성 템플릿 파일 사용 (현재 방법)

현재는 직접 `firebase-config.js` 파일에 API 키를 입력하고, 이 파일을 `.gitignore`에 추가하여 Git으로 관리되지 않도록 설정되어 있습니다. 이 방법은 간단하지만, 배포 시 수동으로 파일을 업로드해야 한다는 단점이 있습니다.

## 보안 주의사항

- API 키가 포함된 `firebase-config.js` 파일은 절대 GitHub에 업로드하지 마세요.
- Firebase 콘솔에서 적절한 보안 규칙을 설정하여 데이터베이스를 보호하세요.
- 가능하면 환경 변수를 사용하여 API 키를 관리하세요. 