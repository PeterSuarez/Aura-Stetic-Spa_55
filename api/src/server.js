// Punto de entrada: inicia el servidor HTTP.

const os = require('node:os');
const app = require('./app');
const db = require('./db');
const PUERTO = process.env.PORT ?? 3000;

db.iniciar();

// Direcciones IPv4 del computador en la red local (las que usa el celular).
const ipsLocales = () =>
 Object.values(os.networkInterfaces())
 .flat()
 .filter((red) => red && red.family === 'IPv4' && !red.internal)
 .map((red) => red.address);
app.listen(PUERTO, () => {
 console.log(`API disponible en http://localhost:${PUERTO}/api/reservas`);
 for (const ip of ipsLocales()) {
 console.log(`Desde el celular: http://${ip}:${PUERTO}/api/reservas`);
 }
});
