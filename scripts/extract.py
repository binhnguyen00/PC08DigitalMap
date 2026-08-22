import os
import glob
import json
import unicodedata
import pandas as pd
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# Cấu hình các tham số chính
API_KEY = ""
MODEL_ID = "gemini-3.6-flash"

# Tìm thư mục chứa ảnh dựa trên vị trí tương đối của script và xử lý chuẩn hóa Unicode
script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(script_dir, "data")

image_dir_name = "54 cụm loa lê chân"
IMAGE_DIR = os.path.join(data_dir, image_dir_name)

if os.path.exists(data_dir):
  for entry in os.listdir(data_dir):
    if unicodedata.normalize('NFC', entry) == unicodedata.normalize('NFC', image_dir_name):
      IMAGE_DIR = os.path.join(data_dir, entry)
      break

OUTPUT_EXCEL = os.path.join(script_dir, "output", "extracted_info.xlsx")

class SpeakerInfo(BaseModel):
  vi_tri: str = Field(description="Vị trí của cụm loa (ví dụ: 'trung tâm sự nghiệp công phường Lê Chân')")
  kinh_do: str = Field(description="Kinh độ (Longitude) của cụm loa, chỉ lấy phần số thập phân (ví dụ: '106.681259')")
  vi_do: str = Field(description="Vĩ độ (Latitude) của cụm loa, chỉ lấy phần số thập phân (ví dụ: '20.849321')")

def main():
  # Khởi tạo client Gemini API
  client = genai.Client(api_key=API_KEY)

  # Quét danh sách các file ảnh trong thư mục (hỗ trợ không phân biệt hoa thường và Unicode)
  image_paths = []
  if os.path.exists(IMAGE_DIR):
    for entry in os.listdir(IMAGE_DIR):
      ext = os.path.splitext(entry)[1].lower()
      if ext in ['.jpg', '.jpeg', '.png']:
        image_paths.append(os.path.join(IMAGE_DIR, entry))

  # Sắp xếp danh sách file để xử lý tuần tự đẹp mắt
  image_paths.sort()

  print(f"Tìm thấy {len(image_paths)} ảnh cần xử lý.")

  # Đọc file Excel đã có để tiếp tục (resume) nếu đang chạy dở
  os.makedirs(os.path.dirname(OUTPUT_EXCEL), exist_ok=True)
  if os.path.exists(OUTPUT_EXCEL):
    df = pd.read_excel(OUTPUT_EXCEL)
    processed_files = set(df["Tên file"].tolist())
    results = df.to_dict("records")
    print(f"Đang tiếp tục chạy. Đã xử lý {len(processed_files)} file.")
  else:
    processed_files = set()
    results = []

  # Lặp qua từng file ảnh để bóc tách thông tin
  for i, path in enumerate(image_paths, 1):
    filename = os.path.basename(path)
    if filename in processed_files:
      continue

    print(f"[{i}/{len(image_paths)}] Đang xử lý: {filename}...")
    try:
      with open(path, "rb") as f:
        image_bytes = f.read()

      ext = os.path.splitext(filename)[1].lower()
      mime_type = "image/png" if ext == ".png" else "image/jpeg"

      prompt = (
        "Đọc các thông tin dạng chữ được viết đè (overlay) trên ảnh này. "
        "Hãy tìm và bóc tách chính xác các giá trị sau:\n"
        "1. Vị trí của cụm loa (văn bản đi sau từ khóa 'Vị trí:').\n"
        "2. Toạ độ GPS của cụm loa (văn bản đi sau từ khóa 'Toạ độ:'). "
        "Hãy tách riêng toạ độ này ra làm hai phần: kinh_do (Kinh độ / Longitude) và vi_do (Vĩ độ / Latitude), chỉ lấy phần số thập phân (không lấy ký tự °N, °E, v.v.).\n"
        "Ví dụ: Với toạ độ '20.849321°N, 106.681259°E' -> kinh_do='106.681259', vi_do='20.849321'."
      )

      # Gọi API Gemini
      response = client.models.generate_content(
          model=MODEL_ID,
          contents=[
              types.Part.from_bytes(
                  data=image_bytes,
                  mime_type=mime_type,
              ),
              prompt
          ],
          config=types.GenerateContentConfig(
              response_mime_type="application/json",
              response_schema=SpeakerInfo,
          ),
      )

      # Parse dữ liệu JSON trả về
      if response and response.text:
        data = json.loads(response.text)
      else:
        print(f"  -> Không thể bóc tách thông tin từ ảnh: {filename}")
        continue

      location = data.get("vi_tri", "")
      if location:
        location = location.strip()
      lng = data.get("kinh_do", "")
      if lng:
        lng = lng.strip()
      lat = data.get("vi_do", "")
      if lat:
        lat = lat.strip()

      print(f"  -> Vị trí: {location}")
      print(f"  -> Toạ độ: {lat}, {lng}")

      results.append({
        "Tên file": filename,
        "Vị trí": location,
        "Kinh độ": lng,
        "Vĩ độ": lat
      })

      # Lưu lại tiến độ vào file Excel ngay sau mỗi ảnh
      df_new = pd.DataFrame(results)
      df_new.to_excel(OUTPUT_EXCEL, index=False)

    except Exception as e:
      print(f"Lỗi khi xử lý {filename}: {e}")

  print("Hoàn thành!")

if __name__ == "__main__":
  main()
