import * as momentTZ from 'moment-timezone';
import { IFecha } from 'src/model/fecha.model';


class DateMomentUtils {
  static timeZone: string = 'Europe/Berlin';
  static horasHabiles = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
  ];

  static getUltimaFechaCotizacionGempresa(): IFecha {
    const fecha = new Date();
    fecha.setMinutes(0);
    const fechaISO = fecha.toISOString();
    const horaUTC = momentTZ(fechaISO).utc();
    const fechaString = horaUTC.format();

    return {
      fecha: fechaString.substring(0, 10),
      hora: fechaString.substring(11, 16)
    };
  }

  static formatearFecha(fecha: IFecha): string {
    return `${fecha.fecha}T${fecha.hora}`;
  }

  static quitarDiasAfechaActual(dias: number): IFecha {
    const date = new Date();
    date.setDate(date.getDate() - dias); // Restar los días especificados
    date.setMinutes(0);
    
    const fecha = date.toISOString();
    const horaTz = momentTZ.tz(
      `${fecha}`,
      DateMomentUtils.timeZone,
    );
    
    const fechaStr = horaTz.format();
    return {
      fecha: fechaStr.substring(0, 10),
      hora: fechaStr.substring(11, 16),
    };
}


  //FECHA YYYY-MM-DD T HH-MM
  static horarioAleman(fecha: string): string {
    console.log('fecha Alemania:', fecha)
    const fechaDate = new Date(DateMomentUtils.getFechaFromString(fecha));
    const fechaStr = fechaDate.toISOString().substring(0, 16);
    console.log('fecha UTC:', fechaStr)
    return fechaStr
  }

  // Convierte una string fecha en un objeto Date en horario de Berlin
  static getFechaFromString(fecha: string): Date {
    const horaTz = momentTZ.tz(
      `${fecha}:00`,
      DateMomentUtils.timeZone,
    );
    return horaTz.toDate();
  }

  // Convierte una string fecha en un objeto Date en horario de Berlin
  static getFechaFromObj(fecha: Date): Date {
    const horaTz = momentTZ.tz(
      `${fecha}:00`,
      DateMomentUtils.timeZone,
    );
    return horaTz.toDate();
  }

  //Convierte una fecha UTC a una fecha UTC +1 con hora 08:00
  static cotDia(fecha: string): string {
    //const horaTz = momentTZ.tz(`${fecha}T08:00`, DateMomentUtils.TIMEZONE);
    const fechaDate = new Date(DateMomentUtils.setHoraFechaString(fecha));
    const fechaStr = fechaDate.toISOString().substring(0, 16);
    return fechaStr
  }

  //Le asigna las 08:00 hrs a una fecha (solo para consultas de cotizaciones del día)
  static setHoraFechaString(fecha: string): Date {
    const horaTz = momentTZ.tz(
      `${fecha}T08:00`,
      DateMomentUtils.timeZone,
    );
    return horaTz.toDate();
  }


  //Suma una cantidad de horas a una fecha
  static sumaHoras(fecha: string, horas: number): string {
    const fechaDate = new Date(DateMomentUtils.setHoraFechaString(fecha));
    fechaDate.setTime(fechaDate.getTime() + (horas * 60 * 60 * 1000));    
    const fechaStr = fechaDate.toISOString().substring(0, 16);
    return fechaStr
  }

  //transforma iFecha a string
  static formatFechaHora(iFecha: IFecha): string {
    return `${iFecha.fecha}T${iFecha.hora}`;
  }

  //Transforma una fecha y hora UTC a UTC+1 y devuelve un objeto con fecha y hora
  static transformUTC1FechaHora(fecha: string, hora: string): IFecha {
    const date = new Date(`${fecha}T${hora}:00.000Z`);
    const horaTz = momentTZ.tz(
      date,
      DateMomentUtils.timeZone,);
    const fechaStr = horaTz.format()
    return {
      fecha: fechaStr.substring(0, 10),
      hora: fechaStr.substring(11, 16),
    };
  }
  static transformFechaHora(fecha: string, hora: string): IFecha {
    const date = new Date(`${fecha}T${hora}:00.000Z`);
    const horaTz = momentTZ.tz(
      date,
      DateMomentUtils.timeZone,);
    const fechaStr = horaTz.format()
    return {
      fecha: fechaStr.substring(0, 10),
      hora: fechaStr.substring(11, 16),
    };
  }
  static transformToUtc(fecha: string, hora: string): IFecha {
    // Crear una fecha combinando fecha y hora, asumiendo que están en UTC
    const date = new Date(`${fecha}T${hora}:00Z`); // Z indica que está en UTC
    
    // Extraer fecha y hora en UTC
    const utcFecha = date.toISOString().substring(0, 10); // Fecha en formato YYYY-MM-DD
    const utcHora = date.toISOString().substring(11, 16); // Hora en formato HH:mm
    
    return {
      fecha: utcFecha,
      hora: utcHora,
    };
  }

}

export default DateMomentUtils;
