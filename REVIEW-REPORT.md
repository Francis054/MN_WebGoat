# Secure Code and Application Review Report

**Name:** Francis Dey  
**Programme:** 2026 Cyber Security Bootcamp  
**Week:** Week 5, Application Security and Secure Development  
**Date:** 6 November 2026  
**Project:** Bootcamp App  
**Repository:** Add your GitHub repository URL before submission  
**Application stack:** Node.js, Express.js, SQLite and Lodash

---

## 1. Introduction

This report presents the secure code and application review performed on the `bootcamp-app` project during Week 5 of the 2026 Cyber Security Bootcamp.

The exercise applied DevSecOps principles to a deliberately vulnerable Node.js application. The purpose was to identify security weaknesses, understand their causes, apply appropriate remediation, retest the application and prepare the security checks for automation.

All tests were performed within the authorized project scope against the locally created training application at `127.0.0.1`. No production system, external website or third-party application was tested. The credentials contained in the starter code were demonstration values rather than real credentials.

The review covered:

- Source-code security
- User-input validation
- Database-query security
- Cross-site scripting prevention
- Secret management
- Dependency security
- HTTP security headers
- Error handling
- Access control
- Automated security testing

The review followed the DevSecOps cycle:

```text
Identify → Understand → Remediate → Retest → Automate → Monitor
```

---

## 2. Main Task

The main task was to review a deliberately vulnerable Node.js, Express and SQLite application, identify its security weaknesses, correct the findings and verify the effectiveness of the changes.

The exercise was completed in the following stages:

### Monday: Project setup and pipeline mapping

- Created the starter application.
- Initialized Git and uploaded the project to GitHub.
- Installed SonarQube for IDE.
- Reviewed the first editor warnings.
- Prepared a secure-development checklist.
- Mapped security controls to the development lifecycle.

### Tuesday: SQL injection review

- Used Snyk Code to inspect insecure input handling.
- Reviewed the flow from `req.query.name` to the SQLite query.
- Applied allow-list validation.
- Replaced string-built SQL with a parameterized query.
- Replaced client-facing database details with a generic error response.
- Retested valid and malicious input.

### Wednesday: Reflected XSS review

- Used Snyk Code to identify untrusted input flowing from `req.query.q` to `res.send()`.
- Reproduced the issue safely using HTML input on localhost.
- Applied an output-context remediation.
- Retested the route manually.
- Rescanned the application.

### Thursday: Dependency and configuration review

- Reviewed direct and transitive npm dependencies.
- Prepared Snyk Open Source and OWASP Dependency-Check scans.
- Updated Express and Lodash within their existing major versions.
- Added Helmet security headers.
- Replaced hard-coded credentials with environment variables.
- Added centralized error handling.
- Added deny-by-default protection to the `/admin` route.

### Friday: Automation, triage and reporting

- Prepared a GitHub Actions security workflow.
- Configured SAST and SCA security gates.
- Prioritized findings by likelihood and impact.
- Recorded remediation evidence.
- Documented remaining work and accepted-risk requirements.

---

## 3. Tools and Technologies Used

| Tool or technology | Purpose |
| --- | --- |
| Node.js | Runs the JavaScript application |
| Express.js | Provides the HTTP server and routes |
| SQLite | Provides the in-memory training database |
| Lodash | Provides object-merging functionality in the settings route |
| Helmet | Adds protective HTTP response headers |
| Visual Studio Code | Used to edit and review project files |
| Git | Records the history of project changes |
| GitHub | Stores the remote repository |
| GitHub Actions | Runs automated security checks |
| SonarQube for IDE | Provides editor-based security and code-quality feedback |
| Snyk Code | Performs static application security testing |
| Snyk Open Source | Checks dependencies for known vulnerabilities |
| OWASP Dependency-Check | Reports dependency CVEs and CVSS scores |
| Browser Developer Tools | Inspects responses and security headers |
| curl | Sends controlled HTTP requests to application routes |
| Bash/Kali Linux terminal | Runs the application, scanners and Git commands |

---

## 4. Scope and Rules

### In scope

- `app.js`
- `package.json`
- `package-lock.json`
- `.gitignore`
- `.env.example`
- `.github/workflows/security.yml`
- `/user`
- `/search`
- `/settings`
- `/admin`
- Direct and transitive npm dependencies
- HTTP response headers
- Error responses
- Demonstration secrets in Git history

### Out of scope

