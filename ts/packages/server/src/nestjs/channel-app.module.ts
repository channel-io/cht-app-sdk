import { type DynamicModule, Logger, Module, type Provider } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";
import { ChannelAppController } from "./channel-app.controller.js";
import { ChannelAppService } from "./channel-app.service.js";
import { NativeFunctionClient } from "../native/client.js";
import { TokenManager } from "../token/manager.js";
import type { TokenManagerConfig } from "../token/types.js";
import { ExtensionDiscoveryService } from "../discovery/extension-discovery.service.js";
import {
  type ChannelAppModuleOptions,
  type ChannelAppModuleAsyncOptions,
  CHANNEL_APP_OPTIONS,
} from "./types.js";

const nativeFunctionClientProvider: Provider = {
  provide: NativeFunctionClient,
  inject: [CHANNEL_APP_OPTIONS],
  useFactory: (options: ChannelAppModuleOptions) =>
    new NativeFunctionClient({
      appStoreUrl: options.appStoreUrl,
      debug: options.debug,
    }),
};

const tokenManagerProvider: Provider = {
  provide: TokenManager,
  inject: [CHANNEL_APP_OPTIONS],
  useFactory: (options: ChannelAppModuleOptions) => {
    const config: TokenManagerConfig = {
      appId: options.appId,
      appSecret: options.appSecret,
      logger: new Logger(TokenManager.name),
    };

    if (options.appStoreUrl !== undefined) {
      config.appStoreUrl = options.appStoreUrl;
    }
    if (options.tokenCacheStorage !== undefined) {
      config.cacheStorage = options.tokenCacheStorage;
    }
    if (options.tokenRefreshBufferMs !== undefined) {
      config.refreshBufferMs = options.tokenRefreshBufferMs;
    }
    if (options.debug !== undefined) {
      config.debug = options.debug;
    }

    return new TokenManager(config);
  },
};

const channelAppProviders = [
  ExtensionDiscoveryService,
  nativeFunctionClientProvider,
  tokenManagerProvider,
  ChannelAppService,
];

const channelAppExports = [
  ChannelAppService,
  ExtensionDiscoveryService,
  NativeFunctionClient,
  TokenManager,
];

@Module({})
export class ChannelAppModule {
  /**
   * Register the module with static options
   *
   * @example
   * ```typescript
   * // Using decorator-based extensions (recommended)
   * @Module({
   *   imports: [
   *     ChannelAppModule.forRoot({
   *       appId: process.env.APP_ID,
   *       appSecret: process.env.APP_SECRET,
   *     }),
   *   ],
   *   providers: [CalendarExtension], // Your @Extension decorated classes
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(options: ChannelAppModuleOptions): DynamicModule {
    return {
      module: ChannelAppModule,
      imports: [DiscoveryModule],
      controllers: [ChannelAppController],
      providers: [
        {
          provide: CHANNEL_APP_OPTIONS,
          useValue: options,
        },
        ...channelAppProviders,
      ],
      exports: [...channelAppExports],
      global: true,
    };
  }

  /**
   * Register the module with async options (for dependency injection)
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     ConfigModule,
   *     ChannelAppModule.forRootAsync({
   *       imports: [ConfigModule],
   *       inject: [ConfigService],
   *       useFactory: (config: ConfigService) => ({
   *         appId: config.get('APP_ID'),
   *         appSecret: config.get('APP_SECRET'),
   *       }),
   *     }),
   *   ],
   *   providers: [CalendarExtension], // Your @Extension decorated classes
   * })
   * export class AppModule {}
   * ```
   */
  static forRootAsync(options: ChannelAppModuleAsyncOptions): DynamicModule {
    const asyncProvider: Provider = {
      provide: CHANNEL_APP_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    const result: DynamicModule = {
      module: ChannelAppModule,
      imports: [DiscoveryModule, ...(options.imports ?? [])],
      controllers: [ChannelAppController],
      providers: [asyncProvider, ...channelAppProviders],
      exports: [...channelAppExports],
      global: true,
    };

    return result;
  }
}
