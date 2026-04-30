const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'https://cinemarwanda-backend.vercel.app';

export const config = {
  api: {
    bodyParser: false,
  },
};

export function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

function getForwardHeaders(req) {
  const headers = { ...req.headers };
  delete headers.host;
  delete headers['content-length'];
  return headers;
}

export async function proxyToBackend(req, res, backendPath = req.url) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const upstream = await fetch(`${BACKEND_ORIGIN}${backendPath}`, {
      method: req.method,
      headers: getForwardHeaders(req),
      body: hasBody ? req : undefined,
      duplex: hasBody ? 'half' : undefined,
    });

    upstream.headers.forEach((value, key) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    applyCors(res);

    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.status(upstream.status).send(buffer);
  } catch (error) {
    return res.status(502).json({
      message: 'Failed to reach backend API',
      detail: error.message,
    });
  }
}
