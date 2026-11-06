const express = require('express');
const helmet = require('helmet');
const sqlite3 = require('sqlite3');

const app = express();
const db = new sqlite3.Database(':memory:');

const API_KEY = process.env.API_KEY;
const DB_PASSWORD = process.env.DB_PASSWORD;

/*
 * Helmet adds protective HTTP response headers and removes
 * the X-Powered-By: Express header.
 */
app.use(helmet());

/*
 * Encode untrusted text before placing it inside HTML.
 *
 * The ampersand must be replaced first so that the ampersands
 * introduced by the other replacements are not encoded again.
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/*
 * Initialize the in-memory training database.
 */
db.serialize(() => {
  db.run(
    'CREATE TABLE users (id INTEGER, name TEXT, email TEXT)'
  );

  db.run(
    "INSERT INTO users VALUES (1, 'ama', 'ama@example.com')"
  );

  db.run(
    "INSERT INTO users VALUES (2, 'kofi', 'kofi@example.com')"
  );
});

/*
 * Secure user lookup.
 *
 * Controls:
 * 1. Convert the input to text.
 * 2. Validate it against an allow-list.
 * 3. Pass it separately from the SQL command.
 * 4. Return a generic database error to the visitor.
 */
app.get('/user', (req, res) => {
  const name = String(req.query.name || '').trim();

  if (!/^[a-z]{1,20}$/i.test(name)) {
    return res.status(400).json({
      error: 'Invalid name',
    });
  }

  db.all(
    'SELECT * FROM users WHERE name = ?',
    [name.toLowerCase()],
    (err, rows) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          error: 'Something went wrong',
        });
      }

      return res.json(rows);
    }
  );
});

/*
 * Secure search route.
 *
 * The query is validated for length and encoded before being
 * included in the HTML response.
 */
app.get('/search', (req, res) => {
  const query = String(req.query.q || '').trim();

  if (query.length > 100) {
    return res.status(400).json({
      error: 'Search text must not exceed 100 characters',
    });
  }

  const safeQuery = escapeHtml(query);

  return res
    .status(200)
    .type('html')
    .send(`<h1>Results for ${safeQuery}</h1>`);
});

/*
 * Secure settings route.
 *
 * This preserves the original GET route used by the lab, but it:
 * - handles invalid JSON safely;
 * - rejects arrays and primitive values;
 * - accepts only the expected "theme" field;
 * - removes the unsafe Lodash merge.
 */
app.get('/settings', (req, res, next) => {
  try {
    const data = JSON.parse(req.query.data || '{}');

    if (
      data === null ||
      typeof data !== 'object' ||
      Array.isArray(data)
    ) {
      return res.status(400).json({
        error: 'Settings must be a JSON object',
      });
    }

    const allowedKeys = ['theme'];
    const suppliedKeys = Object.keys(data);

    const unsupportedKey = suppliedKeys.find(
      (key) => !allowedKeys.includes(key)
    );

    if (unsupportedKey) {
      return res.status(400).json({
        error: `Unsupported setting: ${unsupportedKey}`,
      });
    }

    if (
      data.theme !== undefined &&
      !['light', 'dark'].includes(data.theme)
    ) {
      return res.status(400).json({
        error: 'Theme must be light or dark',
      });
    }

    return res.json({
      theme: data.theme || 'light',
    });
  } catch (err) {
    return next(err);
  }
});

/*
 * Protected admin route.
 *
 * It fails closed:
 * - if API_KEY is not configured, access is forbidden;
 * - if the supplied key is missing or incorrect, access is forbidden.
 */
app.get('/admin', (req, res) => {
  const providedKey = req.get('x-api-key');

  if (!API_KEY || providedKey !== API_KEY) {
    return res.status(403).json({
      error: 'Forbidden',
    });
  }

  return res.json({
    ok: true,
  });
});

/*
 * Return a controlled response for unknown routes.
 */
app.use((req, res) => {
  return res.status(404).json({
    error: 'Route not found',
  });
});

/*
 * Central error handler.
 *
 * This must appear after all routes.
 */
// Express identifies error middleware by its four parameters.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    error: 'Something went wrong',
  });
});

app.listen(3000, '127.0.0.1', () => {
  console.log('http://localhost:3000');
});