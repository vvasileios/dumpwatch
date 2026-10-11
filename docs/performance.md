# Query performance

EXPLAIN experiments behind the main queries. Warm session, JIT off; each script runs inside a rolled-back transaction where it adds data.

## Nearby collection points (query 1)

Query 1 (collection points within 500 m of a spot in Kentro, closest 20) on 50,000 points, plus two variants.
Warm session, JIT off. Run with `make -s sql f=db/queries/05_explain_nearby.sql` (and `06`, `07`); plans are in `db/explain/`.

| Query | Plan | Rows checked | Time |
| --- | --- | --- | --- |
| `ST_DWithin(location, p, 500)` with GiST index | Bitmap Index Scan | 1,927 | 2.1 ms |
| `ST_DWithin(location, p, 500)` without index | Seq Scan | 50,000 | 33 ms |
| `ST_Distance(location, p) < 500` with GiST index | Seq Scan | 50,000 | 36 ms |
| `ORDER BY location <-> p LIMIT 20` (KNN, no radius) | Index Scan, Order By | 20 | 0.1 ms |

- `ST_DWithin` uses the index: a bounding-box check finds candidates, then the exact distance check runs on those only.
- `ST_Distance(...) < x` can't use the index, so it scans every row even when the index exists.
- KNN is fastest but has no radius: it always returns 20 points, however far away.

<details>
<summary>Query 1 plan with the GiST index</summary>

```
 Limit  (cost=24402.71..24402.72 rows=5 width=41) (actual time=2.040..2.042 rows=20.00 loops=1)
   Buffers: shared hit=552
   ->  Sort  (cost=24402.71..24402.72 rows=5 width=41) (actual time=2.040..2.041 rows=20.00 loops=1)
         Sort Key: (st_distance(location, '0101000020E61000003333333333F3364052B81E85EB514440'::geography, true))
         Sort Method: top-N heapsort  Memory: 27kB
         Buffers: shared hit=552
         ->  Bitmap Heap Scan on collection_points  (cost=78.63..24402.65 rows=5 width=41) (actual time=0.158..1.929 rows=1119.00 loops=1)
               Filter: st_dwithin(location, '0101000020E61000003333333333F3364052B81E85EB514440'::geography, '500'::double precision, true)
               Rows Removed by Filter: 808
               Heap Blocks: exact=522
               Buffers: shared hit=552
               ->  Bitmap Index Scan on collection_points_location_gix  (cost=0.00..78.63 rows=1897 width=0) (actual time=0.124..0.124 rows=1927.00 loops=1)
                     Index Cond: (location && _st_expand('0101000020E61000003333333333F3364052B81E85EB514440'::geography, '500'::double precision))
                     Index Searches: 1
                     Buffers: shared hit=30
 Planning Time: 0.530 ms
 Execution Time: 2.052 ms
```
</details>

<details>
<summary>Query 1 plan without the GiST index</summary>

```
 Limit  (cost=626092.61..626092.62 rows=5 width=41) (actual time=33.095..33.097 rows=20.00 loops=1)
   Buffers: shared hit=530
   ->  Sort  (cost=626092.61..626092.62 rows=5 width=41) (actual time=33.095..33.096 rows=20.00 loops=1)
         Sort Key: (st_distance(location, '0101000020E61000003333333333F3364052B81E85EB514440'::geography, true))
         Sort Method: top-N heapsort  Memory: 27kB
         Buffers: shared hit=530
         ->  Seq Scan on collection_points  (cost=0.00..626092.55 rows=5 width=41) (actual time=0.077..32.985 rows=1119.00 loops=1)
               Filter: st_dwithin(location, '0101000020E61000003333333333F3364052B81E85EB514440'::geography, '500'::double precision, true)
               Rows Removed by Filter: 48881
               Buffers: shared hit=530
 Planning Time: 0.032 ms
 Execution Time: 33.102 ms
```
</details>

## Report list: keyset vs OFFSET (query 8)

`GET /api/reports/list` first paged with a keyset cursor on `(reported_at, id)`; the numbers below are from that version. It now uses page numbers (`OFFSET` + `count(*)`) with search; that experiment is `db/queries/09_report_search.sql`, plans in `db/explain/q9_report_search.txt`.
Run with `make -s sql f=db/queries/08_report_list.sql`: it adds 100,000 reports inside a transaction, explains, then rolls back. Plans are in `db/explain/q8_report_list.txt`.

