---
title: CYC-INTEL Inference Microservice
emoji: 🌪️
colorFrom: blue
colorTo: cyan
sdk: docker
app_port: 7860
pinned: false
---

# CYC-INTEL Satellite Interpolation Model

This Space hosts the inference microservice for the ISRO Cyclone Intelligence System.

**POST /interpolate** — Accepts two GOES/INSAT NetCDF satellite frames and returns a temporally interpolated CMI frame as a compressed numpy binary.
