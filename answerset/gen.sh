#/bin/bash

clingo --rand-prob --seed=$RANDOM rules.lp | python draw.py
