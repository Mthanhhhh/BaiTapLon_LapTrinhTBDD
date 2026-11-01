# Vietnam delivery address catalog

Snapshot downloaded 2026-11-01 from https://provinces.open-api.vn/api/v2/?depth=2
34 provinces/cities and 3,321 commune-level units. No district layer.
The same snapshot is validated by auth-service. Update both copies together.

Map: Leaflet 1.9.4; OpenStreetMap data, OSM France raster rendering.
Classroom, non-commercial, low-volume demo only; attribution stays visible.
Usage: https://www.openstreetmap.fr/usage/
Address lookup: Photon public demo, explicit searches and pin-drop reverse lookup.
https://github.com/komoot/photon — no availability guarantee; no bulk requests.
Pinned coordinates are stored in existing auth_db.user_addresses latitude/longitude.
Old address text is retained. New writes require a matching province/ward pair.
