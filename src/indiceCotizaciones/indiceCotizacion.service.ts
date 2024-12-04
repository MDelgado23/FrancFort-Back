import { Injectable, Logger } from '@nestjs/common';
import { IndiceCotizacion } from './entities/indiceCotizacion.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Equal, Repository } from 'typeorm';
import { Cotizacion } from 'src/cotizacion/entities/cotizacion.entity';
import { Indice } from 'src/indice/entities/indice.entity';
import { CotizacionesService } from 'src/cotizacion/cotizacion.service';
import DateMomentUtils from '../utils/dateMomentsUtils';
import axios from 'axios';
import { IFecha } from 'src/model/fecha.model';
import { IndiceService } from 'src/indice/indice.service';

@Injectable()
export class IndiceCotizacionService {
  private readonly logger = new Logger(IndiceCotizacionService.name);

  constructor(
    @InjectRepository(IndiceCotizacion)
    private readonly indiceRepository: Repository<IndiceCotizacion>,
    @InjectRepository(Cotizacion)
    private readonly cotizacionRepository: Repository<Cotizacion>,
    @InjectRepository(Indice)
    private readonly indiceRepositoryBase: Repository<Indice>,
    private readonly cotizacionService: CotizacionesService,
  ) {}

  public async obtenerTodasLasCotizaciones(): Promise<Cotizacion[]> {
    try {
      return await this.cotizacionRepository.find();
    } catch (error) {
      this.logger.error('Error al obtener todas las cotizaciones:', error);
      throw error;
    }
  }

  public async actualizarCotizacionesMisIndices(): Promise<void> {
    const arrIndicesEnDBLocal = await this.buscarMisCodigosDeIndicesDeDB();
    if (arrIndicesEnDBLocal && arrIndicesEnDBLocal.length > 0) {
      for (const codIndice of arrIndicesEnDBLocal) {
        try {
          await this.guardarTodasLasCotizaciones(codIndice);
        } catch (error) {
          this.logger.error(
            `Error al actualizar cotizaciones para el índice ${codIndice}: ${error.message}`,
          );
        }
      }
    } else {
      this.logger.error('No hay índices en la DB local o la búsqueda falló');
    }
  }

  public async buscarMisCodigosDeIndicesDeDB(): Promise<string[]> {
    const indices = await this.indiceRepositoryBase.find({
      select: ['codigoIndice'],
    });
    return indices.map((indice) => indice.codigoIndice);
  }

  public async guardarTodasLasCotizaciones(codIndice: string): Promise<void> {
    const ultimaFechaEnMiDB =
      await this.ultimaFechaDeCotizacionEnMiDB(codIndice);
    const strUltimaFechaEnMiDB =
      DateMomentUtils.formatearFecha(ultimaFechaEnMiDB);

    const ultimaFechaGempresa =
      await DateMomentUtils.getUltimaFechaCotizacionGempresa();
    const strUltimaFechaDeGempresa =
      DateMomentUtils.formatearFecha(ultimaFechaGempresa);

    try {
      await this.getCotizacionesDeGempresaUTC1(
        codIndice,
        strUltimaFechaEnMiDB,
        strUltimaFechaDeGempresa,
      );
    } catch (error) {
      this.logger.error(
        `Error al guardar cotizaciones para el índice ${codIndice}: ${error.message}`,
      );
      this.logger.error(
        `ultimafechadb ${strUltimaFechaEnMiDB}:  ultimafechagempresa${strUltimaFechaDeGempresa}`,
      );
    }
  }

