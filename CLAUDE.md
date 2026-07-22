# cht-app-sdk

이 프로젝트는 Channel Talk App SDK 기반 앱입니다.

## SDK 규격
- 서버: @channel.io/app-sdk-server (NestJS)
- WAM: @channel.io/app-sdk-wam (React)
- Extension 패턴: @Extension + @Func 데코레이터
- config extension: getConfigSchema + validateStoredConfig
- 표준 App Store extension(order/wms/messaging/customtab 등)은 runtime.generateHttpFunction의
  standardExtensionName + standardFunctionName 옵션으로 생성합니다.

## 핵심 규칙
- **런타임 진입점과 빌드 루트는 `.app-studio/project.json`으로 관리합니다.**
  다양한 레포를 가져온 경우, 이 파일의 `installRoot`, `serverRoot`, `entryFile`을 먼저 확인하세요.
  기존 레포가 바로 App Studio 함수 서버가 아니면 `.app-studio/server` 같은 wrapper 서버를 만들고
  `.app-studio/project.json`의 `serverRoot`를 wrapper로 바꾸는 방식이 가장 안전합니다.
- **외부 사이트 탐색/API 발견은 반드시 browser-mcp 도구를 사용하세요.**
  curl, wget, Bash로 직접 HTTP 요청하지 마세요. browser-mcp는 쿠키/세션/JavaScript를 처리하고, 사용자가 VNC로 실시간 확인할 수 있습니다.
- WebSearch/WebFetch 같은 숨은 웹 도구로 URL을 찾지 마세요. URL 발견도 사용자가 볼 수 있고 녹화 가능한 browser-mcp 브라우저 안에서 진행하세요.
- 날씨, 환율, 공휴일, 공개 통계처럼 로그인/관리자 화면이 필요 없는 공개 데이터 API 앱은 검색엔진을 열지 말고 곧바로 runtime 도구로 구현하세요. 이미 알려진 공식 공개 API가 충분하면 브라우저 탐색 자체를 생략하고, 필요할 때만 공식 문서 URL로 직접 이동하세요.
- 특히 날씨 앱은 예외 없이 Open-Meteo의 geocoding/forecast/archive API를 사용하세요. 날씨 앱에서는 browser.open/navigate/snapshot 호출, Google/Bing 검색, OpenWeatherMap/WeatherAPI/AccuWeather처럼 API key가 필요한 제공자 탐색이 금지입니다. 사용자가 특정 유료 제공자와 API key를 명시한 경우에만 이 금지를 풀 수 있습니다.
- 날씨 앱은 비개발자 사용자가 바로 부를 수 있는 단일 대표 함수(예: `weather.getWeather`)를 우선 만들고, 입력은 `city`, `startDate`, `endDate`처럼 단순하게 유지하세요. 보조 함수가 필요해도 최종 QA는 생성 도구가 반환한 `exposedMethod` 또는 `@Func` 문자열과 정확히 같은 함수명으로 호출하세요. `weather.getWeather`를 `getWeather`처럼 줄여 부르거나 함수명을 추측하지 마세요.
- Open-Meteo geocoding은 한글 지명만으로 결과가 없을 수 있습니다. 날씨 앱에서 사용자가 "서울로 테스트"처럼 한국어 도시명을 주면 `서울 → Seoul`, `도쿄 → Tokyo`, `뉴욕 → New York`, `파리 → Paris`, `런던 → London` 같은 alias/fallback을 구현하고, 실제 QA 입력도 `city: "서울"`로 호출해 통과시켜야 합니다.
- 서비스명만 있고 공식 URL을 확정하지 못했더라도 사용자 요청이 관리자형/WMS/ERP/업무 화면 앱이거나 사용자가 Remote 시연을 허용했다면, 검색엔진 탐색보다 Teaching Mode가 우선입니다. 채팅으로 URL을 묻거나 Google 검색으로 대기하지 말고 같은 sessionId에서 browser.waitForScreencastReady → browser.startCapture → browser.startRecording → browser.requestDemo(reason="서비스 로그인/주문 화면으로 이동해 시연해주세요") → browser.waitForChange로 전환하세요. 사용자가 Remote 탭에서 직접 URL 이동/로그인/업무 화면 시연을 할 수 있게 해야 하며, URL 질문은 Remote 시연도 불가능하거나 비즈니스 화면 근거가 전혀 없을 때만 짧게 하세요.
- 서비스명이나 로그인 도메인/tenant 값으로 URL을 조합해 직접 이동하지 마세요. 공식 URL이 불명확하고 사용자 요청이 공개 API/문서 탐색에 가깝거나 Remote 시연 신호가 없다면 먼저 알려진 공식 API/문서 URL이 있는지 판단하고, 있으면 검색엔진 없이 그 공식 URL로 직접 이동하세요. 공식 URL을 전혀 모르고 문서 근거가 꼭 필요하면 브라우저에 보이는 검색엔진 결과 페이지에서 서비스명 원문/영문명 + "API docs OAuth"처럼 검색한 뒤, 현재 페이지의 visible anchor href/search redirect target으로 확인된 결과만 여세요. URL을 모른다는 이유로 `https://developers.{brand}...`, `https://api.{brand}...`, 국가 TLD(`.kr`, `.co.kr`, `.jp` 등)를 추측해 이동하지 마세요. 구현에 충분한 공개 endpoint가 이미 알려져 있으면 브라우저 탐색을 생략하세요. 검색 결과/차단 페이지에서 target URL이 현재 페이지의 visible anchor href 또는 search redirect target으로 확인되지 않으면 browser.navigate는 SEARCH_RESULT_LINK_REQUIRED로 차단됩니다. `UNVERIFIED_PROVIDER_URL` 또는 `SEARCH_RESULT_LINK_REQUIRED`가 나오면 같은 브랜드의 새 도메인 후보를 절대 만들지 말고, 공개 API/OAuth 문서라면 검색 결과의 visible link를 먼저 열고, 그 외에는 사용자 제공 URL/Remote 시연/짧은 확인 질문으로 전환하세요. 추측한 `https://www.{brand}.co.kr`, `admin.{brand}`, `/{login,index}` 후보는 금지입니다. URL 조합은 사용자가 URL을 직접 제공했거나, 현재 페이지의 링크/form action/redirect/search result가 그 URL을 증명한 경우에만 허용됩니다.
- 사용자가 관리자 로그인 정보로 "도메인", "상점", "몰 ID", "tenant", "company code" 같은 값을 주면 그 값이 항상 서브도메인이라는 뜻은 아닙니다. `https://{tenant}.{provider}`만 반복하지 말고, 공식 로그인 페이지의 도메인/상점/회사코드 입력칸에 넣는 값일 가능성을 먼저 확인하세요. 공식 로그인 페이지를 찾았고 도메인/ID/PW 입력칸이 보이면 같은 sessionId에서 startCapture/startRecording을 켠 뒤 그 값을 폼에 입력하거나 requestDemo로 시연받으세요.
- 서비스 URL을 확정해야 할 때도 검색엔진은 마지막 수단입니다. 공식 문서 URL을 알고 있으면 그 URL로 직접 이동하고, 공개 데이터 API처럼 문서 확인 없이 구현 가능한 경우에는 브라우저 탐색을 생략하세요. 단, 공개 API/OAuth 문서가 필요하고 공식 URL을 모른다면 검색 결과 링크를 검증하는 편이 국가/개발자 도메인을 만들어내는 것보다 낫습니다. 관리자형/WMS/ERP 앱이거나 사용자가 Remote 시연을 허용한 경우에는 URL 검색보다 Teaching Mode가 우선입니다. 사용자가 제공한 domain/tenant 값을 근거 없이 곧바로 호스트명으로 조합해 첫 이동하지 마세요. URL guard가 한 번이라도 차단하면 그것은 "더 많은 추측을 시도하라"는 신호가 아니라 "증거 있는 링크나 사용자 입력으로 전환하라"는 신호입니다.
- 로그인 시연은 필드마다 쪼개지 마세요. 도메인/상점/ID/PW/제출이 한 화면에 있으면 browser.requestDemo는 "로그인 정보를 입력하고 로그인 버튼까지 눌러주세요"처럼 한 번만 요청하고 browser.waitForChange도 제출 뒤 한 번만 호출하세요. 자동 입력이 가능한 명시 credential을 받은 경우에도 browser.evaluate 한 번으로 여러 필드를 채우고 제출한 뒤 관리자 화면 도달 조건을 한 번만 기다리세요.
- 로그인 또는 업무 화면에서 CAPTCHA, 보안코드, OTP, 2FA, 인증번호, security code가 감지되면 즉시 `browser.addEvidence(kind="security-challenge")`로 현재 화면 근거를 남기고, 실제 취소/반품/교환/배송지 변경 같은 mutation submit은 skip/guard 처리하세요. 챌린지를 풀려고 반복 입력하거나 필드별 waitForChange를 계속 호출하지 말고, 같은 recording session에서 requestDemo + waitForChange로 사용자가 풀 수 있게 이어가세요.
- 공식 URL을 모르는 상태에서 browser.open/browser.navigate/startCapture/startRecording을 같은 병렬 도구 묶음으로 호출하지 마세요. 먼저 browser.open으로 세션을 만들고, 관리자형/WMS/ERP 또는 Remote 시연 신호가 있으면 같은 sessionId에서 waitForScreencastReady 후 startCapture/startRecording/requestDemo/waitForChange로 바로 넘어가세요. 공개 API/문서 탐색은 알려진 공식 URL, 사용자가 제공한 URL, 검증된 검색 결과 링크, 또는 브라우저 없는 runtime 구현을 우선하세요. 확인되지 않은 URL로 navigate가 running/error이면 같은 묶음 안에서 다른 URL 탐색을 병렬로 시작하지 말고, 검색 결과 evidence/공식 URL/evidence 또는 Remote 시연 경로로 전환하세요.
- browser.snapshot 결과가 로그인/관리자/업무 화면(예: 로그인, ID/PW, admin, ERP/WMS, 주문, 판매처, 출고, 반품)을 보여주고 공개 비즈니스 API가 아직 확인되지 않았다면 거기서 응답을 끝내지 마세요. 같은 sessionId로 browser.startCapture → browser.startRecording → browser.requestDemo → browser.waitForChange를 순서대로 호출해 Teaching Mode로 전환하세요.
- 관리자 로그인 정보는 채팅으로 먼저 요구하지 마세요. 로그인/업무 화면을 찾았다면 같은 browser sessionId에서 capture/recording을 켠 뒤 Remote 탭으로 사용자가 직접 로그인 폼에 입력하게 하고, stopRecording이 저장한 captured credentials로 App Store config를 autoFill하세요. 사용자가 이미 채팅에 비밀값을 적은 경우에만 도구 입력에 조심히 사용하고, 응답/후속 질문에 반복 노출하지 마세요.
- browser.stopRecording, stopCapture, waitForChange, snapshot, recording action에서 보이는 credential 값은 모두 비밀입니다. 채팅 응답에는 실제 값을 절대 쓰지 말고, 필요한 경우 "domain/username/password 키가 저장됨"처럼 키 이름과 상태만 말하세요.
- runtime.generateFunctionFromRecording의 description/targetDomain에도 녹화에서 본 실제 domain/tenant/username/password/apiKey/hash/token 값을 쓰지 마세요. description에는 "로그인 도메인(<실제값>)"처럼 쓰지 말고 "로그인 도메인 키를 사용"처럼 키 이름과 역할만 남기세요.
- **로그인이 필요한 사이트는 Teaching Mode를 사용하세요.**
  browser.requestDemo로 사용자에게 로그인을 요청하고, browser.waitForChange로 완료를 대기합니다.
  공식 개발자센터/API 문서가 로그인 화면을 보여주면, 사용자가 API 연동을 명시했거나 API key/hash/Partner Key를 제공한 경우에만 Teaching Mode로 개발자센터 로그인을 요청하세요. 관리자 계정만 있거나 ERP/WMS/어드민 녹화가 자연스러운 서비스라면 개발자센터 대신 실제 관리자 화면에서 주문/샵 식별 작업을 녹화하세요.
  "API", "개발자센터", "연동" 페이지를 찾았다는 사실만으로 공개 API가 확인된 것이 아닙니다. 그 페이지가 로그인 폼, API 신청, 문서 목록 없는 안내 페이지, 또는 관리자 계정(도메인/ID/PW) 입력 화면이면 완료하지 말고, 공개 비즈니스 endpoint/schema/hash 발급 방식이 보이기 전까지는 관리자 화면 기반 서비스로 간주해 Teaching Mode를 시작하세요.
  API 문서가 로그인 뒤에 있고 현재 가진 정보가 관리자 credential 형태라면 API 로그인 페이지에서 멈추지 마세요. 사용자가 별도 API key/hash/token을 줬거나 공개 문서에서 인증/주문/샵/배송/재고 endpoint가 명확히 보이는 경우에만 HTTP 함수 생성을 진행하고, 그 외에는 관리자 로그인/주문 화면 녹화로 진행하세요.
  API hash, access key처럼 발급받아야 하는 값은 앱 설정의 config extension credential로 받도록 구현하고, 실제 비밀값이 없어도 스캐폴딩/빌드까지 진행하세요.
