import { config, proxyToBackend } from './_proxy.js';

export { config };

export default async function handler(req, res) {
  return proxyToBackend(req, res);
}
