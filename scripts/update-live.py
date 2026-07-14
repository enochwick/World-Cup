#!/usr/bin/env python3
"""
Auto-updates public/live.json (and dist/live.json) from ESPN's public World Cup
feed: match results, top scorers, assists, and clean sheets. Deterministic — no
AI involved. Commits and pushes to GitHub only when the data actually changed.

Run hourly via launchd (see scripts/com.worldcup.liveupdate.plist).
"""
import json, os, re, sys, subprocess, collections, urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public", "live.json")
DIST = os.path.join(ROOT, "dist", "live.json")

SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates={}"
SUMMARY = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event={}"
WINDOWS = ["20260611-20260627", "20260628-20260719"]  # group stage, knockouts

# Knockout bracket structure (static tournament shape).
KO_FIXED = {  # round of 32: fixed pairings, home listed first
    "m73": ("RSA", "CAN"), "m74": ("BRA", "JPN"), "m79": ("GER", "PAR"),
    "m80": ("NED", "MAR"), "m77": ("CIV", "NOR"), "m81": ("FRA", "SWE"),
    "m75": ("MEX", "ECU"), "m76": ("ENG", "COD"), "m78": ("BEL", "SEN"),
    "m82": ("USA", "BIH"), "m83": ("ESP", "AUT"), "m84": ("POR", "CRO"),
    "m85": ("SUI", "ALG"), "m86": ("AUS", "EGY"), "m87": ("ARG", "CPV"),
    "m88": ("COL", "GHA"),
}
KO_FEEDS = {  # later rounds: home = winner of feeds[0], away = winner of feeds[1]
    "r16a": ("m73", "m80"), "r16b": ("m79", "m81"), "r16c": ("m74", "m77"),
    "r16d": ("m75", "m76"), "r16e": ("m84", "m83"), "r16f": ("m82", "m78"),
    "r16g": ("m87", "m86"), "r16h": ("m85", "m88"),
    "qf1": ("r16a", "r16b"), "qf2": ("r16c", "r16d"), "qf3": ("r16e", "r16f"),
    "qf4": ("r16g", "r16h"), "sf1": ("qf1", "qf3"), "sf2": ("qf2", "qf4"),
    "final": ("sf1", "sf2"),
}

# ESPN display / text names -> app team codes.
NAME2CODE = {
    "Mexico": "MEX", "South Africa": "RSA", "South Korea": "KOR", "Korea Republic": "KOR",
    "Czechia": "CZE", "Switzerland": "SUI", "Canada": "CAN", "Bosnia and Herzegovina": "BIH",
    "Bosnia-Herzegovina": "BIH", "Qatar": "QAT", "Brazil": "BRA", "Morocco": "MAR",
    "Scotland": "SCO", "Haiti": "HAI", "United States": "USA", "USA": "USA", "Australia": "AUS",
    "Paraguay": "PAR", "Turkiye": "TUR", "Türkiye": "TUR", "Turkey": "TUR", "Germany": "GER",
    "Ivory Coast": "CIV", "Côte d'Ivoire": "CIV", "Ecuador": "ECU", "Curacao": "CUW", "Curaçao": "CUW",
    "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN", "Belgium": "BEL",
    "Egypt": "EGY", "Iran": "IRN", "IR Iran": "IRN", "New Zealand": "NZL", "Spain": "ESP",
    "Cape Verde": "CPV", "Cabo Verde": "CPV", "Uruguay": "URU", "Saudi Arabia": "KSA", "France": "FRA",
    "Norway": "NOR", "Senegal": "SEN", "Iraq": "IRQ", "Argentina": "ARG", "Austria": "AUT",
    "Algeria": "ALG", "Jordan": "JOR", "Colombia": "COL", "Portugal": "POR", "DR Congo": "COD",
    "Congo DR": "COD", "Uzbekistan": "UZB", "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
}

