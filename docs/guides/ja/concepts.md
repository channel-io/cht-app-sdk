# 基本概念

## Function

Function は Channel がアプリサーバーに呼び出す単一の動作です。各 function は `method`、`params`、`context` を受け取り、`result` または `error` を返します。

## Schema

Function は input/output schema を公開します。TypeScript は Zod を使い、Go は struct と `json` tag を基本の型インターフェースとして使います。

## Native Client

Native client はアプリサーバーから AppStore native function を呼び出すためのクライアントです。トークン発行、拡張登録、ALF task 登録などを扱います。

## Extension Helper

Extension helper は WMS のように method 群が決まっている拡張を簡単に登録する API です。

## Proto

`proto/` は言語共通の契約です。アプリ開発者は通常、生成された proto code ではなく各言語 SDK の使いやすい API を使います。
messaging のような大きな共有 DTO 群はここで管理し、各言語 SDK が使いやすい型/API として公開します。
