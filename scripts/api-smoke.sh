#!/usr/bin/env bash
# Smoke test for the public API (/api/v1). Run it against a dev server or the live site:
#
#   scripts/api-smoke.sh                                   # http://localhost:3000
#   BASE=https://massimino.fitness scripts/api-smoke.sh
#   KEY=msk_live_... REVOKED_KEY=msk_live_... scripts/api-smoke.sh
#
# It checks every endpoint, the error paths, paging to the last page, and that no
# response contains private data. Exits non-zero if any check fails.

set -u
BASE="${BASE:-http://localhost:3000}"
API="$BASE/api/v1"
KEY="${KEY:-}"
REVOKED_KEY="${REVOKED_KEY:-}"
pass=0
fail=0
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

ok()   { pass=$((pass + 1)); printf '  ok    %s\n' "$1"; }
bad()  { fail=$((fail + 1)); printf '  FAIL  %s\n' "$1"; }

# request <name> <expected status> <url> [curl args...]  -> body in $TMP/<name>.json
request() {
  local name="$1" want="$2" url="$3"; shift 3
  local got
  got=$(curl -s -o "$TMP/$name.json" -D "$TMP/$name.headers" -w '%{http_code}' --max-time 60 "$@" "$url")
  if [ "$got" = "$want" ]; then ok "$name -> $got"; else bad "$name -> $got (wanted $want) $(head -c 200 "$TMP/$name.json")"; fi
}

field() { python3 -c "import json,sys; d=json.load(open('$TMP/$1.json')); print(eval(sys.argv[1]))" "$2" 2>/dev/null; }
check() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (got '$2', wanted '$3')"; fi; }

echo "Massimino API smoke test against $API"

echo "1. Entry points"
request index 200 "$API"
request openapi 200 "$API/openapi.json"
check "contract is OpenAPI 3.1" "$(field openapi "d['openapi']")" "3.1.0"
check "contract lists 10 paths" "$(field openapi "len(d['paths'])")" "10"

echo "2. Collections"
request exercises 200 "$API/exercises?page_size=3"
check "exercises page_size honoured" "$(field exercises "len(d['exercises'])")" "3"
request programs 200 "$API/programs"
request teams 200 "$API/teams"
request countries 200 "$API/fitness-intelligence/countries?page_size=5"

echo "3. Single resources"
EX=$(field exercises "d['exercises'][0]['uid']")
PR=$(field programs "d['programs'][0]['uid']")
TM=$(field teams "d['teams'][0]['uid'] if d['teams'] else ''")
request exercise 200 "$API/exercises/$EX"
check "exercise name pattern" "$(field exercise "d['name']")" "exercises/$EX"
request program 200 "$API/programs/$PR"
request workouts 200 "$API/programs/$PR/workouts?page_size=2"
request workout 200 "$API/programs/$PR/workouts/1"
check "workout parent" "$(field workout "d['parent']")" "programs/$PR"
if [ -n "$TM" ]; then request team 200 "$API/teams/$TM"; else ok "team (no public teams to fetch)"; fi
request country 200 "$API/fitness-intelligence/countries/SE"
request country_lower 200 "$API/fitness-intelligence/countries/se"

echo "4. Canonical fields on every resource"
for r in exercise program workout country ${TM:+team}; do
  check "$r has the canonical fields" \
    "$(field "$r" "all(k in d for k in ['name','uid','title','body_txt','body_html','lang','uri','source','license','create_time','update_time'])")" "True"
done

echo "5. Not found, and nothing private is revealed"
request missing_exercise 404 "$API/exercises/does-not-exist"
check "404 reason" "$(field missing_exercise "d['error']['details'][0]['reason']")" "EXERCISE_NOT_FOUND"
request missing_program 404 "$API/programs/does-not-exist"
request closed_program 404 "$API/programs/nasm-fat-loss-program"
request missing_workout 404 "$API/programs/$PR/workouts/9999"
request missing_team 404 "$API/teams/does-not-exist"
request missing_country 404 "$API/fitness-intelligence/countries/ZZ"

