# Online player cap and wait queue plan (drafted 2026-10-16, not built)

Requested 2026-10-16: only 20 people on the server in online mode; anyone else who tries to log in goes into a wait queue, and they can leave it.

## Today
- Online mode uses Supabase. `public.players` has `last_seen`, updated by the client heartbeat `touch_player` every `NET_CFG.beat`. The admin stats count players seen in the last 5 minutes.
- Nothing limits how many can play at once. Realtime presence (`NET_RT.online`) lists who is in a zone.
- Offline mode is separate and never touches the server.

## Target behaviour
1. **At most 20 online players at once** (`max_online` stored in `game_private.config`, so it can change without a release). Offline play is not counted and never queued.
2. **Seat:** a player holds a seat while their heartbeat is fresh. A seat is released on log-out and when no heartbeat arrives for 90 seconds.
3. **Queue:** when the server is full, logging in to online mode puts you in a first-in-first-out queue. The screen shows "You are #N in line" and the number of players ahead, refreshed every 5 seconds, and nothing else loads in the meantime.
4. **Leaving:** a Leave queue button is always shown; it removes you from the queue and returns to the "How do you want to play?" screen, where Play Offline is still available. Closing the page or losing the connection also drops you from the queue after 30 seconds without a poll.
5. **Promotion:** when a seat frees up, the first person in line is reserved the seat for 60 seconds. Their client sees "Your turn" and continues into the character screen. If they don't claim it in time, the seat goes to the next in line.
6. **Reconnect grace:** a player whose connection drops keeps their seat for 2 minutes so a refresh or a network blip does not send them to the back of the queue.
7. **Admin exempt:** the admin account always gets in (and does not use a seat), so it can always manage the server.
8. **Server enforced:** the cap is checked by the server (RPC `queue_join`, `queue_poll`, `queue_leave`), and the game RPCs that load or save a character refuse a player without a seat, so editing the client cannot skip the queue.

## Server work (needs your approval before it runs on the live project)
- Table `game_private.seats (player uuid primary key, since timestamptz, beat timestamptz, reserved_until timestamptz)` and `game_private.queue (player uuid primary key, joined timestamptz, polled timestamptz)`.
- Functions `public.queue_join()` returns `{ state: 'play'|'wait', ahead, total }`, `public.queue_poll()` returns the same and promotes when due, `public.queue_leave()`. A shared helper `game_private.seat_ok()` is added to the character load and save functions.
- `touch_player` also refreshes the seat's `beat`.
- Stale seats and stale queue rows are cleaned lazily inside every `queue_*` call, so no scheduled job is needed.

## Client work
- Queue screen between sign-in and character select (`showQueue()` in main4.js): position, a Leave button, a spinner, and the "Your turn" state.
- Heartbeat continues while queued; a seat is lost with a message "You were disconnected for too long" and the player goes back to the queue.
- Help and Updates entries; the Credits/Network box shows "Online 12/20".

| Phase | Model | Work |
|---|---|---|
| Q1 | Opus | SQL migration (tables, functions, seat check in the load and save RPCs), client queue screen, leave/promotion/grace handling, idle auto log-out with the Config setting, online count display, Help and Updates, tests against a mock server. Opus because it is server-side access control on the live database. Needs your go-ahead before the migration runs. |

## Open questions (guesses used if not answered)
- Idle players (answered 2026-10-16): auto log-out after 30 minutes without input, adjustable in Config up to 60 minutes (`save.opts.idleMin`, 5 to 60). A 60-second warning with a "Still here" button comes first. Logging out frees the seat for the next in line. Online mode only.
- Queue wait estimate: guess "about N minutes" is not shown, only the position, because I can't predict session length.
- Who counts toward 20: every signed-in online player, including those in the character select screen. They only get a seat after promotion, and the seat is released when they leave the screen.
