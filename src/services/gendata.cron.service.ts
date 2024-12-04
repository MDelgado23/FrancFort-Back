/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CotizacionesService } from 'src/cotizacion/cotizacion.service';
import { IndiceCotizacionService } from 'src/indiceCotizaciones/indiceCotizacion.service';
import { IndiceService } from 'src/indice/indice.service';
import { EmpresaService } from 'src/empresa/empresa.service';
import { arrCodEmp } from 'src/utils/arrEmp';

@Injectable()
export class GenDataService {
  private readonly logger = new Logger(GenDataService.name);
  constructor(
    private readonly cotizacionesService: CotizacionesService,
    private readonly indiceCotizacionService: IndiceCotizacionService,
    private readonly indiceService: IndiceService,
    private readonly empresaService: EmpresaService,
  ) {
    this.logger.log('Cron corriendo');
  }
  // Cron que se ejecuta cada hora en el minuto 0, segundo 1
  @Cron('1 0 * * * *') // Formato: segundo, minuto, hora, día del mes, mes, día de la semana
  async ejecutarCronDeIndices() {
    const arrCodigosEmpresas = arrCodEmp;
    //1
    try {
      this.logger.log('[CRON] Trayendo los datos de Empresas');
      for (const codigo of arrCodigosEmpresas) {
        await this.empresaService.saveEmpDbByCod(codigo);
        this.logger.log(
          ' [CRON] Todas las empresas fueron guardadas correctamente.',
        );
      }
    } catch (error) {
      this.logger.error('Error al guardar las empresas:', error);
      return;
    }
    // 2
    try {
      this.logger.log(
        '[CRON] Iniciando actualización de cotizaciones desde Gempresa',
      );
      await Promise.all(
        arrCodigosEmpresas.map(async (codigo) => {
          this.logger.log(
            `[CRON] Actualizando cotizaciones para empresa: ${codigo}`,
          );
          await this.cotizacionesService.saveAllCotizacionesDb(codigo);
        }),
      );
      this.logger.log(
        '[CRON] Todas las cotizaciones se han actualizado correctamente.',
      );
    } catch (error) {
      this.logger.error(
        `[CRON] Error al actualizar cotizaciones de empresas: ${error.message}`,
      );
      return;
    }

    // 3
    try {
      this.logger.log('[CRON] Verificando Indices');
      await this.indiceService.saveAllIndicesDb();
      this.logger.log('[CRON] Indices actualizados');
    } catch (error) {
      this.logger.error(`[CRON] Error al actualizar los indices`);
      return;
    }

    // 4
    try {
      this.logger.log('[CRON] Actualizando Base de Datos de Cot Indices');
      await this.indiceCotizacionService.actualizarCotizacionesMisIndices();
      this.logger.log('[CRON] Indices actualizados');
    } catch (error) {
      this.logger.error(`[CRON] Error al actualizar los indices`);
      return;
    }

    // 5
    try {
      this.logger.log(
        '[CRON] Iniciando publicación de cotizaciones de índices',
      );
      await this.indiceCotizacionService.publicarCotizacionesNuevasEnGempresa(
        'FWB',
      );
      this.logger.log(
        '[CRON] Cotizaciones de índices publicadas correctamente.',
      );
    } catch (error) {
      this.logger.error(
        `[CRON] Error al publicar cotizaciones de índices: ${error.message}`,
      );
    }
  }
}