echo "6. Bad input"
request bad_param 400 "$API/exercises?limit=5"
check "400 reason" "$(field bad_param "d['error']['details'][0]['reason']")" "UNKNOWN_PARAMETER"
request bad_page_size 400 "$API/exercises?page_size=-1"
request bad_token 400 "$API/exercises?page_token=not-a-token"
request huge_page 200 "$API/exercises?page_size=100000"
check "page_size capped at 100" "$(field huge_page "len(d['exercises'])")" "100"

echo "7. Paging to the last page"
TOKEN=""; seen=0; pages=0
while :; do
  request "walk" 200 "$API/fitness-intelligence/countries?page_size=20${TOKEN:+&page_token=$TOKEN}" >/dev/null
  n=$(field walk "len(d['countries'])"); seen=$((seen + n)); pages=$((pages + 1))
  TOKEN=$(field walk "d['next_page_token']")
  [ -z "$TOKEN" ] && break
  [ "$pages" -gt 20 ] && break
done
check "walk reached every country in $pages pages" "$seen" "$(field walk "d['total_size']")"
T1=$(curl -s --max-time 60 "$API/exercises?page_size=2" | python3 -c "import json,sys; print(json.load(sys.stdin)['next_page_token'])")
request token_other_query 400 "$API/exercises?page_size=2&q=squat&page_token=$T1"
check "token tied to its query" "$(field token_other_query "d['error']['details'][0]['reason']")" "PAGE_TOKEN_MISMATCH"

echo "8. Keys"
request no_key 200 "$API/programs"
request wrong_key 401 "$API/programs" -H "Authorization: Bearer msk_live_this-key-does-not-exist"
if grep -qi '^www-authenticate:' "$TMP/wrong_key.headers"; then ok "401 carries WWW-Authenticate"; else bad "401 has no WWW-Authenticate"; fi
request malformed_auth 401 "$API/programs" -H "Authorization: Basic abc"
if [ -n "$KEY" ]; then
  request good_key 200 "$API/programs" -H "Authorization: Bearer $KEY"
  request good_key_header 200 "$API/programs" -H "X-API-Key: $KEY"
  check "keyed limit is higher" "$(grep -i '^x-ratelimit-limit:' "$TMP/good_key.headers" | tr -d '\r' | awk '{print $2}')" "600"
else
  echo "  skip  valid key (set KEY to test)"
fi
if [ -n "$REVOKED_KEY" ]; then
  request revoked_key 403 "$API/programs" -H "Authorization: Bearer $REVOKED_KEY"
  check "403 reason" "$(field revoked_key "d['error']['details'][0]['reason']")" "API_KEY_REVOKED"
else
  echo "  skip  revoked key (set REVOKED_KEY to test)"
fi

echo "9. Headers"
if grep -qi '^access-control-allow-origin: \*' "$TMP/exercises.headers"; then ok "CORS open"; else bad "CORS header missing"; fi
if grep -qi '^x-ratelimit-limit:' "$TMP/exercises.headers"; then ok "rate limit headers present"; else bad "rate limit headers missing"; fi
got=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X OPTIONS "$API/exercises")
check "OPTIONS preflight" "$got" "204"
got=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X POST "$API/exercises")
check "POST is not allowed" "$got" "405"

echo "10. No private data in any response"
leaks=$(cat "$TMP"/*.json | grep -oiE '"(email|password|passwordHash|keyHash|userId|user_id|trainerId|trainer_id|createdBy|token|secret)"[[:space:]]*:|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|postgres(ql)?://|sk_live_|DATABASE_URL|NEXTAUTH_SECRET' | sort -u | head -5)
if [ -z "$leaks" ]; then ok "no private field names, emails or credentials found"; else bad "possible private data: $leaks"; fi

echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
