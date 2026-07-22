import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ChannelAppModule } from "@channel.io/app-sdk-server";
import { CommandExtension } from "./extensions/command.extension.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ChannelAppModule.forRoot({
      extensions: [CommandExtension],
    }),
  ],
})
export class AppModule {}