- Production systems
- Applications belonging to other people
- Public websites
- Network exploitation
- Denial-of-service testing
- Password attacks
- Social engineering
- Destructive database testing
- Real credentials or confidential data

### Safety rule

All testing was performed against the application running locally at:

```text
http://127.0.0.1:3000
```

---

## 5. Review Methodology

The review combined automated analysis with manual verification.

### 5.1 Static application security testing

Snyk Code inspected the source code without running it. It traced untrusted HTTP input to sensitive operations such as database queries and HTML responses.

### 5.2 Software composition analysis

Snyk Open Source and OWASP Dependency-Check were selected to inspect direct and transitive libraries for known vulnerabilities.

### 5.3 Manual verification

The application was tested locally using the browser and `curl`. Tests included:

- Valid user lookup
- SQL injection input
- HTML input in the search route
- Invalid JSON in the settings route
- Admin requests with and without an API key
- Inspection of security headers

### 5.4 Retesting

After each change, the original test was repeated and the relevant scanner was run again. A finding was treated as resolved only when the application behavior and scanner evidence supported that conclusion.

---

## 6. Initial Scan Results

The first recorded Snyk Code scan produced the following result:

```text
4 Code issues found
3 High
1 Medium
```

The findings were:

| # | Finding | Severity | Location | Initial status |
| ---: | --- | --- | --- | --- |
| 1 | Use of hard-coded password | Medium | `app.js`, line 9 | Open |
| 2 | Hard-coded non-cryptographic secret | High | `app.js`, line 8 | Open |
| 3 | Hard-coded non-cryptographic secret | High | `app.js`, line 9 | Open |
| 4 | Reflected cross-site scripting | High | `app.js`, original search route | Open |

**Snyk organization:** `francis054`  
**Project path:** `/home/francisdey/Desktop/labsbootcamp-app`

After the hard-coded credentials were moved to environment variables, the next recorded scan produced:

```text
1 Code issue found
1 High
```

The three hard-coded-secret findings were no longer reported. The remaining result was reflected XSS.

---

## 7. Vulnerabilities Identified

### 7.1 SQL Injection

**Location:** `/user` route  
**Security category:** Injection  
**Potential impact:** Unauthorized disclosure or modification of database data

The original laboratory application constructed an SQL statement by joining user input directly to the query. A malicious value could change the meaning of the SQL command.

Example malicious input:

```text
x' OR '1'='1
```

This condition is always true and could return multiple database records.

#### Remediation

The supplied project code used allow-list validation:

```js
const name = String(req.query.name || '');

if (!/^[a-z]{1,20}$/i.test(name)) {
  return res.status(400).json({ error: 'Invalid name' });
}
```

It also used a parameterized query:

```js
db.all(
  'SELECT * FROM users WHERE name = ?',
  [name],
  (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Something went wrong' });
    }

    return res.json(rows);
  }
);
```

#### Status

**Resolved.** The malicious input is rejected with `400 Invalid name`, while valid names continue to return the expected user.

---

### 7.2 Reflected Cross-Site Scripting

**Location:** `/search` route  
**Security category:** Cross-site scripting  
**Snyk severity:** High

The vulnerable route placed `req.query.q` into an HTML response through `res.send()`. Snyk reported that unsanitized HTTP input flowed into an HTML-rendering sink.

A controlled input such as:

```html
<b>hello</b>
```

was interpreted as HTML rather than displayed as ordinary text.

#### Risk

Reflected XSS may allow an attacker to:

- Execute browser-side script
- Steal session information
- Display fraudulent content
- Present a fake login form
- Redirect a user
- Perform actions within the origin of the affected application

#### Final remediation

The route was changed to return plain text rather than dynamically constructed HTML:

```js
app.get('/search', (req, res) => {
  const query = String(req.query.q || '');

  return res
    .status(200)
    .type('text/plain')
    .send(`Results for ${query}`);
});
```

This removes the HTML rendering context. Markup such as `<b>` or `<script>` is returned as text instead of being interpreted by the browser.

#### Status

**Remediated in code. Final clean Snyk evidence must be inserted after the last scan.**

Manual expected result:

```text
Results for <b>hello</b>
```

The word `hello` must not appear in bold, and script markup must not execute.

---

### 7.3 Hard-Coded API Key

**Location:** `app.js`, original line 8  
**Security category:** Secret exposure  
**Snyk severity:** High

The original code contained:

```js
const API_KEY = 'a8f5f167f44f4964e6c998dee827110c';
```

