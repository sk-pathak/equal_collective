const http = require('http');

class XRayClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:8080/api';
  }

  async startTrace(name, metadata = {}) {
    try {
      const res = await this._request('/traces', 'POST', { name, metadata });
      return res.id;
    } catch (error) {
      console.error('XRay: Failed to start trace', error);
      return null;
    }
  }

  async addStep(traceId, { stepName, status, input, output, reasoning, parentStepId, startedAt, endedAt, orderIndex }) {
    if (!traceId) return;
    try {
      await this._request('/steps', 'POST', {
        trace_id: traceId,
        step_name: stepName,
        status: status || 'COMPLETED',
        input: input || {},
        output: output || {},
        reasoning: reasoning || null,
        parent_step_id: parentStepId,
        started_at: startedAt || new Date().toISOString(),
        ended_at: endedAt || new Date().toISOString(),
        order_index: orderIndex || 0,
      });
    } catch (error) {
      console.error('XRay: Failed to add step', error);
    }
  }

  async finishTrace(traceId, status = 'COMPLETED') {
    if (!traceId) return;
    try {
      await this._request(`/traces/${traceId}`, 'PATCH', { status });
    } catch (error) {
      console.error('XRay: Failed to finish trace', error);
    }
  }

  _request(path, method, body) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve(data);
            }
          } else {
            reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }
}

module.exports = XRayClient;
