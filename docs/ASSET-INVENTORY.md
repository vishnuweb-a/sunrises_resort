# Asset inventory

**Source:** sunriverresort.in media library, read through `/wp-json/wp/v2/media`.

**Capture method:** the build environment cannot download from that domain directly. Each original was opened in a browser and captured at its rendered size: about 1344 px on the long edge for 2560 px originals, and 1381 px for `POOL-min.jpg`. The captures were exported as WebP at 1344 px and 800 px.

**Action before launch:** re-export from the 2560 px originals for sharper full-bleed use.

## public/assets/

| Folder | File (–800 / –1600 .webp) | Original in WP media | Subject | Used on |
|---|---|---|---|---|
| hero | river-balcony | 2025/12/DSC7247-min-scaled.jpg | Balcony, swing chair, river and hillside | Home hero slide 1, cinematic section, Explore, Booking hero |
| resort | pool-mountains | 2025/12/POOL-min.jpg | Pool with hills and resort block | Hero slide 2, Explore, Wellness hero |
| resort | entrance-walkway | 2025/12/DSC7471-min-scaled.jpg | Walkway, balconies and the "Sun River Resort" sign | Hero slide 3, Explore, About hero |
| resort | grounds-gardens | 2025/12/DSC7438-2-1-min-1-scaled.jpg | Garden path, lawns, gazebo | Intro banner, About, Gallery hero |
| restaurant | riverside-terrace | 2025/12/DSC7415-1-min-scaled.jpg | Table set on the riverside promenade | Dining, Restaurant |
| rooms | exec-hill-1/2/3 | DSC7340, DSC7331, DSC7229 | Executive room interiors | Executive Hill View ¹ |
| rooms | exec-river-1/2 | DSC7628, DSC7298 | Room with balcony doors and greenery | Executive River View ¹, Contact hero |
| rooms | family-suite-1/2 | 2026/05/DSC7289-1, DSC7292-1 | King bed and bunk beds | Family Suite ² |
| rooms | suite-lounge | 2025/12/DSC7217-1-min-scaled.jpg | Room with king bed and sofa set | Family Suite, Explore |
| rooms | bath-shower, bath-tub | DSC7625, 2026/05/DSC7343-1 | Bathrooms | Room galleries |
| branding | sunriver-logo.png | 2025/12/418091222_…-removebg-preview.png | **Original** full-colour logo, background keyed out | Footer |
| branding | sunriver-emblem-white.png, sunriver-emblem-black.png | derived from the above | **Single-colour adaptation (needs approval)** | Header, mobile menu |
| branding | favicon.png | derived from the original logo | | Favicon |
| gallery | (none) | | The gallery reuses the files above by ID, so nothing is duplicated | |
| icons | (none) | | Icons are Lucide React components, tree-shaken into the bundle | |

¹ The photos were assigned to the hill-view and river-view rooms by what is visible in them. The live site's room galleries could not be read individually, so please confirm.

² Certain: the bunk beds match "King size Multiple beds" and the 6-adult occupancy.

## Gaps

- **Authorised video.** `2025/12/sunriver-resort-video.mp4` and `sunriver-video-.mp4` exist in the media library but could not be fetched here. The hero is built to take a video in place of slide 1.
- **Dining.** There is no restaurant interior or food photography, and no menu.
- **Full resolution.** Re-export from the 2560 px originals.
- **Not used:** template and stock files in the library. These are the 2021/08 Unsplash and spa stock, the `logo.png` / `logo-white.png` "Cls Hotel" theme logos, the solar-panel image, and `woocommerce-placeholder`.

No Four Seasons images, video, logos or fonts are included anywhere in the project.