#### Risk

A committed API key may be exposed through repository access, repository history, forks, backups, logs or screenshots.

#### Remediation

The hard-coded value was replaced with:

```js
const API_KEY = process.env.API_KEY;
```

#### Status

**Resolved in the current source code.** The finding disappeared from the second Snyk scan.

---

### 7.4 Hard-Coded Database Password

**Location:** `app.js`, original line 9  
**Security category:** Credential exposure  
**Snyk severity:** High and Medium

The original code contained:

```js
const DB_PASSWORD = 'Admin@12345';
```

Snyk reported the value as both a hard-coded password and a hard-coded non-cryptographic secret.

#### Remediation

The value was changed to:

```js
const DB_PASSWORD = process.env.DB_PASSWORD;
```

A `.env.example` file documents the required variable names without storing real values.

#### Status

**Resolved in the current source code.** Both password-related findings disappeared from the second Snyk scan.

The demonstration value remains in previous Git commits. A real exposed password would need to be revoked and replaced.

---

### 7.5 Detailed Error Leakage

**Location:** `/settings` route  
**Trigger:** Invalid JSON such as `data=bad`  
**Security category:** Security misconfiguration

Invalid JSON could produce an application error containing stack information and internal details.

#### Remediation

A centralized error handler was added after the application routes:

```js
app.use((err, req, res, next) => {
  console.error(err);

  return res.status(500).json({
    error: 'Something went wrong'
  });
});
```

#### Status

**Resolved.** The terminal receives the detailed error, while the visitor receives only a generic response.

---

### 7.6 Missing Security Headers

**Affected component:** HTTP responses  
**Security category:** Security misconfiguration

The original Express application disclosed its server technology through `X-Powered-By` and lacked the complete set of headers applied by Helmet.

#### Remediation

Helmet was installed and enabled:

```js
const helmet = require('helmet');

app.use(helmet());
```

#### Status

**Resolved.** Helmet removes `X-Powered-By` and adds protective response headers such as Content Security Policy and `X-Content-Type-Options`.

---

### 7.7 Missing Access Control

**Location:** `/admin` route  
**Security category:** Broken access control

The exercise required an administrative function protected by a deny-by-default check.

#### Remediation

```js
app.get('/admin', (req, res) => {
  if (!API_KEY || req.get('x-api-key') !== API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return res.json({ ok: true });
});
```

The route denies access when the server key is absent, the request header is absent or the supplied key is incorrect.

#### Status

**Resolved.** Requests without the correct key return `403 Forbidden`.

---

### 7.8 Vulnerable Dependencies

**Affected files:** `package.json` and `package-lock.json`  
**Security category:** Vulnerable and outdated components

The starter project deliberately used older versions of Express and Lodash. These dependencies and their transitive libraries require SCA review.

#### Remediation

The document-prescribed update commands are:

```bash
npm install express@4 lodash@4
npm install helmet
```

#### Status

**Updated, but final SCA evidence remains to be recorded.** Some findings may remain in transitive dependencies, including packages introduced through SQLite3.

---

## 8. Remediation Summary

| Finding | Remediation | Current status |
| --- | --- | --- |
| SQL injection | Allow-list validation and parameterized query | Resolved |
| Reflected XSS | Changed the search response to `text/plain` | Remediated in code; final scan evidence required |
| Hard-coded API key | Read from `process.env.API_KEY` | Resolved in current source |
| Hard-coded password | Read from `process.env.DB_PASSWORD` | Resolved in current source |
| Error leakage | Added centralized error middleware | Resolved |
| Missing security headers | Added Helmet | Resolved |
| Missing access control | Added deny-by-default API-key check | Resolved |
| Vulnerable dependencies | Updated Express and Lodash within major version 4 | SCA retest required |
| Manual security checks | Prepared GitHub Actions workflow | Pipeline evidence required |

---

## 9. Status Before and After Remediation

### 9.1 Confirmed Snyk Code results

| Scan stage | High | Medium | Total |
| --- | ---: | ---: | ---: |
| Initial scan | 3 | 1 | 4 |
| After removing hard-coded secrets | 1 | 0 | 1 |
| After final XSS remediation | **Insert final scan count** | **Insert final scan count** | **Insert final scan count** |

### 9.2 Application behavior