- 로그인 중 CAPTCHA, 보안코드, OTP, 2FA, 인증번호, security code 같은 사람이 확인해야 하는 챌린지가 나오면 직접 OCR/추측/새로고침/반복 입력을 하지 마세요. 같은 browser sessionId에서 즉시 browser.requestDemo(reason="보안 확인/로그인을 완료해주세요")를 호출하고, 곧바로 browser.waitForChange로 대기하세요. 녹화 중이라면 이 흐름도 같은 recording session 안에서 이어가야 하며, 사용자가 업무 화면까지 시연하면 추가로 챌린지를 풀려고 하지 말고 stopRecording → runtime.generateFunctionFromRecording으로 진행하세요.
- **App Studio MCP 도구는 이미 연결되어 있습니다.**
  runtime/browser/channel 도구를 찾기 위해 ToolSearch를 쓰지 말고, 연결된 MCP 도구를 직접 사용하세요.
- 프로젝트 파일 조회/수정은 runtime.listProjectFiles, runtime.readProjectFile, runtime.writeProjectFile을 사용하세요.
- 사용자가 GitHub 업로드, private repo 생성, repo 링크 연결, 특정 branch push, 커밋 단위 배포를 원하면 runtime.pushProjectToGithub를 사용하세요. createIfMissing=true면 private=true가 기본이며, channel GitHub token이 설정된 경우 별도 토큰을 묻지 마세요. disposable QA repo를 초기화하는 E2E가 아니라면 force=true를 쓰지 마세요.
- GitHub 연동 프로젝트에서는 runtime.writeProjectFile/runtime.generate* 도구가 만드는 App Studio git commit을 의미 있는 단위로 유지하고, 주요 구현 단위가 끝날 때 pushProjectToGithub로 원격 branch를 최신화하세요. 특정 commit으로 배포해야 하면 push 결과 또는 deployStatus의 commitSha를 사용해 runtime.deploy({ commitSha })로 검증하세요.
- 프로젝트 slug는 현재 URL, workspace state, 또는 runtime.createProject 결과의 slug만 신뢰하세요. 서비스명에서 `provider-wms`, `provider-app` 같은 slug를 새로 추측해 runtime 도구에 넣지 마세요.
- 새 앱/새 프로젝트 요청에서 현재 URL이나 workspace에 project slug가 없다면 첫 도구 호출은 runtime.createProject여야 합니다. browser.open(projectName=...)은 브라우저 세션만 만들 뿐 프로젝트 DB row, 파일 scaffold, S3 backup을 만들지 않습니다.
- `Project "..." not found` 또는 파일 목록 404/500이 나오면 browser.open을 반복하지 마세요. 직전 runtime.createProject 결과 slug가 없다면 요청받은 프로젝트 이름으로 runtime.createProject를 한 번 호출해 scaffold를 만든 뒤 같은 slug로 계속하세요.
- 한 프로젝트를 만든 뒤에는 모든 runtime 도구의 `projectName`/slug 인자로 같은 slug를 계속 사용하세요. slug mismatch나 "not found"가 나면 새 프로젝트명을 추측하지 말고 현재 URL의 `/project/{slug}` 또는 직전 createProject 결과로 되돌아가세요.
- browser sessionId, recordingId, 서비스명은 project slug가 아닙니다. `browser.stopRecording`이 recordingId를 반환하면 다음 도구 호출은 반드시 같은 project slug와 그 recordingId를 쓰는 runtime.generateFunctionFromRecording이어야 합니다. 그 사이에 TodoWrite, Read, listProjectFiles, browser.open, WebSearch, 새 녹화 시작을 호출하지 마세요. stopRecording이 성공했는데 "녹화 ID가 없다"고 말하거나 다시 녹화를 시작하면 실패입니다.
- built-in Write/Edit/MultiEdit/Read/Bash로 /app/generated/<project> 파일을 만들거나 수정하지 마세요. 그런 수정은 App Studio 워크스페이스/S3 백업과 동기화되지 않을 수 있습니다.
- extension 파일(.extension.ts)은 codegen 도구로 생성합니다.
- App Store가 호출해야 하는 표준 기능은 standalone 함수가 아니라 @Extension({ name }) 파일로 노출하세요.
  예: standardExtensionName="order", standardFunctionName="core.getOrders" → extension.order.core.getOrders
- App Store 표준 extension(order/wms/messaging/config 등)은 직접 Write/Edit로 만들지 마세요. HTTP/API 근거가 있으면 runtime.generateHttpFunction, 브라우저 녹화 근거가 있으면 runtime.generateFunctionFromRecording으로 생성하세요.
  이 도구들이 @channel.io/app-sdk-server import, @Extension/@Func, app.module 등록을 맞춰줍니다.
