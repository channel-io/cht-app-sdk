# API Key Extension (legacy)

> 신규 앱은 [Config](config.md)를 사용합니다. 기존 설치와의 호환성이 필요한 동안에만 API key를
> 유지합니다.

## 계약

| Function                                          | 필수 여부 | 역할                                 |
| ------------------------------------------------- | --------- | ------------------------------------ |
| `extension.apikey.metadata.getAuthConfig`         | 필수      | Legacy credential field와 scope 선언 |
| `extension.apikey.validation.validateCredentials` | 권장      | 저장된 credential 검증               |

`apikey:v1`을 등록합니다. 저장 값을 app Function, log, WAM data, `wamArgs`로 노출하지 않습니다.

## TypeScript

Deprecated `ApiKeyExtensionInterface`를 `@Extension({ name: "apikey" })`와 공개 API key schema로
구현합니다. 설정 WAM은 manager-scoped credential native operation을 사용하고 provider 호출은
server가 수행합니다. [TypeScript API key 레퍼런스](../../../reference/typescript/extensions/apikey.md)를
확인하세요.

## Go

```go
err := app.Use(apikey.Extension().
  GetAuthConfig(handler.GetAuthConfig).
  ValidateCredentials(handler.ValidateCredentials))
```

`extension/apikey`는 호환성 용도로만 사용합니다. Config field로 재구성하고 저장 값 확인과 설치
채널 이전이 끝난 뒤 legacy 등록을 제거합니다.

## 검증

- Channel/manager scope, masking, invalid credential, 삭제, migration rollback을 테스트합니다.
- Credential 검증 실패만으로 provider mutation을 재시도하지 않습니다.
- 설정 화면에 필요한 최소 native credential permission만 요청했는지 확인합니다.

[Go Extension 레퍼런스](../../../reference/go/EXTENSIONS.md)도 확인하세요.
