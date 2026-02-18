# Objectives & problem statement

Demo Day is an excellent opportunity to showcase the uniqueness and excitement of our game design. 

The game should do three things:

- **Make** **people** **actually** **learn** **about** **each** **other:** Everyone finds time capsules tied to real classmates; their photo, a fun fact, something personal. By the end you've engaged with every person in the cohort.
- **Get** **people** **moving** **and** **competing:**There's a countdown. There's a puzzle to crack. You're physically moving around a space hunting for things through your phone camera.
- **Show** **what** **we** **built:** AR overlaid on a real environment, built in a week, running from a QR code which will need to download an app (users will also require Testflight).

### Game concept & vision

**Concept:** You scan a QR code, point your phone around to calibrate the AR world, and hunt for Augmented Reality time capsules. Each capsule reveals a cohort member's story and a fragment of an escape code. Find them all and crack the code before time runs out.

**The** **story:** It's 2126. User is standing in the world famous Fractal University. A hundred years ago, the best cohort they ever had pulled one last prank, they set a lock timer on the door and hid the passcode in capsules which are scattered around the loft. The only escape is to get the passcode to the main door. To get out, you need to find every single capsule. If you do not get out, a bomb explodes which ends the university forevermore which explains Andrew’s urgency for us to get this right.

- who is the user?

**[initial] How** **it** **plays:**

1. install testflight(qr code)
2. Scan a QR code. Lands you onto app install. you get a unique player ID.
    1. could take some time - maybe get people to install beforehand?
3. Quick intro explains the game (stretch goal: a holographic version of Andrew delivers it in AR).
    1. show it on app + screen
4. Open your camera. orient yourself around. 
5. Capsules are floating in the space, anchored to real-world positions.
6. Walk around. Find a capsule. Tap it. It opens and shows you: a name, a photo, a fun fact, a key fragment, and a sequence number.
    1. Do we need a map to mark out the boundary and red/green rooms?
7. 12 capsules are out in the open. The other 5 are locked away behind passcodes. You unlock those by combining keys from clusters of 2–3 nearby open capsules.
    1. Capsules are colour coded
    2. Progress is shown i.e. 14/17
8. All 17 keys together spell out the final escape phrase.
9. Enter it before the timer hits zero. If you don't finish, you see how far you got and what you missed.
    1. Summary of all capsule content will be the end screen after the game finishes.

**Look** **and** **feel:** Futuristic but playful. Glowing capsules, translucent UI, the vibe of cracking open something old through a sci-fi lens. 

**Platform:** react native(iOS only). ARWorldMap generated with swift, object positions used for capsules. 

**Mock Examples:**

![image.png](attachment:ab6ecc8c-ad20-4612-ba52-74b94d7902b2:image.png)

![image.png](attachment:24782c79-ea2f-4510-a6aa-08506644d8aa:image.png)

![image.png](attachment:a14f21ee-fb65-4dd9-9a1f-61ae4e1658f5:image.png)

# Target audience

The 17 people in this cohort. We know each other, which is what makes the pen portraits hit, it's real people we've spent weeks with.

Secondary audience is anyone watching the demo: judges, instructors, guests. They'll see a walkthrough of the experience and the tech behind it, even if they're not playing the full game live.

**Practical** **assumptions:**

- Everyone has an iOS smartphone with a camera
- No accounts, no sign-up, scan the code and you're in
- A full session runs 15–30 minutes (tunable via the timer)
- The demo itself will be a constrained walkthrough, the full experience is designed to be played at a separate, dedicated session
- Late joiners, timer starts when they enter as an individual game.
- Non-smartphone users, unfortunately excluded.

### Scope / non-goals

**Must**

- QR code → install ios testflight app
- onboarding
- names
- AR camera view with capsules placed at real-world positions
    - constrained to the fractal bootcamp space
- Each capsule contains: name, photo?, fun fact, key fragment, sequence number
- Countdown timer
- Final phrase input → win or lose
- leaderboard

**Should**