- 오픈 API가 없거나 관리자 화면 조작으로만 조회가 가능한 서비스는 browser.waitForScreencastReady → browser.startCapture → browser.startRecording → requestDemo/waitForChange → browser.stopRecording → runtime.generateFunctionFromRecording 순서로 Playwright 기반 함수를 생성하세요. 이 경우에도 App Store 표준 함수라면 standardExtensionName/standardFunctionName을 반드시 넘기세요.
- browser.requestDemo와 browser.waitForChange를 다른 브라우저 도구와 병렬 호출하지 마세요. 반복 시연 대기라면 timeoutMs를 90~120초처럼 명시하고, timeout/error 또는 사용자의 "시연 완료" 메시지를 받으면 새 녹화를 시작하기 전에 같은 sessionId로 browser.snapshot(interactiveOnly=true, flat=true)을 호출해 현재 화면과 recordingActive를 확인하세요. 로그인 성공, 관리자 홈, 검색 차단, credential field만 보이는 상태는 녹화 완료 근거가 아닙니다. 주문/샵/CS/action evidence가 있거나 browser.stopRecording이 충분하다고 통과할 때만 runtime.generateFunctionFromRecording으로 이어가세요.
- 녹화가 active인 상태에서 로그인 페이지나 관리자 업무 화면을 발견했으면 startCapture/startRecording을 다시 호출하지 마세요. 같은 UUID sessionId로 snapshot → requestDemo(로그인 정보를 모두 입력하고 로그인 버튼까지 눌러달라는 한 번의 요청) → waitForChange를 한 번만 이어가고, 로그인 후 주문/샵/action evidence가 보이면 같은 sessionId로 stopRecording을 시도하세요.
- 사용자가 Remote 탭에서 작업을 끝냈다고 말했는데 오래된 waitForChange running 카드가 남아 있어도, 이를 새 프로젝트/새 세션/새 녹화를 시작해야 한다는 신호로 해석하지 마세요. 먼저 직전 UUID sessionId로 snapshot/stopRecording을 시도하고, 정말 녹화가 없고 업무 화면 evidence도 없을 때만 새 demo를 요청하세요.
- 사용자가 "오픈 API가 없다", "브라우저 녹화", "관리자 화면", "도메인/아이디/비밀번호", "ERP/WMS/어드민" 같은 신호를 주거나, 로그인 정보가 API key/hash가 아니라 관리자 계정이면 API 문서/개발자센터 탐색을 반복하지 마세요. 대상 서비스의 실제 관리자 화면에서 startCapture와 startRecording을 모두 켠 뒤 사용자의 주문 조회/샵 식별 조작을 시연받고, stopRecording 결과로 함수를 생성하세요. 개발자센터/API 문서를 먼저 봤더라도 비즈니스 데이터 API가 확인되지 않으면 즉시 관리자 화면 녹화 경로로 전환하세요.
- "API", "개발자센터", "연동" 페이지를 찾았다는 사실만으로 공개 API가 확인된 것이 아닙니다. 그 페이지가 로그인 폼, API 신청, 문서 목록 없는 안내 페이지, 또는 관리자 계정(도메인/ID/PW) 입력 화면이면 완료하지 말고, 공개 비즈니스 endpoint/schema/hash 발급 방식이 보이기 전까지는 관리자 화면 기반 서비스로 간주해 같은 sessionId에서 Teaching Mode를 시작하세요.
- API 문서가 로그인 뒤에 있고 현재 가진 정보가 관리자 credential 형태라면 API 로그인 페이지에서 멈추지 마세요. 사용자가 별도 API key/hash/token을 줬거나 공개 문서에서 인증/주문/샵/배송/재고 endpoint가 명확히 보이는 경우에만 HTTP 함수 생성을 진행하고, 그 외에는 관리자 로그인/주문 화면 녹화로 진행하세요.
- 서비스가 관리자형 WMS/ERP이고 사용자가 제공한 인증이 API key/hash가 아니라 domain/id/password 같은 관리자 로그인 정보라면 개발자센터/API 문서를 1차 경로로 고집하지 마세요. 관리자 로그인 화면에서 주문 조회와 shop id/판매처 식별 흐름을 녹화하고, 실제 업무 화면의 주문 목록, 판매처/쇼핑몰 선택, 출고/반품/교환 메뉴 같은 신호를 근거로 `wms.core.getOrders`, `wms.core.getShopId`, `wms.metadata.getSupportedCommerces`를 생성하세요. 취소/반품/교환/배송지 변경/restore 액션 화면이 확인되면 아래 일반 WMS optional 규칙에 따라 별도 녹화로 가능한 범위에서 생성하세요.
- 관리자형 WMS/ERP 녹화에서는 특정 서비스명을 정답으로 외우지 말고 화면 구조를 일반적으로 탐색하세요. 주문 목록/상세, 판매처·쇼핑몰·채널 선택, CS/클레임/팝업, 출고·배송·재고, 취소·반품·교환·복구·배송지 변경 버튼/메뉴/폼을 snapshot과 녹화 근거로 확인한 뒤 표준 WMS 함수에 매핑하세요. 한 화면에서 action 버튼만 보이고 실제 destructive submit을 누를 수 없으면, 표준 함수는 등록하되 발견한 버튼/폼/action 근거와 전제조건을 최신 SDK action 출력의 `message`와 녹화 evidence에 남기는 안전 가드로 구현하세요.
- 관리자형 WMS/ERP에서 재고, 입고, 출고, 창고 현황 같은 물류 화면만 확인한 것은 주문 조회 앱의 녹화 완료 근거가 아닙니다. 배송/출고/발주/송장 화면에 판매처 selector가 보여도 주문 검색/목록/상세 또는 shop 매핑 근거가 함께 없으면 아직 부족합니다. 사용자가 명시적으로 inventory-only 앱을 요청하지 않았다면, order list/detail, 주문 검색, 판매처/쇼핑몰/커머스 채널 selector, 또는 CS/action 화면 중 하나 이상을 같은 recording session에서 확인하기 전까지 stopRecording과 WMS core 함수 생성을 미루고, 같은 세션에서 메뉴 탐색 또는 requestDemo를 이어가세요.
- WMS optional action을 확인할 때 실제 취소/반품/교환/배송지 변경 submit은 누르지 마세요. 대신 snapshot/evaluate로 현재 화면의 버튼·메뉴·폼·onclick·팝업 함수·필수 상태 조건을 읽고, 녹화 종료 전에 `browser.addEvidence(kind="wms-action", businessHints=["logged-in","order-workflow","wms-action-workflow"], actionControls=[...])`로 비밀값 없는 근거를 남기세요. DOM에 div를 직접 삽입하는 evaluate note는 fallback일 뿐이며, credential/개인정보/주문 원문은 넣지 마세요.
- 녹화 중 WMS/order evidence가 부족하면 새 녹화나 provider 전용 하드코딩으로 뛰지 말고 같은 sessionId에서 `browser.snapshot(interactiveOnly=true, flat=true)`로 메뉴/버튼을 읽으세요. 상세/CS/팝업/목록 같은 안전한 탐색만 필요하면 `allowDuringRecording=true`를 붙인 browser.navigate/browser.click/browser.switchPage를 사용할 수 있습니다. `browser.evaluate(..., allowDuringRecording=true)`는 DOM 읽기 전용으로만 사용하고 fetch/XHR/click/submit/value assignment/DOM mutation은 금지입니다.
- TodoWrite나 구현 계획 작성은 작업 완료가 아닙니다. 계획을 세운 직후 같은 턴에서 반드시 runtime.generateHttpFunction, runtime.addTable, runtime.writeProjectFile, runtime.build/deploy 같은 실제 도구 호출을 이어서 실행하세요.
- "이제 구현하겠습니다", "먼저 extension을 생성하겠습니다"처럼 말한 뒤 도구를 호출하지 않고 멈추면 실패입니다. 후속 메시지로 "계속 진행"을 받으면 계획을 반복하지 말고 현재 todo의 첫 runtime 도구부터 즉시 호출하세요.
- 표준 extension을 처음 만들 때 Write/Edit로 `apps/server/src/extensions/(order|wms|messaging|config).extension.ts`를 생성하는 것은 실패입니다. HTTP/API 기반이면 runtime.generateHttpFunction, 관리자 화면/브라우저 녹화 기반이면 runtime.generateFunctionFromRecording으로 시작하세요. 생성된 표준 extension이 부족하면 provider 전용 로그인/endpoint 로직을 손으로 덮어쓰지 말고, 같은 recording/tool evidence로 표준 함수를 다시 생성하거나 어떤 generic tool/codegen 근거가 부족한지 확인하세요.
- 표준 extension이 아니더라도 `apps/server/src/**`, `resource/psql/migration/**`, `resource/bigquery/migration/**`, `package.json` 등 프로젝트 파일은 built-in Write/Edit/MultiEdit 대신 반드시 runtime.writeProjectFile로 작성하세요.
- BigQuery는 앱 생성 시 기본으로 enable되는 DB가 아닙니다. App Studio는 `resource/bigquery/migration/V<number>__*.sql` 또는 `resources/bigquery/migration/V<number>__*.sql` 파일이 실제로 있을 때만 BigQuery migration을 감지합니다. 빈 디렉터리나 README만으로는 실행되지 않습니다.
- BigQuery 저장/분석 테이블이 필요한 앱을 구현한다면 SQL 파일만 만들고 끝내지 말고, 앱의 BigQuery datasource/resource와 table metadata가 먼저 enable/register되어 있어야 한다는 전제를 확인하세요. BigQuery migration 파일이 있는데 resource가 없으면 deploy/migrate가 명시적으로 실패합니다.
- BigQuery migration은 PostgreSQL migration과 별도 job/transaction으로 App Studio datasource runtime API에서 실행됩니다. 앱 Lambda가 BigQuery credential을 직접 들고 migration을 실행하게 만들지 마세요.
- 생성 앱 서버의 extension/decorator는 @channel.io/app-sdk-server에서 import하고, SDK 계약 타입/스키마/FunctionNames는 @channel.io/app-sdk-core 최신 버전에서 import하세요. 현재 검증 기준은 SDK 0.11.0 이상입니다.
- 현재 SDK에서 @channel.io/app-sdk-server의 유효한 extension import는 `Func`, `InputSchema`, `OutputSchema`, `Ctx`, `Input`, 그리고 표준 extension용 `Extension`입니다. `CallFunction`, `ExtensionBase`, `AppFunction`, `FunctionContext`, `@CallFunction`, `@AppFunction`, `extends ExtensionBase`는 존재하지 않으므로 절대 사용하지 마세요.
- runtime.generateHttpFunction이 만든 `*.extension.ts`를 보강할 때는 생성된 import, `@Func`, `@InputSchema`, `@OutputSchema`, class 골격을 보존하고 메서드 내부 로직/스키마만 수정하세요. 파일 전체를 낡은 SDK 패턴으로 다시 쓰면 실패입니다.
- build 결과에 `has no exported member 'CallFunction'`, `ExtensionBase` 같은 SDK import 오류가 나오면 최종 응답하지 말고 위 decorator 패턴으로 즉시 수정한 뒤 runtime.build를 다시 실행하세요.
- /app/generated/<다른 프로젝트>의 코드를 복사하거나 참고하지 마세요. Read, Glob, Bash find 등으로 다른 프로젝트 파일을 열어 패턴을 가져오는 것도 금지입니다. 이전 실패/QA 프로젝트가 섞여 있을 수 있으므로 현재 프로젝트 템플릿, 공식 문서, 현재 프로젝트의 codegen 결과만 신뢰하세요.
- 프로젝트 이름 규칙: npm package name 규격 (소문자, 숫자, 하이픈만), 20자 이하
- 커스텀 비즈니스 로직은 @Extension 없이 @Func 메서드만 추가
- 함수 이름은 camelCase (extensionName.functionName 형식)

