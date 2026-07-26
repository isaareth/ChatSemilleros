const fs = require('fs');
const path = require('path');

// Carga los datos de los semilleros una sola vez (se reutiliza entre invocaciones "calientes")
const semillerosPath = path.join(process.cwd(), 'data', 'semilleros.json');
const SEMILLEROS_DATA = JSON.parse(fs.readFileSync(semillerosPath, 'utf-8'));

const SYSTEM_PROMPT = `Eres el asistente virtual de semilleros de investigación de la Universidad EAFIT. Tu única fuente de información es el siguiente listado de semilleros activos, en formato JSON. Cada objeto tiene: nombre, pregrado_requerido, minimo_semestres, perfil (a quién buscan y requisitos de perfil), observaciones (detalles de la convocatoria), info_general (qué es el semillero, a qué escuela pertenece), objetivos, y logros (trayectoria).

DATOS:
${JSON.stringify(SEMILLEROS_DATA)}

Reglas:
- Responde SIEMPRE en español, de forma clara, breve y organizada (usa listas cuando ayude).
- Básate únicamente en la información del JSON anterior. Si la pregunta no se puede responder con estos datos, dilo explícitamente y sugiere que la persona contacte a la dependencia de semilleros de EAFIT.
- Si preguntan por "convocatoria abierta", ten en cuenta que el archivo no siempre indica fechas explícitas; responde con lo que sí sepas (requisitos, perfil) y aclara si la vigencia de la convocatoria no está especificada en tus datos.
- Si el nombre del semillero mencionado no coincide exactamente, busca coincidencias parciales o por sigla (ej: SIMPRO, SIETE, SIE, SIIE, SIIS, SCOPE).
- No inventes requisitos, fechas ni logros que no estén en los datos.
- Sé cálido pero conciso; evita relleno innecesario.`;

module.exports = async (req, res) => {
  // CORS básico (útil si en algún momento el frontend vive en otro dominio)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en las variables de entorno.' });
    return;
  }

  try {
    const { history } = req.body; // [{ role: 'user'|'model', text: '...' }, ...]

    if (!Array.isArray(history) || history.length === 0) {
      res.status(400).json({ error: 'Falta el historial de la conversación (history).' });
      return;
    }

    // Traduce el historial al formato que espera Gemini
    const contents = history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { maxOutputTokens: 1000 },
      }),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Error de Gemini:', data);
      res.status(geminiResponse.status).json({
        error: data?.error?.message || 'Error consultando el modelo.',
      });
      return;
    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ||
      'No obtuve una respuesta clara. Intenta reformular tu pregunta.';

    res.status(200).json({ answer });
  } catch (err) {
    console.error('Error interno:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
