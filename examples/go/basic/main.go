package main

import (
	"context"
	"log"
	"os"

	"github.com/channel-io/cht-app-sdk/go/appsdk"
	"github.com/channel-io/cht-app-sdk/go/extension/wms"
	sdkgin "github.com/channel-io/cht-app-sdk/go/server/gin"
)

func main() {
	app := appsdk.New(appsdk.Options{
		AppID:     os.Getenv("APP_ID"),
		AppSecret: os.Getenv("APP_SECRET"),
	})
	if err := app.Use(wms.Extension().
		GetSupportedCommerces(wms.StaticSupportedCommerces("app-cafe24", "app-naver-smart-store")).
		GetOrders(func(_ context.Context, _ appsdk.Context, _ *wms.GetOrdersRequest) (*wms.GetOrdersResponse, error) {
			return &wms.GetOrdersResponse{Orders: []wms.Order{}}, nil
		}),
	); err != nil {
		log.Fatal(err)
	}

	log.Printf("registered methods: %v", app.Methods())
	server := sdkgin.NewServer(app,
		sdkgin.WithSignature(os.Getenv("SIGNING_KEY")),
		sdkgin.WithAutoRegister(),
	)
	log.Fatal(server.Run(":8080"))
}