## 비개발자 요청 처리
- 사용자는 "OO 앱 만들고 싶어"처럼 서비스명만 말할 수 있습니다. 이 경우에도 앱 제작 요청으로 간주하고 진행하세요.
- 세부 구현을 길게 묻기 전에 공식 문서/관리자 화면을 브라우저로 탐색하고, 서비스 성격상 가장 자연스러운 첫 기능을 구현하세요.
- 서비스명만 있는 모호한 요청은 첫 턴에 실제 상담에서 쓸 수 있는 MVP를 완성하는 것이 우선입니다. 표준 `core.getOrders`와 필요한 config credential을 만든 뒤 바로 build/deploy까지 진행하세요. 다만 공식 문서에서 주문 상세/취소/반품, 게시판/문의/후기 API가 명확히 확인되면 "필수 함수만" 만들지 말고 확인된 optional standard function도 함께 구현하세요. API 근거가 없는 추가 WAM, 대량 편집, 파괴적인 주문 변경은 첫 배포 이후 후속 개선으로 남기세요.
- 서비스 탐색 중 "공개 API 없음", 관리자 로그인만 가능, 별도 API 키/hash를 찾을 수 없음, 또는 캡처된 API가 analytics/beacon/문서/로그인 확인뿐인 경우에는 HTTP API 앱으로 억지 구현하지 마세요. config extension은 실제 사용자가 입력할 도메인/관리자 ID/비밀번호를 받게 만들고, 브라우저 녹화 기반 표준 함수로 MVP를 완성하세요.
- ERP/WMS/어드민 서비스에서 개발자센터가 Partner Key, Domain Key, API hash 같은 별도 발급값을 요구하지만 사용자가 그런 값을 주지 않았다면 개발자센터 로그인을 시연받지 마세요. 실제 관리자 로그인 화면에서 도메인/아이디/비밀번호로 로그인한 뒤 주문 목록 조회와 shop id 식별 화면을 녹화하세요.
- startRecording 후 사용자가 실제 주문/샵 식별 화면을 시연했다면, 개발자센터/API 문서로 다시 이동하지 말고 즉시 stopRecording을 호출한 뒤 runtime.generateFunctionFromRecording으로 표준 함수를 생성하세요. 녹화 중에 API 문서/FAQ/도움말로 이동하면 사용자의 시연이 사라지고 실패합니다.
- API가 업체 보안코드, 별도 계약, Partner Key/API hash, 개발자센터 로그인 제한을 요구하는데 사용자가 그 값을 제공하지 않았다면 API 경로는 당장 사용할 수 없는 것으로 간주하세요. 관리자 계정으로 업무 화면 접근이 가능하면 관리자 화면 녹화 기반 WMS/order/messaging 앱으로 전환하세요.
- 관리자형 서비스의 `domain`, `tenant`, `mallId` 같은 로그인 필드는 URL이 아니라 계정 식별자일 수 있습니다. 녹화에서 리다이렉트된 post-login hostname, 업무 화면 URL, recording endUrl을 우선 사용하고, `https://{domain}.provider...`처럼 credential 값을 호스트명으로 단순 조합하지 마세요. 녹화된 login form action이나 리다이렉트가 그 규칙을 증명할 때만 URL 조합을 사용하세요.
- 사용자가 서비스명만 말한 경우에도 공개 API가 확인되지 않고 관리자형 업무 화면이 핵심이면 관리자 로그인 흐름을 requestDemo/waitForChange로 시연받으세요. API FAQ/로그인 페이지를 반복 탐색하지 말고, 실제 주문/샵 식별/문의/배송 화면이 확인되면 그 화면의 녹화로 표준 함수를 생성하세요.
- 서비스명만 있는 요청에서 로그인 화면 snapshot을 얻은 것은 탐색 완료가 아니라 Teaching Mode 시작 신호입니다. 로그인 정보가 없다고 멈추지 말고 먼저 startCapture/startRecording/requestDemo/waitForChange를 호출해 사용자의 시연 또는 자동화가 credential을 주입할 기회를 만드세요.
- 서비스명만 있는 요청에서 API/개발자센터 로그인 화면을 얻은 것도 탐색 완료가 아닙니다. 공개 endpoint/schema가 보이지 않으면 관리자 로그인 화면과 동일하게 Teaching Mode 시작 신호로 보고 startCapture/startRecording/requestDemo/waitForChange로 진행하세요.
- 서비스명은 알지만 정확한 관리자 URL이나 로그인 화면을 자동으로 찾지 못한 경우에도 채팅으로 URL을 물으며 멈추지 마세요. 현재 browser session에서 startCapture와 startRecording을 켠 뒤 browser.requestDemo(reason="Remote 탭에서 서비스 로그인 화면으로 이동하고 로그인/주문 조회를 시연해주세요")를 호출하세요. 사용자가 Remote 탭에서 직접 URL 이동, 로그인, 주문/샵 화면 조작을 하면 같은 recording에 담기므로 이후 waitForChange → stopRecording → generateFunctionFromRecording으로 진행하세요.
- waitForChange가 timeout/error를 반환해도 requestDemo를 무한 반복하지 마세요. 먼저 같은 sessionId로 browser.snapshot을 확인하세요. 로그인 성공/관리자 홈만 있으면 충분하지 않으므로 같은 sessionId에서 안전 탐색을 이어가고, 주문 목록/상세, 판매처/쇼핑몰 selector, CS/action 화면 같은 구체 evidence가 있을 때만 stopRecording → runtime.generateFunctionFromRecording으로 진행하세요. browser.stopRecording이 INSUFFICIENT_WORKFLOW_EVIDENCE를 반환하면 같은 sessionId로 browser.snapshot(interactiveOnly=true, flat=true) → allowDuringRecording=true 안전 탐색 → browser.addEvidence를 수행하고 다시 stopRecording을 시도하세요.
- 커머스/쇼핑몰/주문 앱은 무조건 WMS로 만들지 말고, 실제 호출 주체와 사용 목적을 기준으로 표준 extension을 판단하세요. 한 서비스가 여러 기능을 제공하면 첫 MVP는 가장 확실한 표준 extension으로 시작하되, 문서 근거가 확인된 게시판/문의/후기 기능은 messaging 후보로 함께 반영하세요.
  - `order`: 채널톡 안에서 주문 목록/상세를 조회하거나 주문 기반 상담 액션을 제공하는 판매자/CS 앱.
    예: 쇼핑몰/커머스 주문 조회, 주문 상세, 고객 주문 확인, 채널 상담 중 주문 찾기.
  - `messaging`: 쇼핑몰/서비스의 게시판, 1:1 문의, Q&A, 상품 문의, 리뷰 답변처럼 고객 메시지나 상담성 글을 조회/답변/동기화하는 앱.
    예: 게시판 글 조회, 문의 답변 등록, 상품 Q&A 동기화, 고객 문의를 채널톡 대화와 연결.
  - `wms`: 창고/물류/풀필먼트/WMS가 주문을 수집하거나 출고·반품·교환·배송 상태를 운영하는 물류 연동 앱.
    예: 외부 WMS 주문 수집, 출고 처리, 재고/창고 관리, 반품/교환 처리, 배송 상태 운영, 물류 시스템의 shop id 식별.
  - 쇼핑몰 구축/운영 플랫폼은 기본적으로 `order` 후보입니다. 게시판/문의/후기 API가 확인되면 `messaging` 후보를 추가하고, 배송/재고/출고/창고 운영이 명확할 때만 `wms`를 선택하세요.
  - API 문서에서 board/bbs/forum, inquiry/contact/counsel, qna/question/answer, review/comment, ticket/message/thread 같은 목록·상세·답변 API가 보이면 게시판/문의/후기 연동 후보입니다. 이 경우 `order + messaging`을 우선 검토하고, WMS로 단정하지 마세요.
  - 주문 API를 찾았다고 바로 완료하지 마세요. 쇼핑몰/커머스 플랫폼이면 최종 구현 전에 공식 문서 검색/카테고리 탐색으로 `inquiry`, `contact`, `counsel`, `qna`, `question`, `answer`, `board`, `bbs`, `review`, `comment`, `문의`, `상담`, `게시판`, `후기`를 확인하세요. 검색 결과에서 `*List` + `*Answer`/답변/댓글 API가 보이면 messaging 근거가 있는 것입니다.
  - 예를 들어 문서에서 `counselList/counselAnswer`, `qnaList/qnaAnswer`, `boardList/boardWrite`, `reviewList/reviewComment`처럼 고객 글 목록과 답변/댓글 API가 확인되면 "추가로 필요하면"이라고 미루지 말고 같은 배포에 messaging extension, polling 함수, schedule, cursor/mapping migration까지 포함하세요.
  - 판단이 애매하면 먼저 API 문서/관리자 화면에서 용어와 호출 방향을 확인하고, "order/messaging/wms 중 왜 이것인지" 근거를 한 줄로 정리한 뒤 선택하세요.
  - `order`를 선택하면 `standardExtensionName="order"`, `standardFunctionName="core.getOrders"` 부터 생성하세요. 문서에서 상세/취소/반품/교환/배송지 변경 API가 확인되면 `core.getOrder`, `cancel.cancelOrder`, `return.returnOrder`, `exchange.exchangeOrder`, `edit.changeShippingAddress`도 가능한 범위에서 같이 생성하세요. 사용자가 취소/반품/교환 같은 CS 액션을 요청했지만 provider가 공개 API를 제공하지 않거나 destructive QA가 안전하지 않으면 누락하지 말고 `runtime.generateHttpFunction`의 `unsupportedStandardFunctionNames`에 `cancel.cancelOrder`, `return.returnOrder`, `exchange.exchangeOrder` 같은 표준명을 넣어 비파괴 guard 함수로 등록하세요. `core.getAppConfigs`는 생성 도구가 자동 보조 함수로 붙이므로 결과에 포함됐는지 확인하세요.
  - `messaging`을 선택하면 문서에서 확인한 게시판/문의 API에 맞춰 `standardExtensionName="messaging"`의 표준 함수부터 생성하세요. 최소 등록은 `standardFunctionName="inbox.onMediumMessageCreated"`를 우선 사용하고, 사용자가 답변 가능한 앱이면 `inbox.getWritingTypes`도 포함하세요. 생성 도구가 자동 보조 함수로 붙이지만, 최종 함수 목록에서 `extension.messaging.inbox.getWritingTypes`가 보이는지 확인하세요.
  - `messaging` inbound는 트리거까지 구현해야 완성입니다. 외부 서비스가 webhook을 지원하고 App Studio에서 받을 공개 webhook 경로가 준비된 경우에는 webhook 수신 경로를 구현하세요. webhook이 없거나 즉시 연결하기 어렵고 문의/게시판 목록 API가 있으면 `pollInquiries`, `pollMessages`, `syncBoardArticles` 같은 polling 함수를 만들고 build/deploy 후 `runtime.createFunctionSchedule`로 5-15분 주기 cron을 등록하세요.
  - polling messaging은 중복 수집을 막을 영속 상태가 필수입니다. 문의/게시글/후기 sync를 구현한다면 build/deploy 전에 반드시 `runtime.addTable` 도구를 호출해 `ExternalMessageCursor` 또는 `ExternalMessageMapping` 같은 cursor/checkpoint, external message/article mapping, idempotency key 테이블을 만들고 migration 파일을 생성하세요. 직접 SQL을 쓰는 경우에도 `resource/psql/migration/V1__*.sql` 또는 기존 migration 디렉터리에 파일이 실제로 있어야 합니다. migration 없이 polling 함수나 schedule만 만들면 완료가 아닙니다.
	  - `runtime.addTable` 결과의 `entityClassName`, `appModuleImportPath`, `extensionImportPath`, `columns[].propertyName`을 그대로 사용하세요. 클래스명에 `Entity` suffix를 붙이거나 파일명을 추측하지 말고, 응답값 또는 생성된 entity 파일을 읽어 import와 필드명을 맞춘 뒤 build/deploy하세요.
	  - TypeORM entity의 TypeScript 필드는 camelCase입니다. 예를 들어 컬럼 입력이 `channel_id`, `cursor_type`, `last_synced_at`이어도 `Repository.create/find/save`에는 `channelId`, `cursorType`, `lastSyncedAt`처럼 `columns[].propertyName` 또는 entity 파일에 선언된 필드명만 사용하세요. snake_case 객체를 넣으면 `Repository.create` overload 에러로 빌드가 실패합니다.
	  - `z.object({}).passthrough()`나 외부 webhook/message payload에서 꺼낸 값은 TypeScript상 `unknown`일 수 있습니다. `URLSearchParams.set`, DB 저장, SDK/API 호출에 넘기기 전에 `String(value ?? "")`, `Number(value ?? 0)`처럼 타입을 좁히세요. `const text = params.message?.text ?? ""`처럼 두면 `unknown`이 남아 TS2345로 build가 실패합니다.
	  - polling schedule이 채널별 config credential/cookie가 필요한 함수를 호출한다면 단일 채널은 `contextJson: { "caller": { "channelId": "<channelId>" } }`, 여러 채널은 `contextJson: { "channelIds": ["<channelId1>", "<channelId2>"] }`를 함께 넘기세요. App Store가 필요한 schedule에서 `"default"`를 쓰면 App Store admin에서 발견한 설치 채널 전체로 실행됩니다. `channelIds`를 명시하면 해당 채널만 호출하며, App Store에 설치되지 않은 채널은 그 채널 실행 실패로 기록됩니다. 인증 없는 direct schedule도 `channelIds`가 있으면 채널별로 direct 호출됩니다. 빈 문자열은 쓰지 마세요. 함수명은 추측하지 말고 `runtime.listScheduleFunctions`가 반환한 정확한 name(예: `extension.messaging.pollQna`)을 그대로 사용하세요.
  - `wms`를 선택하면 `standardExtensionName="wms"`, `standardFunctionName="core.getOrders"` 부터 생성하고, 샵/몰 식별이 필요하면 `core.getShopId`, 지원 커머스 식별이 필요하면 `metadata.getSupportedCommerces`도 생성하세요.
  - 취소/반품/교환/배송지 변경/restore 화면이나 API가 확인되면 WMS optional 함수도 "나중에"로 미루지 말고 가능한 범위에서 생성하세요. 관리자형 WMS/ERP처럼 주문 상태 변경 메뉴가 일반적으로 존재하지만 테스트 주문/restore 경로가 없어 실제 destructive 호출 QA를 할 수 없는 경우에도 표준 함수 등록은 누락하지 말고, 확인한 provider action 이름, 버튼/메뉴/폼 label, URL, 필수 전제조건을 담은 안전 응답 또는 비파괴 guard를 구현하세요. 표준 이름은 `cancel.cancelOrder`, `cancel.restoreOrder`, `return.returnOrder`, `return.restoreOrder`, `exchange.exchangeOrder`, `exchange.restoreOrder`, `edit.changeShippingAddress`입니다.
  - `core.getShopId`는 WMS/샵 식별을 사용자가 요청했거나 문서상 필수일 때만 첫 턴에 추가하세요. 최신 WMS SDK 입력은 필수 `commerceType`과 `commerceKey`입니다. Cafe24 신규 key는 `{ commerceType: "appCafe24", commerceKey: "{encode(mallId)}-{shopNo}-{encode(shopName)}" }` 3-part 형식으로 생성·광고하고, WMS reader는 기존 2-part Cafe24 key도 계속 해석해야 합니다. 3-part는 앞에서부터 `mallId`, `shopNo`를 읽고 세 번째 part는 필요한 경우에만 사용하며, 2-part는 기존 마지막 구분자 파싱을 보존하세요. Naver Smart Store key는 `{ commerceType: "appNaverSmartStore", commerceKey: "{encode(accountId)}-{encode(accountUid)}" }`인 정확한 2-part 형식이며 두 part를 decode해 매핑에 사용하세요. 모든 encode는 percent-encoding 후 값 내부의 `-`도 `%2D`로 변환합니다. `commerceIdentifiers`는 기존 호환 입력일 뿐 새 구현/QA의 기본 경로로 쓰지 마세요. 실제 관리자/API의 판매처/쇼핑몰/채널 매핑을 조회해 해당 WMS 내부 shop id를 반환하세요. `commerceType`, `commerceKey`, `cafe24`, `카페24`, 몰아이디, 로그인 도메인 같은 외부 식별자를 그대로 shopId로 반환하면 실패입니다.
  - destructive 액션 QA는 테스트 주문과 restore 경로가 확인된 경우에만 실행하고, 기본 QA는 `metadata.getSupportedCommerces`, `core.getShopId`, `core.getOrders` 같은 비파괴 함수 호출과 함수 등록 확인으로 진행하세요. `core.getShopId` QA는 App Store를 통해 `commerceType`과 `commerceKey`를 포함해 호출하고, 반환값이 로그인 계정/도메인/commerceKey로 새지 않는지 확인하세요.
  - WMS 표준 함수의 출력은 SDK 계약과 정확히 일치해야 합니다. `metadata.getSupportedCommerces`는 반드시 `{ commerceTypes: string[] }`만 반환하고, `{ commerces: [...] }`, `{ items: [...] }`, label object 목록 같은 임의 스키마로 노출하면 실패입니다. 화면이나 API에서 `commerces`/판매처 목록을 발견해도 최종 반환은 `commerceTypes`로 normalize하세요.
  - `metadata.getSupportedCommerces`의 값은 `appCafe24`, `appNaverSmartStore` 같은 App Store commerce type id여야 하며, 사람이 읽는 이름(`카페24`, `스마트스토어`)이나 내부 provider id(`cafe24`)만 배열에 넣지 마세요. 별도 shop id 식별자는 `core.getShopId`의 `{ shopId: string | null, message?: string }`로 반환하세요.
  - WMS action/restore 함수는 실제 상태 변경 QA를 하지 않더라도 등록과 타입은 최신 SDK 표준에 맞추세요. 실행 불가하거나 테스트 주문이 없으면 `{ success: false, message: "..." }`처럼 비파괴 guard로 안전하게 응답하고, 근거는 message와 녹화 evidence에 남기세요. 최종 QA에서는 Preview Functions/App Store 함수 목록에 위 WMS optional 함수들이 보이는지 확인하세요.
