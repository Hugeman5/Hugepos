# HugePOS – Sanity Checks

```bash
curl -s http://localhost:6012/api/mock-auth/active-users | jq .

curl -s -X POST http://localhost:6012/api/mock-auth/verify \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"eugene","pin":"5245"}' | jq .

curl -s http://localhost:6012/api/register/status | jq .
```