# Goalkeeper per team (for clean-sheet attribution) + editorial note.
KEEPERS = {"ESP": "Unai Simón", "MEX": "Raúl Rangel"}
CS_NOTES = {
    "ESP": "Spain are yet to concede at this World Cup",
    "MEX": "Eliminated by England in the round of 16",
}


def fetch(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def code_of(name):
    return NAME2CODE.get(name, "")


def gather():
    """Return (post_events, goals, assists, player_team, clean_sheets, raw_by_pair)."""
    events = []
    for w in WINDOWS:
        sb = fetch(SCOREBOARD.format(w))
        events += [e for e in sb.get("events", []) if e["status"]["type"]["state"] == "post"]

    goals, assists, pteam = collections.Counter(), collections.Counter(), {}
    clean = collections.Counter()
    # raw score by frozenset of the two team codes -> (codeA, scoreA, codeB, scoreB, pens, winner_code)
    by_pair = {}

    for e in events:
        comp = e["competitions"][0]
        sides = {}
        for x in comp["competitors"]:
            c = code_of(x["team"]["displayName"])
            sides[x["homeAway"]] = {
                "code": c,
                "score": int(x.get("score", 0) or 0),
                "shootout": x.get("shootoutScore"),
                "winner": x.get("winner", False),
            }
        h, a = sides.get("home"), sides.get("away")
        if h and a and h["code"] and a["code"]:
            # clean sheets
            if a["score"] == 0:
                clean[h["code"]] += 1
            if h["score"] == 0:
                clean[a["code"]] += 1
            # store by unordered team pair for bracket matching
            pens = None
            if h["shootout"] is not None and a["shootout"] is not None:
                pens = f"{h['shootout']}–{a['shootout']}"
            win = h["code"] if h["winner"] else a["code"] if a["winner"] else (
                (h["code"] if (h["shootout"] or 0) > (a["shootout"] or 0) else a["code"]) if pens else None)
            aet = e["status"]["type"].get("detail") == "AET"
            by_pair[frozenset((h["code"], a["code"]))] = {
                "home": h, "away": a, "pens": pens, "winner": win, "aet": aet,
            }

        try:
            s = fetch(SUMMARY.format(e["id"]))
        except Exception:
            continue
        for kp in s.get("keyEvents", []):
            t = kp.get("text") or ""
            if not t.startswith("Goal!") or "own goal" in t.lower():
                continue
            parts = kp.get("participants") or []
            m = re.search(r"\(([^)]+)\)", t)
            code = code_of(m.group(1)) if m else ""
            if parts:
                scorer = parts[0]["athlete"]["displayName"]
                goals[scorer] += 1
                pteam[scorer] = code
                if "Assisted by" in t and len(parts) > 1:
                    ast = parts[1]["athlete"]["displayName"]
                    assists[ast] += 1
                    pteam.setdefault(ast, code)
    return goals, assists, pteam, clean, by_pair


def resolve_results(by_pair):
    """Walk the bracket, matching completed ESPN games to slots by team pair."""
    winners, results = {}, {}

    def resolve_slot(sid):
        if sid in KO_FIXED:
            return KO_FIXED[sid]
        f0, f1 = KO_FEEDS[sid]
        return (winners.get(f0), winners.get(f1))

    order = list(KO_FIXED) + list(KO_FEEDS)  # fixed first, then feeds in defined (dependency) order
    for _ in range(4):  # a few passes so later rounds resolve as earlier ones fill in
        for sid in order:
            if sid in results:
                continue
            home, away = resolve_slot(sid)
            if not home or not away:
                continue
            game = by_pair.get(frozenset((home, away)))
            if not game:
                continue
            flip = game["home"]["code"] == away  # ESPN home is our away
            hs = game["away"]["score"] if flip else game["home"]["score"]
            as_ = game["home"]["score"] if flip else game["away"]["score"]
            entry = {"hs": hs, "as": as_}
            if game["pens"]:
                entry["pens"] = "–".join(reversed(game["pens"].split("–"))) if flip else game["pens"]
            if game["winner"]:
                entry["winner"] = game["winner"]
                winners[sid] = game["winner"]
            if game["aet"]:
                entry["aet"] = True
            results[sid] = entry
    return results


def build():
    goals, assists, pteam, clean, by_pair = gather()

    amap = {p: c for p, c in assists.items()}
    scorers = [{"player": p, "team": pteam.get(p, ""), "goals": g}
               for p, g in goals.items() if g >= 3]
    scorers.sort(key=lambda s: (-s["goals"], -amap.get(s["player"], 0), s["player"]))

    assist_list = [{"player": p, "team": pteam.get(p, ""), "assists": a}
                   for p, a in assists.items() if a >= 3]
    assist_list.sort(key=lambda s: (-s["assists"], s["player"]))

    clean_sheets = []
    for code, keeper in KEEPERS.items():
        n = clean.get(code, 0)
        if n:
            cs = {"player": keeper, "team": code, "cs": n}
            if code in CS_NOTES:
                cs["note"] = CS_NOTES[code]
            clean_sheets.append(cs)
    clean_sheets.sort(key=lambda c: -c["cs"])

    # Golden Boot note
    note = "Goal and assist tallies are compiled live from ESPN. Ties are ordered by assists."
    if len(scorers) >= 2:
        top = scorers[0]
        chasers = [s for s in scorers[1:] if s["goals"] == scorers[1]["goals"]]
        if top["goals"] > scorers[1]["goals"]:
            names = ", ".join(c["player"].split()[-1] for c in chasers)
            note = (f"{top['player'].split()[-1]} leads the Golden Boot outright on {top['goals']}, "
                    f"clear of {names} on {scorers[1]['goals']}. Ties are ordered by assists.")

    results = resolve_results(by_pair)

    asof = datetime.now(ZoneInfo("America/Chicago")).strftime("%B %-d, %Y")

    # Load existing to preserve editorial 'notes' and 'stage'.
    existing = json.load(open(PUBLIC, encoding="utf-8")) if os.path.exists(PUBLIC) else {}
    out = {
        "asOf": asof,
        "stage": existing.get("stage", "Knockout stage in progress"),
        "results": results,
        "scorers": scorers,
        "scorersNote": note,
        "assists": assist_list,
        "cleanSheets": clean_sheets,
        "notes": existing.get("notes", {}),
    }
    return out


def write_if_changed(data):
    new = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    # Compare against current public file ignoring the volatile asOf line.
    def strip_asof(txt):
        return re.sub(r'"asOf":.*?,\n', "", txt)
    old = open(PUBLIC, encoding="utf-8").read() if os.path.exists(PUBLIC) else ""
    if strip_asof(new) == strip_asof(old):
        return False
    with open(PUBLIC, "w", encoding="utf-8") as f:
        f.write(new)
    with open(DIST, "w", encoding="utf-8") as f:
        f.write(new)
    return True


def git_push():
    def run(*args):
        return subprocess.run(["git", "-C", ROOT, *args], check=True,
                              capture_output=True, text=True)
    run("add", "public/live.json", "dist/live.json")
    if not run("status", "--porcelain").stdout.strip():
        return
    stamp = datetime.now(ZoneInfo("America/Chicago")).strftime("%Y-%m-%d %H:%M CT")
    run("commit", "-m", f"Auto-update live World Cup data ({stamp})")
    run("push", "origin", "HEAD")


def main():
    try:
        data = build()
    except Exception as e:
        print(f"[update-live] fetch/build failed: {e}", file=sys.stderr)
        return 1
    if not data["scorers"]:
        print("[update-live] no scorers parsed — skipping (likely transient ESPN issue)", file=sys.stderr)
        return 1
    if write_if_changed(data):
        print("[update-live] data changed — pushing")
        try:
            git_push()
        except subprocess.CalledProcessError as e:
            print(f"[update-live] git failed: {e.stderr}", file=sys.stderr)
            return 1
    else:
        print("[update-live] no change")
    return 0


if __name__ == "__main__":
    sys.exit(main())