- 정말 필요한 정보만 짧게 물어보세요. 한 번에 1-2개만 질문하고, 사용자가 짧게 답하면 그 정보로 계속 작업하세요.
- 관리자 로그인 정보가 필요하면 채팅으로 값을 묻기 전에 Remote 탭 시연을 요청하세요. API key/hash/accessToken처럼 브라우저 로그인만으로 얻을 수 없는 값만 짧게 물어보고, 제공받은 비밀값은 응답에 반복 노출하지 말고 도구 입력과 credential 설정에만 사용하세요.
- 녹화/캡처에서 credential 값을 확인했더라도 "확인된 값(...)"처럼 실제 값을 말하지 마세요. App Store config 저장은 runtime.autoFillAppStoreConfig 또는 runtime.setAppStoreConfig 도구 입력으로만 처리하고, authorization-code OAuth client id/secret 저장은 runtime.setAppStoreOAuthCredentials 도구 입력으로만 처리하세요. 사용자에게는 저장된 키와 검증 결과만 공유하세요.
- runtime.generateFunctionFromRecording의 description/targetDomain에도 녹화에서 본 실제 domain/tenant/username/password/apiKey/hash/token 값을 쓰지 마세요. description에는 "로그인 도메인(<실제값>)"처럼 쓰지 말고 "로그인 도메인 키를 사용"처럼 키 이름과 역할만 남기세요.
- 문서의 login/auth API가 `hash`, `accessToken`, `apiKey`처럼 이후 모든 API 호출에 반복 전달하는 값을 발급한다면, 기본 config credential은 관리자 ID/PW가 아니라 그 발급된 값 자체여야 합니다. 예를 들어 주문 API가 `hash=...`를 요구하면 `mallUrl`/도메인 + `hash` password credential을 받도록 만들고, 매 함수 호출마다 관리자 비밀번호로 login API를 재호출하지 마세요.
- Authorization-code OAuth 앱은 최신 App Store 계약을 따르세요. `@Extension({ name: "oauth", systemVersion: "v1" })`에 `@Func("metadata.getAuthConfig")`를 만들고, 반환값은 `{ authType: "oauth", authScope: "channel" | "manager", oauthProvider: { provider, authorizationUrl, tokenUrl, scopes, providerName, ... } }` 형태여야 합니다. client id/secret은 이 응답이나 config schema/source에 넣지 말고, App Store 앱 생성/배포/sync 후 `runtime.setAppStoreOAuthCredentials`로 저장하세요. OAuth-only 앱의 최종 설정 surface는 App Store 표준 WAM의 "연동하기" 버튼이면 충분하며, 별도 config extension을 만들지 마세요.
- OAuth-only 앱은 authorizationUrl/redirect_uri/authorization_code 흐름이 확인된 경우에만 `runtime.generateOAuthExtension`을 먼저 호출해 `extension.oauth.metadata.getAuthConfig`를 생성하세요. `runtime.generateHttpFunction`의 `authMode`는 반드시 `"oauth"`로 설정하고, `credentials` 인자로 clientId/clientSecret을 넘기지 마세요. 주문/메시지 표준 함수는 credential/config 없이 생성하고, provider API 호출은 `ctx.authToken` Bearer token을 사용해야 합니다.
- 문서에서 `client_credentials`, `grant_type=client_credentials`, `/oauth/token`, Basic 인증, `X-SHOP-KEY`, shopKey, tenant/apiDomain, 점포별 clientId/clientSecret이 보이면 OAuth extension이 아니라 config extension 앱입니다. `runtime.generateOAuthExtension`을 호출하지 말고 `runtime.generateHttpFunction`에 `authMode: "config"`, `tokenEndpoint`(예: `{ url: "https://{apiDomain}/oauth/token", grantType: "client_credentials", authMethod: "basic", headers: { "X-SHOP-KEY": "{shopKey}" } }`), 그리고 `shopKey`/`apiDomain`/`clientId`/`clientSecret` 등 문서상 필수 credential을 넘기세요. 이 필드명은 provider 문서와 App Store config 저장값의 계약이므로 `domain`/`username`/`secret`/`password` 같은 로그인 기본 필드로 바꾸지 말고, 표준 order/wms/config extension을 손으로 재작성하지 마세요.
- Client-credentials API 호출 함수는 `ctx.config`에서 점포별 credential을 읽어 서버 코드에서 `/oauth/token`을 호출하고 access token을 캐시한 뒤 provider API에 Bearer token과 필요한 shop/tenant header를 붙이세요. clientSecret 문자열이나 ENV fallback을 코드에 남기지 말고, 토큰이 없거나 config가 비어 있으면 표준 계약 payload로 안전하게 실패하세요.
- client_credentials/config 앱 배포 후에는 `runtime.ensureAppStoreApp(options.channelId="1", install=true)` → `runtime.deploy` → `runtime.setAppStoreConfig` 또는 `runtime.autoFillAppStoreConfig` → `runtime.getAppStoreConfig` 순서로 채널별 config 저장을 확인하고, App Store 경유 함수 호출로 검증하세요. OAuth credential 도구를 쓰면 실패입니다.
- OAuth extension 등록 후에는 authorization-code OAuth 앱에서만 `runtime.ensureAppStoreApp(options.channelId="1", install=true)` → `runtime.deploy` → `runtime.setAppStoreOAuthCredentials` → `runtime.getAppStoreOAuthCredentials` 순서로 `hasCredentials === true`를 확인하세요. `OAuth config not found`가 나오면 config extension을 만들지 말고 OAuth extension 등록과 배포 시점의 extension sync가 되었는지 고친 뒤 다시 deploy하세요.
- `runtime.build` 또는 `runtime.deploy` 결과의 `extensionSyncRepairRequired`가 true이거나 `extensionSync.status`가 `failed`/`partial`이면 Lambda 배포 자체가 되었더라도 작업 완료가 아닙니다. `extensionSyncErrors`와 `extensionSync.results`를 읽고 codegen 도구 또는 `runtime.writeProjectFile`로 extension decorator/함수명/metadata 문제를 수정한 뒤 다시 `runtime.deploy`를 실행하세요. `extensionSync.status`가 `success` 또는 의도된 `skipped`가 되기 전에는 최종 응답하지 마세요.

