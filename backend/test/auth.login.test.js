const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');
const { createAuthService } = require('../src/services/auth.service');

const JWT_SECRET = 'test-secret-for-handled-login-tests-32-bytes';
const PASSWORD = 'correct development password';
const BUSINESS = { id: 7, business_code: 'NORTHSTAR01' };
const USER = {
  id: 42,
  business_id: 7,
  name: 'Morgan Lee',
  email: 'manager@northstarhvac.test',
  password_hash: bcrypt.hashSync(PASSWORD, 4),
  role: 'MANAGER',
  is_active: 1
};

function createTestApp({ business = BUSINESS, user = USER, isProduction = false } = {}) {
  const authRepository = {
    async findBusinessByCode(businessCode) {
      return business && business.business_code === businessCode ? business : null;
    },
    async findUserByBusinessIdAndEmail(businessId, email) {
      return user && user.business_id === businessId && user.email === email ? user : null;
    }
  };
  const authService = createAuthService({ authRepository, jwtSecret: JWT_SECRET });

  return createApp({ authService, isProduction });
}

async function withServer(options, callback) {
  const server = http.createServer(createTestApp(options));
  server.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  try {
    const address = server.address();
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

function loginRequest(baseUrl, credentials = {}) {
  return fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessCode: 'NORTHSTAR01',
      email: USER.email,
      password: PASSWORD,
      ...credentials
    })
  });
}

async function assertGenericAuthenticationFailure(response) {
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    error: 'Invalid business code, email, or password.'
  });
}

test('successful login returns safe user information and signs the required JWT claims', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await loginRequest(baseUrl, {
      businessCode: 'northstar01',
      email: USER.email.toUpperCase()
    });
    const body = await response.json();
    const cookie = response.headers.get('set-cookie');
    const token = cookie.match(/^handled_auth=([^;]+)/)[1];
    const claims = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      user: {
        id: USER.id,
        businessId: BUSINESS.id,
        name: USER.name,
        email: USER.email,
        role: USER.role
      }
    });
    assert.equal(claims.sub, String(USER.id));
    assert.equal(claims.businessId, BUSINESS.id);
    assert.equal(claims.role, USER.role);
    assert.equal(claims.exp - claims.iat, 15 * 60);
    assert.deepEqual(Object.keys(claims).sort(), ['businessId', 'exp', 'iat', 'role', 'sub'].sort());
  });
});

test('incorrect password returns the generic authentication failure', async () => {
  await withServer({}, async (baseUrl) => {
    await assertGenericAuthenticationFailure(await loginRequest(baseUrl, { password: 'wrong password' }));
  });
});

test('unknown business code returns the generic authentication failure', async () => {
  await withServer({ business: null }, async (baseUrl) => {
    await assertGenericAuthenticationFailure(await loginRequest(baseUrl));
  });
});

test('unknown user returns the generic authentication failure', async () => {
  await withServer({ user: null }, async (baseUrl) => {
    await assertGenericAuthenticationFailure(await loginRequest(baseUrl, { email: 'unknown@northstarhvac.test' }));
  });
});

test('inactive user returns the generic authentication failure', async () => {
  await withServer({ user: { ...USER, is_active: 0 } }, async (baseUrl) => {
    await assertGenericAuthenticationFailure(await loginRequest(baseUrl));
  });
});

test('JWT is not returned in the JSON response', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await loginRequest(baseUrl);
    const body = await response.text();
    const token = response.headers.get('set-cookie').match(/^handled_auth=([^;]+)/)[1];

    assert.equal(body.includes(token), false);
    assert.equal(JSON.parse(body).token, undefined);
  });
});

test('successful login sets an HttpOnly SameSite=Lax cookie scoped to the API', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await loginRequest(baseUrl);
    const cookie = response.headers.get('set-cookie');

    assert.match(cookie, /^handled_auth=/);
    assert.match(cookie, /; HttpOnly/i);
    assert.match(cookie, /; SameSite=Lax/i);
    assert.match(cookie, /; Path=\/api/i);
    assert.match(cookie, /; Max-Age=900/i);
    assert.doesNotMatch(cookie, /; Secure/i);
  });
});

test('password hashes are never exposed in the response', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await loginRequest(baseUrl);
    const body = await response.text();

    assert.equal(body.includes(USER.password_hash), false);
    assert.equal(body.includes('password_hash'), false);
  });
});

test('production login cookie uses Secure', async () => {
  await withServer({ isProduction: true }, async (baseUrl) => {
    const response = await loginRequest(baseUrl);

    assert.match(response.headers.get('set-cookie'), /; Secure/i);
  });
});

test('invalid login request is rejected before authentication', async () => {
  await withServer({}, async (baseUrl) => {
    const response = await loginRequest(baseUrl, { businessCode: 'bad-code!' });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'Invalid login request.' });
  });
});