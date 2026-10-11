set -e
npx tsc -p tests/tsconfig.json
echo "Building..."
npx nuxt build > /tmp/build.log 2>&1 || { tail -40 /tmp/build.log; exit 1; }
node .output/server/index.mjs > /tmp/server.log 2>&1 &
server=$!
trap 'kill $server 2>/dev/null; [ "$status" = 0 ] || tail -30 /tmp/server.log' EXIT
i=0
until node -e "fetch('http://127.0.0.1:3001/api/health').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"; do
    i=$((i + 1))
    [ $i -gt 60 ] && { echo "Server did not start"; exit 1; }
    sleep 0.5
done
export TEST_ADMIN_COOKIE="$(node tests/admin-cookie.ts)"
status=0
node --test --test-concurrency=1 tests/*.test.ts || status=$?
exit $status
