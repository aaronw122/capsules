**Why**
There are 7 best practice approaches that will be implemented as part of this programme.

1. **Repo setup** Aaron's proposal

**1. Linting (ESLint)**

**Why:** Catches bugs that run but shouldn't for example unused variables, unhandled promises, accidental any types. Cheaper to catch here than in a playtest.

**2. Formatting (Prettier)**

**Why:** Eliminates "style" debates in PRs. Everyone's code looks the same, so diffs only show real changes.

**3. Testing**

**Why:** With 3 people shipping fast, tests are the only way to know someone else's change didn't break your subsystem - can use Claude for this.

**4.** **Pre-commit** **Hooks** **(Husky)**

**Why:** Automates the stuff people forget. No one pushes unlinted code or broken tests, even when rushing on Day 3.

**5a.** **PR** **Template**

**Why:** Forces you to explain *what* and *why* before asking for a review. The reviewer shouldn't have to guess.

**5b.** **Small** **PRs**

**Why:** A 50-line PR gets a real review. A 500-line PR gets a "looks good." Small PRs find bugs; big PRs hide them.

**5c.** **Self-Review** **+** **Code** **Review**

**Why:** You catch half the issues re-reading your own diff. The reviewer catches the other half — the things you're too close to see.

**6.** **GitHub** **Actions** **CI**

**Why:** Runs lint and tests automatically on every PR so no one merges broken code, even if they skipped the local hooks.

**7.** **Branch** **Protection**

**Why:** Makes the rules non-negotiable. Can't merge to main without passing CI and getting a review.

**How**

Github

1. **Init repo, push to GitHub**
    1. Aaron defined
2. **Install ESLint + Prettier, create configs**
    
    npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
    
    **Mobile** **(React** **Native** **+** **TypeScript):**
    
    npm install -D eslint @react-native/eslint-config
    
    Keep rules minimal to start — catch real bugs, not style opinions:
    
    - no-unused-vars (error)
    
    - no-console (warn — flag but don't block)
    
    - @typescript-eslint/no-explicit-any (warn)
    
    - @typescript-eslint/no-floating-promises (error — critical for async bugs)
    

**3.** **Formatting** **(Prettier)**

One .prettierrc at the repo root, shared by server and mobile, run it through ES lint:

{

"semi": true,

"singleQuote": true,

"tabWidth": 2,

"trailingComma": "all",

"printWidth": 100

}

Run Prettier through ESLint (not separately) using eslint-config-prettier so there's one tool to run, not two.

4. **Install Husky + lint-staged, create hooks** 

# Install

npm install -D husky lint-staged

npx husky init

**.husky/pre-commit** — runs on every commit, fast:

npx lint-staged

**lint-staged config** **in** **package.json:**

{

"lint-staged": {

"*.{ts,tsx}": ["eslint --fix", "prettier --write"],

"*.{json,md}": ["prettier --write"]

}

}

**.husky/pre-push** — runs before push, thorough:

cd server && npm test

cd ../mobile && npm test

This means: commits are fast (lint + format only), pus

5 **Add PR template** 

## What to look at

<!-- Point the reviewer to the important parts. -->

## How to test

<!-- Steps to verify this works. -->

## Checklist

- [ ] Self-reviewed the diff

- [ ] No console.logs left in

- [ ] Types are accurate (no new `any`)

- [ ] Tests pass locally

**PR** **rules:**

- **Small** **PRs.** One subsystem or one feature per PR. If a PR touches more than 3-4 files, ask yourself if it can be split.

- **Self-review** **first.** Before requesting review, read your own diff on GitHub. You'll catch half the issues yourself.

- **SI** **reviews** **every** **PR.** Check: does it conform to the interface contract? Does it break other subsystems?

- **Claude** **as** **second** **reviewer.** Paste the diff and ask: "Review for bugs, frame-rate issues, memory leaks, missing error handling."

**Review** **checklist** **(from** **Google's** **eng** **practices):**

- Does the code do what the PR description says?

- Is it more complex than it needs to be?

- Are edge cases handled?

- Are there tests for the new behaviour?

6. **Add GitHub Actions CI workflow** 

**.github/workflows/ci.yml:**

name: CI

on:

pull_request:

branches: [main]

jobs:

server:

runs-on: ubuntu-latest

defaults:

run:

working-directory: server

steps:

- uses: actions/checkout@v4

- uses: actions/setup-node@v4

with:

node-version: 20

- run: npm ci

- run: npm run lint

- run: npm test

mobile:

runs-on: ubuntu-latest

defaults:

run:

working-directory: mobile

steps:

- uses: actions/checkout@v4

- uses: actions/setup-node@v4

with:

node-version: 20

- run: npm ci

- run: npm run lint

- run: npm test

7. **Set branch protection rules** 

In GitHub repo settings → Branches → Add rule for main:

- Require PR reviews (1 reviewer minimum)
- Require status checks to pass (CI workflow)
- No direct pushes to main

Team: everyone clones, runs npm install (hooks install automatically)

**Notes**

Standardising Work Product

- Linting
    - Checks for risky patterns in code that are syntactically valid but may cause bugs or performance issues
    - Suggested tool: ESLin
- Formatting
    - Style sheets etc. to ensure consistency of formatting.
- Testing
    - With Ai coding, deep test coverage is easier than evert.
    - All tests should pass before mergig a PR to keeo the build “green”
    - Realistic environment before releasing to production.
    - Automate linting, formatting, and testing with precommit hooks (try Husky: https://typicode.github.io/husky)
- Prs
    - Description google.github.io/eng-practices/review/developer/cl-descriptions.html
    - Size
        - Favour small Prs, shares knowledge across teams
        - Google’s best practice - google.github.io/eng-practices/review/developer/cl-small-cls.html
    - Code Review
        - Always self review
        - Best practices - google.github.io/eng-practices/review/reviewer/looking-for.html