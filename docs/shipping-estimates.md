# Province delivery estimates

Names and historical mergers: [Government administrative list](https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/7/19ttg.signed.pdf).
Coordinates: [Countries States Cities Database by dr5hn and contributors](https://github.com/dr5hn/countries-states-cities-database/blob/master/json/states.json), downloaded 2026-10-30, licensed under [ODbL](licenses/geodata-ODbL.txt). The derived 34-province coordinate/alias database is distributed in `apps/mobile/src/utils/vietnamShipping.ts` under ODbL. Changes: retain Vietnam only; add historical aliases and government names. No geocoding of an actual shipping address is claimed.

Haversine distance between representative province points is divided by Hanoi–HCMC reference distance. Minimum days = max(1, ceil(2 * distance / reference)); maximum = minimum + 1. Hanoi–HCMC is exactly 2–3 days as requested by the project owner. Same-province estimate is 1–2 days. These are calendar-day **estimates**, not a carrier SLA. They exclude pickup cutoffs, public holidays, islands, remote-area delays and road routing.

Use the account's default saved address (otherwise the first saved address); a manually selected province overrides it for browsing only, stored per account or guest. No location is assumed for a guest. Missing/unrecognized origin/destination produces no numeric estimate. Historical province names map to current provinces, so geographic precision is province-level after the merger. No database address is overwritten.

Prices, stock, ratings, sales and seller ownership continue to come from the API. This change does not manufacture merchant data or convert catalog starter prices into verified live offers. No carrier integration is currently configured; connecting one requires the merchant's carrier API credentials and service contract.
