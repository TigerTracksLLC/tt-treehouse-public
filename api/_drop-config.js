// Shared settings for the post-party drop (/drop, /reel, /review).
// To reuse for the next party: change EVENT (e.g. 'dec13') and redeploy.

const EVENT = 'oct17';

module.exports = {
  EVENT,
  PENDING_PREFIX: `${EVENT}/pending/`,
  APPROVED_PREFIX: `${EVENT}/approved/`,
  PEOPLE_PREFIX: `${EVENT}/people/`,
  // Missed connections cards are no longer tied to one party (/connections is a standing page).
  // The folder name is fixed so cards already sent stay in /review when EVENT changes.
  CONNECT_PREFIX: 'oct17/connect/',
  // couples' stories are not tied to one party, so they sit outside the event folder
  STORIES_PREFIX: 'stories/',
  MAX_FILE_BYTES: 4 * 1024 * 1024 * 1024, // 4 GB per file
};