  public async getCotizacionesDeGempresaUTC1(
    codigoIndice: string,
    strUltimaFechaEnMiDB: string,
    strUltimaFechaDeGempresa: string,
  ): Promise<IndiceCotizacion[]> {
    const indice = await this.indiceRepositoryBase.findOne({
      where: { codigoIndice },
    });

    if (!indice) {
      this.logger.error(
        `[NUEVO] Índice no encontrado para el código ${codigoIndice}`,
      );
      return [];
    }

    const url = `http://ec2-54-145-211-254.compute-1.amazonaws.com:3000/indices/${codigoIndice}/cotizaciones?fechaDesde=${strUltimaFechaEnMiDB}&fechaHasta=${strUltimaFechaDeGempresa}`;

    try {
      const response = await axios.get(url);
      const cotizacionesExternas = response.data;

      this.logger.log(
        `[NUEVO] Cotizaciones obtenidas para el índice ${codigoIndice}: ${JSON.stringify(cotizacionesExternas)}`,
      );

      const cotizacionesAGuardar = cotizacionesExternas.map((cotizacion) =>
        this.indiceRepository.create({
          fecha: cotizacion.fecha,
          hora: cotizacion.hora,
          valorCotizacionIndice: cotizacion.valor,
          codigoIndice: indice,
        }),
      );

      await this.indiceRepository.save(cotizacionesAGuardar);
      this.logger.log(
        `Se guardaron ${cotizacionesAGuardar.length} cotizaciones para el índice ${codigoIndice}`,
      );

      return cotizacionesAGuardar;
    } catch (error) {
      this.logger.error(
        `Error al obtener cotizaciones de Gempresa para el índice ${codigoIndice}: ${error.message}`,
      );
      throw error;
    }
  }

  async calcularIndice(): Promise<void> {
    const arrCodigosEmpresas = [
      'AAPL',
      'TSLA',
      'JPM',
      'ROG.SW',
      'SHEL',
      'MSFT',
      'META',
    ];
    await Promise.all(
      arrCodigosEmpresas.map(async (codigo) => {
        console.log('codigo:', codigo);
        await this.cotizacionService.saveAllCotizacionesDb(codigo);
      }),
    );
    const cotizaciones = await this.obtenerTodasLasCotizaciones();
    this.logger.log(`Número de cotizaciones obtenidas: ${cotizaciones.length}`);

    const cotizacionesPorDiaYHora = {};

    cotizaciones.forEach((cotizacion) => {
      const valorCotizacion = Number(cotizacion.cotizacion);
      if (isNaN(valorCotizacion)) {
        this.logger.error(
          `Cotización no válida: ${JSON.stringify(cotizacion)}`,
        );
        return;
      }

      const fechaHora = `${cotizacion.fecha} ${cotizacion.hora}`;
      if (!cotizacionesPorDiaYHora[fechaHora]) {
        cotizacionesPorDiaYHora[fechaHora] = {
          valores: [],
          fecha: cotizacion.fecha,
          hora: cotizacion.hora,
        };
      }
      cotizacionesPorDiaYHora[fechaHora].valores.push(valorCotizacion);
    });

    for (const fechaHora of Object.keys(cotizacionesPorDiaYHora)) {
      const grupo = cotizacionesPorDiaYHora[fechaHora];
      const sumaCotizaciones = grupo.valores.reduce(
        (acc, curr) => acc + curr,
        0,
      );
      const promedio = sumaCotizaciones / grupo.valores.length;
      const valorLimitado = parseFloat(promedio.toFixed(2));

      try {
        await this.findLastCotizacionDb('FWB');
        this.logger.log(
          `Índice FWB publicado para la fecha ${grupo.fecha} y hora ${grupo.hora}`,
        );
      } catch (error) {
        this.logger.error(
          `Error procesando el índice para la fecha ${grupo.fecha} y hora ${grupo.hora}: ${error.message}`,
        );
      }
    }
  }

