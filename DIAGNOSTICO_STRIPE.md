# 🔍 Diagnóstico de Integración Stripe

## Problema Reportado
- ❌ Se muestra pantalla azul (spinner) sin redirigir a Stripe
- ❌ No se recibe email con credenciales después del pago

## ✅ Cambios Realizados

### 1. Frontend (PreinscripcionPage.jsx)
- ✅ Quitados botones innecesarios "Cancelar Solicitud"
- ✅ Agregado logging detallado en `handleProceedToPayment()`:
  - Muestra en consola la solicitud de pago
  - Muestra la respuesta completa del servidor
  - Muestra la URL de Stripe
  - Muestra errores detallados si algo falla

### 2. API (axios.js)
- ✅ Arreglado `baseURL` para usar `VITE_API_URL` del .env
- ✅ Fallback a `http://localhost:8000/api` si no está configurado
- ✅ Asegura conexión correcta con backend

### 3. Backend
- ✅ Agregado endpoint `/api/diagnostico` para revisar configuración

---

## 🚀 Cómo Diagnosticar

### Paso 1: Verificar Configuración
Abre en el navegador:
```
http://localhost:8000/api/diagnostico
```

Deberías ver algo como:
```json
{
  "stripe_configured": true,
  "stripe_secret_key": "sk_test_51Tf2CTL...",
  "mail_configured": true,
  "mail_from": "mrgrueso2005@gmail.com",
  "api_url": "http://localhost",
  "frontend_url": "http://localhost:5173",
  "environment": "local"
}
```

✅ Si ves `"stripe_configured": true` y `"mail_configured": true`, todo está OK.
❌ Si ves `false`, revisa el .env del backend.

### Paso 2: Revisar Consola del Navegador
1. Abre DevTools (F12 o Ctrl+Shift+I)
2. Ve a la pestaña **Console**
3. Completa el formulario de preinscripción
4. Haz clic en "Pagar 700 BS Ahora"
5. En la consola deberías ver logs como:
   ```
   📡 Enviando solicitud de pago para postulante: 123
   ✅ Respuesta del servidor: {checkout_url: "https://checkout.stripe.com/...", session_id: "cs_..."}
   🔗 Redirigiendo a Stripe URL: https://checkout.stripe.com/...
   ```

❌ Si ves error:
```
❌ Error en handleProceedToPayment: ...
```
Revisa qué dice el error exacto y qué está en `Response data`.

### Paso 3: Probar Manualmente con CURL (Backend)

Primero, obtén un postulante verificado (o crea uno):
```bash
# Desde terminal en backend/
curl -X POST http://localhost:8000/api/postulantes/1/pago \
  -H "Content-Type: application/json" \
  -d '{}'
```

Deberías recibir:
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/cs_...",
  "session_id": "cs_..."
}
```

❌ Si ves error "El postulante debe estar verificado":
- El postulante estado no es "Verificado"
- Necesita llamar primero a `/postulantes/{id}/verificar`

❌ Si ves error "Requisitos documentales incompletos":
- Faltan documentos por verificar
- Revisa en la BD la tabla `requisitos_documentales`

---

## 📧 Problema: No Recibo Email

El email se envía desde el **webhook de Stripe**, NO desde el frontend.

### Flujo Correcto:
```
1. Usuario completa pago en Stripe ✅
2. Stripe envía evento "checkout.session.completed" a tu webhook
3. Tu backend (webhook) recibe el evento
4. Backend crea User
5. Backend envía email ✅
6. Usuario ve página de éxito
```

### Causas Posibles del Email No Recibido:

#### 1️⃣ Webhook no está configurado en Stripe
**Solución**: En dashboard de Stripe:
- Ve a Developers → Webhooks
- Agrega endpoint: `https://tudominio.com/api/stripe/webhook`
  - Para localhost: Usa Stripe CLI
  - Para producción: USA tu dominio real
- Evento: `checkout.session.completed`
- Copia el webhook secret y actualiza en `.env`:
  ```
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

#### 2️⃣ Credenciales de Gmail incorrectas
Verificar en `.env`:
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USERNAME=mrgrueso2005@gmail.com
MAIL_PASSWORD="hhsw nmrf ekcv trvq"  ← Contraseña de aplicación (NO tu contraseña de Gmail)
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="mrgrueso2005@gmail.com"
```

✅ Usar **contraseña de aplicación**, no contraseña de Gmail normal
- Ve a myaccount.google.com → Seguridad → Contraseñas de aplicación
- Genera una para "Mail"
- Copia esa contraseña al .env

#### 3️⃣ MAIL_MAILER está en 'log' en lugar de 'smtp'
Verificar `.env`:
```
# ❌ INCORRECTO (solo guarda en logs, no envía emails)
MAIL_MAILER=log

# ✅ CORRECTO (envía via Gmail)
MAIL_MAILER=smtp
```

#### 4️⃣ El webhook no está siendo llamado
Revisar logs del servidor:
```bash
cd backend
tail -f storage/logs/laravel.log
```

Si ves en los logs un error como:
```
Error al enviar correo de credenciales: ...
```

Significa que el webhook SÍ llegó pero falló el email. Revisa las credenciales de Gmail.

---

## 🧪 Prueba Completa Paso a Paso

### Ambiente: 
- Backend ejecutándose en `http://localhost:8000`
- Frontend ejecutándose en `http://localhost:5173`

### Pasos:
1. **Abre frontend**: http://localhost:5173
2. **Ve a Preinscripción**
3. **Llena formulario** con datos válidos:
   - Usa CI diferente cada vez
   - Usa email diferente cada vez (ej. test1@gmail.com, test2@gmail.com)
   - Carreras diferentes
4. **Revisa datos** en paso 2
5. **Haz clic "Pagar 700 BS Ahora"**
6. **Abre DevTools** (F12) → Console para ver logs
7. **En Stripe**, usa tarjeta de prueba:
   ```
   ✅ 4242 4242 4242 4242
   Exp: 12/34
   CVC: 123
   ```
8. **Verifica**:
   - ✅ Deberías redirigir a página de éxito
   - ✅ En logs del backend deberías ver que User fue creado
   - ✅ En tu correo deberías recibir las credenciales (puede tardar 1-2 minutos)

---

## 📋 Checklist de Solución

- [ ] Visitaste `/api/diagnostico` y todo está `true`
- [ ] Viste logs en DevTools → Console con ✅ y no ❌
- [ ] Completaste formulario con datos válidos
- [ ] La redirección a Stripe funcionó
- [ ] Completaste el pago en Stripe
- [ ] Viste página de éxito
- [ ] Webhook está configurado en Stripe
- [ ] Credenciales de Gmail son correctas (contraseña de aplicación)
- [ ] MAIL_MAILER=smtp en .env (no log)
- [ ] Recibiste email con credenciales en 1-2 minutos

---

## 🆘 Si Aún Tiene Problemas

Proporciona:
1. Screenshot del console (F12 → Console) cuando haces clic en pagar
2. Resultado de http://localhost:8000/api/diagnostico
3. Últimas líneas de `backend/storage/logs/laravel.log`
4. Confirmación de:
   - ¿MAIL_MAILER=smtp?
   - ¿Credenciales de Gmail correctas?
   - ¿Webhook de Stripe configurado?