- Holographic Andrew for the onboarding (3D AR character)
- Sound design / ambient audio / haptics
- Game Mechanic
    - Two-tier puzzle: 12 capsules in the open, 5 locked behind passcodes that require combining keys from nearby open capsules
    - All capsules contain a letter that when opened get appended to an array that is displayed top right of screen for user (acts as a progress bar for user
        - The array of letters is an anagram of the exit keyword to escape so user has to figure that out
- Animations when collecting capsules
- Summary page showing everything you found

**Could**

- Support for different venues or outdoor play
    - pretty feasible with admin/user model

**Out of Scope**

- **No** **accounts** **or** **saved** **progress.** Every scan is a fresh start.
- **No** **AI-generated** **content.** We're writing every fun fact, every clue, every portrait by hand. It matters that it's personal.
- **No** **outdoor** **mode.** Built for an indoor venue.
- **no android.**

# User Journeys

Live - [user_stories_flow_3.drawio](https://www.notion.so/user_stories_flow_3-drawio-30a6af3ca68580278220c31d36ca31cb?pvs=21) 

# Architecture overview (hub-and-spoke, ECS)

TBD

![Screenshot 2026-02-17 at 7.12.56 PM.png](attachment:a6e8cd41-662e-4322-96d6-85a497cc398a:Screenshot_2026-02-17_at_7.12.56_PM.png)

![Screenshot 2026-02-17 at 7.13.16 PM.png](attachment:97cdeb34-d1fe-4ce7-b4b3-872cf7346be9:Screenshot_2026-02-17_at_7.13.16_PM.png)

![Screenshot 2026-02-17 at 7.13.22 PM.png](attachment:922f771f-7879-492a-bb04-70139cc18a0e:Screenshot_2026-02-17_at_7.13.22_PM.png)

# Constraints

**Timeline:**

- 4 days of actual development (Days 2–5), with Day 2 split between planning and initial architecture
- Day 1 is orientation / skill-building, Day 6 is demo
- Realistically ~3.5 days of coding, this is reflected in the plan

**Team:**

- Max 3 developers with 1 system integrator
- No prior AR experience on the team, this is the biggest technical risk. Budget Day 2 afternoon and Day 3 morning just for getting a working AR camera view with one object placed in space.

**Tech** **stack:**

- TypeScript, mobile-first web app
- AR framework: AR.js (marker-based or location-based) or WebXR Device API — needs evaluation on Day 2. AR.js has a gentler learning curve and broader device support, which matters given zero AR experience.
- Rendering: A-Frame (pairs naturally with AR.js) or Three.js if you need more control
- Bundler: Vite
- Capsule content (portraits, facts, clues): static JSON baked into the app — keeps it simple, no backend needed for core gameplay
- If you want shared progress visibility (everyone sees which capsules have been found globally), you'll need a lightweight backend, an example would be Firebase Realtime DB or a simple WebSocket server on a free tier.

**Deployment:**

- Static hosting (Vercel or Netlify — both free tier, both support deploy previews for testing on phones during development)
- Custom domain not required — a clean Vercel URL behind a QR code works fine
- HTTPS is mandatory — AR camera access requires it. Both Vercel and Netlify give you this for free.

**Device** **support:**

- iOS Safari and Android Chrome are the two browsers that matter
- AR.js works on both without app install
- Test on real phones early and often — AR behaves differently on device vs desktop emulator

# Milestones & success criteria - Check [Plan](https://www.notion.so/Plan-30a6af3ca68580568d90ef4b38d54eba?pvs=21)

Summary of Milestones:

*Day 2 (Tuesday)*

- PRD Completed incl. architecture etc.
    - DOD: All three of us bought into this page.
- Architecture and Stubs on Repo
    - DOD: core.ts runs, all subsystems stubbed, team assignments locked, repo set up, everyone can clone and run

*Day 3 (Wednesday)*

- Core Features Built
    - Prove riskiest assumption
        - DOD: Phone camera opens in the web app. One 3D object renders in AR space. Visible on at least one team member's phone - if this doesn't work by lunch of day 3, re-evaluate the approach.
        - A capsule renders at a fixed position in AR. You can tap it. It opens and shows placeholder content.
    - Core Loop Working
        - DOD: Multiple capsules placed in a space. Walk around, find them, tap to open, see pen portrait content. No puzzle logic yet, just find-and-collect.

*Day 4 (Thursday)*

- Secondary Features Built and Refinements
    - Puzzle & timer
        - DOD: Two-tier system works: open capsules give keys, keys unlock hidden capsules. Timer counts down. Win/lose states trigger.
    - Pen Portraits
        - DOD: All 17 pen portraits written and in the app. All clues authored. Capsule positions configured for the venue (or a test space).

*Day 5 (Friday)*

- Demo Ready
    - DOD: Tagged release. Deployed to Vercel/Netlify. QR code generated. Tested on both iOS and Android. Constrained demo walkthrough rehearsed.
    - DOD; Summary page works. Capsule open animations. Timer feels urgent. At least one person outside the team has played through.

*Day 6 (Saturday)*

- Demo knocked out of the park
    - 3-5 team run throughs end-2-end
    - Game is 110% demo
    - Fallback options investigated and planned for

# Team roles & assignments

| **Name** | **Title** | **Roles** |
| --- | --- | --- |
| Aaron | System Integrator |  |
| Beckham | Fullstack Dev |  |
| Erik | Augmented Reality SME |  |

# Open questions

- lobby/gamestate.
    - how do we start a game? how do we end it? should we do either of those things?
- Discovered Capsule
    - For a discovered capsule, does it only indicate a capsule the user found or if other users find a capsule and others can see that?
- how does server broadcast end game to client?
    - whenever you load up game, request time from server, client counts down. at 0, request leaderboard from server.
    - websockets
