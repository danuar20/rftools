"""
========================================================================================
EXCEL ⇄ KML & ISD TOOLKIT
========================================================================================
Description:
    A desktop GUI application built with Python Tkinter for cellular network / telecom 
    optimization engineers. It provides tools for:
    1. Excel to KML Point Converter: Converts site location Excel data into Google Earth KML points.
    2. Excel to PRB KML Converter: Converts cell metrics & site parameters into styled sector 
       polygons on Google Earth, color-coded by DL/UL PRB utilization and RRC user metrics, 
       complete with legend overlay and HTML popup tables.
    3. ISD (Inter-Site Distance) Calculator: Computes nearest-neighbor distances (in km) 
       between two sets of cell sites (File A to File B) using the Haversine formula and exports 
       detailed results and statistical summaries.

System & Library Requirements:
    - Python Version: Python 3.8 or higher
    - Operating System: Windows (recommended), macOS, or Linux
    - Network Connection: Active internet connection required (for online login verification 
      and fetching remote logos/icons).

Dependencies (Install via pip):
    pip install pandas openpyxl simplekml pillow requests

Required Excel Formats:
    1. Excel to KML (Point):
       - Sheet containing columns for latitude ('lat' / 'latitude') and longitude ('lon' / 'long' / 'longitude').
    2. Excel to KML (PRB):
       - Sheet named 'Sheet1' containing mandatory headers:
         'LAT', 'LONG', 'BEAM' (e.g. LTE900, LTE1800, LTE2100, LTE2300-1st, etc.),
         'DIRECTION' (azimuth angle in degrees), 'DL PRB BDBH', 'UL PRB BDBH',
         'RRC User BDBH', 'PAYLOAD (MB)', 'CELLNAME', 'SITENAME'.
    3. ISD Calculator:
       - File A & File B with columns for site identifiers, latitude, and longitude.

Usage:
    Run the application using:
        python kml_isd.py
========================================================================================
"""

from tkinter import *
from tkinter import ttk, messagebox, filedialog
import tkinter as tk
import threading
import requests
import pandas as pd
import json
import openpyxl
from openpyxl.comments import Comment
import simplekml
from simplekml import ListItemType, OverlayXY, ScreenXY, Units
import math
import os
import requests
from io import BytesIO
import webbrowser
import time
from PIL import Image, ImageTk, ImageFilter, ImageDraw, ImageEnhance, ImageOps
from datetime import datetime
import ctypes

# --------------------
# Utility functions
# --------------------
def set_app_icon(window):
    """Set application window and taskbar icon using Google_Earth.ico."""
    icon_path = "Google_Earth.ico"
    # Set Windows AppUserModelID so taskbar icon displays correctly
    if os.name == 'nt':
        try:
            myappid = 'telkominfra.kml_isd_toolkit.1.0'
            ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
        except Exception:
            pass

    if not os.path.exists(icon_path):
        try:
            url = "https://raw.githubusercontent.com/danuar20/image/main/Google_Earth.ico"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            with open(icon_path, "wb") as f:
                f.write(response.content)
        except Exception as e:
            print("Failed to download icon:", e)

    if os.path.exists(icon_path):
        try:
            window.iconbitmap(icon_path)
        except Exception as e:
            print("Failed to set window icon:", e)

def show_contact_support_dialog():
    """Display contact support email and phone information (for Login screen)."""
    title = "Contact Support"
    info = (
        "Contact Support\n"
        "-----------------------------------------\n"
        "Email : danuartrianurrohman@gmail.com\n"
        "        danuartrianurrohman@telkominfra.com\n"
        "Phone : +6282116513070"
    )
    messagebox.showinfo(title, info)

def show_about_dialog():
    """Display general application information and developer contact details (for Main App)."""
    title = "About - Excel ⇄ KML & ISD Toolkit"
    info = (
        "Excel ⇄ KML & ISD Toolkit (v2.0)\n"
        "========================================\n\n"
        "A desktop network optimization toolkit for cellular engineers:\n"
        "• Excel → KML Point: Converts site coordinates into KML placemarks.\n"
        "• Excel → KML PRB: Generates sector polygons with DL/UL PRB & RRC metrics.\n"
        "• Calculate ISD: Computes nearest-neighbor site distances (in km).\n\n"
        "Developer & Support Contact:\n"
        "-----------------------------------------\n"
        "Developer : Danuar Trianur Rohman\n"
        "Company   : Telkominfra © 2025-2026\n"
        "Email     : danuartrianurrohman@gmail.com\n"
        "            danuartrianurrohman@telkominfra.com\n"
        "Phone     : +6282116513070"
    )
    messagebox.showinfo(title, info)

def generate_sample_excel_template(template_type, default_filename):
    """Generate and save a sample Excel file (.xlsx) with valid sample data."""
    save_path = filedialog.asksaveasfilename(
        title=f"Save Sample Template",
        defaultextension=".xlsx",
        initialfile=default_filename,
        filetypes=[("Excel Files", "*.xlsx")]
    )
    if not save_path:
        return None

    try:
        if template_type == 'point':
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Sheet1"
            headers = ["SITE_ID", "SITENAME", "Site", "LONG", "LAT"]
            ws.append(headers)
            
            rows = [
                ["JKT001", "Jakarta_Monas_01", 106.827153, -6.175392],
                ["JKT002", "Jakarta_GBK_02", 106.801444, -6.243589],
                ["BDG001", "Bandung_GedungSate_01", 107.619123, -6.917464],
                ["SUB001", "Surabaya_TuguPahlawan_01", 112.737829, -7.245842],
            ]
            for idx, r in enumerate(rows, start=2):
                ws.append([r[0], r[1], f'=UPPER(A{idx}&" : "&B{idx})', r[2], r[3]])
            
            wb.save(save_path)

        elif template_type == 'prb':
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Sheet1"
            
            headers = [
                "WEEK", "SITEID", "SITENAME", "CELLNAME", "BEAM", "DL PRB BDBH", "UL PRB BDBH", "RRC User BDBH",
                "PAYLOAD (MB)", "BW (MHz)", "LONG", "LAT", "DIRECTION", "CLASS REV", "NOP", "RTPO",
                "PROPINSI", "KABUPATEN", "KECAMATAN", "DESA", "SDR", "ANTENNA_TYPE", "TOWER_HEIGHT",
                "ANTENNA_HEIGHT", "M-Tilt", "E-Tilt", "PCI"
            ]
            ws.append(headers)

            # Add comment to BEAM column header (E1)
            comment_text = (
                "Example :\n"
                "LTE700\n"
                "LTE900\n"
                "LTE1800\n"
                "LTE2100\n"
                "LTE2300-1st\n"
                "LTE2300-2nd\n"
                "LTE2300-3rd"
            )
            beam_comment = Comment(comment_text, "Danuar Trianur Rohman")
            beam_comment.width = 220
            beam_comment.height = 180
            ws["E1"].comment = beam_comment

            rows = [
                [
                    "W29", "JKT001", "JKT_MONAS_01", "JKT_MONAS_01_Sec1", "LTE1800", 25.5, 18.2, 35,
                    10240, 20, 106.827153, -6.175392, 0, "REV_A", "NOP_JKT", "RTPO_JKT",
                    "DKI JAKARTA", "JAKARTA PUSAT", "GAMBIR", "GAMBIR", "SDR_01", "POLE", 30, 28,
                    2, 4, 101
                ],
                [
                    "W29", "JKT001", "JKT_MONAS_01", "JKT_MONAS_01_Sec2", "LTE1800", 68.4, 55.0, 82,
                    25600, 20, 106.827153, -6.175392, 120, "REV_A", "NOP_JKT", "RTPO_JKT",
                    "DKI JAKARTA", "JAKARTA PUSAT", "GAMBIR", "GAMBIR", "SDR_01", "POLE", 30, 28,
                    2, 4, 102
                ],
                [
                    "W29", "JKT001", "JKT_MONAS_01", "JKT_MONAS_01_Sec3", "LTE1800", 92.1, 88.6, 135,
                    35840, 20, 106.827153, -6.175392, 240, "REV_A", "NOP_JKT", "RTPO_JKT",
                    "DKI JAKARTA", "JAKARTA PUSAT", "GAMBIR", "GAMBIR", "SDR_01", "POLE", 30, 28,
                    2, 4, 103
                ]
            ]
            for r in rows:
                ws.append(r)

            wb.save(save_path)

        elif template_type == 'isd_a':
            df = pd.DataFrame([
                {"SITE_ID": "SITE_A01",  "LAT": -6.175392, "LONG": 106.827153},
                {"SITE_ID": "SITE_A02",  "LAT": -6.917464, "LONG": 107.619123},
            ])
            df.to_excel(save_path, index=False, engine='openpyxl')

        elif template_type == 'isd_b':
            df = pd.DataFrame([
                {"SITE_ID": "SITE_B01", "LAT": -6.243589, "LONG": 106.801444},
                {"SITE_ID": "SITE_B02", "LAT": -6.183333, "LONG": 106.841667},
                {"SITE_ID": "SITE_B03", "LAT": -6.921852, "LONG": 107.607140},
            ])
            df.to_excel(save_path, index=False, engine='openpyxl')

        messagebox.showinfo("Sample Saved", f"Sample template saved successfully to:\n{save_path}")
        return save_path
    except Exception as e:
        messagebox.showerror("Error", f"Failed to save sample template:\n{e}")
        return None
