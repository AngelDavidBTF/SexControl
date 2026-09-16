# Pruebas de SexControl

Hay tres niveles, y cada uno responde a una pregunta distinta:

| Comando | Qué comprueba | Necesita red |
|---|---|---|
| `npm test` | Lógica pura: liga, duelos, títulos, temporadas, actividad, muro y logros (Karma + Jasmine). | No |
| `npm run test:rules` | Que las reglas de Firestore dejan pasar lo que deben y **rechazan los intentos de trampa**. | Sí |
| `npm run test:e2e` | La app entera sobre la **build de producción**, con dos cuentas reales. | Sí |
| `npm run test:all` | Todo lo anterior, con la build de por medio. | Sí |

## Por qué los E2E van contra la build de producción

Porque un fallo real se coló por no hacerlo: la app arrancaba Ionic con un proveedor que no
correspondía y, en la build optimizada, **ningún componente llegaba a registrarse**: la pantalla
salía en negro. Con `ionic serve` funcionaba, así que las pruebas de entonces no lo vieron.
`tests/e2e/smoke.e2e.js` existe justo para que eso no vuelva a pasar desapercibido.

## Qué hace falta para las pruebas con red

Estas pruebas corren contra el proyecto **real** de Firebase (`sexcontrol-6c000`), no contra los
emuladores. Hacen falta dos cosas que no están en el repositorio:

### 1. Token de depuración de App Check

App Check bloquea cualquier petición que no venga de la app de verdad. Para las pruebas se usa un
token de depuración registrado en **Firebase Console → App Check → Apps → app web → Gestionar
tokens de depuración**.

Ponlo en el entorno:

```bash
export SEXCONTROL_APPCHECK_DEBUG_TOKEN="el-token"
```

o crea `tests/app-check.local.json` (está en `.gitignore`):

```json
{ "debugToken": "el-token" }
```

**Nunca subas el token al repositorio.** Si se filtra, bórralo en la consola y registra otro.

### 2. Cuentas de prueba

Por defecto se usan tres cuentas con buzón público de Mailinator. Las dos primeras (`A` y `B`)
deben tener **el email verificado**, porque la app lo exige para entrar; la tercera solo se usa
desde Node para comprobar lo que NO puede hacer quien no es amigo ni miembro.

Se pueden cambiar por entorno: `SEXCONTROL_TEST_A`, `SEXCONTROL_TEST_B`, `SEXCONTROL_TEST_C` y
`SEXCONTROL_TEST_PASSWORD`.

Para verificar una cuenta nueva: regístrala en la app, abre el buzón en
[mailinator.com](https://www.mailinator.com) y pulsa el enlace del correo de Firebase. Ojo: el
registro está limitado por IP, así que conviene reutilizar las cuentas en lugar de crear otras.

## Integración continua

En cada push y cada pull request, GitHub Actions ejecuta lo que no necesita secretos: los tests
unitarios, la build de producción y `tests/ci/build-smoke.js`, que abre esa build y comprueba que
la pantalla de login se ve (la red de seguridad contra la pantalla en negro). Las reglas y los E2E
se lanzan a mano, porque necesitan el token de App Check y las cuentas de prueba.

## Antes de la primera vez

```bash
npm install
npx playwright install chromium   # el navegador de los E2E (pesa ~150 MB)
```

Para `npm test` hace falta un Chrome instalado. Si no lo encuentra, indícalo:

```bash
export CHROME_BIN="/ruta/a/chrome"
```

## Cómo se ejecutan

```bash
npm test                                   # lógica pura, rápido
npm run build -- --configuration production
npm run test:rules
npm run test:e2e
```

Los E2E sirven `www/` en `http://localhost:8200` durante la prueba. Para probar contra el sitio ya
publicado:

```bash
SEXCONTROL_TEST_URL=https://sexcontrol-6c000.web.app npm run test:e2e
```

Las capturas se guardan en `tests/.out/` (fuera del control de versiones).

## Sobre los datos

Las pruebas con red **escriben en la base de datos real**, siempre con las cuentas de prueba, y
limpian lo que crean al terminar (amistades, grupos, invitaciones y muros). Si una se corta a
medias puede dejar algún grupo `test-*` o `e2e-*` suelto; se pueden borrar sin miedo.

Las reglas se prueban contra las **desplegadas**, no contra el archivo local. Despliega antes de
probar los cambios:

```bash
npx firebase-tools deploy --only firestore:rules --project sexcontrol-6c000
```

Ten en cuenta que las reglas tardan unos segundos en propagarse: si la primera comprobación falla
justo después de desplegar, repite la ejecución.