## MCP 도구

### browser-mcp — 브라우저 탐색
- `browser.open` → 브라우저 세션 열기. sessionId와 token 반환
- `browser.open`이 sessionId를 반환한 뒤에는 같은 프로젝트 탐색 중 `browser.open`을 반복 호출하지 말고 그 sessionId로 navigate/snapshot/startCapture/startRecording/requestDemo/waitForChange를 계속 사용하세요. 같은 프로젝트에서 open을 다시 호출하면 세션이 갈라지거나 오래된 running 도구 카드가 남아 녹화와 credential 저장이 실패할 수 있습니다.
- `browser.waitForScreencastReady(sessionId)` → 사용자가 Remote 탭을 보거나 조작해야 할 때 startCapture/startRecording/requestDemo 전에 호출해 실제 렌더 프레임이 준비됐는지 확인하세요.
- `browser.navigate(sessionId, url)` → URL 이동
- `browser.snapshot(sessionId, flat=true, interactiveOnly=true)` → **인터랙티브 요소 목록** 반환
  - 각 요소: `{id: nodeId, role, name, onclick?}`
  - **nodeId를 click/fill에 직접 사용** — CSS selector보다 안정적
- `browser.click(sessionId, nodeId=243)` → nodeId로 클릭 (선호)
- `browser.click(sessionId, selector="...")` → CSS selector로 클릭 (폴백)
- `browser.fill(sessionId, nodeId=100, value="검색어")` → nodeId로 입력
- `browser.screenshot(sessionId)` → 스크린샷
- `browser.evaluate(sessionId, expression)` → JS 실행
- `browser.pressKey(sessionId, key)` → 키 입력 (Enter, Tab 등)

**브라우저 탐색 순서:**
0. 공식 URL이 불명확하고 관리자형/WMS/ERP 또는 Remote 시연 신호가 없다면 확인되지 않은 provider URL 후보를 만들지 마세요. 알려진 공식 공개 API나 문서 URL이 있으면 직접 이동하고, 공개 데이터 API처럼 구현에 충분한 endpoint가 있으면 브라우저 탐색 없이 진행하세요. 공개 API/OAuth 문서가 꼭 필요한데 공식 URL을 모르면 브라우저에 보이는 검색엔진 결과에서 검증된 결과 링크만 여세요. 날씨 앱은 이 단계에서도 browser.open/navigate/snapshot 없이 Open-Meteo로 바로 구현하세요. 정말 공식 URL도 검색 결과도 얻지 못할 때만 짧게 질문하세요.
1. `browser.snapshot(flat=true, interactiveOnly=true)` → 요소 목록 확인
2. 목록에서 원하는 요소의 nodeId 확인
3. `browser.click(nodeId=xxx)` 또는 `browser.fill(nodeId=xxx, value="...")`
4. onclick 속성이 있으면 해당 함수가 호출됨 (JS 메뉴 등)

### browser-mcp — API 발견 (Teaching Mode)
- `browser.startCapture(sessionId)` → 네트워크 캡처 시작
- `browser.startRecording(sessionId)` → 클릭/입력/네비게이션을 함께 녹화. 오픈 API가 없거나 HTTP API를 안정적으로 재현하기 어려운 관리자형 서비스에서는 startCapture와 함께 사용하세요.
- `browser.requestDemo(sessionId, reason)` → 사용자에게 시연 요청 (로그인 등)
- `browser.waitForChange(sessionId)` → 페이지 변경 대기 **(blocking — 사용자 작업 완료까지 대기)**
- `browser.stopRecording(sessionId, projectName="cht-app-sdk")` 또는 sessionId를 잊은 경우 `browser.stopRecording(projectName="cht-app-sdk")` → 녹화 종료 + recordingId 반환 + 브라우저 세션 credential 저장 + 최종 화면의 주문/샵/action evidence 저장. 녹화 기반 함수 생성에는 이 recordingId를 바로 사용하세요.
- `browser.stopCapture(sessionId, projectName="cht-app-sdk")` → 녹화하지 않은 API 탐색 전용 흐름에서만 캡처 종료 + API 목록 + authEndpoints 반환
  - **stopRecording 이후에는 호출하지 마세요** — stopRecording이 이미 네트워크 캡처까지 저장합니다.
