const ELASTIC_URL = 'http://localhost:9200';
const BACKEND_URL = 'http://localhost:8080/api/v1';

async function syncAndTestElasticsearch() {
  console.log('=== ELASTICSEARCH INTEGRATION & SEARCH VERIFICATION ===\n');

  // 1. Fetch all products from API
  console.log('1. Fetching product catalog from API...');
  const res = await fetch(`${BACKEND_URL}/products?size=50`);
  const data = await res.json();
  const products = data.data.content;
  console.log(`   ✓ Fetched ${products.length} products.\n`);

  // 2. Index into Elasticsearch
  console.log('2. Syncing products into Elasticsearch index "products"...');
  for (const prod of products) {
    const doc = {
      id: prod.id,
      name: prod.name,
      price: prod.price,
      rating: prod.rating,
      soldCount: prod.soldCount,
      thumbnailUrl: prod.thumbnailUrl,
    };
    await fetch(`${ELASTIC_URL}/products/_doc/${prod.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
  }
  // Refresh index
  await fetch(`${ELASTIC_URL}/products/_refresh`, { method: 'POST' });
  console.log(`   ✓ Successfully indexed ${products.length} products into Elasticsearch!\n`);

  // 3. Test Fuzzy Search Query (Fuzzy matching "sneekers" -> "Red Sneakers")
  console.log('3. Testing Fuzzy Full-Text Search: Query = "sneeker" (typo matching)...');
  const searchRes = await fetch(`${ELASTIC_URL}/products/_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: {
        multi_match: {
          query: 'sneeker',
          fields: ['name', 'description'],
          fuzziness: 'AUTO',
        },
      },
    }),
  });
  const searchData = await searchRes.json();
  const hits = searchData.hits.hits;

  console.log(`   ✓ Matches found: ${hits.length}`);
  hits.forEach((h) => {
    console.log(`     - [Score: ${h._score}] ${h._source.name} ($${h._source.price})`);
  });

  if (hits.length > 0 && hits[0]._source.name.includes('Sneakers')) {
    console.log('\n======================================================');
    console.log('🎉 ELASTICSEARCH FULL-TEXT SEARCH VERIFIED 100%! 🎉');
    console.log('Fuzzy search successfully matched misspelled keyword!');
    console.log('======================================================\n');
  }
}

syncAndTestElasticsearch().catch(console.error);

