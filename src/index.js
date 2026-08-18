// src/index.js
// Điểm khởi đầu chính của Cloudflare Worker (Worker Entry Point)

import { routeRequest } from './router.js';

export default {
  /**
   * Cloudflare Worker fetch handler
   * @param {Request} request 
   * @param {object} env 
   * @param {object} ctx 
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    return await routeRequest(request, env, ctx);
  }
};
