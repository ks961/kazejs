#!/bin/bash

# rename files after TypeScript compilation
for file in dist/cjs/*.js; do
  mv "$file" "${file%.js}.cjs"
done

