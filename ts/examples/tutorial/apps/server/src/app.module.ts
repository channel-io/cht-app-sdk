import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ChannelAppModule } from "@channel.io/app-sdk-server";
import { CommandExtension } from "./extensions/command.extension.js";

@Module({
  imports: [
    ConfigModule.forRoot(),
    ChannelAppModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        appId: config.get("APP_ID") ?? "",
        appSecret: config.get("APP_SECRET") ?? "",
        debug: true,
      }),
    }),
  ],
  providers: [CommandExtension],
})
export class AppModule {}
