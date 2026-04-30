import { config, proxyToBackend } from '../../_proxy.js';

export { config };

export default function handler(req, res) {
  return proxyToBackend(req, res, req.url);
}
