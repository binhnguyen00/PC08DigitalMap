#!/usr/bin/env python3
"""Convert Overpass API JSON (`out geom`) into a GeoJSON FeatureCollection.

Usage: python3 scripts/overpass_to_geojson.py INPUT [OUTPUT]
If OUTPUT is omitted, INPUT is overwritten.
"""
import json
import sys


def convert(data: dict) -> dict:
    if data.get("type") == "FeatureCollection":
        return data
    features = []
    for el in data.get("elements", []):
        if el.get("type") != "way" or not el.get("geometry"):
            continue
        coords = [[p["lon"], p["lat"]] for p in el["geometry"] if p]
        if len(coords) < 2:
            continue
        tags = el.get("tags", {})
        features.append({
            "type": "Feature",
            "properties": {"id": el["id"], "shape": "Line", **tags},
            "geometry": {"type": "LineString", "coordinates": coords},
        })
    return {"type": "FeatureCollection", "features": features}


def main() -> None:
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else src
    with open(src, encoding="utf-8") as f:
        data = json.load(f)
    out = convert(data)
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    print(f"{dst}: {len(out['features'])} features")


if __name__ == "__main__":
    main()