def load_remembered_credentials():
    """Load saved login credentials if Remember Me was checked."""
    config_file = ".remember_me.json"
    if os.path.exists(config_file):
        try:
            with open(config_file, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"remember": False, "username": "", "password": ""}

def save_remembered_credentials(remember, username, password):
    """Save or clear remembered login credentials."""
    config_file = ".remember_me.json"
    data = {
        "remember": remember,
        "username": username if remember else "",
        "password": password if remember else ""
    }
    try:
        with open(config_file, "w") as f:
            json.dump(data, f)
    except Exception:
        pass

def download_file():
    """Download JSON credentials from GitHub (same as original)."""
    file_url = "https://raw.githubusercontent.com/danuar20/File/main/datasheet.txt"
    try:
        resp = requests.get(file_url, timeout=10)
        resp.raise_for_status()
        return json.loads(resp.text)
    except Exception as e:
        messagebox.showerror("Error", f"You are offline or cannot access the credentials file.\nPlease check your internet connection and try again.")
        return None

def find_latlon_headers(headers):
    """Given a list of header names, return indexes for lat and lon if possible."""
    lat_idx = lon_idx = None
    low = [h.lower() if h is not None else "" for h in headers]
    for i, h in enumerate(low):
        if h in ('lat', 'latitude', 'y'):
            lat_idx = i
        if h in ('lon', 'long', 'longitude', 'x'):
            lon_idx = i
    return lat_idx, lon_idx

def haversine_km(lat1, lon1, lat2, lon2):
    """Compute great-circle distance between two points (degrees) in kilometers."""
    # convert degrees to radians
    rlat1 = math.radians(lat1)
    rlon1 = math.radians(lon1)
    rlat2 = math.radians(lat2)
    rlon2 = math.radians(lon2)
    dlat = rlat2 - rlat1
    dlon = rlon2 - rlon1
    a = math.sin(dlat/2)**2 + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    R = 6371.0088  # Earth radius km (mean)
    return R * c

def open_folder(path):
    if os.name == 'nt':
        os.startfile(path)
    else:
        webbrowser.open(f"file://{path}")


def get_dl_prb_color(dl_prb):
    """Determine color hex based on DL PRB value."""
    if dl_prb == 0:
        return 'BFBFBF'
    elif 0 < dl_prb <= 35:
        return '0000FF'  # Blue
    elif 35 < dl_prb <= 60:
        return '00FF00'  # Green
    elif 60 < dl_prb <= 75:
        return 'FFFF00'  # Yellow
    elif 75 < dl_prb <= 90:
        return 'FFBF00'  # Orange
    elif dl_prb > 90:
        return 'FF0000'  # Red
    return 'FFFFFF'  # Default white

def get_ul_prb_color(ul_prb):
    """Determine color hex based on UL PRB value."""
    if ul_prb == 0:
        return 'BFBFBF'
    elif 0 < ul_prb <= 35:
        return '0000FF'  # Blue
    elif 35 < ul_prb <= 60:
        return '00FF00'  # Green
    elif 60 < ul_prb <= 75:
        return 'FFFF00'  # Yellow
    elif 75 < ul_prb <= 90:
        return 'FFBF00'  # Orange
    elif ul_prb > 90:
        return 'FF0000'  # Red
    return 'FFFFFF'  # Default white

def get_rrc_color(rrc):
    """Determine color hex based on RRC user count value."""
    if rrc == 0:
        return 'BFBFBF'
    elif 0 < rrc <= 40:
        return '0000FF'  # Blue
    elif 40 < rrc <= 60:
        return '00FF00'  # Green
    elif 60 < rrc <= 90:
        return 'FFFF00'  # Yellow
    elif 90 < rrc <= 120:
        return 'FFBF00'  # Orange
    elif rrc > 120:
        return 'FF0000'  # Red
    return 'FFFFFF'  # Default white

def get_altitude(uarfc):
    """
    Menentukan altitude berdasarkan nilai uarfc.
    """
    if uarfc == "LTE900":
        return 40
    elif uarfc == "LTE1800":
        return 38
    elif uarfc == "LTE2100":
        return 36  
    elif uarfc == "LTE2300-1st":
        return 34
    elif uarfc == "LTE2300-2nd":
        return 32
    elif uarfc == "LTE2300-3rd":
        return 30
    elif uarfc == "LTE700":
        return 42
    return 28

def sec_beam(uarfc):
    if uarfc == "LTE900" or uarfc == "LTE1800" or  uarfc == "LTE2100" or  uarfc == "LTE700":
        return 23
    elif uarfc == "LTE2300-1st" or uarfc == "LTE2300-2nd" or uarfc == "LTE2300-3rd":
        return 25
    return 27

def sec_radius(uarfc):
    if uarfc == "LTE900" :
        return 0.042
    elif uarfc == "LTE1800":
        return 0.046
    elif uarfc == "LTE2100":
        return 0.05  
    elif uarfc == "LTE2300-1st":
        return 0.054
    elif uarfc == "LTE2300-2nd":
        return 0.058
    elif uarfc == "LTE2300-3rd":
        return 0.062
    elif uarfc == "LTE700":
        return 0.038
    return 0.08

def calculate_new_coords(rad_Lat, rad_Lon, azimuth_angle, d_R):
    rad_Lat_new = math.asin(math.sin(rad_Lat) * math.cos(d_R) + math.cos(rad_Lat) * math.sin(d_R) * math.cos(azimuth_angle))
    rad_Lon_new = rad_Lon + math.atan2(math.sin(azimuth_angle) * math.sin(d_R) * math.cos(rad_Lat), math.cos(d_R) - math.sin(rad_Lat) * math.sin(rad_Lat_new))
    Lat_new = math.degrees(rad_Lat_new)
    Lon_new = math.degrees(rad_Lon_new)
    return Lon_new, Lat_new




