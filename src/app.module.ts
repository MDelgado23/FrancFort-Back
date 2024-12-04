import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmpresaModule } from './empresa/empresa.module';
import { CotizacionesModule } from './cotizacion/cotizacion.module';
import { IndiceCotizacionModule } from './indiceCotizaciones/indiceCotizacion.module';
import { IndiceModule } from './indice/indice.module';
import { GenDataService } from './services/gendata.cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        synchronize: true,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        logging: 'all',
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    EmpresaModule,
    CotizacionesModule,
    IndiceCotizacionModule,
    IndiceModule,
  ],
  controllers: [AppController],
  providers: [AppService, GenDataService],
})
export class AppModule {}
