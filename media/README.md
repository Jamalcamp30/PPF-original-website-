# PPF Hero Background Video — Media Assets

Place your exported hero video files here:

| File                 | Purpose                                     |
|----------------------|---------------------------------------------|
| `ppf-hero.mp4`      | Primary video (H.264, 1920×1080, ≤ 8 MB)   |
| `ppf-hero.webm`     | WebM fallback (VP9, same resolution)        |
| `hero-poster.jpg`   | Still frame shown before video loads & on mobile |

## How to prepare the clips

1. **Combine your two Instagram training clips** into one seamless reel  
   using any editor (CapCut, Premiere, DaVinci Resolve, etc.).
2. **Export at 1920 × 1080**, 24–30 fps, ≤ 8 MB total.  
   Keep it **10–20 seconds** for a tight loop with no visible seam.
3. **No audio track** — the `<video>` tag is muted, so strip audio to save bytes.
4. **Extract a poster frame** — a strong still from the video, saved as `hero-poster.jpg`.

> On mobile (≤ 768 px) the video is hidden and only the poster image is shown  
> to save bandwidth. On desktops the video autoplays, muted, on a continuous loop.
