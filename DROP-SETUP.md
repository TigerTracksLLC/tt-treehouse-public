# Post-party drop: /drop, /reel, /review

Guests open treehouseevents.cliffeliz.ai/drop, add their name and phone or email, and pick videos and photos from their camera roll. The files go straight from their phone to Vercel Blob storage at full quality. Nothing goes public until it's approved at /review. Approved files appear at /reel.

## Pages

- **/drop** is the link in the text blast. Videos come first, it's built for phones first, there's no size cap that matters (4 GB per file), and big videos upload in parallel chunks that retry on bad signal.
- **/reel** shows approved videos and then photos. It isn't linked from the homepage. Send this link to everyone who uploaded.
- **/review** is admin only and needs the key below. It has three tabs: To review, On the reel, and Who sent (with a copy-contacts button and a CSV download).

## One-time setup in Vercel (about 5 minutes)

1. Go to the Vercel dashboard, open project **tt-treehouse-public**, then **Storage**, then **Create Database**, and choose **Blob**. Name it `treehouse-drop`, pick **Public** access, and connect it to this project for all environments. This adds `BLOB_READ_WRITE_TOKEN` automatically.
2. Go to **Settings**, then **Environment Variables**, and add `DROP_ADMIN_KEY`. Its value is any password you choose. Anyone with this password can approve and delete uploads.
3. Merge the branch `feature/oct17-drop` into `main` (or copy the files from the zip into the repo and push). Vercel redeploys.
4. Test it on your own phone. Upload one video at /drop, approve it at /review, and check that it shows up at /reel.

## Swapping the hero video

Both pages loop `/img/hero-video.mp4` (Tribeca Rooftop, Oct 2025). To use a clip from Saturday, compress it to about 5 MB at 720p, save it as `img/drop-hero.mp4`, and change the `<source src>` in `drop.html` and `reel.html`.

## Notes

- Storage and transfer count toward the Vercel plan. A few hundred phone videos can come to tens of GB, so check **Storage > treehouse-drop > Usage** after the first day.
- iPhone videos are .MOV (HEVC). They play in Safari and on most modern browsers, but some older Android phones can't play them on /reel.
- For the next party, change `EVENT` in `api/_drop-config.js` and in `js/drop.js` (for example to `dec13`), and update the date line on both pages.