| Case | Plan | Rows read | Time |
| --- | --- | --- | --- |
| Staff, first page | Index Scan Backward `(reported_at, id)` | 26 | 0.02 ms |
| Staff, page 201, keyset cursor | Index Scan Backward, row comparison in Index Cond | 26 | 0.02 ms |
| Staff, page 201, `OFFSET 5000` | Index Scan Backward, skips 5,000 rows | 5,026 | 1.1 ms |
| Staff, `status = open`, page 201 | Index Scan Backward `(reported_at, id)` + Filter | 78 | 0.02 ms |
| Citizen, first page | Index Scan Backward `(reported_by, reported_at, id)` | 26 | 0.04 ms |
| Citizen, generic plan | Index Scan Backward + Filter on every condition | 26,494 | 1.9 ms |
| Staff, first page, no list indexes | Parallel Seq Scan + top-N sort | 100,500 | 20 ms |

- Keyset cost stays flat on any page; `OFFSET` (same WHERE clause) reads and throws away every skipped row, so it grows with page depth.
- The cursor is only an id. The query looks up its `(reported_at, id)` in SQL (scoped to the same reporter for citizens), because a JS `Date` keeps milliseconds and a millisecond cursor would skip rows.
- With a status that matches a third of the rows, filtering the time index is cheaper; when the status is rare (about 1% of rows), the planner uses `(status, reported_at, id)` with the whole keyset condition in the Index Cond.
- `$2 IS NULL OR status = $2` is fine because `pg` sends unnamed statements, which Postgres plans with the real values. A reused named statement can get a generic plan, and then every condition becomes a filter.

## Report search and page numbers (query 9)

`make -s sql f=db/queries/09_report_search.sql` adds 100,000 reports in a transaction, explains, and rolls back. Plans: `db/explain/q9_report_search.txt`.

| Case | Plan | Time |
| --- | --- | --- |
| Total count, no filter (the price of page numbers) | Seq Scan | 6.2 ms |
| Page 1 rows | Index Scan on `(reported_at, id)` | 0.06 ms |
| Page 201 (`OFFSET 5000`) | Same index, skips 5,000 rows | 1.2 ms |
| Rare search "asbestos" (100 rows) | Bitmap scan on the `pg_trgm` GIN index | 2.1 ms |
| Same search without the trigram index | Seq Scan, 100k rows filtered | 26 ms |
| Common word "fridge" (12% of rows) | Seq Scan (planner's choice) | 26 ms |
| `4242`: description or id | BitmapOr: trigram index + primary key | 1.0 ms |

- The real cost of page numbers is `count(*)`, not `OFFSET`.
- A trigram index turns `ILIKE '%word%'` into an index lookup; for words in many rows the planner rightly prefers a scan.

## Nearest collection point per report (query 10)

`make -s sql f=db/queries/10_report_list_nearest.sql`, 100,000 reports and 50,000 points. Plans: `db/explain/q10_report_list_nearest.txt`.

| Case | Plan | Time |
| --- | --- | --- |
| `LEFT JOIN LATERAL … ORDER BY location <-> … LIMIT 1` after paging | GiST KNN search for each of the 25 page rows | 4.5 ms |
| Same lateral join before paging, sorted by distance | 100,500 KNN searches | 2.9 s |
| After paging, without the GiST index | Seq Scan + sort of 50k points per row | 271 ms |

## Hotspots: which side drives the join (query 11)

`make -s sql f=db/queries/11_hotspots.sql`. Plans: `db/explain/q11_hotspots.txt`.

| Join direction | Plan | Time |
| --- | --- | --- |
| From the ~340 unresolved reports, `ST_DWithin` into points | GiST search on points per report | 17 ms |
| From the 50k points, count reports per point | GiST search on reports per point (50,000 times) | 149 ms |

## Weekly trend per zone

Rewritten after review: reports are bucketed once with `date_trunc('week', reported_at, 'Europe/Athens')` and left-joined onto `generate_series` weeks, instead of a range join per week. The zone's GiST scan runs once instead of 12 times (5,257 → 440 buffers), and week boundaries stay correct across daylight-saving changes.
