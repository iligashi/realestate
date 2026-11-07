// Protects every route from NoSQL operator injection and oversized pages.
//
// Express parses `?price[$gt]=0` and JSON bodies like `{ "email": { "$ne": null } }`
// into objects. If those reach a Mongoose query, the client controls the query
// operators. This middleware removes any key that starts with `$` or contains
// a `.` from req.body, req.query and req.params before controllers see them.

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;

const stripOperators = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripOperators);
  }
  if (!isPlainObject(value)) {
    return value;
  }
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete value[key];
    } else {
      value[key] = stripOperators(value[key]);
    }
  }
  return value;
};

const clampInt = (raw, { min, max, fallback }) => {
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

const sanitize = (req, res, next) => {
  if (req.body) stripOperators(req.body);
  if (req.params) stripOperators(req.params);

  if (req.query) {
    stripOperators(req.query);

    // Query values used as filters must be plain strings, not nested objects
    for (const key of Object.keys(req.query)) {
      if (isPlainObject(req.query[key])) delete req.query[key];
    }

    // Cap pagination so one request can't pull the whole collection
    if (req.query.limit !== undefined) {
      req.query.limit = String(
        clampInt(req.query.limit, { min: 1, max: MAX_PAGE_SIZE, fallback: DEFAULT_PAGE_SIZE })
      );
    }
    if (req.query.page !== undefined) {
      req.query.page = String(clampInt(req.query.page, { min: 1, max: 100000, fallback: 1 }));
    }
  }

  next();
};

module.exports = { sanitize, stripOperators, MAX_PAGE_SIZE };
