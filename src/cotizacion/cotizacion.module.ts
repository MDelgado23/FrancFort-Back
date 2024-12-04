import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cotizacion } from './entities/cotizacion.entity';
import { CotizacionesController } from './cotizacion.controller';
import { CotizacionesService } from './cotizacion.service';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { IndiceCotizacionModule } from 'src/indiceCotizaciones/indiceCotizacion.module';
import { IndiceModule } from 'src/indice/indice.module';
import { EmpresaService } from 'src/empresa/empresa.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cotizacion, Empresa]),
    forwardRef(() => IndiceCotizacionModule), // Evitar dependencia circular
    IndiceModule,
  ],
  controllers: [CotizacionesController],
  providers: [CotizacionesService, EmpresaService],
  exports: [CotizacionesService],
})
export class CotizacionesModule {}
