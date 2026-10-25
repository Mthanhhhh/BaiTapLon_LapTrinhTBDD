const BASE_URL = process.env.API_URL || 'http://localhost:8080';

const SORT_OPTIONS = {
  BEST_SALES: 'soldCount,desc',
  POPULAR: 'viewCount,desc',
  PRICE_ASC: 'minPrice,asc',
  PRICE_DESC: 'minPrice,desc',
  RATING: 'ratingAvg,desc',
  BANNER_DISCOUNT: 'discountPercent,desc',
};

async function testEndpoint(name: string, url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (res.ok) {
      console.log(`[OK]   ${name.padEnd(35)}: status ${res.status}`);
      return true;
    } else {
      console.error(`[FAIL] ${name.padEnd(35)}: status ${res.status} (${res.statusText})`);
      return false;
    }
  } catch (err: any) {
    console.error(`[FAIL] ${name.padEnd(35)}: error ${err.message}`);
    return false;
  }
}

async function runDetailedChecks(): Promise<boolean> {
  let allPassed = true;

  console.log('\n--- Running Detailed Verifications ---');

  // 1. Reviews verification
  try {
    const res = await fetch(`${BASE_URL}/api/v1/products/1/reviews?size=3`);
    if (!res.ok) {
      console.error(`[FAIL] Product 1 Reviews: status ${res.status}`);
      allPassed = false;
    } else {
      const data = await res.json();
      const items = data.data?.content || [];
      if (items.length >= 1 && items[0].userFullName && typeof items[0].rating === 'number') {
        console.log(`[OK]   Product 1 Reviews: count=${items.length}, firstReviewer="${items[0].userFullName}", rating=${items[0].rating}, emotion=${items[0].emotion}`);
      } else {
        console.error(`[FAIL] Product 1 Reviews: Invalid data structure or empty reviews: ${JSON.stringify(items)}`);
        allPassed = false;
      }
    }
  } catch (err: any) {
    console.error(`[FAIL] Product 1 Reviews: ${err.message}`);
    allPassed = false;
  }

  // 2. Category product count verification (1: 9, 2: 3, 3: 1, 4: 6)
  const expectedCategoryCounts: Record<number, number> = {
    1: 9,
    2: 3,
    3: 1,
    4: 6,
  };

  try {
    const catRes = await fetch(`${BASE_URL}/api/v1/categories`);
    if (!catRes.ok) {
      console.error(`[FAIL] Categories list: status ${catRes.status}`);
      allPassed = false;
    } else {
      const catData = await catRes.json();
      const categories: Array<{ id: number; name: string }> = catData.data || [];
      console.log(`[OK]   Fetched ${categories.length} root categories.`);

      for (const [catIdStr, expectedCount] of Object.entries(expectedCategoryCounts)) {
        const catId = Number(catIdStr);
        const pRes = await fetch(`${BASE_URL}/api/v1/products/category/${catId}?size=1`);
        if (!pRes.ok) {
          console.error(`[FAIL] Category ${catId} products: status ${pRes.status}`);
          allPassed = false;
          continue;
        }
        const pData = await pRes.json();
        const total = pData.data?.totalElements ?? 0;
        if (total === 0) {
          console.error(`[FAIL] Category ${catId}: EMPTY (expected ${expectedCount}, got 0)`);
          allPassed = false;
        } else if (total !== expectedCount) {
          console.error(`[FAIL] Category ${catId}: MISMATCH (expected ${expectedCount}, got ${total})`);
          allPassed = false;
        } else {
          console.log(`[OK]   Category ${catId} product count: ${total} (MATCHES expected ${expectedCount})`);
        }
      }
    }
  } catch (err: any) {
    console.error(`[FAIL] Category checks: ${err.message}`);
    allPassed = false;
  }

  // 3. Expected failure on sort=price,asc (500)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/products?sort=price,asc&size=2`);
    if (res.status === 500) {
      console.log(`[OK]   sort=price,asc returned HTTP 500: EXPECTED-FAIL (entity uses minPrice)`);
    } else {
      console.error(`[FAIL] sort=price,asc returned status ${res.status}, expected 500`);
      allPassed = false;
    }
  } catch (err: any) {
    console.error(`[FAIL] sort=price,asc check error: ${err.message}`);
    allPassed = false;
  }

  // 4. Multi-sort soldCount,desc & id,asc
  try {
    const res = await fetch(`${BASE_URL}/api/v1/products?sort=soldCount,desc&sort=id,asc&size=10`);
    if (!res.ok) {
      console.error(`[FAIL] Multi-sort soldCount,desc&id,asc returned status ${res.status}`);
      allPassed = false;
    } else {
      const data = await res.json();
      const content: Array<{ id: number; name: string; soldCount: number }> = data.data?.content || [];
      let isDescending = true;
      for (let i = 1; i < content.length; i++) {
        if (content[i].soldCount > content[i - 1].soldCount) {
          isDescending = false;
          break;
        }
      }
      if (isDescending && content.length > 0) {
        console.log(`[OK]   Multi-sort soldCount,desc&id,asc: status 200, items sorted descending by soldCount (${content.slice(0, 3).map(p => `${p.name}: ${p.soldCount}`).join(', ')})`);
      } else {
        console.error(`[FAIL] Multi-sort soldCount,desc&id,asc: items not descending!`);
        allPassed = false;
      }
    }
  } catch (err: any) {
    console.error(`[FAIL] Multi-sort check error: ${err.message}`);
    allPassed = false;
  }

  // 5. Popular order: Hoodie shirt, Red Sneakers, Headphone, Smartphone, Pear
  try {
    const res = await fetch(`${BASE_URL}/api/v1/products?sort=viewCount,desc&sort=id,asc&size=5`);
    if (!res.ok) {
      console.error(`[FAIL] Popular products (viewCount,desc): status ${res.status}`);
      allPassed = false;
    } else {
      const data = await res.json();
      const items: Array<{ id: number; name: string }> = data.data?.content || [];
      const actualNames = items.map(p => p.name);
      const expectedNames = ['Hoodie shirt', 'Red Sneakers', 'Headphone', 'Smartphone', 'Pear'];
      const matches = expectedNames.every((name, idx) => actualNames[idx] === name);

      if (matches) {
        console.log(`[OK]   Popular order (viewCount,desc): matches expected [${expectedNames.join(' -> ')}]`);
      } else {
        console.error(`[FAIL] Popular order mismatch!\n       Expected: ${expectedNames.join(', ')}\n       Actual:   ${actualNames.join(', ')}`);
        allPassed = false;
      }
    }
  } catch (err: any) {
    console.error(`[FAIL] Popular check error: ${err.message}`);
    allPassed = false;
  }

  return allPassed;
}

