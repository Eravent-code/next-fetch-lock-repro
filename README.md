# Fetch cache lock never released when `fetch()` throws synchronously

Minimal reproduction for a Next.js bug report, made from the official
[`reproduction-template`](https://github.com/vercel/next.js/tree/canary/examples/reproduction-template).

`app/[slug]/page.tsx`: the page and `generateMetadata` call the same helper,
which runs this inside a `try/catch`:

```ts
fetch(`not-a-url/posts/${slug}`, { next: { revalidate: 60 } })
```

The page calls `notFound()` when the helper returns `null`.

## Steps

```bash
npm install
npm run build
NEXT_PRIVATE_DEBUG_CACHE=1 npm run start
```

In another terminal:

```bash
curl -i -m 10 http://localhost:3000/hello
```

## Expected

Both `fetch()` calls reject with
`TypeError: Failed to parse URL from not-a-url/posts/hello`, the 404 page is
rendered and the response completes.

## Actual

`HTTP/1.1 404 Not Found` and about 4.8 kB of HTML are sent, then the response
never ends:

```
curl: (28) Operation timed out after 10005 milliseconds with 4777 bytes received
```

`getPost failed` is logged only once: the second `fetch()` never settles. The
server logs:

```
IncrementalCache: lock get d009af82b3a0a0461ffa205696f698d8b0208dba9612be95c1e5358db259011e false
IncrementalCache: successfully locked d009af82b3a0a0461ffa205696f698d8b0208dba9612be95c1e5358db259011e
FileSystemCache: get d009af82b3a0a0461ffa205696f698d8b0208dba9612be95c1e5358db259011e [] FETCH false
IncrementalCache: lock get d009af82b3a0a0461ffa205696f698d8b0208dba9612be95c1e5358db259011e true
getPost failed: Failed to parse URL from not-a-url/posts/hello
```

Nothing is logged after that. Same with `npm run dev`. Reproduced with
`next@16.5.0-canary.25`, `16.4.2` and `15.5.28`.