| Security area | Before remediation | After remediation | Status |
| --- | --- | --- | --- |
| SQL query | User input could change SQL meaning | Parameterized query separates data from command | Resolved |
| Malicious name input | Could return unintended records in the original lab | Returns `Invalid name` | Resolved |
| Search input | Browser interpreted supplied markup as HTML | Route returns markup as plain text | Remediated in code |
| API key | Stored directly in `app.js` | Read from environment | Resolved |
| Database password | Stored directly in `app.js` | Read from environment | Resolved |
| Error response | Could disclose implementation details | Returns generic error | Resolved |
| HTTP headers | Express disclosure and limited protection | Helmet enabled | Resolved |
| Admin access | No protected admin demonstration | Incorrect or absent key returns `403` | Resolved |
| Security testing | Manual scans | Workflow prepared for push and pull request | Evidence required |

### 9.3 SCA results

| Tool | Before | After | Status |
| --- | ---: | ---: | --- |
| Snyk Open Source | Insert actual total | Insert actual total | Pending scan evidence |
| OWASP Dependency-Check | Insert vulnerable-library total | Insert updated total | Pending scan evidence |

### 9.4 Pipeline results

| Check | First run | Final run |
| --- | --- | --- |
| Snyk SAST gate | Insert result | Insert result |
| Snyk SCA gate | Insert result | Insert result |
| Dependency-Check CVSS gate | Insert result | Insert result |
| Overall workflow | Insert red/green result | Insert red/green result |

---

## 10. Risk Prioritization

Likelihood and impact were scored from 1 to 3:

- Likelihood: 1 = unlikely, 2 = possible, 3 = likely
- Impact: 1 = small, 2 = serious, 3 = severe

Risk score:

```text
Likelihood × Impact
```

| Score | Rating |
| ---: | --- |
| 1–2 | Low |
| 3–4 | Medium |
| 6 | High |
| 9 | Critical |

| # | Finding | Found by | Likelihood | Impact | Score | Rating | Effort | Status |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- | --- |
| 1 | Reflected XSS | Snyk Code and browser test | 3 | 3 | 9 | Critical | Quick | Remediated in code; retest evidence required |
| 2 | SQL injection | Code review and lab test | 3 | 3 | 9 | Critical | Quick | Resolved |
| 3 | Hard-coded API key | Snyk Code | 3 | 3 | 9 | Critical | Quick | Resolved in current source |
| 4 | Hard-coded database password | Snyk Code | 3 | 3 | 9 | Critical | Quick | Resolved in current source |
| 5 | Missing admin access control | Manual review | 2 | 3 | 6 | High | Moderate | Resolved |
| 6 | Error-detail leakage | Browser test | 2 | 2 | 4 | Medium | Quick | Resolved |
| 7 | Missing security headers | Browser Developer Tools | 2 | 2 | 4 | Medium | Quick | Resolved |
| 8 | Vulnerable dependencies | Snyk and Dependency-Check | To be scored from results | To be scored from results | Pending | Pending | Varies | Retest required |

---

## 11. Retest Evidence

| Check | Before | After |
| --- | --- | --- |
| `/user?name=ama` | Returned Ama’s record | Still returns Ama’s record |
| SQL injection input | Could affect query meaning in original lab | Returns `Invalid name` |
| HTML search input | Rendered as HTML | Displayed as plain text |
| Hard-coded credentials | Three related Snyk findings | Removed from the second scan |
| Invalid settings JSON | Could expose internal details | Returns `Something went wrong` |
| `/admin` without key | No protected demonstration | Returns `Forbidden` |
| `/admin` with correct key | Not applicable | Returns `{"ok":true}` |
| Helmet headers | Missing full protective set | Helmet headers present |
| Snyk Code | 4 findings | 1 finding before final XSS implementation; final scan must be inserted |
| Snyk Open Source | Insert result | Insert result |
| Dependency-Check | Insert result | Insert result |
| GitHub Actions | Insert result | Insert result |

---

## 12. Snyk CLI Observation

The globally installed Snyk wrapper attempted to download its executable under:

```text
/usr/local/lib/node_modules/snyk/wrapper_dist
```

The current user did not have permission to write to that directory, producing an `EACCES` error. Snyk also reported that the CLI was operating in degraded mode.

This was a tool-installation issue rather than an application vulnerability. A project-local installation avoids requiring writes to the global system directory:

```bash
npm install --save-dev snyk
./node_modules/.bin/snyk code test
./node_modules/.bin/snyk test
```

---

## 13. Other Observations

### Different tools report different weaknesses

