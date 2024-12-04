import { Controller, Get, Logger, Post, Body, Query, HttpStatus, HttpException, Param } from '@nestjs/common';
import { IndiceCotizacionService } from './indiceCotizacion.service';
import DateMomentUtils from '../utils/dateMomentsUtils';
import { IndiceCotizacion } from './entities/indiceCotizacion.entity';

@Controller('indice-cotizacion')
export class IndiceCotizacionController {
  private readonly logger = new Logger(IndiceCotizacionController.name);

  constructor(private readonly indiceCotizacionService: IndiceCotizacionService) {}

  
  @Get('/getAll')
    async actualizarCotizacionesIndicesDesdeGempresa() {
        
        try {
            await this.indiceCotizacionService.actualizarCotizacionesMisIndices();
            return { message: "Cotizaciones Actualizadas" };
        } catch (error) {
            this.logger.error(`Error al actualizar cotizaciones de índices: ${error.message}`);
            throw new HttpException('Error al actualizar cotizaciones de índices', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

  // Actualizar mis cotizaciones de indices desde el principio.
  @Get('/postMine')
    async calcularIndices() {
        const data = await this.indiceCotizacionService.calcularIndice();
        return data
    }

  // Actualizar mis cotizaciones desde el ultimo subido.
  @Get('/postFromLast')
  async actualizarMisCotIndices(codIndice: string) {
    try {
      await this.indiceCotizacionService.publicarCotizacionesNuevasEnGempresa("FWB");
    } catch (error) {
      this.logger.error (`Error al actualizar /postFromLast`);
      throw error;
    }
  }

  @Get('getAllIndCotByCod/:codIndice')
  async getallCotizations(
    @Param('codIndice') codIndice: string
  ): Promise<IndiceCotizacion[]> {
    return await this.indiceCotizacionService.getAllCotizaciones(codIndice)
  }

}
