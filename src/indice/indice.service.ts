import { Injectable } from '@nestjs/common';
import { Indice } from './entities/indice.entity';
import clienteAxios, { AxiosResponse } from 'axios';
import { baseURL } from 'src/services/axios/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IFecha } from 'src/model/fecha.model';
import DateMomentUtils from 'src/utils/dateMomentsUtils';

@Injectable()
export class IndiceService {
  constructor(
    @InjectRepository(Indice)
    private readonly indiceRepository: Repository<Indice>,
  ) {}

  async createIndice(body): Promise<void> {
    try {
      await clienteAxios.post(`${baseURL}/indices`, body);
    } catch (error) {
      console.error('El indice ya existe', 409);
    }
  }
  public async saveAllIndicesDb(): Promise<Indice[]> {
    const respuesta: AxiosResponse<any, any> = await clienteAxios.get(
      `${baseURL}/indices`,
    );
    console.log('respuesta.data:', respuesta.data);

    const promesasGuardado = respuesta.data.map(async (indice) => {
      if ((await this.findIndiceByCod(indice.code)) == null) {
        console.log('indice.data:', indice);

        // Usamos el método `create` para inicializar la entidad
        const newIndice = this.indiceRepository.create({
          codigoIndice: indice.code,
          nombreIndice: indice.name,
          valorFinalIndice: indice.valor,
        });

        console.log('newIndice:', newIndice);
        await this.indiceRepository.save(newIndice);
        return newIndice;
      } else {
        console.log(
          `El índice code: ${indice.code} ya existe en la base de datos`,
        );
      }
    });

    await Promise.all(promesasGuardado);
    return respuesta.data;
  }

  async findIndiceByCod(code: string): Promise<Indice> {
    try {
      const indiceCotizacion: Indice = await this.indiceRepository.findOne({
        where: { codigoIndice: code },
      });
      console.log('indiceCotizacion:', indiceCotizacion);
      return indiceCotizacion;
    } catch (error) {
      console.error('Error buscando indice Cotizacion:', error);
      throw error;
    }
  }

  async getAllCods(): Promise<string[]> {
    try {
      const indices = await this.indiceRepository.find({
        select: ['codigoIndice'],
      });

      return indices.map((indice) => indice.codigoIndice);
    } catch (error) {
      console.error('Error obteniendo todos los códigos de índices:', error);
      throw error;
    }
  }
}
