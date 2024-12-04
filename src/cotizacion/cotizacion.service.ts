import { Injectable, Logger } from '@nestjs/common';
import { Cotizacion } from './entities/cotizacion.entity';
import { Between, Equal, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import clienteAxios from 'axios';
import { baseURL } from 'src/services/axios/config';
import DateMomentUtils from 'src/utils/dateMomentsUtils';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { IFecha } from 'src/model/fecha.model';
import { EmpresaService } from 'src/empresa/empresa.service';
import { ICotizacionCard } from './model/iCotizacion';


@Injectable()
export class CotizacionesService {
  private readonly logger = new Logger(CotizacionesService.name);
  constructor(
    @InjectRepository(Cotizacion)
    private readonly cotizacionRepository: Repository<Cotizacion>,

    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  
    private readonly empresaService: EmpresaService) { }

    

  
  public async lastDateCotizacionGmpresa(): Promise<IFecha> {
    const fecha = DateMomentUtils.getUltimaFechaCotizacionGempresa()
    
    return fecha;
  }

  
  async findLastCotizacionDb(codEmp: string): Promise<IFecha> {
    try {
      
      const empresa = await this.empresaRepository.findOne({
        where: { codEmp: codEmp },
      })
      if (!empresa) {
        console.log(`No se encontró una empresa con codEmpresa: ${codEmp}`);
        return null;
      }
      const lastCotizacion: Cotizacion[] = await this.cotizacionRepository.find(
        {
          where: { empresa: Equal(empresa.codEmp) },
          order: { id: "DESC" },
          take: 1,
        })
        
      const dateCotizacion = lastCotizacion[0];
    
      if (!dateCotizacion || !dateCotizacion.fecha) {
        const fecha: IFecha = DateMomentUtils.transformUTC1FechaHora('2024-01-01', '00:00');
        return fecha;
      } else {
        const fecha: IFecha = DateMomentUtils.transformUTC1FechaHora(dateCotizacion.fecha, dateCotizacion.hora);
        return fecha;
      }
        
    } catch (error) {
      console.error("Error al encontrar la última cotización:", error);
      return null;
    }
  }


  
  public async saveCotizacionDb(cotizacion: Cotizacion) {
    try {       
      if (await this.findCotizacion(cotizacion) == null) {
      const savedCotizacion = await this.cotizacionRepository.save(cotizacion)
        return savedCotizacion;
      } else {
        
      }
    } catch (error) {
      console.error("Error al guardar la cotizacion:", error);
      throw error;
    }
  }


  async findCotizacionById(idCotizacion: number): Promise<Cotizacion> {
    try {
      const cotizaciones: Cotizacion = await this.cotizacionRepository.findOne({
        where: { id: idCotizacion },
      })
      return cotizaciones
    } catch (error) {
      console.error("Error buscando cotizacion:", error);
      throw error;
    }
  }


  
  async findCotizacion(cotizacion: Cotizacion): Promise<Cotizacion | null> {
    try {
      
      const cotizacionEncontrada = await this.cotizacionRepository.findOne({
        where: {
          fecha: cotizacion.fecha,
          hora: cotizacion.hora,
          empresa: { codEmp: cotizacion.empresa.codEmp }, 
        },
        relations: ['empresa'], 
      });
  
      return cotizacionEncontrada || null;
    } catch (error) {
      console.error('Error buscando cotización:', error);
      throw error;
    }
  }
  




  
  public async getCotizacionesEntreFechas(codEmp: string, grFecha: string, lrFecha: string): Promise<Cotizacion[]> {
    const empresa = await this.empresaRepository.findOne({ where: { codEmp } });
    const respuesta: AxiosResponse<any, any> = await clienteAxios.get(`${baseURL}/empresas/${codEmp}
      /cotizaciones?fechaDesde=${grFecha}&fechaHasta=${lrFecha}`);
      const promesasGuardado = respuesta.data.map(async (cotizacion) => {
        
        if (DateMomentUtils.horasHabiles.includes(cotizacion.hora)) {
          const newCotizacion = new Cotizacion(
            cotizacion.id,
            cotizacion.fecha,
            cotizacion.hora,
            cotizacion.cotization,
            empresa
          );
          await this.saveCotizacionDb(newCotizacion);
        }
      });
  
      await Promise.all(promesasGuardado);
    return respuesta.data;

  }

  
  public async saveAllCotizacionesDb(codEmp: string) {
    const fechaUltimaDb = await this.findLastCotizacionDb(codEmp);
    const strUltimaDb = DateMomentUtils.formatFechaHora(fechaUltimaDb)
    const fechaActual = await this.lastDateCotizacionGmpresa();
    const strFechaActual = DateMomentUtils.formatFechaHora(fechaActual)
    this.getCotizacionesEntreFechas(codEmp, strUltimaDb, strFechaActual)
    this.logger.log(`todas las cotizaciones actualizadas`)
  }

 

  async getallCotizacions(codEmp: string): Promise<Cotizacion[]> {
    try {
      const empresa = await this.empresaRepository.findOne({
        where: { codEmp: codEmp },
      })
      if (!empresa) {
        console.log(`No se encontró una empresa con codEmpresa: ${codEmp}`);
        return null;
      }
      const lastCotizacions: Cotizacion[] = await this.cotizacionRepository.find(
        {
          where: { empresa: Equal(empresa.codEmp) },
          order: { id: "DESC" },
        })
      console.log('lastCotizacions:', lastCotizacions)
      return Promise.all(lastCotizacions)
    }
    catch (error) {
      console.error("Error getlastCotizacionCard:", error);
      return null;
    }
  }







  //            CALCULO DE PARTICIPACION EMPRESAS
  

  async calcularParticipaciones(seleccion: string): Promise<{ empresa: string, participacion: number }[]> {
    const arrCodigosEmpresas = await this.empresaService.getAllcodsEmpresa();
    const datosEmpresas = await Promise.all(arrCodigosEmpresas.map(async (codEmp) => {
      const promedio = seleccion === 'DIA'
        ? await this.calcularPromedioDia(codEmp)
        : await this.calcularPromedioMes(codEmp);
      const cantidadAcciones = await this.cantidadAcciones(codEmp);
      return { codEmp, promedio, cantidadAcciones };
    }));

    let totalMercado = 0;
    const capacitaciones = datosEmpresas.map(({ codEmp, promedio, cantidadAcciones }) => {
      const capitalizacion = promedio * (cantidadAcciones || 0);
      totalMercado += capitalizacion;
      return { codEmp, capitalizacion };
    });
    const participaciones = capacitaciones.map(({ codEmp, capitalizacion }) => ({
      empresa: codEmp,
      participacion: parseFloat((totalMercado > 0 ? (capitalizacion / totalMercado) * 100 : 0).toFixed(2)),
    }));
    return participaciones;
  }
  

  async calcularPromedioDia(codEmp: string): Promise<number | null> {
    let nowDate = DateMomentUtils.getUltimaFechaCotizacionGempresa()

    try {
      const empresa = await this.empresaRepository.findOne({
        where: { codEmp: codEmp },
      });

      if (!empresa) {
        console.log(`No se encontró una empresa con codEmpresa: ${codEmp}`);
        return null;
      }

      
      let lastCotizacions = await this.cotizacionRepository.find({
        where: {
          fecha: nowDate.fecha,
          empresa: Equal(empresa.codEmp)
        },
        order: { id: "ASC" },
      });

      
      if (lastCotizacions.length === 0) {
        nowDate = DateMomentUtils.quitarDiasAfechaActual(1);
        lastCotizacions = await this.cotizacionRepository.find({
          where: {
            fecha: nowDate.fecha,
            empresa: Equal(empresa.codEmp)
          },
          order: { id: "ASC" },
        });
      }

     
      if (lastCotizacions.length === 0) {
        console.log(`No se encontraron cotizaciones para el código de empresa ${codEmp} en las fechas recientes.`);
        return null;
      }

      let total = 0;
      for (const element of lastCotizacions) {
        total += Number(element.cotizacion)
      }
      const promedio = parseFloat((total / lastCotizacions.length).toFixed(2));
      

      return promedio

    } catch (error) {
      console.error('Error al calcular el promedio:', error);
      return 0;
    }

  }


  async calcularPromedioMes(codEmp: string): Promise<number> {
    let nowDate = DateMomentUtils.getUltimaFechaCotizacionGempresa();
    
    let last30Days=DateMomentUtils.quitarDiasAfechaActual(30)
    

    try {
     
      const empresa = await this.empresaRepository.findOne({
        where: { codEmp: codEmp },
      });

      if (!empresa) {
        console.log(`No se encontró una empresa con codEmpresa: ${codEmp}`);
        return null;
      }

     
      let lastCotizacions = await this.cotizacionRepository.find({
        where: {
          empresa: Equal(empresa.codEmp),
          fecha: Between(last30Days.fecha, nowDate.fecha),
        },
        order: { id: "ASC" },
      });

      
      if (lastCotizacions.length === 0) {
        console.log(`No se encontraron cotizaciones para el código de empresa ${codEmp} en las fechas recientes.`);
        return null;
      }

      let total = 0;
      for (const element of lastCotizacions) {
        total += Number(element.cotizacion)
      }
      const promedio = parseFloat((total / lastCotizacions.length).toFixed(2));
      

      return promedio

    } catch (error) {
      console.error('Error al calcular el promedio:', error);
      return 0;
    }
  }

  async cantidadAcciones(codEmp: string): Promise<number|null> {
    const empresa = await this.empresaRepository.findOne({
      where: { codEmp: codEmp },
    })
    
    return empresa.cantidadAcciones
  }

  async getlastCardCot(codEmp: string): Promise<ICotizacionCard> {
    try {
      const empresa = await this.empresaRepository.findOne({
        where: { codEmp: codEmp },
      })
      if (!empresa) {
        console.log(`No se encontró una empresa con codEmpresa: ${codEmp}`);
        return null;
      }
      const lastCotizacion: Cotizacion[] = await this.cotizacionRepository.find(
        {
          where: { empresa: Equal(empresa.codEmp) },
          order: { id: "DESC" },
          take: 2,
        })
      const cambioPorcentual = ((lastCotizacion[0].cotizacion - lastCotizacion[1].cotizacion) / lastCotizacion[1].cotizacion) * 100
      const card: ICotizacionCard = {
        codEmpresa: codEmp,
        nombreEmpresa: empresa.nombreEmp,
        valorActual: lastCotizacion[0].cotizacion,
        fluctuacion: parseFloat(cambioPorcentual.toFixed(3)),
      };
      return card
    }
    catch (error) {
      console.error("Error getlastCotizacionCard:", error);
      return null;
    }
  }


}