async function main() {
  console.log(`=== Checking API Endpoints on ${BASE_URL} ===\n`);
  let allOk = true;

  const tests = [
    { name: 'Categories Root', path: '/api/v1/categories' },
    { name: 'Product Detail (ID: 1)', path: '/api/v1/products/1' },
    { name: 'Product Detail (ID: 10)', path: '/api/v1/products/10' },
    { name: 'Product Detail (ID: 12)', path: '/api/v1/products/12' },
    { name: 'Product List (default)', path: '/api/v1/products?size=2' },
    { name: 'Sort: BEST_SALES', path: `/api/v1/products?sort=${SORT_OPTIONS.BEST_SALES}&size=2` },
    { name: 'Sort: POPULAR', path: `/api/v1/products?sort=${SORT_OPTIONS.POPULAR}&size=2` },
    { name: 'Sort: PRICE_ASC', path: `/api/v1/products?sort=${SORT_OPTIONS.PRICE_ASC}&size=2` },
    { name: 'Sort: PRICE_DESC', path: `/api/v1/products?sort=${SORT_OPTIONS.PRICE_DESC}&size=2` },
    { name: 'Sort: RATING', path: `/api/v1/products?sort=${SORT_OPTIONS.RATING}&size=2` },
    { name: 'Sort: BANNER_DISCOUNT', path: `/api/v1/products?sort=${SORT_OPTIONS.BANNER_DISCOUNT}&size=1` },
    { name: 'Products by Category (ID: 1)', path: '/api/v1/products/category/1?size=2' },
    { name: 'Products Search (keyword: sneaker)', path: '/api/v1/products/search?keyword=sneaker&size=2' },
    { name: 'Product Reviews (ID: 1)', path: '/api/v1/products/1/reviews?size=3' },
  ];

  for (const t of tests) {
    const ok = await testEndpoint(t.name, `${BASE_URL}${t.path}`);
    if (!ok) allOk = false;
  }

  const detailedOk = await runDetailedChecks();
  if (!detailedOk) allOk = false;

  console.log('\n=== Summary ===');
  if (allOk) {
    console.log('All API endpoints & detailed verification checks PASSED successfully!');
    process.exit(0);
  } else {
    console.error('Some checks FAILED!');
    process.exit(1);
  }
}

main();

