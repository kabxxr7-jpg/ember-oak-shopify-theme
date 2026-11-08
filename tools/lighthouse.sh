#!/bin/sh
# Lighthouse 12 on the live dev store (needs .storefront-cookie from tools/unlock-web.mjs).
# Writes docs/lighthouse-raw/<name>.json with the cookie header removed from the saved config.
set -e
cd "$(dirname "$0")/.."
CHROME=$(node -e "console.log(require('./tools/node_modules/playwright').chromium.executablePath())")
H=$(node -e "console.log(JSON.stringify({Cookie:require('fs').readFileSync('.storefront-cookie','utf8')}))")
B=https://ember-and-oak-coffee-tpmi70xy.myshopify.com
mkdir -p docs/lighthouse-raw
run() {
  CHROME_PATH=$CHROME tools/node_modules/.bin/lighthouse "$B$1" --quiet --chrome-flags="--headless=new" --extra-headers="$H" \
    --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="docs/lighthouse-raw/$2.json" $3 >/dev/null 2>&1 || true
  node -e "
    const fs=require('fs');const f='docs/lighthouse-raw/$2.json';const r=JSON.parse(fs.readFileSync(f,'utf8'));
    if (r.configSettings) r.configSettings.extraHeaders = {Cookie:'(removed)'};
    fs.writeFileSync(f, JSON.stringify(r));
    const c=r.categories;console.log('$2',Object.values(c).map(x=>x.id+':'+Math.round((x.score||0)*100)).join(' '),'LCP',r.audits['largest-contentful-paint'].displayValue,'CLS',r.audits['cumulative-layout-shift'].displayValue,'TBT',r.audits['total-blocking-time'].displayValue)"
}
rm -f docs/lighthouse-raw/*.json
for i in 1 2 3 4 5; do run / home-mobile-$i; done
for i in 1 2 3; do run / home-desktop-$i --preset=desktop; done
for i in 1 2 3; do run /pages/find-your-coffee quiz-mobile-$i; done
for i in 1 2 3; do run /pages/stockists stockists-mobile-$i; done
for i in 1 2 3; do run /products/morning-ember product-mobile-$i; done
