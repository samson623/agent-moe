---
name: video
description: Generate 3 platform-optimized videos (TikTok, YouTube Shorts, IG Reels) from a single topic
user_invocable: true
---

# /video — Video Factory

Generate 3 videos (TikTok, YouTube Shorts, Instagram Reels) from a single topic.

## Usage

```
/video [topic] [duration]
```

Examples:
- `/video productivity hacks`
- `/video AI tools for creators 45s`
- `/video how to build a morning routine 60s`

## Instructions

When this skill is invoked:

1. **Parse the arguments:**
   - Everything before an optional duration suffix is the **topic**
   - Duration is optional, specified as `Ns` (e.g. `30s`, `45s`, `60s`). Default: `30s`
   - Extract duration by looking for a pattern like `\d+s` at the end of args

2. **Find the workspace ID:**
   - Run: `curl -s http://localhost:3000/api/workspaces | jq -r '.data[0].id'`
   - If that fails, check if the dev server is running. If not, tell the user to start it with `pnpm dev`

3. **Call the Video Factory API:**
   ```bash
   curl -s -X POST http://localhost:3000/api/video-factory/generate \
     -H "Content-Type: application/json" \
     -d '{"workspace_id": "<WORKSPACE_ID>", "topic": "<TOPIC>", "duration_seconds": <DURATION>}'
   ```

4. **Parse the response:**
   - Extract `batchId` and the 3 `packageId` values
   - Tell the user: "Generating 3 videos for '[topic]'... This takes 1-3 minutes."

5. **Poll for status:**
   ```bash
   curl -s "http://localhost:3000/api/video-factory/<BATCH_ID>/status?workspace_id=<WS_ID>&package_ids=<ID1>,<ID2>,<ID3>"
   ```
   - Poll every 10 seconds
   - Show progress updates to the user as each platform's render completes
   - Stop when `status` is `ready_for_review`, `failed`, or `partially_failed`

6. **Report results:**
   - For each completed video, show: platform, title, confidence score, render URL
   - Tell the user they can review and approve the videos in the Agent MOE UI at the Video Packaging page → Factory tab
   - If any failed, report the error

## Important

- The Next.js dev server must be running on localhost:3000
- Auth cookies are required — the curl calls go through the browser session
- If auth fails (401), tell the user to log in to Agent MOE in their browser first
