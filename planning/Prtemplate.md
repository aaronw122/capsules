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