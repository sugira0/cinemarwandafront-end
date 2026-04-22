const BACKEND_ORIGIN = 'https://cinemarwanda-backend.vercel.app';

module.exports = async (req, res) => {
  const queryParams = req.query || {};
  const path = Array.isArray(queryParams.path)
    ? queryParams.path.join('/')
    : (queryParams.path || '');
  const query = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (key === 'path') return;
    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, String(entry)));
      return;
    }
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const targetUrl = `${BACKEND_ORIGIN}/api/${path}${query.toString() ? `?${query.toString()}` : ''}`;

  const forwardHeaders = { ...req.headers };
  delete forwardHeaders.host;
  delete forwardHeaders.connection;
  delete forwardHeaders['content-length'];

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  let body;
  if (hasBody && req.body !== undefined) {
    if (Buffer.isBuffer(req.body) || typeof req.body === 'string') {
      body = req.body;
    } else {
      body = JSON.stringify(req.body);
    }
  }

  const contentType = req.headers['content-type'];

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...forwardHeaders,
        ...(contentType ? { 'content-type': contentType } : {}),
      },
      body,
    });

    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });

    const text = await response.text();
    return res.status(response.status).send(text);
  } catch (error) {
    return res.status(502).json({ message: `Proxy error: ${error.message}` });
  }
};
