import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Empresa } from './entities/empresa.entity';
import { EmpresaService } from './empresa.service';
import  { arrCodEmp }  from 'src/utils/arrEmp';

@Controller('empresas')

export class EmpresaControllers {
  logger: any;
  constructor(private readonly empresaService: EmpresaService,
    
  ) { }



  /* @Get('/:codEmp')
  async getAll(@Param('codEmp') codEmp: string): Promise<Empresa> {
    return this.empresaService.getEmpByCod(codEmp)
  } */


  /* @Get('/save/:codEmp')
  async saveEmpresa(@Param('codEmp') codEmp: string): Promise<Empresa> {
    return this.empresaService.saveEmpDbByCod(codEmp)
  } */

  @Get('/details/:codEmp')
async getEmpresaDetails(@Param('codEmp') codEmp: string): Promise<Empresa | null> {
  return await this.empresaService.findEmpByCode(codEmp);
}



  @Post('/saveall')
  async saveEmpresasDb(): Promise<void> {
    console.log("Todas las empresas");
    const arrCods = arrCodEmp;

    try {
      for (const codigo of arrCods) {
        await this.empresaService.saveEmpDbByCod(codigo); 
    }
      console.log("Todas las empresas fueron guardadas correctamente.");
    } catch (error) {
      console.error("Error al guardar las empresas:", error);
    }
  }



  @Get('/buscar/db')
  async findEmpresas(): Promise<Empresa[]> {
    try {
      return await this.empresaService.findEmpresas();
    } catch (error) {
      console.error(error)
    }
  }
}