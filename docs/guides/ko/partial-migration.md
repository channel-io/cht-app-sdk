# 부분 마이그레이션

기존 Go 앱은 모든 function을 한 번에 SDK로 옮기지 않아도 됩니다. `compat/legacy.Composite`로 기존 registry와 SDK registry를 함께 사용할 수 있습니다.

```go
sdkApp := appsdk.New(appsdk.Options{AppID: appID})
sdkApp.Func("extension.new.method", appsdk.Handle(newHandler))

composite, err := legacy.NewComposite(
  sdkApp,
  legacy.Registry{
    "extension.old.method": oldHandler,
  },
  legacySchemaProvider,
)
```

규칙은 단순합니다.

- 한 method의 owner는 SDK 또는 legacy 중 하나입니다.
- 중복 method는 시작 시 실패합니다.
- `extension.core.function.getFunctions`는 composite가 SDK와 legacy schema를 합쳐 응답합니다.
- 존재하지 않는 method는 fallback 탐색 없이 method not found를 반환합니다.

an existing commerce app는 이 방식으로 function을 하나씩 옮기는 첫 번째 대상입니다.
