# Who follows me (Instagram export comparator)

A simple Next.js web app that helps you compare your **Instagram followers vs following** using Instagram’s **data export ZIP**.

## Privacy
Your ZIP is **processed locally in your browser**. Nothing is uploaded to a server.

## How to run

```bash
pnpm install
pnpm dev
```

Then open the local URL shown in your terminal.

## How to export your data from Instagram

Step 1: Go to `https://accountscenter.instagram.com/`  
Step 2: Click **Your Information and permission**  
Step 3: Click **Export your information**  
Step 4: Click **Create export**  
Step 5: Choose your Instagram account  
Step 6: Click **Export to device**  
Step 7: Fill the form with the following values:
- Notify: your preferred notification email
- Customize information: Clear all, keep only **Followers and following** under **Connections**
- Date range: **All time**
- Format: **JSON**
- Media Quality: **Lower quality**

Step 8: Click **Start export**  
Step 9: Wait for the email (can take ~30 minutes to a few days)  
Step 10: When the email arrives, go to `https://accountscenter.instagram.com/info_and_permissions/dyi/`  
Step 11: Download the report (`.zip`) and upload it in the app

## Expected ZIP contents
Instagram’s ZIP contains a lot of folders; this app looks for these files (path can vary, but filenames matter):

Inside `connections/followers_and_following/`:
- `following.json`
- `followers_1.json` (and possibly `followers_2.json`, `followers_3.json`, …)
- `blocked_profiles.json`
- `pending_follow_requests.json`
- `recent_follow_requests.json`
- `recently_unfollowed_profiles.json`
- `removed_suggestions.json`

If there are multiple `followers_*.json` files, the app **consolidates and de-duplicates** them before comparing.

## What you get
Main comparison tabs:
- **You follow & they follow** (mutual)
- **Only you follow** (not following you back)
- **Only they follow** (they follow you, you don’t follow back)

Extra insights:
- Blocked profiles
- Pending / recent follow requests
- Recently unfollowed
- Removed suggestions

Each list supports **search**, **sorting**, and **CSV export**.
