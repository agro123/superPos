---
title: Guía — Datos de demostración y claves seguras en producción
status: accepted
owner: equipo frontend
updated: 2026-11-08
related:
  [getting-started.md, ../adr/0013-asesor-ia-gemini.md, ../adr/0015-planes-gratis-y-premium.md]
---

# Datos de demostración y claves seguras en producción

Pasos para cargar los datos de demostración en `superpos-univalle` y dejar todas las claves
protegidas. Hazlos en este orden.

> **Regla de oro:** ninguna clave, contraseña ni archivo de credenciales se guarda en el repositorio.
> Solo viven en GitHub Secrets, en `.env*.local` (ignorados por git) o en `~/.config/superpos/`.

## 0. Antes de empezar: limpia lo que no debe subirse

1. `sup.txt` tiene la contraseña del super admin y quedó en tu último commit. Sácalo **antes** de
   hacer `push`:

   ```bash
   git rm --cached sup.txt
   git commit --amend --no-edit
   git log --stat -1   # confirma que sup.txt ya no aparece
   ```

2. Cambia la contraseña del super admin (ya estuvo escrita en texto plano). Firebase console →
   Authentication → usuario `cristian.daniel.medina@correounivalle.edu.co` → ⋮ → Restablecer
   contraseña, o pídele a Claude que genere una nueva en `~/.config/superpos/`.
3. Revisa que nada sensible esté preparado para subir:

   ```bash
   git status --short
   git ls-files | grep -iE "env|secret|credential|adminsdk|sup\.txt"   # solo debe salir .env.example y código
   ```

## 1. Cuenta de servicio (para el CD y para la carga de demostración)

1. Firebase console → ⚙️ **Configuración del proyecto** → **Cuentas de servicio** →
   **Generar nueva clave privada**. Se descarga un `.json`.
2. Google Cloud console → **IAM y administración** → **IAM** → busca la cuenta
   `firebase-adminsdk-…@superpos-univalle.iam.gserviceaccount.com` → **Editar** y asegúrate de que
   tenga estos roles:
   - **Firebase Admin**
   - **Service Usage Consumer**
   - **Cloud Datastore Index Admin** (si el despliegue de índices falla)
3. Guarda el JSON **fuera del proyecto** (por ejemplo `~/Descargas`), nunca dentro de `superPos/`.
   Lo vas a pegar en GitHub en el paso 3 y luego lo borras.

## 2. Clave de Gemini (opcional, para el Asesor I.A.)

La clave termina dentro del JavaScript público del sitio, así que **debe estar restringida**:

1. Recomendado: crea una **clave nueva** solo para producción (Google AI Studio → API keys) y no
   reutilices la de desarrollo de `.env.local`.
2. Google Cloud console → **APIs y servicios** → **Credenciales** → abre la clave:
   - **Restricciones de aplicaciones → Sitios web**:
     - `https://superpos-univalle.web.app/*`
     - `https://superpos-univalle.firebaseapp.com/*`
   - **Restricciones de API → Restringir clave** → solo **Generative Language API**.
   - Guarda.
3. Opcional: **APIs y servicios → Generative Language API → Cuotas**: baja las solicitudes por día.
4. Verifica la restricción (debe fallar fuera de tu dominio):

   ```bash
   curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=TU_CLAVE" | head -5
   # Esperado: error 403 "API_KEY_HTTP_REFERRER_BLOCKED" (sin referer permitido)
   ```

## 3. Secretos y variables en GitHub

GitHub → repositorio → **Settings → Environments → New environment** → `production`.

