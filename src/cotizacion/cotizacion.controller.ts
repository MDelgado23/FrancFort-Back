import { Body, Controller, Get, Param, Query } from '@nestjs/common';
import { CotizacionesService } from './cotizacion.service';
import { Cotizacion } from './entities/cotizacion.entity';
import DateMomentUtils from 'src/utils/dateMomentsUtils';
import { IFecha } from 'src/model/fecha.model';
import { ICotizacionCard } from './model/iCotizacion';
import { arrCodEmp } from 'src/utils/arrEmp';

@Controller('/cotizaciones')
export class CotizacionesController {
  constructor(private cotizacionesService: CotizacionesService) {}


  @Get('/all')
  public async getAllCotizaciones(): Promise<void> {
    const arrCods = arrCodEmp;
    await Promise.all(
      arrCodEmp.map(async (codigo) => {
        console.log('codigo:', codigo);
        await this.cotizacionesService.saveAllCotizacionesDb(codigo);
      }),
    );

    console.log('Todas las cotizaciones se han guardado correctamente.');
  }


  @Get('/participacionBolsa')
  public async getCotizacion(): Promise<any> {
    await this.getAllCotizaciones();
    const participacionesDia = await this.cotizacionesService.calcularParticipaciones('DIA');
    const participacionesMes = await this.cotizacionesService.calcularParticipaciones('MES');
    const resultado = [
      ...participacionesDia.map(p => ({ ...p, tipo: 'DIA' })),
      ...participacionesMes.map(p => ({ ...p, tipo: 'MES' })),
    ];
    console.log(resultado);
    return resultado;
  }

  @Get('/lastCotizacionEmpByCod/:codEmpresa')
  public async getlastCotizacion(
    @Param('codEmpresa') codEmp: string
  ): Promise<ICotizacionCard> {
    return await this.cotizacionesService.getlastCardCot(codEmp)
  }

  @Get('/allCotizacionEmpByCod/:codEmpresa')
  public async getallCotizacions(
    @Param('codEmpresa') codEmpresa: string
  ): Promise<Cotizacion[]> {
    return await this.cotizacionesService.getallCotizacions(codEmpresa)
  }
}
