import server, { handleRequest } from './server.js';

export default async function handler(req, res) {
  return handleRequest(req, res);
}

export { server, handleRequest };
