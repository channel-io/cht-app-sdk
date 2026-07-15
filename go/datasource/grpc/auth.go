package grpcdatasource

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"

	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/proto"
)

const AccessTokenMetadataKey = "x-access-token"
const SignatureMetadataKey = "x-signature"

type AccessTokenIdentity struct {
	AccessToken string
	AppID       string
	ChannelID   string
	ManagerID   string
	CallerType  string
	CallerID    string
	Scopes      map[string][]string
}

type AccessTokenValidator interface {
	ValidateAccessToken(ctx context.Context, accessToken string) (AccessTokenIdentity, error)
}

type AccessTokenValidatorFunc func(ctx context.Context, accessToken string) (AccessTokenIdentity, error)

func (f AccessTokenValidatorFunc) ValidateAccessToken(ctx context.Context, accessToken string) (AccessTokenIdentity, error) {
	return f(ctx, accessToken)
}

type SigningKeyResolver func(ctx context.Context, identity AccessTokenIdentity) (string, error)

func NewJWTAccessTokenValidator(jwtServiceKey string) AccessTokenValidator {
	return AccessTokenValidatorFunc(func(_ context.Context, accessToken string) (AccessTokenIdentity, error) {
		return ParseJWTAccessToken(accessToken, jwtServiceKey)
	})
}

func AccessTokenFromContext(ctx context.Context) string {
	return metadataTextFromContext(ctx, AccessTokenMetadataKey)
}

func SignatureFromContext(ctx context.Context) string {
	return metadataTextFromContext(ctx, SignatureMetadataKey)
}

func metadataTextFromContext(ctx context.Context, key string) string {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return ""
	}
	for _, value := range md.Get(key) {
		if token := strings.TrimSpace(value); token != "" {
			return token
		}
	}
	return ""
}

type accessTokenIdentityContextKey struct{}

func ContextWithAccessTokenIdentity(ctx context.Context, identity AccessTokenIdentity) context.Context {
	return context.WithValue(ctx, accessTokenIdentityContextKey{}, identity)
}

func AccessTokenIdentityFromContext(ctx context.Context) (AccessTokenIdentity, bool) {
	identity, ok := ctx.Value(accessTokenIdentityContextKey{}).(AccessTokenIdentity)
	return identity, ok
}

func ParseJWTAccessToken(accessToken string, jwtServiceKey string) (AccessTokenIdentity, error) {
	accessToken = strings.TrimSpace(accessToken)
	if accessToken == "" {
		return AccessTokenIdentity{}, fmt.Errorf("access token is required")
	}
	if strings.TrimSpace(jwtServiceKey) == "" {
		return AccessTokenIdentity{}, fmt.Errorf("jwt service key is required")
	}
	parts := strings.Split(accessToken, ".")
	if len(parts) != 3 {
		return AccessTokenIdentity{}, fmt.Errorf("invalid jwt access token")
	}

	headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return AccessTokenIdentity{}, fmt.Errorf("decode jwt header: %w", err)
	}
	var header struct {
		Algorithm string `json:"alg"`
	}
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return AccessTokenIdentity{}, fmt.Errorf("parse jwt header: %w", err)
	}
	if header.Algorithm != "HS256" {
		return AccessTokenIdentity{}, fmt.Errorf("unsupported jwt algorithm: %s", header.Algorithm)
	}

	mac := hmac.New(sha256.New, []byte(jwtServiceKey))
	_, _ = mac.Write([]byte(parts[0] + "." + parts[1]))
	expectedSignature := mac.Sum(nil)
	actualSignature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return AccessTokenIdentity{}, fmt.Errorf("decode jwt signature: %w", err)
	}
	if !hmac.Equal(expectedSignature, actualSignature) {
		return AccessTokenIdentity{}, fmt.Errorf("invalid jwt signature")
	}

	return ParseJWTAccessTokenUnverified(accessToken)
}

func ParseJWTAccessTokenUnverified(accessToken string) (AccessTokenIdentity, error) {
	accessToken = strings.TrimSpace(accessToken)
	if accessToken == "" {
		return AccessTokenIdentity{}, fmt.Errorf("access token is required")
	}
	parts := strings.Split(accessToken, ".")
	if len(parts) != 3 {
		return AccessTokenIdentity{}, fmt.Errorf("invalid jwt access token")
	}
	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return AccessTokenIdentity{}, fmt.Errorf("decode jwt payload: %w", err)
	}
	var claims struct {
		Scope    json.RawMessage `json:"scope"`
		Identity string          `json:"identity"`
	}
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return AccessTokenIdentity{}, fmt.Errorf("parse jwt payload: %w", err)
	}

	scopes, err := parseJWTScopes(claims.Scope)
	if err != nil {
		return AccessTokenIdentity{}, err
	}
	scopeMap := scopeMap(scopes)
	callerType, callerID, _ := strings.Cut(claims.Identity, "-")
	return AccessTokenIdentity{
		AccessToken: accessToken,
		AppID:       firstScope(scopeMap, "app"),
		ChannelID:   firstScope(scopeMap, "channel"),
		ManagerID:   firstScope(scopeMap, "manager"),
		CallerType:  callerType,
		CallerID:    callerID,
		Scopes:      scopeMap,
	}, nil
}

func DataSourceSignaturePayload(req *ExecuteQueryRequest, accessToken string) ([]byte, error) {
	reqBytes, err := proto.MarshalOptions{Deterministic: true}.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal datasource request for signature: %w", err)
	}
	var payload bytes.Buffer
	if _, err := payload.Write(reqBytes); err != nil {
		return nil, fmt.Errorf("write datasource request for signature: %w", err)
	}
	if err := payload.WriteByte('\n'); err != nil {
		return nil, fmt.Errorf("write datasource signature separator: %w", err)
	}
	if _, err := payload.WriteString(accessToken); err != nil {
		return nil, fmt.Errorf("write datasource access token for signature: %w", err)
	}
	return payload.Bytes(), nil
}

func VerifyDataSourceSignature(signature string, signingKey string, req *ExecuteQueryRequest, accessToken string) bool {
	key, err := hex.DecodeString(strings.TrimSpace(signingKey))
	if err != nil {
		return false
	}
	payload, err := DataSourceSignaturePayload(req, accessToken)
	if err != nil {
		return false
	}
	mac := hmac.New(sha256.New, key)
	_, _ = mac.Write(payload)
	expected := mac.Sum(nil)
	actual, err := base64.StdEncoding.DecodeString(strings.TrimSpace(signature))
	if err != nil {
		return false
	}
	return hmac.Equal(expected, actual)
}

func parseJWTScopes(raw json.RawMessage) ([]string, error) {
	if len(raw) == 0 || string(raw) == "null" {
		return nil, nil
	}
	var list []string
	if err := json.Unmarshal(raw, &list); err == nil {
		return list, nil
	}
	var joined string
	if err := json.Unmarshal(raw, &joined); err == nil {
		return strings.Fields(joined), nil
	}
	return nil, fmt.Errorf("invalid jwt scope claim")
}

func scopeMap(scopes []string) map[string][]string {
	result := make(map[string][]string)
	for _, scope := range scopes {
		key, value, ok := strings.Cut(scope, "-")
		if !ok {
			continue
		}
		result[key] = append(result[key], value)
	}
	return result
}

func firstScope(scopes map[string][]string, key string) string {
	values := scopes[key]
	if len(values) == 0 {
		return ""
	}
	return values[0]
}
