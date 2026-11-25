// Punto de entrada: inicia el servidor HTTP.

const os = require('node:os');
const app = require('./app');
const db = require('./db');
const PUERTO = process.env.PORT ?? 3000;

async function iniciarServidor() {
 await db.iniciar();

 // Direcciones IPv4 del computador en la red local (las que usa el celular).
 const ipsLocales = () =>
  Object.values(os.networkInterfaces())
  .flat()
  .filter((red) => red && red.family === 'IPv4' && !red.internal)
  .map((red) => red.address);

 app.listen(PUERTO, () => {
  console.log(`API disponible en el puerto ${PUERTO} (/api/reservas)`);
  // En la nube (producción) no tiene sentido mostrar la IP de la red local.
  if (process.env.NODE_ENV !== 'production') {
   for (const ip of ipsLocales()) {
    console.log(`Desde el celular: http://${ip}:${PUERTO}/api/reservas`);
   }
  }
 });
}

iniciarServidor().catch((error) => {
 console.error('No se pudo iniciar la API:', error);
 process.exitCode = 1;
});
