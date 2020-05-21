#!/bin/bash

trap exit SIGINT

N=4
for f in `python -c "import string; print(' '.join(string.ascii_uppercase))"`; do 
  for r in `python -c "import string; print(' '.join(string.ascii_uppercase))"`; do
   ((i=i%N)); ((i++==0)) && wait
    blender -b -P gen_letter_pairs.py -- \
      --front $f \
      --right $r \
      -s AB.gltf \
      --font-path $PWD/B612_Mono \
      --font-name B612Mono-BoldItalic \
      --glyph-width 0.7 \
      --save assets/$f$r.glb &
  done
done 
wait
