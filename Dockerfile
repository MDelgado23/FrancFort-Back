FROM node:16

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia los archivos del backend al contenedor
COPY . .

# Instala las dependencias
RUN npm install

# Expone el puerto que usará la app
EXPOSE 3001

# Copia el script wait-for-it.sh
COPY wait-for-it.sh /usr/bin/wait-for-it.sh
RUN chmod +x /usr/bin/wait-for-it.sh

# Ejecuta la aplicación
CMD ["npm", "run", "start"]