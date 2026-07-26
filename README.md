# Chatbot de Semilleros EAFIT

Chatbot que responde preguntas sobre los semilleros de investigación activos de la Universidad EAFIT (perfil requerido, requisitos, objetivos y trayectoria), usando la API gratuita de Gemini.

## Estructura

```
chatbot-semilleros/
├── public/
│   └── index.html       ← Interfaz de chat (frontend estático)
├── api/
│   └── chat.js           ← Función serverless que llama a Gemini de forma segura
├── data/
│   └── semilleros.json   ← Información de los semilleros (edítalo para actualizar datos)
└── package.json
```

## Cómo desplegar (Vercel, gratis)

1. Sube esta carpeta completa a un repositorio de GitHub.
2. Entra a vercel.com, inicia sesión con GitHub e importa el repositorio.
3. Antes de desplegar, ve a Settings → Environment Variables y agrega:
   - `GEMINI_API_KEY` = tu API key de Google AI Studio (aistudio.google.com)
4. Haz clic en Deploy. Vercel detecta automáticamente `public/` como frontend estático y `api/chat.js` como función serverless.
5. Comparte la URL que te da Vercel (ej: `tu-proyecto.vercel.app`) con los usuarios.

## Cómo actualizar la información de los semilleros

Edita `data/semilleros.json`. Cada semillero es un objeto con estos campos:

```json
{
  "nombre": "...",
  "pregrado_requerido": "...",
  "minimo_semestres": "...",
  "perfil": "...",
  "observaciones": "...",
  "info_general": "...",
  "objetivos": "...",
  "logros": "..."
}
```

No se requiere reiniciar nada manualmente: al hacer commit y push del cambio, Vercel vuelve a desplegar automáticamente.

## Notas

- El modelo usado es `gemini-2.5-flash`. Si notas que se agota el límite gratuito de solicitudes por minuto, puedes cambiarlo por `gemini-2.5-flash-lite` en `api/chat.js` (línea `const model = ...`), que tiene un límite diario más alto.
- La API key nunca debe colocarse en `public/index.html` ni en ningún archivo del frontend — vive únicamente en la variable de entorno `GEMINI_API_KEY` configurada en Vercel.