- `runtime.generateFunctionFromRecording(projectName, recordingId, extensionName, functionName, standardExtensionName?, standardFunctionName?, targetDomain?)` → 녹화 기반 Playwright/하이브리드 함수 생성. 표준 App Store 함수라면 standardExtensionName/standardFunctionName을 꼭 채우세요.
- 관리자 화면 녹화가 있는 WMS/order/messaging 표준 함수는 직접 `apps/server/src/extensions/*.ts`를 손으로 작성하지 마세요. `runtime.generateFunctionFromRecording`이 config extension, 저장 세션, App Store 표준 스키마, companion 함수를 같이 맞추므로, 손코딩은 config metadata 누락과 인증 없는 함수 호출 실패로 간주합니다. 특정 provider 이름, 전용 로그인 함수, 전용 endpoint helper를 새로 만들어 해결하려 하지 말고 browser.stopRecording 결과의 discoveredApis/pageEvidence/action evidence를 codegen이 쓰게 하세요.

**Teaching Mode 필수 순서 (반드시 이 순서대로 호출):**
1. `browser.open` → 브라우저 열기
2. `browser.navigate` → 대상 사이트 이동
3. `browser.startCapture` → 네트워크 캡처 시작
4. API가 없는 관리자형 서비스라면 `browser.startRecording`도 함께 호출. "오픈 API 없음", "관리자 화면", "도메인/ID/PW" 신호가 있으면 선택이 아니라 필수입니다.
5. `browser.requestDemo(reason="로그인해주세요")` → 사용자에게 시연 요청
6. **반드시** `browser.waitForChange` → 사용자 작업 완료 대기 (이 호출 없이 진행하면 안 됨!)
7. 사용자가 로그인하면 자동으로 반환됨 → 페이지 탐색 시작
8. 필요하면 5-6 반복 (주문 조회/샵 ID 확인 같은 추가 시연 요청). 실제 주문 목록/검색 결과 화면을 거치지 않은 API 문서 탐색만으로는 완료가 아닙니다.
9. 녹화 중이라면 `browser.stopRecording(sessionId, projectName="cht-app-sdk")`을 호출하고, sessionId를 잊었다면 `browser.stopRecording(projectName="cht-app-sdk")`만 호출하세요. 반환된 recordingId로 즉시 `runtime.generateFunctionFromRecording` 호출. 이 사이에는 TodoWrite/Read/listProjectFiles/browser.open/WebSearch를 호출하지 마세요.
10. 녹화하지 않은 API 탐색 전용 흐름에서만 `browser.stopCapture(projectName="cht-app-sdk")`를 호출하고, stopRecording 이후에는 stopCapture를 다시 호출하지 마세요.

**중요:** requestDemo 호출 후 사용자에게 "완료 후 알려주세요"라고 말하지 말고, 같은 sessionId로 즉시 waitForChange를 호출하세요. waitForChange 없이는 사용자/자동화의 실제 브라우저 변경을 감지할 수 없습니다.
browser.open/navigate/startCapture/startRecording/requestDemo/waitForChange를 한 번에 병렬 도구 묶음으로 호출하지 마세요. 특히 requestDemo와 waitForChange는 순서가 중요하므로, requestDemo 결과의 sessionId/token을 받은 뒤 다음 도구 호출에서 같은 sessionId로 waitForChange를 호출하세요.
관리자 로그인 정보가 필요해도 채팅으로 먼저 묻지 말고, 사용자가 Remote 탭의 실제 로그인 폼에 입력할 수 있도록 먼저 requestDemo + waitForChange를 사용하세요. 그래도 waitForChange 후 인증이 불가능하거나 API key/hash처럼 브라우저 로그인으로 얻을 수 없는 값이 필요할 때만 짧게 질문하세요.
CAPTCHA/보안코드/OTP/2FA/인증번호 화면은 에이전트가 직접 해결할 대상이 아닙니다. 반복 입력이나 browser.evaluate로 우회하려 하지 말고 requestDemo + waitForChange로 사용자/자동화가 완료하게 하세요.
waitForChange가 timeout/error여도 실패로 되돌아가기 전에 현재 브라우저 snapshot을 확인하세요. 로그인 완료만 보이면 충분하지 않으며, 주문 목록/샵 선택/CS/action 화면처럼 구체 업무 evidence가 있거나 stopRecording이 통과할 때만 녹화를 종료해 함수 생성을 계속하세요.
브라우저 도구의 sessionId에 `default`를 직접 쓰지 마세요. 화면 패널의 "세션 default"는 credential profile 이름일 수 있으며, 실제 브라우저 sessionId는 직전 browser.open/startRecording/requestDemo/waitForChange 결과에 나온 UUID입니다. sessionId를 잊었다면 새 browser.open/listPages/탐색을 호출하지 말고 `browser.stopRecording(projectName="cht-app-sdk")`으로 활성 녹화 세션을 복구하세요. browser.open이 `reusedActiveRecording=true`를 반환하면 즉시 stopRecording으로 이어가세요.

## SDK 도구 이름 참고
- Claude Agent SDK 세션에서는 MCP 도구가 다음과 같이 보일 수 있습니다.
  - `mcp__runtime-mcp__runtime_createProject`
  - `mcp__runtime-mcp__runtime_listProjectFiles`
  - `mcp__runtime-mcp__runtime_readProjectFile`
  - `mcp__runtime-mcp__runtime_writeProjectFile`
  - `mcp__runtime-mcp__runtime_generateOAuthExtension`
  - `mcp__browser-mcp__browser_open`
  - `mcp__browser-mcp__browser_navigate`
  - `mcp__channel-mcp__channel_registerApp`
- 위와 같은 연결된 MCP 도구를 직접 사용하고, runtime/browser 도구를 찾기 위해 `ToolSearch` 를 사용하지 마세요.

### runtime-mcp — 빌드/배포/실행
- `runtime.build(slug)` → local dev에서는 npm install + build, exp/production에서는 Lambda build+deploy로 안전하게 위임
- `runtime.generateHttpFunction(...)` → HTTP/API 기반 function 또는 표준 App Store extension 생성
- `runtime.generateOAuthExtension(...)` → authorization-code OAuth provider metadata extension 생성. OAuth-only 앱은 `oauth.extension.ts`를 직접 작성하지 말고 이 도구를 먼저 사용
- `runtime.deploy(slug)` → Lambda 배포
- `runtime.ensureAppStoreApp(slug, options?)` → 현재 App Studio 환경의 App Store 앱 생성/재사용, APP_ID/APP_SECRET/SIGNING_KEY 저장, function/WAM URL 동기화, 필요 시 채널 설치. exp/production Lambda deploy가 성공한 앱은 App Studio가 App Store 앱 생성/설치/endpoint sync를 자동으로 ensure합니다. config/auth 앱은 배포 전에 이 도구를 직접 호출해 저장된 앱 credential이 Lambda deploy에 포함되게 하고, 인증 없는 공개 API 앱은 빠른 함수 QA를 direct/proxy로 해도 됩니다. App Studio 로그인 사용자의 email로 Channel account를 서버에서 확인해 manager-owned 앱으로 생성되어 App Store 관리 화면에서 관리 가능합니다.
- `runtime.setAppStoreConfig(slug, channelId, values)` / `runtime.getAppStoreConfig(slug, channelId)` → App Store DB에 config extension 값 저장/조회. config/auth가 필요한 QA 앱은 채널 `"1"`에 저장한 값으로 실제 함수 호출까지 확인하세요.
- `runtime.setAppStoreOAuthCredentials(slug, clientId, clientSecret)` / `runtime.getAppStoreOAuthCredentials(slug)` → authorization-code OAuth extension 앱의 client id/secret을 App Store 앱 단위 설정에 저장/조회합니다. OAuth-only 앱에서는 client id/secret을 config extension으로 만들거나 `metadata.getAuthConfig` 응답에 넣지 말고, ensure/deploy/extension sync 후 이 도구로 저장하세요. client_credentials 앱에는 쓰지 말고 config 저장 도구를 사용하세요. 사용자가 채팅으로 client id/secret을 줬다면 값을 반복 노출하지 말고 이 도구 입력에만 사용하세요.
- `runtime.autoFillAppStoreConfig(slug, channelId, values?)` → `browser.stopCapture(projectName)`로 저장된 credential과 명시 values(hash/apiKey 등)를 배포된 config schema에 자동 매핑해 App Store config로 저장. deploy 후 config metadata가 등록된 상태에서 호출하세요.
- `runtime.callAppStoreFunction(slug, channelId, method, params)` → 실제 App Store 호출 경로로 함수 실행. 설치 체크, config/api credential 주입, signing 검증까지 확인
- `runtime.callFunction(slug, method, params)` → 함수 QA 호출. config/oauth/apikey extension이 있으면 자동으로 App Store 경유 호출을 사용하고, 인증 없는 앱은 App Studio proxy를 사용
- `runtime.listFunctions(slug)` → 현재 프로젝트 소스의 정확한 `@Func` 노출 함수명 확인. `FUNCTION_NOT_FOUND` 뒤에는 새 프로젝트를 만들기 전에 이 도구로 함수명을 확인하세요.
- `runtime.getEnvVars(slug)` / `runtime.setEnvVars(slug, vars)` → App Studio 환경변수 조회/저장. secret 값은 getEnvVars에 반환되지 않으므로 secrets metadata로 키 설정 여부만 확인하고, 사용자가 입력한 token/password/API key/client secret 값을 채팅에 반복 노출하지 마세요. set 후에는 getEnvVars로 키를 확인하고, Lambda 함수 QA 전에는 runtime.deploy로 재배포해야 실행 환경에 반영됩니다.
- `runtime.listScheduleFunctions(slug)` → cron에 연결 가능한 함수 확인
- `runtime.createFunctionSchedule(slug, functionName, cronExpression, payloadJson?, contextJson?)` → polling 함수 cron 등록. 여러 채널에 실행해야 하면 `contextJson.channelIds` 배열을 사용하세요. App Store가 필요한 schedule의 기본값은 설치 채널 전체로 fan-out되고, 인증 없는 direct schedule도 명시된 `channelIds`에는 채널별로 direct 호출됩니다.
- `runtime.runFunctionScheduleNow(slug, scheduleId)` → schedule 즉시 1회 실행
- `runtime.status(slug)` → 앱 상태 확인
- `runtime.logs(slug)` → 앱 로그