SonarQube for IDE, Snyk Code, Snyk Open Source and OWASP Dependency-Check inspect different security layers. No single scanner provides complete coverage.

### A code change is not proof of remediation

Every fix requires manual retesting and another scan. The XSS exercise demonstrated that an initial change can still leave a scanner-reported flow.

### Removing a secret is not the same as rotating it

The demonstration credentials were removed from the latest source, but earlier Git commits retain the original values. A real exposed credential must be revoked and replaced.

### Dependency findings may remain after direct upgrades

A direct package can install vulnerable transitive dependencies. Remaining findings require an upgrade, replacement, compensating control or documented accepted-risk decision.

### The settings route deserves future hardening

The document retains the Lodash merge to support the lab. A production design should validate the JSON structure, allow only expected properties and avoid deep-merging arbitrary user-controlled objects.

### The API-key control is a training control

A production administrative function should normally use authenticated identities, role-based access control, HTTPS, audit logging, rate limiting and key rotation rather than only a static request header.

---

## 14. Accepted Risks

No unresolved finding should be ignored without documentation.

At the time of writing, no application finding is deliberately accepted as a permanent risk. Items lacking final scan evidence remain verification tasks rather than accepted risks.

If a dependency cannot be fixed immediately, record it below:

| Finding | Reason not fixed | Compensating control | Owner | Review date |
| --- | --- | --- | --- | --- |
| Insert remaining CVE or Snyk ID | Insert reason | Insert control | Francis Dey | Insert date |

---

## 15. Skills Learned

### Technical skills

- Running a Node.js and Express application
- Working with SQLite
- Reviewing request-to-response data flow
- Identifying SAST sources and sinks
- Preventing SQL injection
- Using parameterized queries
- Applying allow-list validation
- Identifying reflected XSS
- Understanding HTML and plain-text output contexts
- Managing secrets through environment variables
- Configuring Helmet security headers
- Implementing centralized Express error handling
- Implementing deny-by-default access control
- Performing SAST with Snyk Code
- Performing SCA with Snyk Open Source
- Reviewing CVE and CVSS information
- Using OWASP Dependency-Check
- Testing endpoints with `curl`
- Inspecting HTTP headers with browser Developer Tools
- Recording remediation with Git
- Preparing security gates in GitHub Actions

### Professional skills

- Working within an authorized security-testing scope
- Recording before-and-after evidence
- Prioritizing findings by likelihood and impact
- Explaining vulnerabilities in plain language
- Distinguishing confirmed results from expected results
- Documenting unresolved risk
- Preparing a technical security presentation

---

## 16. Lessons Learned

The main lesson is that security must be integrated throughout software development rather than performed only before release.

The exercise also demonstrated that:

- External input must be treated as untrusted.
- SQL commands and data must remain separate.
- Output context determines whether browser content is safe.
- Secrets must not be stored in source code.
- Git history can preserve deleted credentials.
- Dependencies require continuous monitoring.
- Automated scanners require human interpretation.
- A finding is not resolved until it is retested.
- Pipeline failures can be useful security gates.
- Remaining risks need an owner and review date.

---

## 17. Required Final Evidence

The following real outputs must be pasted into this report before final submission if they have not yet been collected:

1. Final `snyk code test` result after the plain-text XSS fix.
2. Snyk Open Source before-and-after totals.
3. OWASP Dependency-Check before-and-after totals.
4. The three highest CVSS scores and associated CVE identifiers.
5. First and final GitHub Actions workflow results.
6. GitHub repository URL.
7. Any remaining dependency finding and accepted-risk decision.

No results should be invented. If a scan has not been completed, label the evidence as pending.

---

## 18. Conclusion

The review identified significant weaknesses in the starter application, including reflected XSS, hard-coded credentials, insecure error behavior, missing security headers, dependency risk and insufficient access control. The original laboratory application also demonstrated SQL injection, which was already corrected in the supplied project code through validation and a parameterized query.

The first Snyk Code scan reported:

```text
3 High findings
1 Medium finding
4 findings in total
```

After the credentials were moved to environment variables, the recorded scan was reduced to:

```text
1 High finding
1 finding in total
```

The remaining reported issue was reflected XSS. The final code changes the search route to return `text/plain`, removing the HTML rendering context. The final Snyk output must be added to provide conclusive scanner evidence.

The project demonstrates the practical DevSecOps process of finding weaknesses early, applying focused remediation, collecting evidence, automating checks and documenting every unresolved risk.
