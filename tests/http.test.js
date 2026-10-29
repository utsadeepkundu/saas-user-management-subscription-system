import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server/app.js';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health endpoint responds without requiring a database-backed session', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, 'API is running');
});

test('public subscription plans return canonical plan names and prices', async () => {
  const response = await fetch(`${baseUrl}/api/subscription/plans`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  const plans = body.data.plans;
  assert.equal(plans.find((plan) => plan.id === 'starter').monthly, 9.99);
  assert.equal(plans.find((plan) => plan.id === 'professional').features.analytics, true);
  assert.equal(plans.find((plan) => plan.id === 'free').features.maxProjects, 3);
});

test('protected profile endpoint rejects anonymous requests', async () => {
  const response = await fetch(`${baseUrl}/api/user/profile`);
  const body = await response.json();
  assert.equal(response.status, 401);
  assert.equal(body.success, false);
});

test('invalid registration input is rejected before database access', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'x', email: 'not-an-email', password: 'weak' }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.errors) && body.errors.length > 0);
});

test('CORS reflects a configured local origin and rejects an unknown origin', async () => {
  const allowed = await fetch(`${baseUrl}/api/health`, { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');

  const denied = await fetch(`${baseUrl}/api/health`, { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(denied.status, 403);
});