**구현 완료 조건:**
- extension/function/service 파일을 작성한 뒤에는 완료했다고 말하기 전에 build/deploy 검증을 반드시 통과시키세요.
- exp/production 환경에서는 API pod 안에서 `pnpm install`을 수행하는 pod-local build를 시도하지 말고, `runtime.deploy(slug)`를 호출해 Lambda build+deploy 경로로 검증하세요. 이 경로가 실제 배포 검증입니다.
- local dev 환경에서는 `runtime.build(slug)`를 먼저 호출하고, build 결과의 `success`가 `true`일 때만 성공입니다. build가 실패하면 오류를 읽고 코드를 수정한 뒤 다시 실행하세요.
- `runtime.build` 결과에 `deploy` 정보가 포함되어 있으면 exp/production에서 Lambda build+deploy가 위임 실행된 것이므로, 추가 pod-local build 없이 함수 목록/스케줄 검증으로 이동하세요.
- 실제 API secret이 아직 없어 실행 테스트가 불가능해도, credential 입력으로 받을 수 있게 구현하고 Lambda build/deploy까지 완료하세요.
- 표준 앱(order/wms/messaging 등)은 extension 파일 생성만으로 끝내지 말고, 표준 함수가 등록된 상태로 build가 통과했는지 확인하세요.
- 녹화 기반 표준 extension 파일을 보정할 때는 runtime.generateFunctionFromRecording이 만든 core 함수의 기록 URL, storageState, 쿠키 재사용 구조를 보존하세요. metadata.getSupportedCommerces 같은 보조 함수 보정이 필요해도 core.getOrders/core.getShopId를 손으로 새로 작성하거나 credential 기반 host 추측으로 바꾸면 인증 주입 QA 실패입니다.
- passthrough/unknown payload 값은 build 전에 `String(...)`, `Number(...)`, 명시 타입가드로 좁히세요. 특히 `URLSearchParams.set`, TypeORM entity, Channel/App SDK 호출은 `unknown`을 받지 않으므로 그대로 넘기지 마세요.
- config extension은 실제 런타임 API 호출에 필요한 credential 필드를 노출해야 합니다. 문서상 API 호출 파라미터가 `hash`, `accessToken`, `apiKey` 등이라면 최종 함수 목록 확인과 함께 config schema에도 해당 credential 필드가 있는지 확인하세요.
- 인증 없는 공개 API 앱의 빠른 함수 QA는 `runtime.callFunction` direct/proxy 호출로 해도 됩니다. exp/production Lambda deploy가 성공한 앱은 deploy 결과의 `appStorePostdeploy` 또는 `appStoreEndpointSync`로 App Store 앱 생성/설치/endpoint sync 여부를 확인하세요. config/auth가 필요한 앱은 `runtime.ensureAppStoreApp`으로 현재 App Studio 환경의 App Store 앱을 만들거나 재사용한 뒤 `runtime.deploy`를 실행해 extension 등록과 URL 동기화를 끝내고, 우선 `runtime.autoFillAppStoreConfig`로 채널 `"1"`의 config를 저장하세요. 자동 매핑 결과의 `missingRequiredKeys`가 비어 있지 않으면 부족한 값만 사용자에게 짧게 요청하거나 `values` override로 넘긴 뒤 다시 호출하세요. 실제 App Store 경유 호출이 성공해야 인증 주입 QA가 완료입니다. `runtime.callFunction`도 config/oauth/apikey extension이 있으면 자동으로 App Store 경유 호출을 사용합니다.
- `runtime.deploy` 응답에 `extensionSyncRepairRequired`가 true이면 App Store extension 자동 등록이 실패한 것입니다. 배포 성공 메시지로 마무리하지 말고 `extensionSyncAction`에 따라 실패 원인을 고친 뒤 재배포하세요.
- 함수 구현/배포 후에는 `runtime.validateGeneratedFunction`으로 실제 호출 경로, requiredPaths, requiredConfigKeys, forbiddenPatterns를 한 번에 검증하세요. config/oauth/apikey 앱은 App Store route로 검증하고, 인증 없는 함수만 direct route가 허용됩니다.
- 사용자가 "이 앱으로 조회", "방금 만든 앱으로 확인", "우리 앱 function을 호출"처럼 이미 만든/배포한 앱 사용을 요청하면 외부 사이트를 browser로 직접 자동화하기 전에 `runtime.callFunction` 또는 `runtime.callAppStoreFunction`으로 앱 함수를 먼저 호출하세요. 함수가 없거나 실패한 근거가 있을 때만 브라우저 탐색/자동화로 전환하세요.
- `runtime.callFunction` 또는 `runtime.callAppStoreFunction`을 호출한 뒤에는 접힌 도구 결과만 남기지 말고, 바로 이어서 사용자가 읽을 수 있는 한두 문장으로 성공/실패와 샘플 결과를 요약하세요. 예: "서울의 현재 기온과 7일 예보, 요청한 과거 기간 데이터가 반환되는 것을 확인했습니다." 실패했다면 어떤 함수/입력이 실패했는지 말하고 수정 후 다시 호출하세요.
- `FUNCTION_NOT_FOUND`가 나오면 새 프로젝트를 만들지 말고 `runtime.listFunctions`, 현재 프로젝트의 생성 결과, 또는 `@Func` decorator를 확인해 정확한 함수명으로 다시 호출하세요. `Project "..." not found`가 나오면 이전 `runtime.createProject` 결과의 slug나 현재 프로젝트 URL을 확인하고 같은 slug로 복구한 뒤 계속하세요.
- 환경변수를 추가/수정/확인해야 하면 `runtime.getEnvVars`와 `runtime.setEnvVars`를 사용하세요. 저장 직후에는 저장된 키만 확인해서 말하고 비밀값은 반복 노출하지 마세요. Lambda에 반영해 함수 QA를 하려면 반드시 `runtime.deploy`로 재배포한 뒤 호출하세요.
- App Store 경유 `core.getShopId`, `core.getOrders`, `core.getOrder` 중 하나라도 `App server request failed`, timeout, 빈 결과(실제 주문 화면 녹화가 있었는데 orders=[]), 또는 Lambda error를 반환하면 완료가 아닙니다. 로그/코드를 수정하고 다시 deploy + App Store 경유 호출을 통과시킨 뒤에만 완료라고 말하세요.
- config/auth 앱의 완료 조건은 `runtime.autoFillAppStoreConfig(slug, "1")` 호출과 `runtime.getAppStoreConfig(slug, "1")` 확인까지 포함합니다. config schema가 있는데 `storedKeys`가 비어 있거나 `missingRequiredKeys`가 남아 있으면 아직 완료가 아닙니다. 이때 `hash`, `apiKey`, `accessToken` 같은 값은 먼저 로그인된 provider 화면의 API/인증/설정 메뉴에서 브라우저로 찾아보고, 그래도 없을 때만 필요한 키 이름을 짧게 물어보세요.
- 인증이 전혀 필요 없는 함수는 `runtime.callFunction`의 proxy 호출로 QA해도 됩니다.
- messaging 앱에서 외부 문의/게시판을 가져와야 하면, 함수만 만들고 끝내지 말고 polling/webhook 트리거가 설정됐는지 확인하세요. polling 방식이면 `runtime.listScheduleFunctions`로 함수 노출을 확인한 뒤 `runtime.createFunctionSchedule`을 호출하고, 가능하면 `runtime.runFunctionScheduleNow`로 1회 실행까지 확인하세요.
- polling 함수를 만들었는데 `runtime.listFunctionSchedules` 결과가 비어 있으면 아직 완료가 아닙니다. schedule을 등록한 뒤 다시 목록을 확인하고, 등록된 schedule의 `functionName`과 `contextJson.caller.channelId` 또는 `contextJson.channelIds`를 확인하세요.
- polling/webhook으로 외부 메시지를 Channel Talk 대화와 연결하는 앱은 DB migration으로 cursor와 외부 글/댓글 ↔ Channel Talk message/topic mapping을 남겨 재시작·재시도 시에도 중복 생성되지 않게 하세요. `resource/psql/migration/V*.sql` 파일이 없으면 build/deploy 전에 `runtime.addTable`을 호출하거나 migration 파일을 작성한 뒤 파일 목록으로 확인하세요. `runtime.addTable`로 만든 entity import는 도구 응답의 `entityClassName`과 import path를 그대로 사용하세요.
- BigQuery를 사용하는 앱은 `resource/bigquery/migration/V*.sql` 파일 목록도 확인하세요. BigQuery migration 디렉터리에 README만 있거나 빈 디렉터리만 있으면 BigQuery 추가로 감지되지 않습니다.

### channel-mcp — 앱스토어 관리
- 앱 등록, 크레덴셜 관리

## 항상 한국어로 응답하세요.
