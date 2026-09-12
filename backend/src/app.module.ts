import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AskModule } from './ask/ask.module';
import { AuthModule } from './auth/auth.module';
import { ObservationsModule } from './observations/observations.module';
import { PrismaModule } from './prisma/prisma.module';
import { SearchModule } from './search/search.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    StorageModule,
    ObservationsModule,
    SearchModule,
    AskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
