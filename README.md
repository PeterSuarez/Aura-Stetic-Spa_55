# Aura Stetic Spa
# Informacion
node -v  v26.13.0
ng version
git version 2.46.2.windows.1
Angular CLI       : 22.2.6
Node.js           : 26.13.0
Package Manager   : npm 11.20.0
Operating System  : win32 x64
# Despliegue en la nube (APE-4)
# Paso 1 en otro terminal ejecutar los comandos y no se debe cerrar
# dirección Aura-Stetic-Spa_55\movil>
cd movil
npm install
npx expo start -c o expo start
# Para simular en la web
npx expo start --web

# Para conbrobar los datos guardados
**API pública:** https://aura-stetic-spa-55.onrender.com/api/reservas
**Salud:** https://aura-stetic-spa-55.onrender.com/api/salud → `{"estado":"ok"}`

# Para visualizar los datos en aplicacion en citas
Usuario: admin
Contraseña: aura2026

por favor no subir fotos pesadas






# Opcional
# Paso 2 en un terminal ejecutar los comandos y no se debe cerrar
# dirección Aura-Stetic-Spa_55\api>
cd api
npm test
npm start o npm run dev

# Paso 3 en otro terminar ejecutar los comandos y no se debe cerrar
# dirección Aura-Stetic-Spa_55\web>
cd web
ng serve

Después de ejecutar ng serve tiene que dar por ejemplo un link como http://localhost:4200/ ese link copiarlo y pegarlo en el buscador siempre va a ejecutar en el puerto 4200

# Paso 4 en otro terminal ejecutar los comandos y no se debe cerrar
# dirección Aura-Stetic-Spa_55\movil>
cd movil
npm install
npx expo start -c o expo start
# Para simular en la web
npx expo start --web 

Da un QR que se escanea en la aplicación Expo Go se encuentra play estore 
Genera un link como Web: http://localhost:8081 para simular en un celular se simula en el buscador 




$img = [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\PETER\Pictures\comprobante.jpg"))

$body = @{
    nombre      = "Maria"
    telefono    = "0999000000"
    servicio    = "Facial renueva tu luminosidad"
    fecha       = "2026-11-28"
    hora        = "15:00"
    notas       = $null
    comprobante = "data:image/jpeg;base64,$img"
    estado      = "pendiente"
} | ConvertTo-Json

Invoke-RestMethod -Uri https://aura-stetic-spa-55.onrender.com/api/reservas -Method Post -ContentType 'application/json' -Body $body
