import { Entity, Column, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { IndiceCotizacion } from "../../indiceCotizaciones/entities/indiceCotizacion.entity";

@Entity('indices')
export class Indice {
  @PrimaryGeneratedColumn({
    type: 'int'
  })
  public id: number;

  @Column({
    name: 'codigoIndice',
    type: "varchar",
    length: 10,
    default: "vacio",
  })
  @Index()
  public codigoIndice: string;

  @Column({
    name: 'nombreIndice',
    length: 100,
    default: "vacio",
  })
  public nombreIndice: string;

  @Column({
    name: 'valorFinalIndice',
    type: 'bigint',
    default: 0,
  })
  public valorFinalIndice: number;

  @OneToMany(() => IndiceCotizacion, (cotizacion) => cotizacion.codigoIndice)
  public cotizaciones: IndiceCotizacion[];
}