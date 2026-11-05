# Secure Development Checklist

Name: Francis Dey
Date: 5 November 2026

## 1. Pipeline map

| Stage   | Security activity                           | Example tool                       | Gate (what blocks progress)                  |
| ------- | ------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| Plan    | Write security requirements and assess risk | Checklist, gap analysis            | Requirements approved                        |
| Design  | Threat modelling                            | STRIDE                             | Top threats have countermeasures             |
| Code    | Scan while you type and peer review         | SonarQube for IDE, Snyk IDE plugin | No hard-coded secrets, pull request reviewed |
| Build   | SAST, SCA and secrets scan                  | Snyk, Dependency-Check             | No new High or Critical findings             |
| Test    | Security tests and DAST                     | OWASP ZAP, penetration test        | No open High findings                        |
| Deploy  | Harden configuration and protect secrets    | Security headers, secrets manager  | Configuration checklist signed off           |
| Operate | Monitor, patch and audit                    | Dependabot, logs, scheduled scans  | Critical patches within agreed time          |

## 2. My own additions (one more security activity for each stage)

- Plan:Conduct a security risk assessment to identify potential threats and business risks before development begins.
- Design: Perform threat modelling to identify possible attack paths and security weaknesses in the system architecture.
- Code: Conduct secure code reviews to identify vulnerabilities such as SQL injection, XSS, and hardcoded credentials.
- Build: Scan application dependencies for known vulnerabilities before producing the build artifact.
- Test: Perform penetration testing to identify and validate security weaknesses.
- Deploy: Apply secure configuration and verify that secrets, permissions, and security settings are properly managed.
- Operate: Continuously monitor application logs and security alerts to detect suspicious activities and potential attacks.

## 3. My pass or fail rules for three gates

1. Gate: Build. Rule: the build fails if Snyk reports any High or Critical issue.
2. Gate:
3. Gate:

## 4. SonarQube for IDE warnings I saw in app.js


Improper input validation exposed sensitive information from the database to and unauthorised use/client

Solution: Proper input validation (by design) to prevent unauthorised data exposure