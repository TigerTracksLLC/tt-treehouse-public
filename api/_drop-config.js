// Shared settings for the post-party drop (/drop, /reel, /review).
// To reuse for the next party: change EVENT (e.g. 'dec13') and redeploy.

const EVENT = 'oct17';

module.exports = {
  EVENT,
  PENDING_PREFIX: `${EVENT}/pending/`,
  APPROVED_PREFIX: `${EVENT}/approved/`,
  PEOPLE_PREFIX: `${EVENT}/people/`,
  MAX_FILE_BYTES: 4 * 1024 * 1024 * 1024, // 4 GB per file
};