  async calcularIndicesEntreFechas(
    fechaDesde: IFecha,
    fechaHasta: IFecha,
  ): Promise<void> {
    const arrCodigosEmpresas = [
      'AAPL',
      'TSLA',
      'JPM',
      'ROG.SW',
      'SHEL',
      'MSFT',
      'META',
    ];
    const cotizacionesPorDiaYHora: {
      [fechaHora: string]: { valores: number[]; fecha: string; hora: string };
    } = {};

    const horasHabiles = DateMomentUtils.horasHabiles;

    for (const codigo of arrCodigosEmpresas) {
      const cotizacionesEmpresas = await this.cotizacionRepository.find({
        where: {
          empresa: { codEmp: codigo },
          fecha: Between(fechaDesde.fecha, fechaHasta.fecha),
          hora: Between('08:00', '14:00'),
        },
        relations: ['empresa'],
        order: { fecha: 'ASC', hora: 'ASC' },
      });

      cotizacionesEmpresas.forEach((cotizacion) => {
        const fechaHora = `${cotizacion.fecha} ${cotizacion.hora}`;
        if (horasHabiles.includes(cotizacion.hora)) {
          if (!cotizacionesPorDiaYHora[fechaHora]) {
            cotizacionesPorDiaYHora[fechaHora] = {
              valores: [],
              fecha: cotizacion.fecha,
              hora: cotizacion.hora,
            };
          }
          cotizacionesPorDiaYHora[fechaHora].valores.push(
            Number(cotizacion.cotizacion),
          );
        }
      });
    }

    // calcular cotIndices
    for (const fechaHora of Object.keys(cotizacionesPorDiaYHora)) {
      const grupo = cotizacionesPorDiaYHora[fechaHora];
      const sumaCotizaciones = grupo.valores.reduce(
        (acc, curr) => acc + curr,
        0,
      );
      const promedio = sumaCotizaciones / grupo.valores.length;
      const valorLimitado = parseFloat(promedio.toFixed(2));

      try {
        await this.publicarIndiceEnGempresa(
          grupo.fecha,
          grupo.hora,
          'FWB',
          valorLimitado,
        );
        this.logger.log(
          `Índice FWB publicado para la fecha ${grupo.fecha} y hora ${grupo.hora}`,
        );
      } catch (error) {
        this.logger.error(
          `Error procesando el índice para la fecha ${grupo.fecha} y hora ${grupo.hora}: ${error.message}`,
        );
      }
    }
  }

  async publicarIndiceEnGempresa(
    fecha: string,
    hora: string,
    codigoIndice: string,
    indice: number,
  ): Promise<void> {
    const data = { fecha, hora, codigoIndice, valorIndice: indice };
    const url =
      'http://ec2-54-145-211-254.compute-1.amazonaws.com:3000/indices/cotizaciones';

    try {
      this.logger.debug(`Intentando publicar índice: ${JSON.stringify(data)}`);
      const response = await axios.post(url, data);
      this.logger.log(
        `Índice ${codigoIndice} publicado en Gempresa: ${JSON.stringify(
          response.data,
        )}`,
      );
    } catch (error) {
      if (error.response?.status === 409) {
        this.logger.warn(
          `La cotIndice de ${codigoIndice} en ${fecha} ${hora} ya existe en Gempresa.`,
        );
      } else {
        this.logger.error(
          `Error al publicar el índice en Gempresa: ${error.response?.data || error.message}`,
        );
        throw error;
      }
    }
  }

