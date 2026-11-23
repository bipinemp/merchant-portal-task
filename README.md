# Merchant Payments Portal

Merchant payments portal built with modern Angular (standalone components, Signals, Reactive Forms, Vitest, Bootstrap 5).

---

## 1. Setup & Running

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run unit tests
npm test

# Build for production
npm run build
```

Application runs at `http://localhost:4200/`.

---

## 2. User Roles & Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **SALES** | `sales@merchant.com` | `password` | Creates and edits merchant applications; views permitted applications. |
| **REVIEWER** | `reviewer@merchant.com` | `password` | Reviews submitted applications, reveals sensitive data, and records approve/reject risk decisions. |
| **ADMIN** | `admin@merchant.com` | `password` | Full access: creates and edits applications, assigns reviewers, and submits risk decisions. |

*(Quick login buttons are available on the login page for switching roles directly)*

---

## 3. Content Security Policy (CSP) Protection

Configured in `src/index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; img-src 'self' data:;">
```

- **`script-src 'self'`**: Prevents XSS attacks by restricting JavaScript execution strictly to the application's own bundles and disallowing untrusted third-party scripts.
- **`connect-src 'self'`**: Restricts network and API requests to authorized origins, preventing exfiltration of sensitive merchant and banking data.
- **`default-src 'self'`**: Restricts all fallback resources to the origin domain.
