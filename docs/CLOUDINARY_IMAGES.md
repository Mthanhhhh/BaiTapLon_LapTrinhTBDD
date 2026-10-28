# Product images on Cloudinary

The existing catalog images were migrated to Cloudinary on 2026-10-29 (Asia/Bangkok).

- Cloud name: `t4eozcyt`.
- Media Library folder configured by the preset: `eshop/products`.
- Public IDs: `eshop-products/product-1` through `eshop-products/product-20`.
- 20 uploaded images supply 20 product thumbnails and 22 existing gallery entries.
- Original image sources are recorded in `scripts/cloudinary-source-products.jsonl`.
- Product 4 had a broken original Unsplash URL; its replacement is recorded in `scripts/cloudinary-source-overrides.json`.
- All resulting HTTPS URLs and asset IDs are recorded in `scripts/cloudinary-product-images.json`.

## Delivery

The client gets `thumbnailUrl` and `images` from the product API. MySQL stores these URLs; the actual files are served from Cloudinary. No Cloudinary credentials or upload preset were added to the mobile app. The existing `RemoteImage` component already supports these HTTPS URLs.

## Migration and recovery

`node scripts/migrate-product-images-cloudinary.mjs` uploads missing images, checkpoints each success in the manifest, and generates forward/rollback SQL. It does not apply database updates. Existing manifest entries are reused on subsequent runs.

For new uploads, set `CLOUDINARY_UPLOAD_PRESET` in the shell environment first. The active preset name is not committed to the repository.

- Apply script: `scripts/cloudinary-product-images.sql`.
- Revert only this URL migration: `scripts/cloudinary-product-images-rollback.sql`.

Both scripts update thumbnails and existing gallery rows with guards on product ID and previous URL. They preserve names, prices, stock, and gallery order. After applying or reverting, refresh affected product caches if present and rebuild the Elasticsearch product index via the existing sync endpoint. Do not run `update_products.sql` afterward: that older seed/update file still contains the original Unsplash URLs and also changes product metadata.

`node scripts/verify-cloudinary-images.mjs` checks catalog, each product detail, best sales, popular products, and keyword search against the manifest. Results are written to `scripts/cloudinary-verification.json`.

## Future seller upload

This is a catalog migration, not a seller upload feature. A later seller flow should upload selected images, receive `secure_url` and `public_id`, then submit the URLs with the product. Keep API secrets on the backend and use server-authorized signed uploads for that flow. The unsigned preset used for this one-time migration can be disabled in the Cloudinary Console when no longer needed.