  public async publicarCotizacionesNuevasEnGempresa(
    codIndice: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Actualizando cotizaciones locales antes de publicar nuevas cotizaciones para el índice ${codIndice}.`,
      );
      await this.actualizarCotizacionesMisIndices();
    } catch (error) {
      this.logger.error(
        `Error al actualizar cotizaciones locales para el índice ${codIndice}: ${error.message}`,
      );
      throw new Error(
        `No se pudo actualizar las cotizaciones locales para el índice ${codIndice}`,
      );
    }

    const ultimaCotizacionPublicada =
      await this.findLastCotizacionDb(codIndice);
    const ultimaFechaISO = DateMomentUtils.formatearFecha(
      ultimaCotizacionPublicada,
    );

    const fechaGempresa =
      await DateMomentUtils.getUltimaFechaCotizacionGempresa();
    const fechaGempresaISO = DateMomentUtils.formatearFecha(fechaGempresa);

    this.logger.log(
      `Última cotización publicada en formato ISO: ${ultimaFechaISO}`,
    );
    this.logger.log(
      `Fecha actual de Gempresa en formato ISO: ${fechaGempresaISO}`,
    );

    // Calculo y publico cotizaciones de índices entre fechas
    try {
      await this.calcularIndicesEntreFechas(
        ultimaCotizacionPublicada,
        fechaGempresa,
      );
    } catch (error) {
      this.logger.error(
        `Error al calcular y publicar índices para el índice ${codIndice}: ${error.message}`,
      );
    }

    this.logger.log(
      `Publicación de nuevas cotizaciones completada para el índice ${codIndice}.`,
    );
  }

  async findLastCotizacionDb(codigoIndice: string): Promise<IFecha> {
    try {
      const lastCotizacion = await this.indiceRepository.findOne({
        where: {
          codigoIndice: {
            codigoIndice,
          },
        },
        order: { fecha: 'DESC', hora: 'DESC' },
      });

      if (!lastCotizacion) {
        this.logger.warn(
          `No se encontró cotización para ${codigoIndice}. Se asignará fecha inicial por defecto.`,
        );
        return { fecha: '2024-01-01', hora: '00:00' };
      }
      return DateMomentUtils.transformFechaHora(
        lastCotizacion.fecha,
        lastCotizacion.hora,
      );
    } catch (error) {
      this.logger.error(
        `Error al buscar última cotización para ${codigoIndice}:`,
        error,
      );
      throw error;
    }
  }

  public async ultimaFechaDeCotizacionEnMiDB(
    codigoIndice: string,
  ): Promise<IFecha> {
    try {
      const ultimaCotizacion = await this.indiceRepository
        .createQueryBuilder('cotizacion')
        .leftJoinAndSelect('cotizacion.codigoIndice', 'indice')
        .where('indice.codigoIndice = :codigoIndice', { codigoIndice })
        .orderBy('cotizacion.id', 'DESC')
        .getOne();

      if (!ultimaCotizacion) {
        return DateMomentUtils.transformToUtc('2024-01-01', '00:00');
      } else {
        return DateMomentUtils.transformToUtc(
          ultimaCotizacion.fecha,
          ultimaCotizacion.hora,
        );
      }
    } catch (error) {
      this.logger.error('Error al buscar la última cotización:', error);
      throw error;
    }
  }

  public async ultimaFechaDeGempresa(
    fecha: string,
    hora: string,
  ): Promise<IFecha> {
    const newDate = await DateMomentUtils.getUltimaFechaCotizacionGempresa();
    return DateMomentUtils.transformToUtc(newDate.fecha, newDate.hora);
  }

  async getAllCotizaciones(codigoIndice: string): Promise<IndiceCotizacion[]> {
    try {
      const indice = await this.indiceRepositoryBase.findOne({
        where: { codigoIndice },
      });

      if (!indice) {
        console.log(
          `No se encontró un índice con codigoIndice: ${codigoIndice}`,
        );
        return [];
      }

      // busco las cot relacionadas al indice
      const allCotizacions: IndiceCotizacion[] = await this.indiceRepository
        .createQueryBuilder('cotizacion')
        .innerJoinAndSelect('cotizacion.codigoIndice', 'indice')
        .where('indice.codigoIndice = :codigoIndice', { codigoIndice })
        .orderBy('cotizacion.fecha', 'ASC')
        .addOrderBy('cotizacion.hora', 'ASC')
        .getMany();

      const validCotizacions = allCotizacions.filter((item) => {
        const isValidDate = !isNaN(new Date(item.fecha).getTime());
        return isValidDate;
      });

      return validCotizacions;
    } catch (error) {
      console.error('Error en getAllCotizations:', error);
      return [];
    }
  }
}
