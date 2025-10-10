const request = require('supertest');
const express = require('express');
const healthRouter = require('../src/routes/health');

describe('Health Check Endpoint', () => {
  const app = express();
  app.use(healthRouter);

  it('should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('ok');
  });
}); 