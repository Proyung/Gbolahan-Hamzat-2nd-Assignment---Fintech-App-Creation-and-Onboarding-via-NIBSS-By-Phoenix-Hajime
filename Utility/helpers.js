// NIBSS wraps payloads differently per endpoint: `data` (BVN), `response` (NIN),
// `account` (account create). This flattens one level so fields read the same way.
const unwrap = (body) => ({ ...(body || {}), ...(body?.data || {}), ...(body?.response || {}), ...(body?.account || {}) });

// Return the first defined value among several possible field names
const pick = (obj, ...keys) => {
    for (const key of keys) {
        if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
    }
    return undefined;
};

// Show only the last 4 digits of an identifier, e.g. *******8901
const mask = (value) => (value ? `${'*'.repeat(Math.max(value.length - 4, 0))}${value.slice(-4)}` : value);

module.exports = { unwrap, pick, mask };
