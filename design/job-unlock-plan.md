# Job unlock tree plan (drafted 2026-10-16, not built)

Requested 2026-10-16: jobs unlock by reaching levels in earlier jobs.

## Rules (as given)
| Job | Unlocks after (each at the level shown) |
|---|---|
| Knight, Light Mage, Dark Mage | Starting jobs |
| Rogue | Knight 5 |
| Brawler | Knight 5 |
| Gray Mage | Light Mage 5, Dark Mage 5 |
| Yeoman | Rogue 5, Brawler 5 |
| Lore Master | Light Mage 10 |
| Gambler | Lore Master 5, Rogue 5 |
| Shadow Knight | Knight 5, Dark Mage 5 |
| Earthwarden | Brawler 5 |
| Tamer | Earthwarden 5 |
| Hidden Blade | Rogue 5, Knight 5 |
| Holy Knight | Knight 5, Light Mage 5 |
| Performer | Rogue 5, Dark Mage 5 |
| Musician | Light Mage 5, Rogue 5 |
| Lancer | Rogue 5, Hidden Blade 5 |
| Blade Sworn | Knight 10 |
| Conjurer | Dark Mage 10, Light Mage 10, Gray Mage 10 |
| Mimic | Dark Mage 10, Light Mage 10 |
| Rune Blade | Knight 10, Dark Mage 10 |
| Artificer | Gray Mage 10, Dark Mage 10 |

All requirements are the job's own level, not the main job level, and a job counts once it has reached that level (it does not need to be your current job).

## What exists today
- `ADVANCED_JOBS` (data.js) maps PLD, RDM, THF, MNK, RNG, SMN, DRK and BRD to a quest and a level; `save.jobsUnlocked[job]` is set by the quest reward (game.js, `r.unlock`) and by `normalizeSave`. `jobUnlockedIn` checks `JOBS[j].advanced` and that flag.
- Jobs SAM, NIN, DRG, BST, BLU, COR, PUP, DNC, SCH, GEO and RUN exist in data. I did not check how or whether they unlock today; that needs a look before building.
- Mercenaries use `MERCS[id].requires` (job or quest) and `mercAvailable`, which call `jobUnlocked`.

## Design
1. A table `JOB_REQ = { THF: { WAR: 5 }, ... }` in data.js. A job with an entry unlocks as soon as every listed job's level (`save.jobs[j].lv`) reaches the requirement. Level ups run the check and unlock the job with a log line and a toast ("You can now become a Rogue. Change jobs with Pip at your residence.").
1b. **Popup (answered 2026-10-16):** the moment a level up meets a job's requirements, a popup opens in the middle of the screen with the job's icon and name ("New job unlocked: Rogue!"), one line of flavour, and a Continue button. If several jobs unlock on the same level up they are shown one after another in the same popup. It waits until the player is out of combat and not zooming, so it never covers a fight; until then it sits in a queue (kept in the save so a log out does not lose it). The log line and the toast stay as well. Guess: reuse the existing level-up or quest-complete popup style rather than a new design.
2. The unlock flag stays in `save.jobsUnlocked`. It is set once and never taken back, so a player who later levels down or changes level sync keeps the job.
3. **Hidden until unlocked (answered 2026-10-16):** the job change menu at the residence (Pip) lists only unlocked jobs. Locked jobs are not shown at all, with no greyed rows and no requirement text, so players find the tree by playing. The unlock toast and log line are what announce a new job. Help describes the tree in general words only.
3b. **Ask the Job Master (answered 2026-10-16):** Tobin, Job Master (`tobin`, the NPC who gives the current job quests) gets a new dialog option, "Why do I have to unlock jobs?". He explains in character that a trade is learned on the back of another (a thief learns from a fighter's footwork, a scholar from a healer's books) and that new jobs open as you master the ones you know. He does not list exact requirements or the tree, so hidden jobs stay hidden. Optional second answer, "How am I doing?": he says in general terms whether you are close to opening something ("You're nearly ready for something new") without naming the job. Guess for the second answer: yes, keep it vague. The text for this lives in `TALK.talkTobin` (data.js) and its existing job-quest options are replaced as in the open question on quests.
4. Existing saves: on load, any job whose requirements are already met is unlocked. Jobs already unlocked by quest stay unlocked.
5. Tobin's two new dialog options, Help and Updates entries, and the job database shows a job only once it is unlocked (same rule as the residence menu).
6. Mercenary Hall: a mercenary of a job is available only if that job is unlocked (as now).

## Open questions (guesses used if not answered)
- What happens to the existing job quests (Holy Knight, Gray Mage, Rogue, Brawler, Yeoman, Conjurer, Shadow Knight, Musician)? Guess: keep them as story quests with their rewards, but they no longer gate the job, since the new tree replaces them. Their old level gates (6 to 10) are replaced by the table.
- Mimic, Rune Blade and Artificer (answered 2026-10-16): rules added to the table. All 21 jobs now have a rule.
- Does "Knight 5" mean the Knight job has reached level 5 at any time (my assumption), or must it be at least 5 right now? Guess: reached at any time.
- Level cap: the sub job rule is unchanged.

| Phase | Model | Work |
|---|---|---|
| J1 (done 18.34.0) | Sonnet | `JOB_REQ` table, the unlock check on level up and on load, residence list that hides locked jobs, toast, unlock popup with queue, tests, Help, Updates. Quests stay as story only. |

Dependencies: none. It can be built before or after M4.
