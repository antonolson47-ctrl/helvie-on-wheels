#!/bin/bash
# Build HELVIE ON WHEELS into a single self-contained dist/index.html
set -e
cd "$(dirname "$0")"
mkdir -p dist
npx esbuild src/main.js --bundle --minify --format=iife --target=es2020 --legal-comments=none --outfile=dist/game.js --log-level=warning
python3 - <<'PY'
import time
js = open('dist/game.js').read().replace('</script', '<\\/script')
fonts = open('build_assets/fonts.css').read()
err = open('src/erroverlay.js').read()
ver = time.strftime('%Y%m%d%H%M%S')
html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#120a14"><meta name="description" content="HELVIE ON WHEELS: a brick-built spy-surf getaway racer. 18+ cartoon violence.">
<title>HELVIE ON WHEELS</title><!--PWA-LINKS-->
<style>{fonts}</style>
<script>{err}window.__HW_VER='{ver}';</script>
</head><body>
<script>{js}</script>
</body></html>'''
open('dist/index.html','w').write(html)
print('ver', ver)
PY
rm dist/game.js
echo "built dist/index.html ($(wc -c < dist/index.html) bytes)"
