import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeleteResult,
  FindOneOptions,
  FindOptionsWhere,
  In,
  Repository,
  UpdateResult,
} from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { AxiosResponse } from 'axios';
import clienteAxios from 'axios';
import { baseURL } from 'src/services/axios/config';


@Injectable()
export class EmpresaService {
  private empresas: Empresa[] = []
  private readonly logger = new Logger(EmpresaService.name);
  private readonly arrCodEmp = ['AAPL', 'TSLA', 'JPM', 'ROG.SW', 'SHEL', 'MSFT', 'META'];

  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>
  ) { }

 

  async saveEmpDbByCod(codEmpresa:string): Promise<Empresa> {
    try {
      if(await this.findEmpByCode(codEmpresa) == null){
        const respuesta: AxiosResponse<any, any> = await clienteAxios.get(`${baseURL}/empresas/${codEmpresa}/details`)
        const empresa = new Empresa(
          respuesta.data.codempresa,
          respuesta.data.empresaNombre,
          respuesta.data.cotizationInicial,
          respuesta.data.cantidadAcciones
        );
        const savedEmpresa = await this.empresaRepository.save(empresa)

        console.log('Empresa guardada:(emp.service.back)', savedEmpresa);
        return savedEmpresa;
      }
      else{
        console.log('La empresa ya existe en la base de datos')
      }
    } catch (error) {
      console.error("Error al guardar la empresa:", error);
      throw error;
    }
  }

 

async findEmpByCode(codEmp: string): Promise<Empresa | null> {
  try {
    const empresa = await this.empresaRepository.findOne({
      where: { codEmp },
      relations: ['cotizaciones'], // Incluye las cotizaciones relacionadas si es necesario
    });

    if (!empresa) {
      this.logger.warn(`No se encontró empresa con código: ${codEmp}`);
      return null;
    }

    return empresa;
  } catch (error) {
    this.logger.error(`Error al buscar empresa con código ${codEmp}: ${error.message}`);
    throw new HttpException(
      `Error al buscar empresa con código ${codEmp}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

 

  async findEmpresas(): Promise<Empresa[]> {
    console.log('entro a find empresas')
    try {
      const empresas: Empresa[] = await this.empresaRepository.find({
      })
      return empresas
    } catch (error) {
      console.error("Error buscando empresas:", error);
      throw error;
    }
  }

  async getAllcodsEmpresa(): Promise<string[]> {
    try {
      const empresas: Empresa[] = await this.empresaRepository.find({})
      const arrCodigos: string[] = [];
      empresas.map((cod) => {
        arrCodigos.push(cod.codEmp);
      })
      return arrCodigos
    } catch (error) {
      console.error("Error buscando empresas:", error);
      throw error;
    }
  }
}