package legacy

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/channel-io/app-sdk/go/appsdk"
)

type HandlerFunc func(ctx context.Context, params json.RawMessage, fnCtx appsdk.Context) (json.RawMessage, error)

type Registry map[string]HandlerFunc

type SchemaProvider func() ([]appsdk.FunctionSchema, error)

type Composite struct {
	app          *appsdk.App
	legacy       Registry
	schemaSource SchemaProvider
}

func NewComposite(app *appsdk.App, legacy Registry, schemaSource SchemaProvider) (*Composite, error) {
	if app == nil {
		return nil, fmt.Errorf("sdk app is required")
	}
	for method := range legacy {
		if app.HasMethod(method) {
			return nil, fmt.Errorf("function method registered in both sdk and legacy registries: %s", method)
		}
	}
	return &Composite{app: app, legacy: legacy, schemaSource: schemaSource}, nil
}

func (c *Composite) HandleRequest(ctx context.Context, req appsdk.FunctionRequest) appsdk.FunctionResponse {
	if req.Method == appsdk.MethodGetFunctions {
		return c.getFunctions()
	}
	if req.Method == appsdk.MethodGetTestFunctions {
		return c.app.GetTestFunctions()
	}
	if c.app.HasMethod(req.Method) {
		return c.app.HandleRequest(ctx, req)
	}
	if handler, ok := c.legacy[req.Method]; ok {
		params := req.Params
		if len(params) == 0 {
			params = json.RawMessage(`{}`)
		}
		result, err := handler(ctx, params, req.Context)
		if err != nil {
			return appsdk.ErrorResponse(err)
		}
		return appsdk.FunctionResponse{Result: result}
	}
	return appsdk.ErrorResponse(appsdk.NewError(appsdk.CodeMethodNotFound, "methodNotFound", fmt.Sprintf("cannot find method %s", req.Method)))
}

func (c *Composite) HandleJSON(ctx context.Context, body []byte) appsdk.FunctionResponse {
	var req appsdk.FunctionRequest
	if err := json.Unmarshal(body, &req); err != nil {
		return appsdk.ErrorResponse(appsdk.NewError(appsdk.CodeBadRequest, "parseError", "failed to parse function request"))
	}
	return c.HandleRequest(ctx, req)
}

func (c *Composite) getFunctions() appsdk.FunctionResponse {
	functions := c.app.Schemas()
	if c.schemaSource != nil {
		legacySchemas, err := c.schemaSource()
		if err != nil {
			return appsdk.ErrorResponse(err)
		}
		seen := map[string]struct{}{}
		for _, fn := range functions {
			seen[fn.Name] = struct{}{}
		}
		for _, fn := range legacySchemas {
			if _, exists := seen[fn.Name]; exists {
				return appsdk.ErrorResponse(appsdk.NewError(appsdk.CodeInternal, "duplicateFunction", fmt.Sprintf("duplicate function schema: %s", fn.Name)))
			}
			functions = append(functions, fn)
		}
	}

	data, err := json.Marshal(appsdk.GetFunctionsResult{Functions: functions, Success: true, ErrorMessage: ""})
	if err != nil {
		return appsdk.ErrorResponse(err)
	}
	return appsdk.FunctionResponse{Result: data}
}
