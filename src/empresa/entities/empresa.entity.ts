import { Cotizacion } from 'src/cotizacion/entities/cotizacion.entity';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity('empresas')
export class Empresa {
  @PrimaryColumn({
    type: 'varchar',
    length: 100,
  })
  public codEmp: string;

  @Column({
    name: 'nombreEmpresa',
    length: 100,
  })
  public nombreEmp: string;

  @Column({
    name: 'cotizacionInicial',
    type: 'decimal',
    precision: 7,
    scale: 2,
  })
  public cotizacionInicial: number;

  @Column({
    name: 'cantidadAcciones',
    type: 'bigint',
  })
  public cantidadAcciones: number;

  @OneToMany(() => Cotizacion, (cotizacion) => cotizacion.empresa)
  public cotizaciones: Cotizacion[];

  constructor(codEmp: string, nombreEmp: string, cotizationInicial: number, cantidadAcciones: number) {
    this.codEmp = codEmp;
    this.nombreEmp = nombreEmp;
    this.cotizacionInicial = cotizationInicial;
    this.cantidadAcciones = cantidadAcciones;
  }

}
