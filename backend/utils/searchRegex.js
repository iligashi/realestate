// Builds a safe case-insensitive "contains" filter from user input.
// Escaping regex metacharacters prevents ReDoS (catastrophic backtracking)
// and stops users from injecting their own patterns.

const MAX_SEARCH_LENGTH = 100;

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const searchRegex = (text) => ({
  $regex: escapeRegex(String(text).trim().slice(0, MAX_SEARCH_LENGTH)),
  $options: 'i'
});

module.exports = { escapeRegex, searchRegex, MAX_SEARCH_LENGTH };