1. **Required reviewers**: agrégate a ti. Ningún despliegue usará los secretos sin tu aprobación.
2. **Deployment branches**: solo `main`.
3. **Environment secrets** (no se pueden volver a leer, ni por ti):

   | Nombre                     | Valor                                                        |
   | -------------------------- | ------------------------------------------------------------ |
   | `FIREBASE_SERVICE_ACCOUNT` | Contenido completo del JSON del paso 1                       |
   | `DEMO_PASSWORD`            | Contraseña de los usuarios de demo (10+ caracteres, nueva)   |
   | `VITE_GEMINI_API_KEY`      | Clave restringida del paso 2 (déjalo sin crear si no hay IA) |

   Genera la contraseña de demo así y guárdala en un gestor de contraseñas:

   ```bash
   node -e "console.log('Demo-' + require('crypto').randomBytes(9).toString('base64url'))"
   ```

4. **Environment variables** (no son secretas: ya están en el sitio público):

   | Nombre                              | Valor                                       |
   | ----------------------------------- | ------------------------------------------- |
   | `FIREBASE_PROJECT_ID`               | `superpos-univalle`                         |
   | `VITE_FIREBASE_API_KEY`             | el de tu `.env.firebase.local`              |
   | `VITE_FIREBASE_AUTH_DOMAIN`         | `superpos-univalle.firebaseapp.com`         |
   | `VITE_FIREBASE_STORAGE_BUCKET`      | `superpos-univalle.firebasestorage.app`     |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `526740365258`                              |
   | `VITE_FIREBASE_APP_ID`              | `1:526740365258:web:562b0080d906692e9f7933` |
   | `VITE_GEMINI_MODEL`                 | `gemini-2.5-flash` (opcional)               |

5. **Borra el JSON** de la cuenta de servicio de tu computador:

   ```bash
   rm ~/Descargas/superpos-univalle-firebase-adminsdk-*.json
   ```

## 4. Cargar los datos de demostración

1. Sube los cambios a `main` (`git push`). El **CI** corre; si pasa, el **CD** pide tu aprobación y
   despliega.
2. Para la demo: GitHub → **Actions → CD → Run workflow** → marca **load_demo** → **Run** → aprueba.
3. Al terminar, el log dice `Listo: 5 usuarios y … documentos de demostración.`
4. Entra a https://superpos-univalle.web.app con:

   | Usuario                  | Qué muestra                                            |
   | ------------------------ | ------------------------------------------------------ |
   | `rosa@superpos.test`     | Dueña del Minimercado (**Premium**)                    |
   | `ana@superpos.test`      | Dueña del Café (**Gratis**) y empleada del Minimercado |
   | `carlos@superpos.test`   | Empleado (vende desde un terminal)                     |
   | `luis@superpos.test`     | Empleado del Café                                      |
   | `invitado@superpos.test` | Tiene una invitación pendiente                         |

   Contraseña: la de `DEMO_PASSWORD`. Para repetir la carga (restaurar la demo), vuelve a ejecutar el
   workflow con **load_demo**: sobrescribe los mismos documentos.

### Alternativa: cargarla desde tu computador

Solo si no quieres usar Actions. El JSON nunca dentro del proyecto, y bórralo al terminar:

```bash
DEMO_PROJECT_ID=superpos-univalle DEMO_CONFIRM=superpos-univalle \
GOOGLE_APPLICATION_CREDENTIALS=~/Descargas/sa.json \
DEMO_PASSWORD='la-de-tu-gestor' pnpm demo
rm ~/Descargas/sa.json
```

`pnpm demo` se niega a correr sin confirmación, con la contraseña del seed (`superpos123`) o apuntando
a un emulador. `pnpm seed` sigue funcionando solo contra los emuladores.

## 5. Revisión final

- [ ] `sup.txt` fuera del commit y la contraseña del super admin cambiada.
- [ ] Cuenta de servicio solo en el secreto `FIREBASE_SERVICE_ACCOUNT` (JSON local borrado).
- [ ] Entorno `production` con revisor obligatorio y solo rama `main`.
- [ ] Clave de Gemini restringida por dominio y API (o sin configurar).
- [ ] `DEMO_PASSWORD` distinta de `superpos123` y guardada en un gestor de contraseñas.
- [ ] Reglas desplegadas (las aplica el CD en cada despliegue).
- [ ] Ningún `.env*` ni `*adminsdk*.json` en `git ls-files`.
