# 핵심 개념

## Function

Function은 Channel이 앱 서버로 호출하는 단일 동작입니다. 모든 function은 `method`, `params`, `context`를 받으며 `result` 또는 `error`를 반환합니다.

## Schema

Function은 input/output schema를 노출합니다. TypeScript는 Zod를 사용하고, Go는 struct와 `json` tag를 기본 타입 표면으로 사용합니다.

## Native Client

Native client는 앱 서버에서 AppStore native function을 호출하는 클라이언트입니다. 토큰 발급, 확장 등록, ALF task 등록 같은 작업을 담당합니다.

## Extension Helper

Extension helper는 WMS처럼 정해진 method 집합이 있는 확장을 편하게 등록하는 API입니다.

## Proto

`proto/`는 언어 공통 계약입니다. 앱 개발자는 보통 proto generated code 대신 각 언어 SDK의 편한 API를 사용합니다.
messaging처럼 큰 공유 DTO 묶음은 여기에서 관리하고 각 언어 SDK가 편한 타입/API로 다시 제공합니다.
