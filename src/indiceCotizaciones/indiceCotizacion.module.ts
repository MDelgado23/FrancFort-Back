import { Module, forwardRef } from '@nestjs/common';
import { IndiceCotizacionController } from './indiceCotizacion.controller';
import { IndiceCotizacion } from './entities/indiceCotizacion.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndiceCotizacionService } from './indiceCotizacion.service';
import { Cotizacion } from 'src/cotizacion/entities/cotizacion.entity';
import { Indice } from 'src/indice/entities/indice.entity';
import { CotizacionesModule } from 'src/cotizacion/cotizacion.module';
import { IndiceModule } from 'src/indice/indice.module';
import { EmpresaModule } from 'src/empresa/empresa.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IndiceCotizacion, Cotizacion, Indice]),
    forwardRef(() => CotizacionesModule), // Evitar dependencia circular
    IndiceModule,
    EmpresaModule,
  ],
  controllers: [IndiceCotizacionController],
  providers: [IndiceCotizacionService],
  exports: [IndiceCotizacionService],
})
export class IndiceCotizacionModule {}
