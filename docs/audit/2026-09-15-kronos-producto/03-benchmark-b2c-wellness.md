---
title: Benchmark — consumer fitness & wellness apps (2026-09-15)
source: web research agent, primary sources linked inline; UNVERIFIED items flagged
status: evidence
---

I have enough verified material now; the remaining conflicts (Whoop ECG clearance, watchOS 27 strength sets, Garmin program "on hold") are resolved or flagged. Here is the report.

# 2026 Consumer Fitness App Benchmark (for a CrossFit box SaaS + athlete app)

Research date: 2026-09-15. All prices USD. Items I could not confirm from a primary/current source are marked **UNVERIFIED**.

---

## 1. Whoop (5.0 / MG)

**Core loop.** Wear 24/7; wake to a Recovery % that sets a daily Strain target; log sleep/activities (auto-detected) and journal behaviors; the app closes the loop with "how yesterday's choices moved today's score" plus a coach chat.

**Hero metrics.** Home tab: **Recovery** (% with green/yellow/red), **Strain** (0–21), **Sleep** (duration + **Sleep Performance %**), **Stress Monitor** (real-time), **Health Monitor** (HRV/RHR/resp/SpO2/temp vs. baseline). Below: My Day, My Plan, customizable My Dashboard. Peak/Life add **Healthspan** (WHOOP Age, Pace of Aging). Sources: [Cybernews review](https://cybernews.com/health-tech/whoop-review/), [925 Studios design breakdown, 2026-03-24](https://www.925studios.co/blog/whoop-design-breakdown).

**Signature UI.** Black background, strict 3-color semantic system (green ready / yellow / red low), one giant score (~72pt equivalent) per tile, reorderable tile cards ("each tile is a doorway"), three disclosure tiers (score → week-over-week line/stacked bar trends → raw biometric graphs), animated transitions that preserve spatial context ([925 Studios](https://www.925studios.co/blog/whoop-design-breakdown)). Reviewers flag jargon-heavy coaching copy as a UX weakness.

**Social/community.** Teams and leaderboards on Strain/Recovery; minor vs. Strava. UNVERIFIED for 2026 changes.

**Coaching/AI.** WHOOP Coach (GPT-based since Sept 2023) as a chat surface; May 2026 added **My Memory** (user-editable context hub) and **Proactive Check-Ins** (e.g., travel-aware sleep/training nudges), plus on-demand **clinician video visits** (US, extra fee, summer 2026) and **HealthEx EHR sync** ([MobiHealthNews](https://www.mobihealthnews.com/news/whoop-launches-clinician-video-visits-ehr-integration-healthex), [CNBC 2026-05-08](https://www.cnbc.com/2026/05/08/whoop-on-demand-clinician-access.html)).

**Integrations/API.** Developer Platform: OAuth 2.0, REST **v2** (v1 removed 2025-10-01), webhooks, 100 req/min & 10k/day default, apps capped at 10 members until approved via dashboard "App approval" (needs privacy policy URL, brand-guideline compliance) ([overview](https://developer.whoop.com/docs/developing/overview/), [rate limits](https://developer.whoop.com/docs/developing/rate-limiting), [approval](https://developer.whoop.com/docs/developing/app-approval), [migration](https://developer.whoop.com/docs/developing/v1-v2-migration/)). Also writes to Apple Health / Health Connect and now pushes strength sessions to Strava (May 2026).

**Pricing (2026).** One $199/yr (5.0), Peak $239/yr (5.0 + Healthspan, Health/Stress Monitor), Life $359/yr (MG: FDA-cleared ECG, Blood Pressure Insights). 24-month: $319/$399/$599. Hardware never sold standalone ([TrackerVS, updated 2026-05-13](https://trackervs.com/pricing/whoop-pricing/), [Wareable](https://www.wareable.com/wearable-tech/whoop-5-vs-whoop-mg-which-membership-explained)). Advanced Labs: $199 single, $349 for 2/yr, $599 for 4/yr, 65 biomarkers via Quest ([Quest newsroom 2025-09-30](https://newsroom.questdiagnostics.com/2025-09-30-WHOOP-Launches-Clinician-Reviewed-Advanced-Labs,-Unlocking-a-Comprehensive-View-of-Human-Health)).

**Shipped last 12 months.** 2025-09-30 Advanced Labs (US); 2026-02-11 Advanced Labs UAE; 2026-05-08 clinician visits + HealthEx + My Memory/Proactive Check-Ins; 2026-06-23 FDA closed the July-2025 warning letter on Blood Pressure Insights after modifications ([STAT](https://www.statnews.com/2026/06/23/fda-drops-enforcement-against-wearable-maker-whoop/)); 2026-08-18 Advanced Labs opened to non-members + Grail Galleri MCED test ([Yahoo Finance](https://finance.yahoo.com/healthcare/articles/whoop-makes-advanced-labs-available-130000377.html)).

**Top complaints.** (1) Upgrade-policy bait-and-switch at 5.0 launch (May 2025) and lock-in without owning hardware ([TechCrunch](https://techcrunch.com/2025/05/11/fitness-tracker-whoop-faces-unhappy-customers-over-upgrade-policy)); (2) "ghost" auto-detected workouts and optical HR drift during high-intensity intervals vs. chest straps ([RedditRecs](https://redditrecs.com/fitness-tracker/model/whoop-50/)); (3) Strain feels arbitrary and needs >1 month calibration ([road.cc](https://road.cc/content/review/whoop-50-315523)).

---

## 2. Garmin Connect (+ Connect+)

**Core loop.** Watch records everything; the phone app opens to a customizable Home with an **Essentials** row and Morning Report; Garmin Coach adapts the day's workout to sleep/HRV/readiness.

**Hero metrics.** Essentials (up to 4): **Sleep Score, Body Battery, Training Readiness (1–100), HRV Status, Health Status, Steps**; plus Training Status, Recovery Time, Stress ([Garmin Rumors on Connect 5.27, 2026-07-20](https://garminrumors.com/garmin-connect-essentials-how-to/)).

**Signature UI.** Card-based Home (Today's Activity, In Focus, At a Glance, Events, Training Plans, Challenges) since the Jan-2024 redesign ([Garmin newsroom](https://www.garmin.com/en-US/newsroom/press-release/wearables-health/garmin-connect-gets-a-new-look-simplified-design-provides-a-more-customized-experience/)); Body Battery as a filling gauge, Training Readiness as a color band, dense charts; Connect+ adds a Performance Dashboard of historical graphs. Light and dark themes.

**Social/community.** Badge challenges, group/family challenges, Connections feed, LiveTrack (expanded for Connect+), Garmin Trails and Live Activity sharing.

**Coaching/AI.** **Active Intelligence** (Connect+, generative insights on Home that refresh through the day); **Garmin Coach** adaptive plans (run, cycle, strength, triathlon since FR 570/970 launch; Q3-2026 Run Coach run-walk/low-volume formats); **Quick Workout** (duration + intensity → session) ([Garmin newsroom 2025-03-27](https://www.garmin.com/en-US/newsroom/press-release/wearables-health/elevate-your-health-and-fitness-goals-with-garmin-connect/), [the5krunner Q3 2026](https://the5krunner.com/2026/09/01/garmin-q3-2026-feature-update/)).

**Integrations/API.** Garmin Connect Developer Program (Health, Activity, Training, Courses, Women's Health APIs), OAuth 2.0 (PKCE), **push** of full JSON payloads to your callback on sync, business-only, no fees, approval "within two business days", sandbox after approval, ~100 req/min ([FAQ](https://developer.garmin.com/gc-developer-program/program-faq/), [Health API](https://developer.garmin.com/gc-developer-program/health-api/), [Open Wearables 2026-05-06](https://openwearables.io/blog/garmin-connect-api-developer-guide-activities-health-metrics)). Several aggregator blogs claim the application form is "on hold / under revision" in 2026 — **UNVERIFIED**; Garmin's own pages say nothing of the sort.

**Pricing.** App free; Connect+ $6.99/mo or $69.99/yr, 30-day trial.

**Shipped last 12 months.** 2026-01-05 Nutrition/macro tracking (Connect+ only) ([PR Newswire](https://www.prnewswire.com/news-releases/stay-on-top-of-nutrition-goals-in-garmin-connect-302651315.html)); 2026-02-24 Fitness Coach plans, lifestyle logging (caffeine/alcohol), sleep alignment, gear tracking ([Garmin newsroom](https://www.garmin.com/en-US/newsroom/press-release/wearables-health/garmin-announces-feature-updates-for-select-smartwatches/)); 2026-07-20 Connect 5.27 Essentials; 2026-09-01 Q3 update: voice control, fall detection, Quick Workout, Live Activity (Connect+ only).

**Top complaints.** (1) Connect+ paywall backlash (10k-upvote boycott thread; Rundown and Year in Review moved behind it) ([Tom's Guide](https://tomsguide.com/wellness/smartwatches/garmin-sparks-outrage-with-connect-subscription-paywall-have-your-say)); (2) Active Intelligence judged shallow ("screenshot to ChatGPT") ([Garmin forums](https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-mobile-andriod/408243/connect-plus-is-a-joke-garmin-moved-that-comment-before-to-make-it-less-visible)); (3) app updates breaking sync (iOS 5.21, 2026-01-29) ([Notebookcheck](https://www.notebookcheck.net/Garmin-Fenix-8-Venu-4-and-more-smartwatches-encounter-issues-after-Garmin-Connect-update.1215798.0.html)).

---

## 3. Strava

**Core loop.** Record or sync an activity → it lands in a social feed with map/Flyover, segments, kudos and comments → subscribers get an Athlete Intelligence summary and training-load charts.

**Hero metrics.** Activity-centric, not readiness: per-activity distance/pace/HR/Relative Effort; subscriber Fitness & Freshness, Training Log, progress chart with comparison mode, personal heatmaps ([Strava Help](https://support.strava.com/en-us/articles/15402044-strava-subscription-features)).

**Signature UI.** Feed of activity cards (map hero, stats row, kudos), Flyover 3D replays and Activity Replays that auto-animate in feed, dark mode (2024), muscle-map cards for strength sessions (May 2026), orange accent.

**Social/community.** Kudos, comments, clubs (hiking clubs up 5.8x in 2025), club/race event discovery (2026-07-09), segment leaderboards (ML-cleaned, 57 factors), group challenges, brand rewards (adidas adiClub points, 2026-07-14) ([press.strava.com](https://press.strava.com/)).

**Coaching/AI.** **Athlete Intelligence** (out of beta 2025-02-20; subscriber, mobile-only, sits under the stat box with "Say More") ([Help](https://support.strava.com/en-us/articles/15401629-athlete-intelligence-on-strava)); **Adaptive Training** goal-based workouts (May 2026); Runna owned since April 2025; **MCP Connector** lets subscribers query their history in Claude (2026-06-01) ([press](https://press.strava.com/articles/strava-launches-mcp-connector)).

**Integrations/API.** OAuth 2.0 REST API; since **2026-06-01** standard-tier developers must hold an active Strava subscription ($11.99/mo), some endpoints retired with 90-day grace; API Policy §5.3 bans any AI use of Strava data (training, RAG, "ingestion into a context window"), data shown only to its owner, no replicating Strava features ([API Agreement eff. 2026-06-01](https://www.strava.com/legal/api), [API Policy](https://www.strava.com/legal/api_policy), [Apps for Strava](https://appsforstrava.com/blog/strava-developer-program-changes-2026)).

**Pricing.** Free tier; $11.99/mo or $79.99/yr; Family $139.99/yr; Strava + Runna $149.99/yr ([Tom's Guide](https://www.tomsguide.com/wellness/fitness/strava-and-runna-launch-joint-subscription-heres-what-you-need-to-know)).

**Shipped last 12 months.** Dec 2025 Year in Sport paywalled ([Slashdot](https://news.slashdot.org/story/25/12/19/2158235/strava-puts-popular-year-in-sport-recap-behind-an-80-paywall)); 2026-04-30 Physical Therapy sport type; 2026-05-21/28 strength overhaul with 14 sync partners (Whoop, Hevy, Garmin, Fitbod…), Route Deviation Alerts, Adaptive Training ([Stories](https://stories.strava.com/articles/whats-new-on-strava-may-2026)); 2026-06-01 MCP + API policy; 2026-06-11 hiking suite (Route Discovery, off-route alerts, Watch navigation); 2026-07 events discovery, adidas, Samsung Health routes.

**Top complaints.** (1) Creeping paywall (Year in Sport) ([Yahoo](https://www.yahoo.com/lifestyle/articles/dear-strava-paywall-problem-thats-150000741.html)); (2) developer lock-down killing small third-party apps ([TechRepublic](https://www.techrepublic.com/article/news-strava-api-scraping-crackdown/)); (3) leaderboard cheating / flagged activities and the 2024 external-link purge ([TechRadar](https://www.techradar.com/health-fitness/strava-does-a-u-turn-as-users-are-allowed-to-post-external-links-again)).

---

## 4. Apple Fitness + Apple Watch (watchOS 26 → 27)

**Core loop.** Close three Activity rings (Move/Exercise/Stand) daily; start workouts from the redesigned Workout app; iPhone Fitness app shows rings, trends, awards, sharing and Fitness+.

**Hero metrics.** Activity rings, Vitals (overnight HR/resp/temp/SpO2/sleep duration), **Sleep Score** (watchOS 26), Training Load, VO2 max, Cardio Fitness, hypertension notifications. No readiness score (a "Readiness" app is code-hinted for later — **UNVERIFIED**, [AppleInsider 2026-09-07](https://appleinsider.com/articles/26/09/07/watchos-27-will-still-have-surprises-even-if-apple-watch-series-12-wont)).

**Signature UI.** Rings as the universal glanceable, Liquid Glass translucency (26), Smart Stack, four-corner Workout app layout (Workout Views, Custom Workout, Pacer, Race Route), auto-music by workout type ([Apple Newsroom 2025-06-09](https://www.apple.com/newsroom/2025/06/watchos-26-delivers-more-personalized-ways-to-stay-active-and-connected/)).

**Social.** Activity Sharing, competitions, awards; Fitness+ shared sessions. Minimal.

**Coaching/AI.** **Workout Buddy** — generative spoken motivation from your history, Fitness+-trainer voice; watchOS 27 (2026-09-14) removes the nearby-iPhone requirement (Wi-Fi/cellular needed) and adds Spanish ([Apple Support](https://support.apple.com/en-us/149077), [DC Rainmaker 2026-06-08](https://www.dcrainmaker.com/2026/06/apple-watchos27-new-features-detailed.html)). Fitness+ Custom Plans; iOS 26 Fitness custom-workout builder and phone-only tracking; manual logging in 26.1 ([9to5Mac](https://9to5mac.com/2025/12/30/ios-26s-fitness-app-has-three-upgrades-ready-for-new-years-goals/)). Strength set/rep/equipment logging in watchOS 27 is reported by AppleInsider/Digital Trends but absent from Apple's release notes — **UNVERIFIED**.

**Integrations/API.** HealthKit (read/write with per-type user consent, no Apple approval beyond App Review; Guideline 5.1.3 forbids ads/data-mining use, sharing only to health/fitness services with consent, no PHI in iCloud) ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)); watchOS 27 adds Workout Zones and Menopause APIs.

**Pricing.** Fitness app free with Watch; Fitness+ $9.99/mo or $79.99/yr, in Apple One ([9to5Mac](https://9to5mac.com/2026/01/05/you-can-get-apple-fitness-plus-for-free-heres-how/)).

**Top complaints.** (1) No rest/sick days for rings ([Apple Community](https://discussions.apple.com/thread/254404555)); (2) rings/Fitness app breaking after 26.x updates ([Apple Community](https://discussions.apple.com/thread/256141992)); (3) Workout Buddy gated to AI-capable iPhones + headphones + English/Spanish.

---

## 5. Oura (Ring 4)

**Core loop.** Sleep with the ring → morning **Readiness**, **Sleep**, **Activity** scores (0–100) → daytime Stress and Resilience, tag behaviors, ask Advisor.

**Hero metrics.** Today tab: Readiness, Sleep, Activity scores, Daytime Stress, Cardiovascular Age, **Cumulative Stress**, Symptom/Health Radar ([TechCrunch 2025-10-20](https://www.techcrunch.com/2025/10/20/oura-launches-redesigned-app-and-cumulative-stress-feature)).

**Signature UI.** Oct-2025 redesign: three tabs **Today / Vitals / My Health**; soft calm palette (not neon), circular score badges, contributor bars, 30-day rolling views (Health Radar), monthly "My Health" trend cards.

**Social.** **Circles**: share chosen scores with up to 20 people, emoji reactions ([Oura blog](https://ouraring.com/blog/introducing-oura-circles/)).

**Coaching/AI.** **Oura Advisor** (LLM chat, all members since 2025-03-31) ([BusinessWire](https://www.businesswire.com/news/home/20250331565896/en/Oura-Advisor-an-AI-powered-Personal-Health-Companion-Now-Rolling-Out-to-All-Oura-Members)); Counsel Health physicians in-app from 2026-06-16.

**Integrations/API.** Oura API v2, OAuth 2.0 (scopes: email, personal, daily, heartrate, workout, tag, session, spo2), personal access tokens deprecated ([docs](https://cloud.ouraring.com/docs/authentication)); third parties report a 10-user cap until app review — **UNVERIFIED** in official docs. Syncs to Apple Health/Health Connect/Strava.

**Pricing.** Ring 4 $349–$499; membership $5.99/mo or $69.99/yr; without it only the 3 scores remain ([Oura support](https://support.ouraring.com/hc/en-us/articles/4409086524819-Oura-Membership)).

**Shipped last 12 months.** 2025-10-20 redesign + Cumulative Stress + 12-month cycle view; 2026-05-28 announced Health Radar (Blood Pressure Signals, Nighttime Breathing; US June 2026, Gen3+) ([Oura blog](https://ouraring.com/blog/introducing-health-radar/)); menopause insights.

**Top complaints.** (1) Mandatory subscription after $349+ hardware ([Fortune](https://fortune.com/2026/02/04/11-billion-oura-ceo-subscriptions-tom-hale-peloton-tesla-elon-musk/)); (2) weak for active training (no on-ring workout HR/GPS); (3) isolated overheating reports ([Tom's Guide](https://www.tomsguide.com/wellness/smart-rings/reddit-users-claim-oura-rings-are-overheating-heres-ouras-response)).

---

## 6. Hevy and Strong (strength-logging benchmarks)

- **Hevy** — 16M+ users; free tier (4 routines, 7 custom exercises), Pro $2.99/mo, $23.99/yr, $74.99 lifetime. Logging: previous session values pre-filled per set, auto rest timer, warm-up/drop/failure set tags, native supersets, RPE/RIR toggle, plate calculator, Apple Watch + Wear OS offline. Social feed (follow, like, comment, copy routines). **Hevy Trainer** algorithmic programs with automatic weight progression. Public API (Pro API key), Strava sync with muscle map ([hevyapp.com](https://www.hevyapp.com/), [API docs](https://api.hevyapp.com/docs/), [SensAI 2026-08-04](https://www.sensai.fit/blog/hevy-vs-strong-2026)).
- **Strong** — free forever (3 routines), Pro $4.99/mo, $29.99/yr, $99.99 lifetime. Fastest "notebook" flow, standalone Apple Watch logging, warm-up calculator, custom timers, Apple Health; no social or AI ([strong.app](https://www.strong.app/)).
- Complaints: Hevy timer bugs/black-screen crashes; Strong inconsistent Watch sync and thin Android/Wear support.

---

## 7. What defines a modern fitness app in 2026

1. **One readiness number as the daily anchor** (Whoop Recovery, Garmin Training Readiness, Oura Readiness; Apple conspicuously lacks it).
2. **Readiness-scaled daily target** (Whoop Strain Target, Garmin Coach daily adaptation, Oura Activity goal).
3. **AI daily briefing on Home** that refreshes through the day (Garmin Active Intelligence, Whoop Proactive Check-Ins, Oura Advisor, Apple Workout Buddy spoken form).
4. **Chat-with-your-data + user-editable memory** (Whoop Coach/My Memory, Oura Advisor, Strava MCP → Claude).
5. **Glanceable customizable stat row** of 3–5 tiles with big number + sparkline (Garmin Essentials, Whoop My Dashboard, Oura Today).
6. **Progressive disclosure**: score → 7/30-day trend with deltas → raw graph (Whoop three tiers, Oura Vitals/My Health, Strava progress comparison mode).
7. **Semantic color only for state, monochrome otherwise** (Whoop green/yellow/red on black; Garmin readiness bands).
8. **Strength logging with autofill of last set, rest timer, set-type tags, muscle map** (Hevy, Strong, now Strava May 2026, Apple watchOS 27 UNVERIFIED).
9. **Social as accountability, not broadcast**: kudos/reactions, small circles, club events, leaderboards with integrity ML (Strava, Oura Circles, Garmin challenges).
10. **Longitudinal health layer bolted onto fitness** (Whoop Healthspan/Labs/clinicians, Oura Health Radar/Counsel, Apple hypertension alerts).
11. **Subscription-gated insights with a free core**, and public backlash whenever a formerly free recap moves behind it (Garmin Connect+, Strava Year in Sport, Oura).
12. **Cross-platform sync via Apple Health / Health Connect plus direct partner APIs**, with AI use of exported data now contractually restricted (Strava).

---

## 8. Pulling third-party data in 2026: what you need

| Source           | API / auth                                                                                                                      | Approval                                                                                                                              | Key restrictions                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Whoop**        | Developer Platform REST v2, OAuth 2.0 auth-code, scopes per data type, webhooks                                                 | Self-serve dashboard; 10 members max until "App approval" request (privacy policy, brand guidelines, tested with ≥1 member)           | 100 req/min, 10k/day default (raisable); must follow API Terms of Use; v1 gone since 2025-10-01                                                                                                |
| **Garmin**       | Connect Developer Program: Health/Activity/Training/Courses/Women's Health, OAuth 2.0 PKCE, push to your HTTPS callback         | Apply as a business with company email, privacy policy, use case; "within two business days"; sandbox then production                 | Business use only; no fees, some metrics licensed; ~100 req/min; 2026 "program paused" claims UNVERIFIED                                                                                       |
| **Apple Health** | HealthKit on-device (iOS/watchOS), per-type user consent; no server API — you must ship an iOS app that uploads to your backend | App Store Review only                                                                                                                 | Guideline 5.1.3: no ads/data-mining, share only to health/fitness services with consent, no PHI in iCloud, no fabricated writes                                                                |
| **Android**      | Health Connect SDK, Android 16 granular permissions                                                                             | Play Console Health apps declaration (mandatory for all apps; Jan 2026 "data overreach" review; 2026-04-15 policy update)             | Only permissions tied to visible features; extra justification for records like blood pressure ([Android Developers](https://developer.android.com/health-and-fitness/health-connect/publish)) |
| **Strava**       | REST API, OAuth 2.0                                                                                                             | Self-serve, but standard tier now requires an active Strava subscription (since 2026-06-01); expanded access via self-service request | Show a user's data only to that user; no AI/ML training, RAG, or context ingestion (API Policy §5.3); no cloning Strava features; retired endpoints; MCP is personal-use only                  |
| **Oura** (bonus) | API v2, OAuth 2.0 with 8 scopes; PATs deprecated                                                                                | Self-serve registration; reported 10-user cap until review (UNVERIFIED)                                                               | Standard terms; rate limits undocumented                                                                                                                                                       |

Practical implication for a box SaaS: Whoop and Oura are the cheapest paths to a per-athlete readiness feed; Garmin requires a corporate application; Apple/Android require your own mobile app; Strava is fine for posting WOD results out but effectively unusable as an AI-coaching data source.
