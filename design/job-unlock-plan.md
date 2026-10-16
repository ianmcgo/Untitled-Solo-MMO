# Job unlock tree plan (drafted 2026-10-16, not built)

Requested 2026-10-16: jobs unlock by reaching levels in earlier jobs.

## Rules (as given)
| Job | Unlocks after (each at the level shown) |
|---|---|
| Warrior, White Mage, Black Mage | Starting jobs |
| Thief | Warrior 5 |
| Monk | Warrior 5 |
| Red Mage | White Mage 5, Black Mage 5 |
| Ranger | Thief 5, Monk 5 |
| Scholar | White Mage 10 |
| Corsair | Scholar 5, Thief 5 |
| Dark Knight | Warrior 5, Black Mage 5 |
| Geomancer | Monk 5 |
| Beastmaster | Geomancer 5 |
| Ninja | Thief 5, Warrior 5 |
| Paladin | Warrior 5, White Mage 5 |
| Dancer | Thief 5, Black Mage 5 |
| Bard | White Mage 5, Thief 5 |
| Dragoon | Thief 5, Ninja 5 |
| Samurai | Warrior 10 |
| Summoner | Black Mage 10, White Mage 10, Red Mage 10 |

All requirements are the job's own level, not the main job level, and a job counts once it has reached that level (it does not need to be your current job).

## What exists today
- `ADVANCED_JOBS` (data.js) maps PLD, RDM, THF, MNK, RNG, SMN, DRK and BRD to a quest and a level; `save.jobsUnlocked[job]` is set by the quest reward (game.js, `r.unlock`) and by `normalizeSave`. `jobUnlockedIn` checks `JOBS[j].advanced` and that flag.
- Jobs SAM, NIN, DRG, BST, BLU, COR, PUP, DNC, SCH, GEO and RUN exist in data. I did not check how or whether they unlock today; that needs a look before building.
- Mercenaries use `MERCS[id].requires` (job or quest) and `mercAvailable`, which call `jobUnlocked`.

## Design
1. A table `JOB_REQ = { THF: { WAR: 5 }, ... }` in data.js. A job with an entry unlocks as soon as every listed job's level (`save.jobs[j].lv`) reaches the requirement. Level ups run the check and unlock the job with a log line and a toast ("You can now become a Thief. Change jobs with Pip at your residence.").
2. The unlock flag stays in `save.jobsUnlocked`. It is set once and never taken back, so a player who later levels down or changes level sync keeps the job.
3. **Hidden until unlocked (answered 2026-10-16):** the job change menu at the residence (Pip) lists only unlocked jobs. Locked jobs are not shown at all, with no greyed rows and no requirement text, so players find the tree by playing. The unlock toast and log line are what announce a new job. Help describes the tree in general words only.
4. Existing saves: on load, any job whose requirements are already met is unlocked. Jobs already unlocked by quest stay unlocked.
5. Help and Updates entries, and the job database shows a job only once it is unlocked (same rule as the residence menu).
6. Mercenary Hall: a mercenary of a job is available only if that job is unlocked (as now).

## Open questions (guesses used if not answered)
- What happens to the existing job quests (Paladin, Red Mage, Thief, Monk, Ranger, Summoner, Dark Knight, Bard)? Guess: keep them as story quests with their rewards, but they no longer gate the job, since the new tree replaces them. Their old level gates (6 to 10) are replaced by the table.
- Rune Fencer and Puppetmaster and Blue Mage are not in your list. Guess: leave them unlocked the way they are now, and add them when you give a rule.
- Does "Warrior 5" mean the Warrior job has reached level 5 at any time (my assumption), or must it be at least 5 right now? Guess: reached at any time.
- Level cap: the sub job rule is unchanged.

| Phase | Model | Work |
|---|---|---|
| J1 | Sonnet | `JOB_REQ` table, the unlock check on level up and on load, residence list that hides locked jobs, toast, tests, Help, Updates. Quests stay as story only. |

Dependencies: none. It can be built before or after M4.