# --------------------
# Conversion functions
# --------------------
def convert_excel_to_kml_file(excel_path, kml_save_path, folder_name="SITENAME", icon_url=None, color_rgb=(85,0,0), label_color=(255,255,0), scale=0.7):
    """
    Read excel file, expect columns (siteID, sitename, lon, lat, site) or auto-detect lat/lon.
    Save KML to kml_save_path.
    """
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    sheet = wb.active
    k = simplekml.Kml()
    fol = k.newfolder(name=folder_name)
    #fol = k.newfolder(name=folder_name, description=f"Converted {os.path.basename(excel_path)}")

    # Style
    style = simplekml.Style()
    if icon_url:
        style.iconstyle.icon = simplekml.Icon(href=icon_url)
    else:
        style.iconstyle.icon = simplekml.Icon(href='http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png')
    style.iconstyle.color = simplekml.Color.rgb(*color_rgb)
    style.iconstyle.scale = scale
    style.labelstyle.color = simplekml.Color.rgb(*label_color)
    style.labelstyle.scale = scale

    # read header to attempt to detect columns
    rows = list(sheet.iter_rows(values_only=True))
    if not rows or len(rows) < 2:
        raise ValueError("Excel file is empty or contains only headers.")
    headers = rows[0]
    lat_idx, lon_idx = find_latlon_headers(headers)

    # fallback: assume columns as in original [siteID, sitename, lon, lat, site]
    if lat_idx is None or lon_idx is None:
        # try common positions
        # original assumed lon at index 2, lat index 3, site name maybe at 4
        if len(headers) >= 4:
            lon_idx = 2
            lat_idx = 3

    data_rows = rows[1:]
    total = len(data_rows)
    for idx, r in enumerate(data_rows, start=1):
        if progress_callback and (idx % max(1, total // 20) == 0 or idx == total):
            pct = int((idx / total) * 100)
            progress_callback(pct, f"Converting placemarks... {pct}% ({idx}/{total})")
        try:
            lat = r[lat_idx] if lat_idx is not None else None
            lon = r[lon_idx] if lon_idx is not None else None
            name = None
            for try_idx in (4,1,0):
                if try_idx < len(r) and r[try_idx] not in (None, ""):
                    name = str(r[try_idx])
                    break
            if lat is None or lon is None:
                continue
            lat_f = float(lat)
            lon_f = float(lon)
            p = fol.newpoint(name=name or "site", coords=[(lon_f, lat_f)])
            p.style = style
        except Exception:
            continue

    k.save(kml_save_path)

def convert_excel_to_prb_kml_file(excel_path, kml_save_path, progress_callback=None):
    """
    Create a PRB KML with a distinct style (red cross icon + description).
    """
    df = pd.read_excel(excel_path, sheet_name="Sheet1", engine="openpyxl")
    total = len(df)
    if progress_callback:
        progress_callback(5, f"Reading Excel datasheet... 5% (0/{total})")
    #df =excel_file

    #excel_file = openpyxl.load_workbook(excel_path, data_only=True)
    #df = pd.read_excel(excel_file, sheet_name='Sheet1')
    #df = excel_file.active

    # Menyiapkan kolom untuk koordinat baru
    df['Coordinates'] = ""  
        
    # Loop melalui setiap baris DataFrame
    for index, row in df.iterrows():
        if progress_callback and ((index + 1) % max(1, total // 20) == 0 or index == total - 1):
            pct = int(((index + 1) / total) * 45) + 5
            progress_callback(pct, f"Calculating sector geometries... {pct}% ({index + 1}/{total})")
        latitude = row.get('LAT')
        longitude = row.get('LONG')
        uarfc = row.get('BEAM')
        azimuth = row.get('DIRECTION')

        # Mendapatkan nilai-nilai
        altitude = get_altitude(uarfc)
        Sectorize_Beam = sec_beam(uarfc)
        Sectorize_Radius = sec_radius(uarfc)

        # Definisikan nilai
        Earth_Curvature_R = 6371
        azimuth_left2 = azimuth - (Sectorize_Beam / 2)
        azimuth_left1 = (azimuth_left2 + azimuth) / 2
        azimuth_right2 = azimuth + (Sectorize_Beam / 2)
        azimuth_right1 = (azimuth_right2 + azimuth) / 2

        # Konversi derajat ke radian
        rad_Lat = math.radians(latitude)
        rad_Lon = math.radians(longitude)
        d_R = Sectorize_Radius / Earth_Curvature_R
        rad_Teta_1 = math.radians(azimuth_left2)
        rad_Teta_2 = math.radians(azimuth_left1)
        rad_Teta_3 = math.radians(azimuth)
        rad_Teta_4 = math.radians(azimuth_right1)
        rad_Teta_5 = math.radians(azimuth_right2)

        # Hitung koordinat baru
        long_lat_1 = f"{calculate_new_coords(rad_Lat, rad_Lon, rad_Teta_1, d_R)[0]},{calculate_new_coords(rad_Lat, rad_Lon, rad_Teta_1, d_R)[1]},{altitude}"
        long_lat_2 = f"{calculate_new_coords(rad_Lat, rad_Lon, rad_Teta_2, d_R)[0]},{calculate_new_coords(rad_Lat, rad_Lon, rad_Teta_2, d_R)[1]},{altitude}"
        long_lat_3 = f"{calculate_new_coords(rad_Lat, rad_Lon, rad_Teta_3, d_R)[0]},{calculate_new_coords(rad_Lat, rad_Lon, rad_Teta_3, d_R)[1]},{altitude}"
        long_lat_4 = f"{calculate_new_coords(rad_Lat, rad_Lon, rad_Teta_4, d_R)[0]},{calculate_new_coords(rad_Lat, rad_Lon, rad_Teta_4, d_R)[1]},{altitude}"
        long_lat_5 = f"{calculate_new_coords(rad_Lat, rad_Lon, rad_Teta_5, d_R)[0]},{calculate_new_coords(rad_Lat, rad_Lon, rad_Teta_5, d_R)[1]},{altitude}"

        # Format koordinat akhir
        long_lat_final = f"{longitude},{latitude},{altitude};{long_lat_1};{long_lat_2};{long_lat_3};{long_lat_4};{long_lat_5};{longitude},{latitude},{altitude}"

        # Update DataFrame dengan koordinat baru
        df.at[index, 'Coordinates'] = long_lat_final

    # Menyimpan kembali ke file Excel
    #df.to_excel(excel_path,sheet_name='Sheet1', index=False)

    #print(df.head())

# Membaca file Excel
    #df = pd.read_excel(excel_path, sheet_name='Sheet1')

    # Membuat objek KML
    kml = simplekml.Kml()
    kml.document.liststyle.listitemtype = ListItemType.checkhidechildren #Membuat agar tidak bisa di expand

    # Mendapatkan ukuran layar secara aman tanpa membuat instance tk.Tk baru
    try:
        if tk._default_root:
            screen_width = tk._default_root.winfo_screenwidth()
            screen_height = tk._default_root.winfo_screenheight()
        else:
            screen_width, screen_height = 1920, 1080
    except Exception:
        screen_width, screen_height = 1920, 1080

    x = screen_width - (0.1 * screen_width)
    y = 0.25 * screen_height

    # Membuat ScreenOverlay baru
    screen = kml.newscreenoverlay(name='Legend')

    # Mengatur ikon gambar
    YOUR_FILE_ID = "1FUMTnOF6rluHJ4WbFSqwmOdERQALn6rV"
    screen.icon.href = 'https://drive.google.com/uc?export=view&id='+(YOUR_FILE_ID)

    # Menentukan posisi overlay pada layar (posisi sudut kiri atas)
    screen.overlayxy = OverlayXY(x=0, y=1, xunits=Units.fraction, yunits=Units.fraction)

    # Menentukan posisi di layar (posisi dalam pixel dari sudut kiri atas layar)
    # Anda bisa menyesuaikan x dan y dengan nilai yang lebih sesuai jika diperlukan
    screen.screenxy = ScreenXY(x=(x), y=(y), xunits=Units.pixels, yunits=Units.pixels)

    # Menentukan ukuran overlay (ukuran dalam satuan fraksi layar)
    screen.size.x = 0.075
    screen.size.y = 0.15
    screen.size.xunits = Units.fraction
    screen.size.yunits = Units.fraction



    # Loop melalui setiap baris DataFrame
    for index, row in df.iterrows():
        if progress_callback and ((index + 1) % max(1, total // 20) == 0 or index == total - 1):
            pct = int(((index + 1) / total) * 45) + 50
            progress_callback(pct, f"Building 3D sector polygons... {pct}% ({index + 1}/{total})")
        latitude = row.get('LAT')
        longitude = row.get('LONG')
        uarfc = row.get('BEAM')
        azimuth = row.get('DIRECTION')
        dl_prb = round(row.get('DL PRB BDBH'),2)
        ul_prb = round(row.get('UL PRB BDBH'),2)
        rrc = round(row.get('RRC User BDBH'),2)
        payload = round(row.get('PAYLOAD (MB)')/1024,2)
        cellname = row.get('CELLNAME')
        coordinates = row.get('Coordinates', '')  # Default to empty string if not found

        # Mengonversi koordinat string menjadi daftar tuple
        try:
            coords = [(float(coord.split(',')[0]), float(coord.split(',')[1]), float(coord.split(',')[2]))  for coord in coordinates.split(';')]
        except ValueError:
            print(f"Invalid coordinates format for CELLNAME {cellname}: {coordinates}")
            continue
        
        #print(coords)
        # Menghitung warna berdasarkan kondisi dl_prb, ul_prb, rrc
        fill_color_dl = get_dl_prb_color(dl_prb)
        fill_color_ul = get_ul_prb_color(ul_prb)
        fill_color_rrc = get_rrc_color(rrc)

        # Membuat poligon
        poligon = kml.newpolygon()
        
        # Menambahkan koordinat
        poligon.outerboundaryis = coords

        # Mengatur warna fill dan garis untuk poligon
        opacity_percent = 40
        opacity_a = int(255 * (opacity_percent / 100)) 
        poligon.style.polystyle.color = simplekml.Color.changealphaint(opacity_a, simplekml.Color.hex(fill_color_dl))
        poligon.style.linestyle.color = simplekml.Color.changealphaint(255, simplekml.Color.hex(fill_color_dl))

        #print (opacity_a)

        # Mengatur altitude
        altitude = get_altitude(uarfc)
        poligon.altitude = altitude
        poligon.extrude = 1
        poligon.altitudemode = simplekml.AltitudeMode.relativetoground
        #print (altitude)
        #138.136794,-5.537905,36;138.137170724259,-5.53815318430904,36;138.137164350433,-5.53816251277536,36
        #Nilai 36 diatas adalah altitude

        # Menambahkan deskripsi
        description = (
            f"<STYLE TYPE=\"text/css\">"
            f"TD{{font-family: Calibri; font-size: 8pt; color: Black;}}"
            f".small-text{{font-size: 6pt;}}"  # Kelas CSS untuk ukuran font kecil
            f"</STYLE>"
            f"<table border=\"1\" padding=\"0\">"
            #f"<tr><td><b><img src=https://cudocomm.com/images/logo/telkominfra.png width=\"184\" height=\"56\"></td>"
            ## image source github ##
            f"<tr><td><b><img src=https://raw.githubusercontent.com/danuar20/image/main/Infra.png width=\"184\" height=\"56\"></td>"
            f"<td><center><img src=https://raw.githubusercontent.com/danuar20/image/main/PUMA.png width=\"184\" height=\"56\"></center></td></tr>"
            #########################
            f"<tr><td><b>WEEK.</td><td>{row.get('WEEK', 'N/A')}</td></b></tr>"
            f"<tr><td><b>SITENAME.</td><td>{row.get('SITENAME', 'N/A')}</td></b></tr>"
            f"<tr><td><b>CELLNAME.</td><td>{cellname}</td></b></tr>"
            f"<tr><td><b>BAND.</td><td>{uarfc}</td></b></tr>"
            f"<tr><td><b>DL PRB BDBH (%).</td><td bgcolor={fill_color_dl}><b><center>{dl_prb}</center></b></td></tr>"
            f"<tr><td><b>UL PRB BDBH (%).</td><td bgcolor={fill_color_ul}><b><center>{ul_prb}</center></b></td></tr>"
            f"<tr><td><b>RRC User BDBH.</td><td bgcolor={fill_color_rrc}><b><center>{rrc}</center></b></td></tr>"
            f"<tr><td><b>PAYLOAD (GB).</td><td><b><center>{payload}</center></td></b></tr>"
            f"<tr><td><b>BANDWIDTH (MHz).</td><td>{row.get('BW (MHz)', 'N/A')}</td></b></tr>"
            f"<tr><td><b>LONGITUDE.</td><td>{longitude}</td></b></tr>"
            f"<tr><td><b>LATITUDE.</td><td>{latitude}</td></b></tr>"
            f"<tr><td><b>CLASS REV.</td><td>{row.get('CLASS REV', 'N/A')}</td></b></tr>"
            f"<tr><td><b>NOP.</td><td>{row.get('NOP', 'N/A')}</td></b></tr>"
            f"<tr><td><b>RTPO.</td><td>{row.get('RTPO', 'N/A')}</td></b></tr>"
            f"<tr><td><b>PROPINSI.</td><td>{row.get('PROPINSI', 'N/A')}</td></b></tr>"
            f"<tr><td><b>KABUPATEN.</td><td>{row.get('KABUPATEN', 'N/A')}</td></b></tr>"
            f"<tr><td><b>KECAMATAN.</td><td>{row.get('KECAMATAN', 'N/A')}</td></b></tr>"
            f"<tr><td><b>DESA.</td><td>{row.get('DESA', 'N/A')}</td></b></tr>"
            f"<tr><td><b>SDR.</td><td>{row.get('SDR', 'N/A')}</td></b></tr>"
            f"<tr><td><b>ANTENNA_TYPE.</td><td>{row.get('ANTENNA_TYPE', 'N/A')}</td></b></tr>"
            f"<tr><td><b>TOWER_HEIGHT.</td><td>{row.get('TOWER_HEIGHT', 'N/A')}</td></b></tr>"
            f"<tr><td><b>ANTENNA_HEIGHT.</td><td>{row.get('ANTENNA_HEIGHT', 'N/A')}</td></b></tr>"
            f"<tr><td><b>AZIMUTH.</td><td>{azimuth}</td></b></tr>"
            f"<tr><td><b>M-Tilt.</td><td>{row.get('M-Tilt', 'N/A')}</td></b></tr>"
            f"<tr><td><b>E-Tilt.</td><td>{row.get('E-Tilt', 'N/A')}</td></b></tr>"
            f"<tr><td><b>PCI.</td><td>{row.get('PCI', 'N/A')}</td></b></tr>"
            f"</table>"
            f"<table border=\"0\" padding=\"0\">"
            f"<tr><td><span class=\"small-text\"><b>©2025-Telkominfra- </b>danuartrianurrohman@telkominfra.com</span></td></tr>"
            f"</table>"
        )

        poligon.description = description

    # Menyimpan file KML
    kml.save(kml_save_path)
    if progress_callback:
        progress_callback(100, "PRB KML generation complete! 100%")

def calculate_isd_file(excel_a, excel_b, output_path, n_nearest=1, progress_callback=None):
    """
    Calculate ISD: for each site in excel_a, find nearest site in excel_b and compute distance (km).
    Save results to an xlsx file with columns:
    siteA, latA, lonA, nearestSiteB, latB, lonB, distance_km
    """
    # load data
    wb_a = openpyxl.load_workbook(excel_a, data_only=True)
    sh_a = wb_a.active
    rows_a = list(sh_a.iter_rows(values_only=True))
    if not rows_a or len(rows_a) < 2:
        raise ValueError("File A is empty or invalid.")
    headers_a = rows_a[0]
    latA_i, lonA_i = find_latlon_headers(headers_a)
    if latA_i is None or lonA_i is None:
        # try default positions
        latA_i, lonA_i = 3, 2

    wb_b = openpyxl.load_workbook(excel_b, data_only=True)
    sh_b = wb_b.active
    rows_b = list(sh_b.iter_rows(values_only=True))
    if not rows_b or len(rows_b) < 2:
        raise ValueError("File B is empty or invalid.")
    headers_b = rows_b[0]
    latB_i, lonB_i = find_latlon_headers(headers_b)
    if latB_i is None or lonB_i is None:
        latB_i, lonB_i = 3, 2

    # build list of sites B
    sites_b = []
    for r in rows_b[1:]:
        try:
            lat = float(r[latB_i])
            lon = float(r[lonB_i])
            name = None
            for try_idx in (0,1,4):
                if try_idx < len(r) and r[try_idx] not in (None, ""):
                    name = str(r[try_idx]); break
            sites_b.append((name or "B_site", lat, lon))
        except Exception:
            continue

    if not sites_b:
        raise ValueError("No valid coordinates found in File B.")

    # Prepare output workbook
    out_wb = openpyxl.Workbook()
    out_sh = out_wb.active
    out_sh.title = "ISD_Result"
    out_sh.append(["siteA","latA","lonA","nearestSiteB","latB","lonB","distance_km"])

    distances = []
    total_a = len(rows_a) - 1
    # iterate A
    for idx_a, r in enumerate(rows_a[1:], start=1):
        if progress_callback and (idx_a % max(1, total_a // 20) == 0 or idx_a == total_a):
            pct = int((idx_a / total_a) * 100)
            progress_callback(pct, f"Computing ISD distances... {pct}% ({idx_a}/{total_a})")
        try:
            latA = float(r[latA_i])
            lonA = float(r[lonA_i])
            nameA = None
            for try_idx in (0,1,4):
                if try_idx < len(r) and r[try_idx] not in (None, ""):
                    nameA = str(r[try_idx]); break
            # find nearest in B
            #best = None
            #best_d = None
            #for b in sites_b:
            #    d = haversine_km(latA, lonA, b[1], b[2])
            #   if best_d is None or d < best_d:
            #        best_d = d
            #        best = b
            #if best is None:
            #    continue
            #out_sh.append([nameA or "A_site", latA, lonA, best[0], best[1], best[2], round(best_d, 6)])
            #distances.append(best_d)

            # hitung semua jarak lalu urutkan
            dist_list = []
            for b in sites_b:
                d = haversine_km(latA, lonA, b[1], b[2])
                dist_list.append((b, d))
            dist_list.sort(key=lambda x: x[1])

            # ambil n_nearest terdekat
            for i in range(min(n_nearest, len(dist_list))):
                nearest_b, nearest_d = dist_list[i]
                out_sh.append([
                    nameA or "A_site", latA, lonA,
                    nearest_b[0], nearest_b[1], nearest_b[2],
                    round(nearest_d, 6)
                ])
                distances.append(nearest_d)        

        except Exception:
            continue

    # summary sheet
    summary_sh = out_wb.create_sheet(title="Summary")
    if distances:
        mn = min(distances)
        mx = max(distances)
        mean = sum(distances)/len(distances)
        summary_sh.append(["count", len(distances)])
        summary_sh.append(["min_km", mn])
        summary_sh.append(["mean_km", mean])
        summary_sh.append(["max_km", mx])
    else:
        summary_sh.append(["No valid distances computed"])

    out_wb.save(output_path)

# --------------------
# GUI: Login + Multi-Page App
# --------------------
class App:
    def __init__(self, root):
        self.root = root
        set_app_icon(root)
        root.title("Sign In - Excel ⇄ KML & ISD Toolkit")        
        root_width = 720
        root_height = 360

        # Calculate screen center position
        screen_width = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()
        x = (screen_width // 2) - (root_width // 2)
        y = (screen_height // 2) - (root_height // 2)
        root.geometry(f"{root_width}x{root_height}+{x}+{y}")
        root.configure(bg="#fff")
        root.resizable(False, False)

        self.is_authenticating = False

        # Load illustration image
        img_url = "https://raw.githubusercontent.com/danuar20/image/main/Infra2.png"

        try:
            response = requests.get(img_url, timeout=10)
            response.raise_for_status()

            img = Image.open(BytesIO(response.content)).convert("RGBA")
            img = img.resize((320, 240), Image.Resampling.LANCZOS)

            offset = (8, 8)
            blur_radius = 8

            shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
            alpha = img.split()[3]
            black_shadow = Image.new("RGBA", img.size, (0, 0, 0, 255))
            shadow.paste(black_shadow, (0, 0), mask=alpha)
            shadow = shadow.filter(ImageFilter.GaussianBlur(blur_radius))

            final_size = (img.width + offset[0], img.height + offset[1])
            final_image = Image.new("RGBA", final_size, (255, 255, 255, 0))
            final_image.paste(shadow, offset, shadow)
            final_image.paste(img, (0, 0), img)

            self.tk_image = ImageTk.PhotoImage(final_image)
            Label(root, image=self.tk_image, bg="white").place(x=20, y=55)

        except Exception as e:
            print("Failed to load illustration image:", e)

        # Compact Login card frame with aligned inputs & button width
        frame = Frame(root, width=320, height=290, bg="white")
        frame.place(x=370, y=35)

        heading = Label(frame, text='Excel ⇄ KML & ISD', fg='#2263AD', bg='white', font=('Segoe UI', 15, 'bold'))
        heading.place(x=25, y=10)

        sub_heading = Label(frame, text='Network Optimization Toolkit - Sign In', fg='#666666', bg='white', font=('Segoe UI', 8))
        sub_heading.place(x=25, y=36)

        # Exact pixel width (270px) for all elements
        INPUT_WIDTH = 270

        self.user = Entry(frame, fg='black', border=0, bg='white', font=('Microsoft YaHei UI Light', 11))
        self.user.place(x=25, y=70, width=INPUT_WIDTH)
        self.user.insert(0, 'Username')

        self.user_line = Frame(frame, height=2, bg='#2263AD')
        self.user_line.place(x=25, y=95, width=INPUT_WIDTH)

        self.code = Entry(frame, fg='black', border=0, bg='white', font=('Microsoft YaHei UI Light', 11))
        self.code.place(x=25, y=115, width=INPUT_WIDTH)
        self.code.insert(0, 'Password')

        self.code_line = Frame(frame, height=2, bg='#2263AD')
        self.code_line.place(x=25, y=140, width=INPUT_WIDTH)

        # Focus & visual border validation highlights
        self.user.bind('<FocusIn>', lambda e: [self._clear_placeholder(self.user, 'Username'), self.user_line.config(bg='#2263AD')])
        self.user.bind('<FocusOut>', lambda e: [self._restore_placeholder(self.user, 'Username'), self.user_line.config(bg='#CBD5E1' if self.user.get() != 'Username' else '#2263AD')])
        self.user.bind('<Return>', lambda e: self.signin())

        self.code.bind('<FocusIn>', lambda e: [self._clear_pass(self.code, 'Password'), self.code_line.config(bg='#2263AD')])
        self.code.bind('<FocusOut>', lambda e: [self._restore_pass(self.code, 'Password'), self.code_line.config(bg='#CBD5E1' if self.code.get() != 'Password' else '#2263AD')])
        self.code.bind('<Return>', lambda e: self.signin())

        # Remember Me Checkbox & Credentials Pre-fill
        saved_cred = load_remembered_credentials()
        self.remember_var = BooleanVar(value=saved_cred.get("remember", False))
        self.remember_cb = Checkbutton(frame, text="Remember me", variable=self.remember_var, bg="white", fg="#555555", font=('Segoe UI', 8), activebackground="white", cursor="hand2")
        self.remember_cb.place(x=22, y=146)

        if saved_cred.get("remember") and saved_cred.get("username"):
            self.user.delete(0, "end")
            self.user.insert(0, saved_cred.get("username"))
            self.code.delete(0, "end")
            self.code.insert(0, saved_cred.get("password"))
            self.code.config(show="*")

        self.signin_btn = Button(frame, text='Sign in', bg="#2263AD", fg='white', activebackground="#1B4F8B", activeforeground="white", border=0, font=('Segoe UI', 10, 'bold'), command=self.signin, cursor='hand2')
        self.signin_btn.place(x=25, y=172, width=INPUT_WIDTH, height=32)

        # Progressbar / Loading Spinner & Status Label (aligned at 270px width)
        self.progressbar = ttk.Progressbar(frame, mode='indeterminate')
        
        self.status_label = Label(frame, text="", bg="white", font=('Segoe UI', 8, 'bold'), wraplength=INPUT_WIDTH, justify="left")
        self.status_label.place(x=25, y=206, width=INPUT_WIDTH)

        # Compact footer link right below button / status
        label = Label(frame, text="Need account or help?", fg='#555555', bg='white', font=('Segoe UI', 8))
        label.place(x=25, y=244)
        self.sign_up = Button(frame, text="Contact support", border=0, bg='white', cursor='hand2', fg='#2263AD', activebackground="white", activeforeground="#1B4F8B", font=('Segoe UI', 8, 'underline'), command=show_contact_support_dialog)
        self.sign_up.place(x=158, y=242)

        # Bind Enter key on main root window for quick login
        root.bind('<Return>', lambda e: self.signin())

    def on_label_click(self, event):
        show_contact_support_dialog()

    def _clear_placeholder(self, widget, placeholder):
        if widget.get() == placeholder:
            widget.delete(0, "end")

    def _restore_placeholder(self, widget, placeholder):
        if widget.get() == "":
            widget.insert(0, placeholder)

    def _clear_pass(self, widget, placeholder):
        if widget.get() == placeholder:
            widget.delete(0, "end")
            widget.config(show="*")

    def _restore_pass(self, widget, placeholder):
        if widget.get() == "":
            widget.insert(0, placeholder)
            widget.config(show="")

    def signin(self):
        if self.is_authenticating:
            return

        username = self.user.get().strip()
        password = self.code.get().strip()

        # Validate required inputs with visual border highlights (Red on error)
        if not username or username == 'Username':
            self.user_line.config(bg='#F04438')
            self.status_label.config(text="✖ Username required.", fg="red")
            messagebox.showwarning("Input Required", "Please enter your username.")
            self.user.focus_set()
            return

        if not password or password == 'Password':
            self.code_line.config(bg='#F04438')
            self.status_label.config(text="✖ Password required.", fg="red")
            messagebox.showwarning("Input Required", "Please enter your password.")
            self.code.focus_set()
            return

        # Set loading UI state with spinner
        self.is_authenticating = True
        self.signin_btn.config(state="disabled", text="Authenticating...")
        self.status_label.config(text="⏳ Verifying credentials, please wait...", fg="#2263AD")
        self.progressbar.place(x=25, y=206, width=270)
        self.progressbar.start(10)

        def reset_ui():
            self.is_authenticating = False
            self.progressbar.stop()
            self.progressbar.place_forget()
            self.signin_btn.config(state="normal", text="Sign in")

        def worker():
            r = download_file()
            
            def handle_result():
                try:
                    if not self.root.winfo_exists():
                        return
                except Exception:
                    return

                if r is None:
                    reset_ui()
                    self.user_line.config(bg='#F04438')
                    self.code_line.config(bg='#F04438')
                    self.status_label.config(text="✖ Connection Error: Unable to reach auth server.", fg="red")
                elif username not in r:
                    reset_ui()
                    self.user_line.config(bg='#F04438')
                    self.status_label.config(text="✖ Login Failed: Username not registered.", fg="red")
                    messagebox.showerror("Login Error", f"Username '{username}' is not registered!\nPlease check your username or contact support.")
                    self.user.focus_set()
                elif password != r[username]:
                    reset_ui()
                    self.code_line.config(bg='#F04438')
                    self.status_label.config(text="✖ Login Failed: Incorrect password.", fg="red")
                    messagebox.showerror("Login Error", f"Incorrect password for user '{username}'!\nPlease check your password and try again.")
                    self.code.focus_set()
                else:
                    self.progressbar.stop()
                    self.progressbar.place_forget()
                    save_remembered_credentials(self.remember_var.get(), username, password)
                    self.status_label.config(text="✔ Login successful! Redirecting...", fg="green")
                    self.root.after(400, self.open_main_window)

            try:
                if self.root.winfo_exists():
                    self.root.after(0, handle_result)
            except Exception:
                pass

        threading.Thread(target=worker, daemon=True).start()

    def open_main_window(self):
        try:
            if self.root.winfo_exists():
                self.root.destroy()
        except Exception:
            pass
        MainApp()

# Fungsi untuk membuat background gradient
def create_gradient_bg(width, height, color_start, color_end):
    img = Image.new("RGB", (width, height), color_start)
    draw = ImageDraw.Draw(img)

    #Gradient dari atas kebawah
    #for y in range(height):
    #    ratio = y / height
    #    r = int(color_start[0] + (color_end[0] - color_start[0]) * ratio)
    #    g = int(color_start[1] + (color_end[1] - color_start[1]) * ratio)
    #    b = int(color_start[2] + (color_end[2] - color_start[2]) * ratio)
    #   draw.line([(0, y), (width, y)], fill=(r, g, b))    

    #return ImageTk.PhotoImage(img)

    #Gradient dari kiri kekanan
    for x in range(width):
        ratio = x / width
        r = int(color_start[0] + (color_end[0] - color_start[0]) * ratio)
        g = int(color_start[1] + (color_end[1] - color_start[1]) * ratio)
        b = int(color_start[2] + (color_end[2] - color_start[2]) * ratio)
        draw.line([(x, 0), (x, height)], fill=(r, g, b))

    return ImageTk.PhotoImage(img)
class MainApp:
    def __init__(self):
        self.app = Tk()
        set_app_icon(self.app)
        self.app.title("Excel ⇄ KML & ISD Toolkit")
        self.app_width = 860
        self.app_height = 540

        # Calculate screen center position
        screen_width = self.app.winfo_screenwidth()
        screen_height = self.app.winfo_screenheight()

        x = (screen_width // 2) - (self.app_width // 2)
        y = (screen_height // 2) - (self.app_height // 2)

        self.app.geometry(f"{self.app_width}x{self.app_height}+{x}+{y}")
        self.app.configure(bg="#f5f7fb")
        self.app.resizable(False, False)

        # Top bar
        top_height = 60
        top_width = self.app_width

        top_canvas = Canvas(self.app, width=top_width, height=top_height, highlightthickness=0)
        top_canvas.pack(fill="x")

        gradient_img = create_gradient_bg(top_width, top_height, (34, 99, 173), (255, 255, 255))
        top_canvas.image = gradient_img
        top_canvas.create_image(0, 0, anchor="nw", image=gradient_img)

        top_canvas.create_text(20, top_height // 2, anchor="w",
            text="Excel ⇄ KML & ISD Toolkit", fill="white", font=("Segoe UI", 15, "bold"))

        try:
            response = requests.get("https://raw.githubusercontent.com/danuar20/image/main/Infra_new.png", timeout=10)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content)).convert("RGBA")
            img = img.resize((150, 45), Image.Resampling.LANCZOS)
            logo_img = ImageTk.PhotoImage(img)
            top_canvas.logo = logo_img
            top_canvas.create_image(top_width - 20, top_height // 2, anchor="e", image=logo_img)
        except Exception as e:
            print("Failed to load top logo:", e)

        # Left nav panel matching dark navy design
        nav = Frame(self.app, bg="#0B1D3A", width=210)
        nav.pack(side="left", fill="y")
        nav.pack_propagate(False)

        # "TOOLS" section title
        tools_lbl = Label(nav, text="TOOLS", fg="#7B8C9E", bg="#0B1D3A", font=("Segoe UI", 8, "bold"))
        tools_lbl.place(x=15, y=12)

        # Bottom bar for version and About/Contact link (matching dark navy theme)
        footer_frame = Frame(nav, bg="#0B1D3A", height=28)
        footer_frame.pack(side="bottom", fill="x")

        ver_lbl = Label(footer_frame, text="v2.0", fg="#7B8C9E", bg="#0B1D3A", font=("Segoe UI", 8))
        ver_lbl.pack(side="left", padx=10, pady=4)

        about_btn = Button(footer_frame, text="About / Contact", fg="#60A5FA", bg="#0B1D3A",
                           font=("Segoe UI", 8, "underline"), borderwidth=0, cursor="hand2",
                           activebackground="#0B1D3A", activeforeground="#93C5FD",
                           command=show_about_dialog)
        about_btn.pack(side="right", padx=10, pady=4)

        # Container for pages
        container = Frame(self.app, bg="#f5f7fb")
        container.pack(side="right", expand=True, fill="both")

        # Pages
        self.pages = {}
        for P in (PageHome, PageExcelToKml, PagePrbKml, PageISD):
            page = P(container, self)
            self.pages[P.__name__] = page
            page.place(relwidth=1, relheight=1)

        # Left Navigation Buttons with Coral Red Active State
        buttons = []
        def set_active(index):
            for i, b in enumerate(buttons):
                if i == index:
                    b.config(bg="#F04438", fg="#FFFFFF", font=("Segoe UI", 9, "bold"))
                else:
                    b.config(bg="#0B1D3A", fg="#E2E8F0", font=("Segoe UI", 9, "bold"))

        self.set_active_menu = set_active

        btn_home = Button(nav, text="⬡  Home", relief="flat", bd=0, anchor="w", padx=12, cursor="hand2", command=lambda: [self.show_page("PageHome"), set_active(0)])
        btn_kml = Button(nav, text="📍  Excel → KML Point", relief="flat", bd=0, anchor="w", padx=12, cursor="hand2", command=lambda: [self.show_page("PageExcelToKml"), set_active(1)])
        btn_prb = Button(nav, text="⟁  Excel → KML PRB", relief="flat", bd=0, anchor="w", padx=12, cursor="hand2", command=lambda: [self.show_page("PagePrbKml"), set_active(2)])
        btn_isd = Button(nav, text="📏  Calculate ISD", relief="flat", bd=0, anchor="w", padx=12, cursor="hand2", command=lambda: [self.show_page("PageISD"), set_active(3)])

        for i, b in enumerate((btn_home, btn_kml, btn_prb, btn_isd)):
            b.place(x=12, y=35 + i*46, width=186, height=36)
            buttons.append(b)

        # Horizontal separator line under menu items
        Frame(nav, height=1, bg="#1E3A5F").place(x=12, y=225, width=186)

        set_active(0)
        self.show_page("PageHome")
        self.app.mainloop()

    def show_page_by_index(self, name, index=0):
        if hasattr(self, 'set_active_menu'):
            self.set_active_menu(index)
        self.show_page(name)

    def show_page(self, name):
        page = self.pages.get(name)
        if page:
            page.lift()

# --------------------
# Pages
# --------------------
class PageHome(Frame):
    def __init__(self, parent, controller):
        Frame.__init__(self, parent, bg="#f5f7fb")
        self.controller = controller

        # Title Header
        Label(self, text="Cellular Network Optimization Suite", bg="#f5f7fb", font=("Segoe UI", 15, "bold"), fg="#1E293B").pack(anchor="w", padx=25, pady=(18, 2))
        Label(self, text="Select a tool below or from the sidebar menu to get started.", bg="#f5f7fb", font=("Segoe UI", 9), fg="#64748B").pack(anchor="w", padx=25, pady=(0, 12))

        # Cards container frame
        cards_frame = Frame(self, bg="#f5f7fb")
        cards_frame.pack(fill="x", padx=18, pady=2)

        # Card 1: Point KML Converter
        card1 = Frame(cards_frame, bg="#FFFFFF", highlightbackground="#CBD5E1", highlightthickness=1)
        card1.grid(row=0, column=0, padx=6, pady=6, sticky="nsew")
        cards_frame.columnconfigure(0, weight=1)

        Label(card1, text="📍  Excel → KML Point", bg="#FFFFFF", fg="#2263AD", font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=12, pady=(12, 4))
        Label(card1, text="Convert site coordinates into Google Earth placemark icons.", bg="#FFFFFF", fg="#64748B", font=("Segoe UI", 8), wraplength=165, justify="left").pack(anchor="w", padx=12, pady=(0, 12))
        Button(card1, text="Launch Tool →", bg="#2263AD", fg="white", activebackground="#1B4F8B", activeforeground="white", bd=0, font=("Segoe UI", 8, "bold"), padx=10, pady=4, cursor="hand2", command=lambda: controller.show_page_by_index("PageExcelToKml", 1)).pack(anchor="w", padx=12, pady=(0, 12))

        # Card 2: PRB KML Generator
        card2 = Frame(cards_frame, bg="#FFFFFF", highlightbackground="#CBD5E1", highlightthickness=1)
        card2.grid(row=0, column=1, padx=6, pady=6, sticky="nsew")
        cards_frame.columnconfigure(1, weight=1)

        Label(card2, text="⟁  Excel → KML PRB", bg="#FFFFFF", fg="#F04438", font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=12, pady=(12, 4))
        Label(card2, text="Build 3D sector polygons color-coded by DL/UL PRB & RRC user metrics.", bg="#FFFFFF", fg="#64748B", font=("Segoe UI", 8), wraplength=165, justify="left").pack(anchor="w", padx=12, pady=(0, 12))
        Button(card2, text="Launch Tool →", bg="#F04438", fg="white", activebackground="#C9302C", activeforeground="white", bd=0, font=("Segoe UI", 8, "bold"), padx=10, pady=4, cursor="hand2", command=lambda: controller.show_page_by_index("PagePrbKml", 2)).pack(anchor="w", padx=12, pady=(0, 12))

        # Card 3: ISD Calculator
        card3 = Frame(cards_frame, bg="#FFFFFF", highlightbackground="#CBD5E1", highlightthickness=1)
        card3.grid(row=0, column=2, padx=6, pady=6, sticky="nsew")
        cards_frame.columnconfigure(2, weight=1)

        Label(card3, text="📏  Calculate ISD", bg="#FFFFFF", fg="#28A745", font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=12, pady=(12, 4))
        Label(card3, text="Compute nearest-neighbor site distances (km) using Haversine algorithm.", bg="#FFFFFF", fg="#64748B", font=("Segoe UI", 8), wraplength=165, justify="left").pack(anchor="w", padx=12, pady=(0, 12))
        Button(card3, text="Launch Tool →", bg="#28A745", fg="white", activebackground="#218838", activeforeground="white", bd=0, font=("Segoe UI", 8, "bold"), padx=10, pady=4, cursor="hand2", command=lambda: controller.show_page_by_index("PageISD", 3)).pack(anchor="w", padx=12, pady=(0, 12))

        # Status Summary Footer Card
        status_card = Frame(self, bg="#FFFFFF", highlightbackground="#CBD5E1", highlightthickness=1)
        status_card.pack(fill="x", padx=24, pady=15)
        Label(status_card, text="ℹ Network Optimization Status", bg="#FFFFFF", fg="#1E293B", font=("Segoe UI", 9, "bold")).pack(anchor="w", padx=12, pady=(8, 2))
        Label(status_card, text="System Online • Ready to parse .xlsx files and export Google Earth KML maps.", bg="#FFFFFF", fg="#64748B", font=("Segoe UI", 8)).pack(anchor="w", padx=12, pady=(0, 8))

class PageExcelToKml(Frame):
    def __init__(self, parent, controller):
        Frame.__init__(self, parent, bg="#f5f7fb")
        self.last_saved_path = None

        # Main Elevated Card Container
        card = Frame(self, bg="#FFFFFF", highlightbackground="#CBD5E1", highlightthickness=1)
        card.pack(fill="both", expand=True, padx=22, pady=18)

        # Header section
        Label(card, text="📍 Excel → KML (Point Converter)", bg="#FFFFFF", font=("Segoe UI", 13, "bold"), fg="#1E293B").pack(anchor="w", padx=18, pady=(14, 2))
        Label(card, text="Select an Excel file (.xlsx) containing site coordinates and convert it into a Placemark KML file.", bg="#FFFFFF", font=("Segoe UI", 8), fg="#64748B").pack(anchor="w", padx=18, pady=(0, 12))

        Frame(card, height=1, bg="#F1F5F9").pack(fill="x", padx=18, pady=(0, 12))

        # Expected headers info box
        info_box = Frame(card, bg="#F8FAFC", highlightbackground="#CBD5E1", highlightthickness=1)
        info_box.pack(fill="x", padx=18, pady=(0, 12))
        Label(info_box, text="💡 Expected Excel Headers:", bg="#F8FAFC", font=("Segoe UI", 8, "bold"), fg="#334155").pack(anchor="w", padx=10, pady=(5, 2))
        Label(info_box, text="Latitude column ('lat' / 'latitude' / 'y') and Longitude column ('lon' / 'long' / 'longitude' / 'x').", bg="#F8FAFC", font=("Segoe UI", 8), fg="#64748B").pack(anchor="w", padx=10, pady=(0, 2))
        Button(info_box, text="📥 Download Sample Template (.xlsx)", bg="#F8FAFC", fg="#2263AD", activebackground="#F8FAFC", activeforeground="#1B4F8B", bd=0, font=("Segoe UI", 8, "bold", "underline"), cursor="hand2", command=lambda: generate_sample_excel_template('point', 'Sample_Point_KML.xlsx')).pack(anchor="w", padx=10, pady=(2, 5))

        # Input Form
        frm = Frame(card, bg="#FFFFFF")
        frm.pack(anchor="w", padx=18, pady=4)

        Label(frm, text="Excel File (.xlsx):", bg="#FFFFFF", font=("Segoe UI", 9, "bold"), fg="#334155").grid(row=0, column=0, sticky="w", pady=2)
        self.excel_path_var = StringVar()
        Entry(frm, textvariable=self.excel_path_var, width=46, font=("Segoe UI", 9)).grid(row=1, column=0, padx=(0, 8))
        Button(frm, text="📁 Browse", font=("Segoe UI", 9), cursor="hand2", command=self.browse_excel).grid(row=1, column=1)

        # Progressbar and percentage progress label
        self.progressbar = ttk.Progressbar(card, mode='determinate', maximum=100)
        self.progress_lbl = Label(card, text="", bg="#FFFFFF", font=("Segoe UI", 8, "bold"), fg="#2263AD")

        # Convert Action Button
        self.convert_btn = Button(card, text="⚡ Convert to KML", bg="#2263AD", fg="white", activebackground="#1B4F8B", activeforeground="white", bd=0, font=("Segoe UI", 9, "bold"), padx=15, pady=6, cursor="hand2", command=self.convert)
        self.convert_btn.pack(anchor="w", padx=18, pady=10)

        # Result Banner Frame
        self.result_frame = Frame(card, bg="#FFFFFF")
        self.result_frame.pack(anchor="w", padx=18, pady=4)

        self.result_label = Label(self.result_frame, text="", bg="#FFFFFF", fg="#16A34A", font=("Segoe UI", 8, "bold"))
        self.result_label.pack(side="left")

        self.open_folder_btn = Button(self.result_frame, text="📂 Open Result Folder", bg="#F1F5F9", fg="#1E293B", activebackground="#E2E8F0", bd=1, font=("Segoe UI", 8, "bold"), padx=8, pady=3, cursor="hand2", command=self.open_result_folder)

    def browse_excel(self):
        p = filedialog.askopenfilename(title="Select Excel File", filetypes=[("Excel Files", "*.xlsx")])
        if p:
            self.excel_path_var.set(p)

    def open_result_folder(self):
        if self.last_saved_path and os.path.exists(os.path.dirname(self.last_saved_path)):
            open_folder(os.path.dirname(self.last_saved_path))

    def convert(self):
        excel_p = self.excel_path_var.get()
        if not excel_p:
            messagebox.showwarning("Warning", "Please select an Excel file first.")
            return
        save_p = filedialog.asksaveasfilename(defaultextension=".kml", filetypes=[("KML files", "*.kml")], title="Save KML File")
        if not save_p:
            return

        self.convert_btn.config(state="disabled")
        self.progressbar.place(x=18, y=182, width=380)
        self.progress_lbl.place(x=18, y=204)
        self.progressbar['value'] = 0
        self.result_label.config(text="")

        def on_progress(pct, msg):
            def _update():
                if self.winfo_exists():
                    self.progressbar['value'] = pct
                    self.progress_lbl.config(text=msg)
            self.after(0, _update)

        def worker():
            try:
                start_time = time.time()
                convert_excel_to_kml_file(excel_p, save_p, progress_callback=on_progress)
                elapsed = time.time() - start_time
                
                def on_success():
                    if not self.winfo_exists(): return
                    self.progressbar.place_forget()
                    self.progress_lbl.place_forget()
                    self.last_saved_path = save_p
                    self.result_label.config(text=f"✔ Saved in {elapsed:.2f}s: {save_p}")
                    self.open_folder_btn.pack(side="left", padx=10)
                    self.convert_btn.config(state="normal")
                self.after(0, on_success)
            except Exception as e:
                def on_error():
                    if not self.winfo_exists(): return
                    self.progressbar.place_forget()
                    self.progress_lbl.place_forget()
                    self.convert_btn.config(state="normal")
                    messagebox.showerror("Error", f"Conversion failed:\n{e}")
                self.after(0, on_error)

        threading.Thread(target=worker, daemon=True).start()

class PagePrbKml(Frame):
    def __init__(self, parent, controller):
        Frame.__init__(self, parent, bg="#f5f7fb")
        self.last_saved_path = None

        card = Frame(self, bg="#FFFFFF", highlightbackground="#CBD5E1", highlightthickness=1)
        card.pack(fill="both", expand=True, padx=22, pady=15)

        Label(card, text="⟁ Excel → KML (PRB Sector Generator)", bg="#FFFFFF", font=("Segoe UI", 13, "bold"), fg="#1E293B").pack(anchor="w", padx=18, pady=(12, 2))
        Label(card, text="Generates 3D sector polygons color-coded by DL/UL PRB utilization and RRC user metrics.", bg="#FFFFFF", font=("Segoe UI", 8), fg="#64748B").pack(anchor="w", padx=18, pady=(0, 8))

        Frame(card, height=1, bg="#F1F5F9").pack(fill="x", padx=18, pady=(0, 8))

        # Visual PRB Color Threshold Legend Bar
        legend_box = Frame(card, bg="#F8FAFC", highlightbackground="#CBD5E1", highlightthickness=1)
        legend_box.pack(fill="x", padx=18, pady=(0, 8))
        
        Label(legend_box, text="🎨 PRB & RRC Load Color Legend:", bg="#F8FAFC", font=("Segoe UI", 8, "bold"), fg="#334155").pack(anchor="w", padx=10, pady=(5, 3))
        
        colors_frame = Frame(legend_box, bg="#F8FAFC")
        colors_frame.pack(anchor="w", padx=10, pady=(0, 3))

        legend_items = [
            ("0% Idle", "#BFBFBF", "black"),
            ("1-35% Low", "#0000FF", "white"),
            ("36-60% Med", "#00FF00", "black"),
            ("61-75% High", "#FFFF00", "black"),
            ("76-90% Heavy", "#FFBF00", "black"),
            (">90% Red", "#FF0000", "white")
        ]
        for label_text, color_hex, text_color in legend_items:
            lbl = Label(colors_frame, text=label_text, bg=color_hex, fg=text_color, font=("Segoe UI", 7, "bold"), padx=5, pady=2)
            lbl.pack(side="left", padx=2)

        Button(legend_box, text="📥 Download Sample PRB Template (.xlsx)", bg="#F8FAFC", fg="#D9534F", activebackground="#F8FAFC", activeforeground="#C9302C", bd=0, font=("Segoe UI", 8, "bold", "underline"), cursor="hand2", command=lambda: generate_sample_excel_template('prb', 'Sample_PRB_KML.xlsx')).pack(anchor="w", padx=10, pady=(2, 6))

        # Form Inputs
        frm = Frame(card, bg="#FFFFFF")
        frm.pack(anchor="w", padx=18, pady=4)

        Label(frm, text="Excel Datasheet (.xlsx):", bg="#FFFFFF", font=("Segoe UI", 9, "bold"), fg="#334155").grid(row=0, column=0, sticky="w", pady=2)
        self.excel_path_var = StringVar()
        Entry(frm, textvariable=self.excel_path_var, width=46, font=("Segoe UI", 9)).grid(row=1, column=0, padx=(0, 8))
        Button(frm, text="📁 Browse", font=("Segoe UI", 9), cursor="hand2", command=self.browse_excel).grid(row=1, column=1)

        # Progressbar and percentage progress label
        self.progressbar = ttk.Progressbar(card, mode='determinate', maximum=100)
        self.progress_lbl = Label(card, text="", bg="#FFFFFF", font=("Segoe UI", 8, "bold"), fg="#D9534F")

        self.convert_btn = Button(card, text="⚡ Convert to PRB KML", bg="#D9534F", fg="white", activebackground="#C9302C", activeforeground="white", bd=0, font=("Segoe UI", 9, "bold"), padx=15, pady=6, cursor="hand2", command=self.convert)
        self.convert_btn.pack(anchor="w", padx=18, pady=8)

        # Result Frame
        self.result_frame = Frame(card, bg="#FFFFFF")
        self.result_frame.pack(anchor="w", padx=18, pady=2)

        self.result_label = Label(self.result_frame, text="", bg="#FFFFFF", fg="#16A34A", font=("Segoe UI", 8, "bold"))
        self.result_label.pack(side="left")

        self.open_folder_btn = Button(self.result_frame, text="📂 Open Result Folder", bg="#F1F5F9", fg="#1E293B", activebackground="#E2E8F0", bd=1, font=("Segoe UI", 8, "bold"), padx=8, pady=3, cursor="hand2", command=self.open_result_folder)

    def browse_excel(self):
        p = filedialog.askopenfilename(title="Select Excel File", filetypes=[("Excel Files", "*.xlsx")])
        if p:
            self.excel_path_var.set(p)

    def open_result_folder(self):
        if self.last_saved_path and os.path.exists(os.path.dirname(self.last_saved_path)):
            open_folder(os.path.dirname(self.last_saved_path))

    def convert(self):
        excel_p = self.excel_path_var.get()
        if not excel_p:
            messagebox.showwarning("Warning", "Please select an Excel file first.")
            return
        save_p = filedialog.asksaveasfilename(defaultextension=".kml", filetypes=[("KML files", "*.kml")], title="Save PRB KML File")
        if not save_p:
            return

        self.convert_btn.config(state="disabled")
        self.progressbar.place(x=18, y=200, width=380)
        self.progress_lbl.place(x=18, y=222)
        self.progressbar['value'] = 0
        self.result_label.config(text="")

        def on_progress(pct, msg):
            def _update():
                if self.winfo_exists():
                    self.progressbar['value'] = pct
                    self.progress_lbl.config(text=msg)
            self.after(0, _update)

        def worker():
            try:
                start_time = time.time()
                convert_excel_to_prb_kml_file(excel_p, save_p, progress_callback=on_progress)
                elapsed_time = time.time() - start_time

                def on_success():
                    if not self.winfo_exists(): return
                    self.progressbar.place_forget()
                    self.progress_lbl.place_forget()
                    self.last_saved_path = save_p
                    self.result_label.config(text=f"✔ PRB KML saved in {elapsed_time:.2f}s: {save_p}")
                    self.open_folder_btn.pack(side="left", padx=10)
                    self.convert_btn.config(state="normal")
                    messagebox.showinfo("Convert Success", f"PRB KML saved successfully as {save_p}\nTime taken: {elapsed_time:.2f} seconds")
                self.after(0, on_success)
            except Exception as e:
                def on_error():
                    if not self.winfo_exists(): return
                    self.progressbar.place_forget()
                    self.progress_lbl.place_forget()
                    self.convert_btn.config(state="normal")
                    messagebox.showerror("Error", f"Failed to create PRB KML:\n{e}")
                self.after(0, on_error)

        threading.Thread(target=worker, daemon=True).start()

class PageISD(Frame):
    def __init__(self, parent, controller):
        Frame.__init__(self, parent, bg="#f5f7fb")
        self.last_saved_path = None

        card = Frame(self, bg="#FFFFFF", highlightbackground="#CBD5E1", highlightthickness=1)
        card.pack(fill="both", expand=True, padx=22, pady=15)

        Label(card, text="📏 Calculate ISD (Inter-Site Distance)", bg="#FFFFFF", font=("Segoe UI", 13, "bold"), fg="#1E293B").pack(anchor="w", padx=18, pady=(12, 2))
        Label(card, text="Compute nearest-neighbor distances (in km) between site lists in File A and File B.", bg="#FFFFFF", font=("Segoe UI", 8), fg="#64748B").pack(anchor="w", padx=18, pady=(0, 8))

        Frame(card, height=1, bg="#F1F5F9").pack(fill="x", padx=18, pady=(0, 8))

        # Sample download bar for ISD
        isd_sample_box = Frame(card, bg="#F8FAFC", highlightbackground="#CBD5E1", highlightthickness=1)
        isd_sample_box.pack(fill="x", padx=18, pady=(0, 8))
        Label(isd_sample_box, text="💡 Sample Templates:", bg="#F8FAFC", font=("Segoe UI", 8, "bold"), fg="#334155").pack(side="left", padx=10, pady=5)
        Button(isd_sample_box, text="📥 File A Template (.xlsx)", bg="#F8FAFC", fg="#28A745", activebackground="#F8FAFC", activeforeground="#218838", bd=0, font=("Segoe UI", 8, "bold", "underline"), cursor="hand2", command=lambda: generate_sample_excel_template('isd_a', 'Sample_ISD_FileA.xlsx')).pack(side="left", padx=5, pady=5)
        Button(isd_sample_box, text="📥 File B Template (.xlsx)", bg="#F8FAFC", fg="#28A745", activebackground="#F8FAFC", activeforeground="#218838", bd=0, font=("Segoe UI", 8, "bold", "underline"), cursor="hand2", command=lambda: generate_sample_excel_template('isd_b', 'Sample_ISD_FileB.xlsx')).pack(side="left", padx=5, pady=5)

        frm = Frame(card, bg="#FFFFFF")
        frm.pack(anchor="w", padx=18, pady=2)

        Label(frm, text="File A (Source Sites):", bg="#FFFFFF", font=("Segoe UI", 8, "bold"), fg="#334155").grid(row=0, column=0, sticky="w", pady=2)
        self.file_a_var = StringVar()
        Entry(frm, textvariable=self.file_a_var, width=46, font=("Segoe UI", 9)).grid(row=0, column=1, padx=(6, 8))
        Button(frm, text="📁 Browse", font=("Segoe UI", 8), cursor="hand2", command=self.browse_a).grid(row=0, column=2)

        Label(frm, text="File B (Target Sites):", bg="#FFFFFF", font=("Segoe UI", 8, "bold"), fg="#334155").grid(row=1, column=0, sticky="w", pady=4)
        self.file_b_var = StringVar()
        Entry(frm, textvariable=self.file_b_var, width=46, font=("Segoe UI", 9)).grid(row=1, column=1, padx=(6, 8), pady=4)
        Button(frm, text="📁 Browse", font=("Segoe UI", 8), cursor="hand2", command=self.browse_b).grid(row=1, column=2, pady=4)

        combo_frame = Frame(card, bg="#FFFFFF")
        combo_frame.pack(anchor="w", padx=18, pady=4)
        Label(combo_frame, text="Number of Nearest Sites:", bg="#FFFFFF", font=("Segoe UI", 8, "bold"), fg="#334155").grid(row=0, column=0, padx=(0, 10))
        self.n_nearest_var = StringVar(value="1")
        combo = ttk.Combobox(combo_frame, textvariable=self.n_nearest_var, values=[str(i) for i in range(1, 6)], state="readonly", width=5)
        combo.grid(row=0, column=1)

        # Progressbar and percentage progress label
        self.progressbar = ttk.Progressbar(card, mode='determinate', maximum=100)
        self.progress_lbl = Label(card, text="", bg="#FFFFFF", font=("Segoe UI", 8, "bold"), fg="#28A745")

        self.calc_btn = Button(card, text="⚡ Calculate ISD", font=("Segoe UI", 9, "bold"), bg="#28A745", fg="white", activebackground="#218838", activeforeground="white", bd=0, padx=15, pady=6, cursor="hand2", command=self.calculate)
        self.calc_btn.pack(anchor="w", padx=18, pady=8)

        # Result Frame
        self.result_frame = Frame(card, bg="#FFFFFF")
        self.result_frame.pack(anchor="w", padx=18, pady=2)

        self.result_label = Label(self.result_frame, text="", bg="#FFFFFF", fg="#16A34A", font=("Segoe UI", 8, "bold"))
        self.result_label.pack(side="left")

        self.open_folder_btn = Button(self.result_frame, text="📂 Open Result Folder", bg="#F1F5F9", fg="#1E293B", activebackground="#E2E8F0", bd=1, font=("Segoe UI", 8, "bold"), padx=8, pady=3, cursor="hand2", command=self.open_result_folder)

    def browse_a(self):
        p = filedialog.askopenfilename(title="Select Excel File A", filetypes=[("Excel Files", "*.xlsx")])
        if p: self.file_a_var.set(p)
    def browse_b(self):
        p = filedialog.askopenfilename(title="Select Excel File B", filetypes=[("Excel Files", "*.xlsx")])
        if p: self.file_b_var.set(p)

    def open_result_folder(self):
        if self.last_saved_path and os.path.exists(os.path.dirname(self.last_saved_path)):
            open_folder(os.path.dirname(self.last_saved_path))

    def calculate(self):
        fa = self.file_a_var.get()
        fb = self.file_b_var.get()
        if not fa or not fb:
            messagebox.showwarning("Warning", "Please select both File A and File B.")
            return
        save_p = filedialog.asksaveasfilename(defaultextension=".xlsx", filetypes=[("Excel files", "*.xlsx")], title="Save ISD Results")
        if not save_p:
            return

        self.calc_btn.config(state="disabled")
        self.progressbar.place(x=18, y=198, width=380)
        self.progress_lbl.place(x=18, y=220)
        self.progressbar['value'] = 0
        self.result_label.config(text="")

        try:
            n_nearest = int(self.n_nearest_var.get())
        except ValueError:
            n_nearest = 1

        def on_progress(pct, msg):
            def _update():
                if self.winfo_exists():
                    self.progressbar['value'] = pct
                    self.progress_lbl.config(text=msg)
            self.after(0, _update)

        def worker():
            try:
                calculate_isd_file(fa, fb, save_p, n_nearest=n_nearest, progress_callback=on_progress)
                
                def on_success():
                    if not self.winfo_exists(): return
                    self.progressbar.place_forget()
                    self.progress_lbl.place_forget()
                    self.last_saved_path = save_p
                    
                    wb = openpyxl.load_workbook(save_p, data_only=True)
                    if "Summary" in wb.sheetnames:
                        s = wb["Summary"]
                        msg_lines = []
                        for row in s.iter_rows(values_only=True):
                            msg_lines.append(f"{row[0]}: {row[1] if len(row)>1 else ''}")
                        msg = "\n".join(msg_lines)
                    else:
                        msg = "Results saved successfully."

                    self.result_label.config(text=f"✔ ISD results saved to: {save_p}")
                    self.open_folder_btn.pack(side="left", padx=10)
                    self.calc_btn.config(state="normal")
                    messagebox.showinfo("ISD Summary", msg)

                self.after(0, on_success)
            except Exception as e:
                def on_error():
                    if not self.winfo_exists(): return
                    self.progressbar.place_forget()
                    self.progress_lbl.place_forget()
                    self.calc_btn.config(state="normal")
                    messagebox.showerror("Error", f"Failed to calculate ISD:\n{e}")
                self.after(0, on_error)

        threading.Thread(target=worker, daemon=True).start()

# --------------------
# Run
# --------------------
if __name__ == "__main__":
    root = Tk()
    App(root)
    root.mainloop()
