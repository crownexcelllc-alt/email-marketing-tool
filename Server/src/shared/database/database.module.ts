import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongo.uri', { infer: true }),
        maxPoolSize: 20,
        minPoolSize: 5,
        autoIndex: false,
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
