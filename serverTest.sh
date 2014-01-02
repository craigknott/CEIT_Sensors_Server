#!/bin/bash
for i in {1..1000000}; do
      netcat localhost 6969 &
  done
