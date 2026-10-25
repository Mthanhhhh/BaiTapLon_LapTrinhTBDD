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

async function main() {
  console.log(`=== Checking API Endpoints on ${BASE_URL} ===\n`);
  let allOk = true;

  const tests = [
    { name: 'Categories Root', path: '/api/v1/categories' },
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
    { name: 'Product Reviews (ID: 10)', path: '/api/v1/products/10/reviews?size=3' },
  ];

  for (const t of tests) {
    const ok = await testEndpoint(t.name, `${BASE_URL}${t.path}`);
    if (!ok) allOk = false;
  }

  console.log('\n=== Summary ===');
  if (allOk) {
    console.log('All endpoints passed with zero FAIL!');
    process.exit(0);
  } else {
    console.error('Some endpoints failed!');
    process.exit(1);
  }
}

main();

