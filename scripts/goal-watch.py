#!/usr/bin/env python3
"""
Live goal watcher for the World Cup dashboard.

Polls ESPN's live scoreboard every POLL_SECONDS and, whenever the score of an
in-progress match goes up, fires a notification to:
  - macOS (native banner + sound, via osascript)
  - your phone (push via ntfy.sh)

This is separate from scripts/update-live.py, which only aggregates *completed*
matches on an hourly cron. This one is real-time and meant to run continuously
(in a terminal, or as a launchd agent — see scripts/com.worldcup.goalwatch.plist).

Config via env vars:
  NTFY_TOPIC     ntfy.sh topic to publish to (subscribe to the same one in the
                 ntfy app). Default below. Anyone who knows the topic can read
                 it, so keep it private-ish.
  NTFY_SERVER    ntfy base URL (default https://ntfy.sh)
  POLL_SECONDS   how often to poll (default 45)
  MAC_ALERTS     "1" to show macOS banners (default 1)
  PHONE_ALERTS   "1" to send ntfy push (default 1)
"""
import json, os, sys, time, subprocess, urllib.request, urllib.parse

NTFY_TOPIC = os.environ.get("NTFY_TOPIC", "worldcup-goals-aebd9103")
NTFY_SERVER = os.environ.get("NTFY_SERVER", "https://ntfy.sh").rstrip("/")
POLL_SECONDS = int(os.environ.get("POLL_SECONDS", "20"))
MAC_ALERTS = os.environ.get("MAC_ALERTS", "1") == "1"
PHONE_ALERTS = os.environ.get("PHONE_ALERTS", "1") == "1"

SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard"
SUMMARY = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event={}"

# State lives in a non-iCloud local dir so a launchd agent can write to it
# (launchd is blocked from ~/Library/Mobile Documents by macOS privacy).
SUPPORT = os.path.join(os.path.expanduser("~"), "Library", "Application Support",
                       "worldcup-goalwatch")
os.makedirs(SUPPORT, exist_ok=True)
STATE = os.path.join(SUPPORT, "state.json")

UA = {"User-Agent": "worldcup-goal-watch/1.0"}


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def load_state():
    try:
        with open(STATE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_state(state):
    tmp = STATE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f)
    os.replace(tmp, STATE)


def mac_notify(title, message):
    if not MAC_ALERTS:
        return
    # Escape double quotes for AppleScript string literals.
    t = title.replace('"', '\\"')
    m = message.replace('"', '\\"')
    script = f'display notification "{m}" with title "{t}" sound name "Glass"'
    try:
        subprocess.run(["osascript", "-e", script], check=False,
                       capture_output=True, timeout=10)
    except Exception as e:
        print(f"[goal-watch] mac notify failed: {e}", file=sys.stderr)


def phone_notify(title, message):
    if not PHONE_ALERTS:
        return
    url = f"{NTFY_SERVER}/{urllib.parse.quote(NTFY_TOPIC)}"
    data = message.encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST", headers={
        **UA,
        "Title": title.encode("utf-8"),
        "Tags": "soccer",
        "Priority": "high",
    })
    try:
        urllib.request.urlopen(req, timeout=15)
    except Exception as e:
        print(f"[goal-watch] ntfy push failed: {e}", file=sys.stderr)


def latest_goal_detail(event_id, scoring_team_abbr):
    """Best-effort scorer + minute for the most recent goal by a team."""
    try:
        s = fetch(SUMMARY.format(event_id))
    except Exception:
        return None
    goals = []
    for kp in s.get("keyEvents", s.get("commentary", [])):
        t = (kp.get("text") or "")
        if not t.startswith("Goal!"):
            continue
        clock = (kp.get("clock") or {}).get("displayValue", "")
        parts = kp.get("participants") or []
        scorer = parts[0]["athlete"]["displayName"] if parts else ""
        goals.append((clock, scorer, t))
    if not goals:
        return None
    clock, scorer, _ = goals[-1]
    bits = [b for b in (scorer, clock and f"{clock}") if b]
    return " · ".join(bits) if bits else None


def poll_once(state):
    try:
        sb = fetch(SCOREBOARD)
    except Exception as e:
        print(f"[goal-watch] scoreboard fetch failed: {e}", file=sys.stderr)
        return state

    for e in sb.get("events", []):
        st = e.get("status", {}).get("type", {})
        state_name = st.get("state")  # "pre" | "in" | "post"
        comp = e["competitions"][0]
        sides = {}
        for x in comp["competitors"]:
            sides[x["homeAway"]] = {
                "abbr": x["team"].get("abbreviation") or x["team"].get("displayName", "?"),
                "name": x["team"].get("shortDisplayName") or x["team"].get("displayName", "?"),
                "score": int(x.get("score", 0) or 0),
            }
        h, a = sides.get("home"), sides.get("away")
        if not h or not a:
            continue

        eid = str(e["id"])
        prev = state.get(eid)
        cur = {"h": h["score"], "a": a["score"], "state": state_name}

        # Only notify on an increase while the match is live (state == "in").
        if state_name == "in" and prev is not None:
            scored = None
            if cur["h"] > prev.get("h", 0):
                scored = h
            elif cur["a"] > prev.get("a", 0):
                scored = a
            if scored:
                clock = st.get("displayClock", "")
                title = f"⚽ GOAL — {scored['name']}"
                line = f"{h['name']} {cur['h']}–{cur['a']} {a['name']}"
                detail = latest_goal_detail(eid, scored["abbr"])
                message = f"{line}"
                if detail:
                    message += f"\n{detail}"
                elif clock:
                    message += f"  ({clock})"
                print(f"[goal-watch] {title} | {line}")
                mac_notify(title, message)
                phone_notify(title, message)

        state[eid] = cur

    # Drop finished/old events so state doesn't grow forever.
    live_ids = {str(e["id"]) for e in sb.get("events", [])}
    for k in list(state.keys()):
        if k not in live_ids:
            del state[k]
    return state


def main():
    print(f"[goal-watch] watching ESPN every {POLL_SECONDS}s | "
          f"mac={MAC_ALERTS} phone={PHONE_ALERTS} topic={NTFY_TOPIC}")
    state = load_state()
    while True:
        state = poll_once(state)
        try:
            save_state(state)
        except Exception as e:
            print(f"[goal-watch] save state failed: {e}", file=sys.stderr)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n[goal-watch] stopped")
