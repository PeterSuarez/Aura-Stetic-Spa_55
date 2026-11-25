# Aura Stetic Spa
# Informacion
node -v  v26.13.0
ng version
Angular CLI       : 22.2.6
Node.js           : 26.13.0
Package Manager   : npm 11.20.0
Operating System  : win32 x64

# Paso 1 en un terminal ejecutar los comandos y no se debe cerrar 
# dirección Aura-Stetic-Spa_55\api>
cd api
npm test
npm start o npm run dev

# Paso 2 en otro terminar ejecutar los comandos y no se debe cerrar
# dirección Aura-Stetic-Spa_55\web>
cd web
ng serve


Después de ejecutar ng serve tiene que dar por ejemplo un link como http://localhost:4200/ ese link copiarlo y pegarlo en el buscador siempre va a ejecutar en el puerto 4200

# Paso 3 en otro terminal ejecutar los comandos y no se debe cerrar
# dirección Aura-Stetic-Spa_55\movil>
cd movil
npm install
npx expo start -c o expo start
# Para simular en la web
npx expo start --web 

Da un QR que se escanea en la aplicación Expo Go se encuentra play estore 
Genera un link como Web: http://localhost:8081 para simular en un celular se simula en el buscador 



---

# Despliegue en la nube (APE-4)

**API pública:** https://aura-stetic-spa-55.onrender.com/api/reservas
**Salud:** https://aura-stetic-spa-55.onrender.com/api/salud → `{"estado":"ok"}`

## Arquitectura

```
GitHub (push) ──► Render Web Service (Docker, HTTPS) ──► Render PostgreSQL (gestionada)
                          ▲
        Web Angular / App móvil Expo consumen /api/reservas
```

- `api/src/db.js` elige la base: **PostgreSQL** si existe `DATABASE_URL` (o `DB_MOTOR=postgres`); si no, **SQLite** local.
- `api/Dockerfile` construye la imagen de la API; `api/.dockerignore` excluye `node_modules`, pruebas, `.env` y `*.db`.

## Ejecutar con Docker en el computador

```bash
copy .env.example .env      # luego cambiar POSTGRES_PASSWORD
docker compose up --build   # API en http://localhost:3000, PostgreSQL con volumen postgres_data
```

Los datos se conservan entre reinicios gracias al volumen `postgres_data`.

Solo la imagen de la API (usa SQLite dentro del contenedor):

```bash
cd api
docker build -t aura-api .
docker run --rm -p 3000:3000 aura-api
```

## Render

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Internal Database URL de la base PostgreSQL de Render (secreto) |
| `CORS_ORIGINS` | `http://localhost:4200,http://localhost:8081` (+ URL de la web si se publica) |
| `NODE_ENV` | `production` |

- Language: Docker · Root Directory: `api` · Health Check Path: `/api/salud`
- Despliegue continuo: cada `git push` a la rama principal genera un nuevo despliegue.

## Seguridad

`.env`, contraseñas, la cadena de conexión y los archivos `*.db` **no** se suben al repositorio (ver `.gitignore`).
