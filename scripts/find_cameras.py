import os
import re
import json
import pandas as pd

from shapely.geometry import shape, Point

"""
Count cameras in cameras.xlsx and check if they are within a specific ward boundary.
Usage: python count_cameras.py
"""

ZONE = "Lê Thanh Nghị.geojson"


def parse_coords(coords_str):
  """
  Parse coordinate string into (lat, lon).
  Supported formats:
    - "20.9059, 106.3105"       (decimal comma)
    - "20.90599°N,106.31057°E"  (degree + cardinal)
  Returns (lat, lon) tuple or None if unparseable.
  """
  s = coords_str.strip()

  # Format: 20.90599°N,106.31057°E
  m = re.match(r'^([\d.]+)\s*°N\s*,\s*([\d.]+)\s*°E$', s, re.IGNORECASE)
  if m:
    return float(m.group(1)), float(m.group(2))

  # Format: 20.9059, 106.3105
  parts = [p.strip() for p in s.split(",")]
  if len(parts) >= 2:
    return float(parts[0]), float(parts[1])

  return None


def main():
  script_dir = os.path.dirname(os.path.abspath(__file__))
  data_path = os.path.join(script_dir, "data", "cameras.xlsx")
  geojson_path = os.path.join(script_dir, "data", f"{ZONE}")

  with open(geojson_path, "r", encoding="utf-8") as f:
    geojson_data = json.load(f)

  zone_shape = shape(geojson_data["features"][0]["geometry"])
  df = pd.read_excel(data_path)

  cameras_in_zone = []
  skipped = 0

  for idx, row in df.dropna(subset=["Toạ độ"]).iterrows():
    coords_str = str(row["Toạ độ"]).strip()
    try:
      result = parse_coords(coords_str)
      if result is None:
        skipped += 1
        continue
      lat, lon = result
    except (ValueError, IndexError):
      skipped += 1
      continue

    point = Point(lon, lat)
    if zone_shape.contains(point):
      cameras_in_zone.append(row)

  print(f"Total cameras processed: {len(df)}")
  print(f"Skipped (unparseable coords): {skipped}")
  print(f"Cameras in {ZONE}: {len(cameras_in_zone)}")

  if cameras_in_zone:
    result_df = pd.DataFrame(cameras_in_zone)
    output_filename = f"cameras_{ZONE.lower().replace(' ', '_')}.xlsx"
    output_path = os.path.join(script_dir, "output", output_filename)
    result_df.to_excel(output_path, index=False)
    print(f"Results saved to: {output_path}")


if __name__ == "__main__":
  main()
