const express = require('express');
const helmet = require('helmet');
const sqlite3 = require('sqlite3');
import escapeHtml from 'escape-html';
const _ = require('lodash');

const app = express();

app.use(helmet());

const db = new sqlite3.Database(':memory:');

/*
 * Encode untrusted input before inserting it into HTML.
 *
 * The ampersand replacement must come first. Otherwise, the
 * ampersands introduced by later replacements would be encoded again.
 */
const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/*
 * Read secrets from environment variables.
 *
 * Do not put the real values in this file.
 */
const API_KEY = process.env.API_KEY;
const DB_PASSWORD = process.env.DB_PASSWORD;

/*
 * Create the in-memory training database.
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
 * This route uses:
 * 1. Allow-list input validation.
 * 2. A parameterized SQL query.
 * 3. A generic client-facing error response.
 */
app.get('/user', (req, res) => {
  const name = String(req.query.name || '');

  if (!/^[a-z]{1,20}$/i.test(name)) {
    return res.status(400).json({
      error: 'Invalid name',
    });
  }

  db.all(
    'SELECT * FROM users WHERE name = ?',
    [name],
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
 * Untrusted search text is encoded before it is inserted into HTML.
 */
app.get('/search', (req, res) => {
  return res.send(
    '<h1>Results for ' +
      escapeHtml(req.query.q) +
      '</h1>'
  );
});

/*
 * Settings route retained from the original lab.
 *
 * Invalid JSON is passed to the centralized error handler below.
 * Lodash must be updated to the latest supported version 4 release.
 */
app.get('/settings', (req, res) => {
  return res.json(
    _.merge(
      { theme: 'light' },
      JSON.parse(req.query.data || '{}')
    )
  );
});

/*
 * Protected administrative route.
 *
 * The route fails closed if API_KEY is not configured.
 */
app.get('/admin', (req, res) => {
  if (
    !API_KEY ||
    req.get('x-api-key') !== API_KEY
  ) {
    return res.status(403).json({
      error: 'Forbidden',
    });
  }

  return res.json({
    ok: true,
  });
});

/*
 * Centralized error handler.
 *
 * It must appear after all application routes.
 *
 * The complete error is written to the terminal, while the visitor
 * receives only a generic message.
 */
app.use((err, req, res, next) => {
  console.error(err);

  return res.status(500).json({
    error: 'Something went wrong',
  });
});

/*
 * Listen only on localhost.
 */
app.listen(
  3000,
  '127.0.0.1',
  () => console.log('http://localhost:3000')
);