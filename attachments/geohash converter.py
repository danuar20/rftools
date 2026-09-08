"""
Geohash Converter — GIS Utility Application  v3.0
===================================================
Features:
  • Login GUI  (credentials fetched from remote URL)
  • Multi-page main GUI  (one page per operation)
  • Gradient blue header  +  top-right logo
  • Active page nav button highlighted in red
  • Page 1 — Geohash  →  Shapefile (.shp)
  • Page 2 — Geohash  →  Lat / Long (.xlsx)
  • Page 3 — Lat / Long  →  Geohash (.xlsx)

Compatible with QGIS | CRS: WGS84 (EPSG:4326)

Requirements:
    pip install pandas pygeohash geopandas shapely pyproj openpyxl requests pillow
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
import logging
import sys
import ctypes
import os
import io
import json
import tempfile
import hashlib
import configparser

# Fix Windows Taskbar Icon link (AppUserModelID)
try:
    if sys.platform == "win32":
        myappid = "telkominfra.geohashconverter.v3"
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
except Exception:
    pass

import requests
from PIL import Image, ImageTk          # pillow
import pandas as pd
import pygeohash
import geopandas as gpd
from shapely.geometry import Polygon
from pyproj import Transformer, CRS

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
CREDENTIALS_URL = "https://raw.githubusercontent.com/danuar20/File/main/datasheet.txt"
LOGO_URL        = "https://raw.githubusercontent.com/danuar20/image/main/Infra_new.png"

# Colour palette (White Theme)
C_BG      = "#f5f5f5"          # light gray background
C_PANEL   = "#ffffff"          # white panel
C_CARD    = "#f9f9f9"          # off-white card
C_ACCENT  = "#2563eb"          # blue accent
C_ACTIVE  = "#ef4444"          # red active page
C_PAGE_BG = "#10294d"          # dark blue page background
C_BLUE1   = "#3b82f6"          # gradient light end
C_BLUE2   = "#2563eb"          # gradient mid
C_BLUE3   = "#1e40af"          # gradient dark end
C_TEXT    = "#1f2937"          # dark text
C_TEXT_LIGHT = "#e2e8f0"       # light text for dark background
C_MUTED   = "#6b7280"          # gray text
C_OK      = "#10b981"          # green
C_ERR     = "#ef4444"          # red
C_WARN    = "#f59e0b"          # amber
C_BORDER  = "#e5e7eb"          # light border 

FONT_TITLE  = ("Segoe UI", 11, "bold")
FONT_LABEL  = ("Segoe UI", 9)
FONT_SMALL  = ("Segoe UI", 8)
FONT_BTN    = ("Segoe UI", 10, "bold")
FONT_NAV    = ("Segoe UI", 9, "bold")
FONT_INPUT  = ("Segoe UI", 10)


# Config file path (same folder as the script)
_SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
_CONFIG_FILE  = os.path.join(_SCRIPT_DIR, ".geohash_config.ini")
_LOGO_CACHE   = os.path.join(tempfile.gettempdir(), "geohash_logo_cache.png")


def apply_window_icon(win):
    """Sets the custom window icon on Tk or Toplevel windows."""
    possible_paths = [
        os.path.join(_SCRIPT_DIR, "geohash_converter.ico"),
        os.path.join(os.path.dirname(_SCRIPT_DIR), "geohash_converter.ico"),
        os.path.join(_SCRIPT_DIR, "Google_Earth.ico"),
        os.path.join(os.path.dirname(_SCRIPT_DIR), "Google_Earth.ico"),
    ]
    for icon_path in possible_paths:
        if os.path.isfile(icon_path):
            try:
                win.iconbitmap(icon_path)
                return
            except Exception as exc:
                log.warning(f"Failed to set iconbitmap '{icon_path}': {exc}")

# ===========================================================================
# CONFIG / CREDENTIAL HELPERS
# ===========================================================================

def fetch_credentials(url: str, timeout: int = 8) -> dict:
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    data = json.loads(resp.text.strip())
    if not isinstance(data, dict):
        raise ValueError("Credential file must be a JSON object.")
    return data


def _obf(s: str) -> str:
    """Trivial reversible obfuscation (not cryptographic)."""
    return hashlib.md5(s.encode()).hexdigest()[:4] + \
           "".join(chr(ord(c) ^ 0x5A) for c in s)


def _deobf(s: str) -> str:
    return "".join(chr(ord(c) ^ 0x5A) for c in s[4:])


def save_login_config(username: str, password: str):
    cfg = configparser.ConfigParser()
    cfg["login"] = {"username": username, "password": _obf(password)}
    with open(_CONFIG_FILE, "w") as f:
        cfg.write(f)


def load_login_config() -> tuple[str, str]:
    """Returns (username, password) or ('', '') if not saved."""
    cfg = configparser.ConfigParser()
    if not os.path.isfile(_CONFIG_FILE):
        return "", ""
    cfg.read(_CONFIG_FILE)
    u = cfg.get("login", "username", fallback="")
    p_enc = cfg.get("login", "password", fallback="")
    return u, (_deobf(p_enc) if p_enc else "")


def clear_login_config():
    if os.path.isfile(_CONFIG_FILE):
        os.remove(_CONFIG_FILE)


# ===========================================================================
# TOOLTIP WIDGET
# ===========================================================================

class Tooltip:
    """Shows a small popup label when hovering over a widget."""

    def __init__(self, widget, text: str):
        self._w    = widget
        self._text = text
        self._tip  = None
        widget.bind("<Enter>", self._show)
        widget.bind("<Leave>", self._hide)

    def _show(self, _event=None):
        x = self._w.winfo_rootx() + 20
        y = self._w.winfo_rooty() + self._w.winfo_height() + 4
        self._tip = tw = tk.Toplevel(self._w)
        tw.wm_overrideredirect(True)
        tw.wm_geometry(f"+{x}+{y}")
        tk.Label(tw, text=self._text, justify="left",
                 bg="#2a2a4a", fg=C_TEXT, relief="flat",
                 font=("Segoe UI", 8), padx=8, pady=4,
                 wraplength=260).pack()

    def _hide(self, _event=None):
        if self._tip:
            self._tip.destroy()
            self._tip = None


# ===========================================================================
# GIS PROCESSING FUNCTIONS
# ===========================================================================

def load_excel(file_path: str) -> pd.DataFrame:
    try:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".csv":
            try:
                df = pd.read_csv(file_path)
            except UnicodeDecodeError:
                df = pd.read_csv(file_path, encoding="latin1")
            except Exception:
                df = pd.read_csv(file_path, sep=None, engine="python")
        else:
            df = pd.read_excel(file_path, engine="openpyxl")

        # Ensure clean unique string column names
        cols = [str(c).strip() for c in df.columns]
        seen = {}
        unique_cols = []
        for c in cols:
            if c not in seen:
                seen[c] = 1
                unique_cols.append(c)
            else:
                seen[c] += 1
                unique_cols.append(f"{c}_{seen[c]-1}")
        df.columns = unique_cols
        log.info(f"Loaded {len(df)} rows from '{file_path}'")
        return df
    except Exception as exc:
        raise ValueError(f"Failed to read file: {exc}") from exc

load_data_file = load_excel


def get_string_columns(df):
    return [str(c) for c in df.columns if df[c].dtype == object or pd.api.types.is_string_dtype(df[c])]


def get_numeric_columns(df):
    return [str(c) for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]


def geohash_to_bbox_polygon(val: str):
    try:
        lat, lon, lat_e, lon_e = pygeohash.decode_exactly(str(val).strip())
        return Polygon([
            (lon - lon_e, lat - lat_e), (lon + lon_e, lat - lat_e),
            (lon + lon_e, lat + lat_e), (lon - lon_e, lat + lat_e),
            (lon - lon_e, lat - lat_e),
        ])
    except Exception as exc:
        log.warning(f"bbox failed '{val}': {exc}")
        return None


def geohash_to_custom_square(val: str, size_m: float):
    try:
        lat, lon = pygeohash.decode(str(val).strip())
        half = size_m / 2.0
        utm = CRS.from_dict({"proj": "utm",
                              "zone": int((lon + 180) / 6) + 1,
                              "south": lat < 0, "datum": "WGS84", "units": "m"})
        t_fwd = Transformer.from_crs("EPSG:4326", utm, always_xy=True)
        t_inv = Transformer.from_crs(utm, "EPSG:4326", always_xy=True)
        cx, cy = t_fwd.transform(lon, lat)
        pts = [(cx-half, cy-half), (cx+half, cy-half),
               (cx+half, cy+half), (cx-half, cy+half), (cx-half, cy-half)]
        return Polygon([t_inv.transform(x, y) for x, y in pts])
    except Exception as exc:
        log.warning(f"custom square failed '{val}': {exc}")
        return None


def geohash_to_latlon(val: str):
    try:
        lat, lon = pygeohash.decode(str(val).strip())
        return float(lat), float(lon)
    except Exception:
        return None, None


def latlon_to_geohash(lat, lon, precision: int = 9) -> str:
    try:
        return pygeohash.encode(float(lat), float(lon), precision=precision)
    except Exception:
        return ""


def create_geodataframe(df, geoms):
    return gpd.GeoDataFrame(df.copy(), geometry=geoms, crs="EPSG:4326")


def make_unique_dbf_columns(cols):
    """
    Truncates column names to max 10 characters (ESRI Shapefile DBF limit)
    and ensures all field names are strictly unique.
    """
    seen = {}
    new_cols = []
    for c in cols:
        name = str(c).strip()
        if name == "geometry":
            new_cols.append("geometry")
            continue
        
        base = name[:10] if name else "field"
        if base not in seen:
            seen[base] = 1
            new_name = base
        else:
            seen[base] += 1
            count = seen[base]
            suffix = f"_{count}"
            trimmed_base = base[:max(1, 10 - len(suffix))]
            new_name = f"{trimmed_base}{suffix}"
            while new_name in new_cols:
                count += 1
                seen[base] = count
                suffix = f"_{count}"
                trimmed_base = base[:max(1, 10 - len(suffix))]
                new_name = f"{trimmed_base}{suffix}"
        new_cols.append(new_name)
    return new_cols


def save_shapefile(gdf, path):
    gdf_copy = gdf.copy()
    gdf_copy.columns = make_unique_dbf_columns(gdf_copy.columns)
    gdf_copy.to_file(path, driver="ESRI Shapefile")


def save_excel(df, path):
    ext = os.path.splitext(path)[1].lower()
    if ext == ".csv":
        df.to_csv(path, index=False)
    else:
        df.to_excel(path, index=False, engine="openpyxl")


# ===========================================================================
# SHARED WIDGETS
# ===========================================================================

def make_entry(parent, var, width=40):
    """Styled single-line Entry."""
    e = tk.Entry(parent, textvariable=var, width=width,
                 bg=C_CARD, fg=C_TEXT, insertbackground=C_TEXT,
                 relief="flat", font=FONT_INPUT, bd=0,
                 highlightthickness=1, highlightbackground="#d1d5db",
                 highlightcolor=C_ACCENT)
    return e


def make_combobox(parent, var, values=(), width=26):
    cb = ttk.Combobox(parent, textvariable=var, values=values,
                      state="readonly", width=width, font=FONT_INPUT)
    return cb


def make_label(parent, text, fg=C_MUTED, font=FONT_LABEL, **kw):
    return tk.Label(parent, text=text, bg="#ffffff", fg=fg,
                    font=font, **kw)


def make_button(parent, text, command, bg=C_BLUE2, fg="white",
                padx=10, pady=4, font=("Segoe UI", 9, "bold"), cursor="hand2"):
    return tk.Button(parent, text=text, command=command,
                     bg=bg, fg=fg, relief="flat",
                     font=font, cursor=cursor, padx=padx, pady=pady,
                     activebackground=C_BLUE3, activeforeground="white")


def section_label(parent, text):
    tk.Label(parent, text=text, bg="#ffffff", fg=C_ACCENT,
             font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(8, 2))


def show_contact_dialog(parent, title, text, icon_text="📞"):
    dlg = tk.Toplevel(parent)
    dlg.title(title)
    dlg.transient(parent)
    dlg.grab_set()
    dlg.configure(bg=C_BG)
    dlg.resizable(False, False)
    x = parent.winfo_rootx() + 80
    y = parent.winfo_rooty() + 80
    dlg.geometry(f"+{x}+{y}")

    frame = tk.Frame(dlg, bg=C_BG, padx=16, pady=16)
    frame.pack(fill="both", expand=True)

    header = tk.Frame(frame, bg=C_BG)
    header.pack(fill="x")
#    tk.Label(header, text=icon_text, bg=C_BG,
#             font=("Segoe UI", 18)).pack(side="left")
#    tk.Label(header, text=title, bg=C_BG, fg=C_TEXT,
#             font=("Segoe UI", 11, "bold")).pack(side="left", padx=(8, 0))

    tk.Label(frame, text=text, bg=C_BG, fg=C_TEXT,
             font=FONT_LABEL, justify="left", wraplength=360).pack(fill="x", pady=(12, 0))

    close_btn = make_button(frame, "Close", dlg.destroy,
                             bg=C_BLUE2, padx=12, pady=6,
                             font=("Segoe UI", 9, "bold"))
    close_btn.pack(pady=(14, 0))

    parent.wait_window(dlg)


# ===========================================================================
# GRADIENT HEADER CANVAS
# ===========================================================================

class GradientHeader(tk.Canvas):
    """
    Draws a left-to-right gradient banner (BLUE1→BLUE2→BLUE3),
    a title text on the left, and a logo image on the right.
    """
    H = 80   # header height in pixels

    def __init__(self, parent, title: str = "", logo_url: str = "", **kw):
        super().__init__(parent, height=self.H, bd=0,
                         highlightthickness=0, **kw)
        self._title     = title
        self._logo_url  = logo_url
        self._logo_img  = None          # keeps PhotoImage reference alive
        self.bind("<Configure>", self._redraw)
        self._load_logo_async()

    # ── gradient drawing ────────────────────────────────────────────────

    def _redraw(self, event=None):
        self.delete("all")
        w = self.winfo_width() or 600
        h = self.H
        steps = w
        # Build gradient: left blue to right white
        start = (0x25, 0x63, 0xeb)
        end   = (0xff, 0xff, 0xff)
        for i in range(steps):
            t = i / max(steps - 1, 1)
            r = int(start[0] + (end[0] - start[0]) * t)
            g = int(start[1] + (end[1] - start[1]) * t)
            b = int(start[2] + (end[2] - start[2]) * t)
            self.create_line(i, 0, i, h, fill=f"#{r:02x}{g:02x}{b:02x}")

        # Subtitle bar at bottom
        self.create_rectangle(0, h - 22, w, h, fill="#e0e7ff", outline="")
        self.create_text(12, h - 11, anchor="w",
                         text="GIS Utility for QGIS  |  WGS84 EPSG:4326",
                         fill="#1e40af", font=("Segoe UI", 8))

        # App title
        self.create_text(16, (h - 22) // 2, anchor="w",
                         text=self._title,
                         fill="white", font=("Segoe UI", 14, "bold"))

        # Logo (if loaded)
        if self._logo_img:
            self.create_image(w - 12, 12, anchor="ne", image=self._logo_img)

    # ── async logo fetch ────────────────────────────────────────────────

    def _load_logo_async(self):
        threading.Thread(target=self._fetch_logo, daemon=True).start()

    def _fetch_logo(self):
        try:
            resp = requests.get(self._logo_url, timeout=8)
            resp.raise_for_status()
            img  = Image.open(io.BytesIO(resp.content)).convert("RGBA")
            # Maintain aspect ratio while fitting inside header
            max_h = self.H - 28
            max_w = 120
            img.thumbnail((max_w, max_h), Image.LANCZOS)
            self.after(0, self._set_logo, img)
        except Exception as exc:
            log.warning(f"Logo load failed: {exc}")

    def _set_logo(self, img):
        self._logo_img = ImageTk.PhotoImage(img)
        self._redraw()


# ===========================================================================
# REUSABLE STATUS BAR
# ===========================================================================

class StatusBar(tk.Frame):
    def __init__(self, parent, **kw):
        super().__init__(parent, bg=C_BG, **kw)
        self._dot = tk.Label(self, text="●", bg=C_BG,
                             fg=C_MUTED, font=("Segoe UI", 11))
        self._dot.pack(side="left", padx=(4, 4))
        self._var = tk.StringVar(value="Ready")
        self._lbl = tk.Label(self, textvariable=self._var,
                             bg=C_BG, fg=C_MUTED, font=FONT_LABEL,
                             anchor="w", justify="left")
        self._lbl.pack(side="left", fill="x", expand=True)
        self._bar = ttk.Progressbar(self, mode="indeterminate", length=120)
        self._bar.pack(side="right", padx=6)

    def set(self, msg: str, level: str = "info"):
        colors = {"info": C_MUTED, "success": C_OK,
                  "error": C_ERR, "working": C_WARN}
        c = colors.get(level, C_MUTED)
        if len(msg) > 50:
            msg = msg[:47] + "..."
        self._var.set(msg)
        self._lbl.configure(fg=c)
        self._dot.configure(fg=c)

    def start(self):
        self._bar.start(10)

    def stop(self):
        self._bar.stop()


# ===========================================================================
# BASE PAGE
# ===========================================================================

class BasePage(tk.Frame):
    """
    Every page inherits from this.  Provides helpers for building
    consistent file-picker rows, column dropdowns, and run/status areas.
    """
    PAGE_TITLE = "Page"
    PAGE_ICON  = "◆"

    def __init__(self, parent, **kw):
        super().__init__(parent, bg=C_PANEL, **kw)
        self._df: pd.DataFrame | None = None
        self._build_page()

    # ── must override ────────────────────────────────────────────────────
    def _build_content(self, body: tk.Frame):
        """Subclasses place their widgets inside *body*."""
        raise NotImplementedError

    def _do_process(self):
        """Subclasses implement the actual data transformation here."""
        raise NotImplementedError

    # ── common page scaffold ─────────────────────────────────────────────
    def _build_page(self):
        # Page heading
        hdr = tk.Frame(self, bg=C_PANEL, pady=0)
        hdr.pack(fill="x")
        tk.Label(hdr, text=f"  {self.PAGE_ICON}  {self.PAGE_TITLE}",
                 bg=C_PANEL, fg=C_TEXT,
                 font=("Segoe UI", 11, "bold"),
                 pady=8).pack(side="left")

        # Body area
        body = tk.Frame(self, bg=C_PANEL, padx=12, pady=10)
        body.pack(fill="both", expand=True)

        # ── Input file row ─────────────────────────────────────
        section_label(body, "Input File (.xlsx / .csv)")
        in_row = tk.Frame(body, bg=C_PANEL)
        in_row.pack(fill="x", pady=(0, 4))
        self.in_var = tk.StringVar()
        make_entry(in_row, self.in_var, width=46).pack(side="left",
                                                       padx=(0, 6), ipady=5)
        make_button(in_row, "Browse…", self._browse_input,
                    bg=C_BLUE2).pack(side="left")

        # Record count
        self.rec_lbl = tk.Label(body, text="", bg=C_PANEL,
                                fg=C_MUTED, font=FONT_SMALL)
        self.rec_lbl.pack(anchor="w")

        # ── Page-specific widgets ───────────────────────────────
        self._build_content(body)

        # ── Output file row ────────────────────────────────────
        section_label(body, "Output File")
        out_row = tk.Frame(body, bg=C_PANEL)
        out_row.pack(fill="x", pady=(0, 6))
        self.out_var = tk.StringVar()
        make_entry(out_row, self.out_var, width=46).pack(side="left",
                                                         padx=(0, 6), ipady=5)
        make_button(out_row, "Browse…", self._browse_output,
                    bg=C_BLUE2).pack(side="left")

        # ── Status bar + Run button ────────────────────────────
        bottom = tk.Frame(self, bg=C_CARD)
        bottom.pack(fill="x", side="bottom")

        # Pack Run button FIRST on the right so it never gets displaced or cut off
        self.run_btn = make_button(bottom, "▶  Run / Process",
                                   self._start, bg=C_ACCENT, pady=5,
                                   font=("Segoe UI", 10, "bold"))
        self.run_btn.pack(side="right", padx=12, pady=4)

        self.status = StatusBar(bottom)
        self.status.pack(fill="x", side="left", expand=True, padx=6, pady=4)

    # ── File dialogs ─────────────────────────────────────────────────────
    def _browse_input(self):
        path = filedialog.askopenfilename(
            title="Select input data file",
            filetypes=[
                ("Supported Data Files", "*.xlsx;*.xls;*.csv"),
                ("Excel files", "*.xlsx;*.xls"),
                ("CSV files", "*.csv"),
                ("All files", "*.*")
            ])
        if path:
            self.in_var.set(path)
            self._load_file(path)
            if not self.out_var.get():
                ext, _ = self._output_spec()
                base_no_ext, _ = os.path.splitext(path)
                self.out_var.set(f"{base_no_ext}_converted{ext}")

    def _browse_output(self):
        ext, ft = self._output_spec()
        path = filedialog.asksaveasfilename(
            title="Save output as", filetypes=ft, defaultextension=ext)
        if path:
            self.out_var.set(path)

    def _output_spec(self):
        """Override to change output file type. Returns (ext, filetypes)."""
        return ".xlsx", [("Excel files", "*.xlsx"), ("CSV files", "*.csv"), ("All files", "*.*")]

    # ── File loading ──────────────────────────────────────────────────────
    def _load_file(self, path: str):
        try:
            self._df = load_excel(path)
            all_cols = [str(c) for c in self._df.columns]
            str_cols = get_string_columns(self._df)
            num_cols = get_numeric_columns(self._df)
            self.rec_lbl.configure(
                text=(f"  {len(self._df)} rows  |  "
                      f"{len(all_cols)} column(s)"),
                fg=C_OK)
            self._on_file_loaded(all_cols, str_cols, num_cols)
            self.status.set(f"Loaded {len(self._df)} rows.", "info")
            if not self.out_var.get():
                ext, _ = self._output_spec()
                base_no_ext, _ = os.path.splitext(path)
                self.out_var.set(f"{base_no_ext}_converted{ext}")
        except ValueError as exc:
            self._df = None
            messagebox.showerror("Load Error", str(exc))
            self.status.set("Error loading file.", "error")

    def _on_file_loaded(self, all_cols: list, str_cols: list, num_cols: list):
        """Override to refresh dropdowns after a file is loaded."""

    # ── Run ───────────────────────────────────────────────────────────────
    def _validate(self) -> str:
        """Return an error string or '' if valid. Override per page."""
        if not self.in_var.get():
            return "Please select an input file."
        if not self.in_var.get().lower().endswith((".xlsx", ".xls", ".csv")):
            return "Input must be an .xlsx, .xls, or .csv file."
        if not os.path.isfile(self.in_var.get()):
            return "Input file does not exist."
        if not self.out_var.get():
            return "Please select an output file."
        return ""

    def _start(self):
        err = self._validate()
        if err:
            messagebox.showwarning("Validation", err)
            self.status.set(err, "error")
            return
        if self._df is None:
            try:
                self._df = load_excel(self.in_var.get())
            except ValueError as exc:
                messagebox.showerror("Load Error", str(exc))
                return
        self.run_btn.configure(state="disabled")
        self.status.start()
        self.status.set("Processing…", "working")
        threading.Thread(target=self._worker, daemon=True).start()

    def _worker(self):
        try:
            self._do_process()
            self.after(0, self._on_done, True, "")
        except Exception as exc:
            log.exception("Processing error")
            self.after(0, self._on_done, False, str(exc))

    def _on_done(self, ok: bool, msg: str):
        self.status.stop()
        self.run_btn.configure(state="normal")
        if ok:
            out_file = self.out_var.get()
            fname = os.path.basename(out_file)
            self.status.set(f"Done!  Saved: {fname}", "success")
            res = messagebox.askyesno(
                "Success",
                f"Processing complete!\n\nSaved to:\n{out_file}\n\nDo you want to open the output folder?"
            )
            if res:
                out_dir = os.path.dirname(os.path.abspath(out_file))
                if os.path.exists(out_dir):
                    os.startfile(out_dir)
        else:
            self.status.set(f"Error: {msg}", "error")
            messagebox.showerror("Error", msg)


# ===========================================================================
# PAGE 1 — Geohash → Shapefile
# ===========================================================================

class PageGeohashToShp(BasePage):
    PAGE_TITLE = "Geohash  →  Shapefile (.shp)"
    PAGE_ICON  = "⬡"

    def _output_spec(self):
        return ".shp", [("Shapefile", "*.shp")]

    def _build_content(self, body):
        # Geohash column
        section_label(body, "Geohash Column")
        row = tk.Frame(body, bg=C_PANEL)
        row.pack(fill="x", pady=(0, 6))
        make_label(row, "Select column:", width=16, anchor="w").pack(side="left")
        self.gh_var = tk.StringVar()
        self.gh_cb  = make_combobox(row, self.gh_var, width=30)
        self.gh_cb.pack(side="left")

        # Mode
        section_label(body, "Conversion Mode")
        self.mode_var = tk.StringVar(value="default")
        modes = [("Default Mode  —  Geohash bounding box",  "default"),
                 ("Custom Mode   —  Square polygon (meters)", "custom")]
        for lbl, val in modes:
            tk.Radiobutton(body, text=lbl, variable=self.mode_var, value=val,
                           command=self._toggle_size,
                           bg=C_PANEL, fg=C_TEXT, selectcolor=C_CARD,
                           activebackground=C_PANEL, activeforeground=C_BLUE3,
                           font=FONT_LABEL).pack(anchor="w", pady=1)

        size_row = tk.Frame(body, bg=C_PANEL)
        size_row.pack(fill="x", pady=(4, 2))
        make_label(size_row, "Square size (m):", width=16, anchor="w").pack(side="left")
        self.size_var = tk.StringVar(value="500")
        self.size_ent = tk.Entry(size_row, textvariable=self.size_var, width=10,
                                 bg=C_CARD, fg=C_TEXT, insertbackground=C_TEXT,
                                 relief="flat", font=FONT_INPUT,
                                 highlightthickness=1,
                                 highlightbackground=C_BORDER,
                                 highlightcolor=C_BLUE3, state="disabled")
        self.size_ent.pack(side="left")
        tk.Label(size_row, text=" m", bg=C_PANEL, fg=C_MUTED,
                 font=FONT_SMALL).pack(side="left")

    def _toggle_size(self):
        s = "normal" if self.mode_var.get() == "custom" else "disabled"
        self.size_ent.configure(state=s)

    def _on_file_loaded(self, all_cols, str_cols, num_cols):
        self.gh_cb["values"] = all_cols
        if all_cols:
            auto = next((c for c in all_cols if any(k in c.lower() for k in ["geohash", "grid", "hash", "id"])), all_cols[0])
            self.gh_var.set(auto)

    def _validate(self):
        err = super()._validate()
        if err:
            return err
        if not self.gh_var.get():
            return "Please select the Geohash column."
        if self.mode_var.get() == "custom":
            try:
                v = float(self.size_var.get())
                if v <= 0:
                    return "Square size must be > 0."
            except ValueError:
                return "Square size must be a valid number."
        return ""

    def _do_process(self):
        col  = self.gh_var.get()
        mode = self.mode_var.get()
        size = float(self.size_var.get()) if mode == "custom" else None
        df   = self._df.copy()

        geoms = [(geohash_to_bbox_polygon(v) if mode == "default"
                  else geohash_to_custom_square(v, size))
                 for v in df[col]]

        if col != "geohash" and "geohash" in df.columns:
            df = df.drop(columns=["geohash"])

        attr = df.rename(columns={col: "geohash"})
        gdf  = create_geodataframe(attr, geoms)
        valid = gdf[gdf.geometry.notna()].copy()
        log.info(f"SHP: {len(valid)}/{len(gdf)} features.")
        save_shapefile(valid, self.out_var.get())


# ===========================================================================
# PAGE 2 — Geohash → LatLong
# ===========================================================================

class PageGeohashToLatLon(BasePage):
    PAGE_TITLE = "Geohash  →  Lat / Long (.xlsx / .csv)"
    PAGE_ICON  = "📍"

    def _build_content(self, body):
        section_label(body, "Geohash Column")
        row = tk.Frame(body, bg=C_PANEL)
        row.pack(fill="x", pady=(0, 6))
        make_label(row, "Select column:", width=16, anchor="w").pack(side="left")
        self.gh_var = tk.StringVar()
        self.gh_cb  = make_combobox(row, self.gh_var, width=30)
        self.gh_cb.pack(side="left")

        # Info box
        info = tk.Frame(body, bg=C_CARD, padx=12, pady=8)
        info.pack(fill="x", pady=(8, 0))
        tk.Label(info, text="Output columns added:  latitude,  longitude",
                 bg=C_CARD, fg=C_BLUE3, font=FONT_LABEL).pack(anchor="w")
        tk.Label(info, text="Values derived from Geohash centroid  (WGS84)",
                 bg=C_CARD, fg=C_MUTED, font=FONT_SMALL).pack(anchor="w")

    def _on_file_loaded(self, all_cols, str_cols, num_cols):
        self.gh_cb["values"] = all_cols
        if all_cols:
            auto = next((c for c in all_cols if any(k in c.lower() for k in ["geohash", "grid", "hash", "id"])), all_cols[0])
            self.gh_var.set(auto)

    def _validate(self):
        err = super()._validate()
        return err or ("" if self.gh_var.get() else "Please select the Geohash column.")

    def _do_process(self):
        col = self.gh_var.get()
        df  = self._df.copy()
        for c in ["latitude", "longitude"]:
            if c in df.columns and c != col:
                df = df.drop(columns=[c])
        lats, lons = zip(*[geohash_to_latlon(v) for v in df[col]])
        df["latitude"]  = list(lats)
        df["longitude"] = list(lons)
        save_excel(df, self.out_var.get())


# ===========================================================================
# PAGE 3 — LatLong → Geohash
# ===========================================================================

class PageLatLonToGeohash(BasePage):
    PAGE_TITLE = "Lat / Long  →  Geohash (.xlsx / .csv)"
    PAGE_ICON  = "🔷"

    def _build_content(self, body):
        section_label(body, "Coordinate Columns")

        for attr, lbl_text in [("lat_var", "Latitude column:"),
                                ("lon_var", "Longitude column:")]:
            row = tk.Frame(body, bg=C_PANEL)
            row.pack(fill="x", pady=2)
            make_label(row, lbl_text, width=18, anchor="w").pack(side="left")
            var = tk.StringVar()
            setattr(self, attr, var)
            cb = make_combobox(row, var, width=28)
            cb_attr = attr.replace("_var", "_cb")
            setattr(self, cb_attr, cb)
            cb.pack(side="left")

        # Precision
        prec_row = tk.Frame(body, bg=C_PANEL)
        prec_row.pack(fill="x", pady=(8, 2))
        make_label(prec_row, "Geohash precision:", width=18, anchor="w").pack(side="left")
        self.prec_var = tk.StringVar(value="7")
        tk.Entry(prec_row, textvariable=self.prec_var, width=6,
                 bg=C_CARD, fg=C_TEXT, insertbackground=C_TEXT,
                 relief="flat", font=FONT_INPUT,
                 highlightthickness=1, highlightbackground=C_BORDER,
                 highlightcolor=C_BLUE3).pack(side="left")
        tk.Label(prec_row, text="  (1 – 12,  default 7)",
                 bg=C_PANEL, fg=C_MUTED, font=FONT_SMALL).pack(side="left")

        # Info box
        info = tk.Frame(body, bg=C_CARD, padx=12, pady=8)
        info.pack(fill="x", pady=(10, 0))
        tk.Label(info, text="Output column added:  geohash",
                 bg=C_CARD, fg=C_ACCENT, font=FONT_LABEL).pack(anchor="w")
        tk.Label(info, text="Higher precision = smaller, more specific cell",
                 bg=C_CARD, fg=C_MUTED, font=FONT_SMALL).pack(anchor="w")

    def _on_file_loaded(self, all_cols, str_cols, num_cols):
        self.lat_cb["values"] = all_cols
        self.lon_cb["values"] = all_cols
        lat_a = next((c for c in all_cols if "lat" in c.lower()), "")
        lon_a = next((c for c in all_cols if any(k in c.lower() for k in ["lon", "lng", "long"])), "")
        self.lat_var.set(lat_a if lat_a else (all_cols[0] if all_cols else ""))
        self.lon_var.set(lon_a if lon_a else (all_cols[1] if len(all_cols) > 1 else ""))

    def _validate(self):
        err = super()._validate()
        if err:
            return err
        if not self.lat_var.get():
            return "Please select the Latitude column."
        if not self.lon_var.get():
            return "Please select the Longitude column."
        if self.lat_var.get() == self.lon_var.get():
            return "Latitude and Longitude columns must be different."
        try:
            p = int(self.prec_var.get())
            if not (1 <= p <= 12):
                return "Precision must be 1 – 12."
        except ValueError:
            return "Precision must be an integer."
        return ""

    def _do_process(self):
        prec = int(self.prec_var.get())
        df   = self._df.copy()
        df["geohash"] = [latlon_to_geohash(lat, lon, prec)
                         for lat, lon in zip(df[self.lat_var.get()],
                                             df[self.lon_var.get()])]
        save_excel(df, self.out_var.get())


# ===========================================================================
# NAV BUTTON
# ===========================================================================

class NavButton(tk.Button):
    """Sidebar navigation button with active/inactive states."""

    W_INACTIVE = C_PAGE_BG
    W_ACTIVE   = C_ACTIVE          # red highlight when active
    FG_ACTIVE  = "white"
    FG_INACT   = C_TEXT_LIGHT

    def __init__(self, parent, text, icon, command, **kw):
        self._icon = icon
        self._text = text
        super().__init__(parent,
                         text=f"  {icon}  {text}",
                         command=command,
                         bg=self.W_INACTIVE, fg=self.FG_INACT,
                         relief="flat", anchor="w",
                         font=FONT_NAV, cursor="hand2",
                         padx=10, pady=12,
                         activebackground=C_ACTIVE,
                         activeforeground="white",
                         **kw)

    def set_active(self, active: bool):
        if active:
            self.configure(bg=self.W_ACTIVE, fg=self.FG_ACTIVE)
        else:
            self.configure(bg=self.W_INACTIVE, fg=self.FG_INACT)


# ===========================================================================
# MAIN APPLICATION WINDOW
# ===========================================================================

class GeohashApp(tk.Toplevel):
    """
    Multi-page main window.
    Layout:
        ┌──────────────────────────────────────────┐
        │  GradientHeader  (logo top-right)         │
        ├────────┬─────────────────────────────────┤
        │  Nav   │  Page content                    │
        │ (left) │                                  │
        └────────┴─────────────────────────────────┘
    """

    PAGES = [
        ("Geohash → Shapefile",  "⬡",  PageGeohashToShp),
        ("Geohash → Coordinates",   "📍", PageGeohashToLatLon),
        ("Coordinates → Geohash",   "🔷", PageLatLonToGeohash),
    ]

    def __init__(self, login_win):
        super().__init__()
        self.withdraw()  # Hide during setup to prevent top-left glitch
        self.login_win = login_win
        self.title("Geohash Converter — GIS Utility")
        apply_window_icon(self)
        self.configure(bg=C_BG)
        self.resizable(True, True)
        self.protocol("WM_DELETE_WINDOW", self._on_close)

        self._nav_btns: list[NavButton] = []
        self._pages: list[BasePage]     = []
        self._active_idx: int           = -1

        self._build_ui()
        self._switch(0)

        w, h = 800, 660
        x = (self.winfo_screenwidth()  - w) // 2
        y = (self.winfo_screenheight() - h) // 2
        self.geometry(f"{w}x{h}+{x}+{y}")
        self.minsize(740, 560)
        self.deiconify()  # Reveal perfectly centered window
        self.focus_set()

    def _on_close(self):
        try:
            self.login_win.destroy()
        except Exception:
            try:
                self.destroy()
            except Exception:
                pass

    # ------------------------------------------------------------------
    # UI Layout
    # ------------------------------------------------------------------

    def _build_ui(self):    
        # ── Gradient header ────────────────────────────────────────────
        self._header = GradientHeader(self,
                                      title="⬡  Geohash Converter",
                                      logo_url=LOGO_URL,
                                      bg=C_BG)
        self._header.pack(fill="x")

        # ── Body row  (nav | pages) ────────────────────────────────────
        body = tk.Frame(self, bg=C_PAGE_BG, padx=8, pady=8)
        body.pack(fill="both", expand=True)

        # Left nav panel
        nav = tk.Frame(body, bg=C_PAGE_BG, width=180)
        nav.pack(side="left", fill="y")
        nav.pack_propagate(False)

        tk.Label(nav, text="  TOOLS", bg=C_PAGE_BG, fg=C_MUTED,
                 font=("Segoe UI", 7, "bold"),
                 pady=10).pack(anchor="w")

        for i, (label, icon, _cls) in enumerate(self.PAGES):
            idx = i
            btn = NavButton(nav, text=label, icon=icon,
                            command=lambda n=idx: self._switch(n),
                            width=22)
            btn.pack(fill="x")
            self._nav_btns.append(btn)

        # Divider
        tk.Frame(nav, bg=C_BORDER, height=1).pack(fill="x", pady=8)

        def show_main_contact(_event=None):
            show_contact_dialog(
                self,
                "About / Contact",
                "Tools: Geohash Converter v3.0\n"
                "Contact: danuartrianurrohman@telkominfra.com\n"
                "Phone: +6282116513070\n"
                "\nThis utility was developed by Telkom Infra's GIS Team.\n"
                "Copyright © 2026 Telkom Infra. All rights reserved.",
                icon_text="ℹ️"
            )

        footer = tk.Frame(nav, bg="#f5f5f5")
        footer.pack(fill="x", side="bottom", pady=4)
        tk.Label(footer, text="  v3.0 | EPSG:4326",
                 bg="#f5f5f5", fg=C_MUTED,
                 font=("Segoe UI", 7)).pack(side="left", anchor="w")
        contact_label = tk.Label(footer, text="About / Contact",
                                 bg="#f5f5f5", fg=C_ACCENT,
                                 font=("Segoe UI", 8, "underline"),
                                 cursor="hand2")
        contact_label.pack(side="right", anchor="e", padx=(0, 6))
        contact_label.bind("<Button-1>", show_main_contact)

        # Right content area — all pages stacked, only one visible
        self._content = tk.Frame(body, bg=C_PANEL, bd=1, relief="solid")
        self._content.pack(side="left", fill="both", expand=True, padx=(8, 0), pady=8)
        self._content.grid_rowconfigure(0, weight=1)
        self._content.grid_columnconfigure(0, weight=1)

        for _label, _icon, PageCls in self.PAGES:
            page = PageCls(self._content)
            page.grid(row=0, column=0, sticky="nsew")
            self._pages.append(page)

    # ------------------------------------------------------------------
    # Page switching
    # ------------------------------------------------------------------

    def _switch(self, idx: int):
        if idx == self._active_idx:
            return
        self._active_idx = idx

        # Highlight correct nav button
        for i, btn in enumerate(self._nav_btns):
            btn.set_active(i == idx)

        # Raise the selected page to the top of the stacking order
        self._pages[idx].tkraise()


# ===========================================================================
# LOGIN WINDOW
# ===========================================================================

class LoginWindow(tk.Tk):
    """
    Login screen.  Credentials fetched live from CREDENTIALS_URL.
    On success, hides itself and opens GeohashApp.
    """

    def __init__(self):
        super().__init__()
        self.withdraw()  # Hide initial uncentered default window
        self.title("Geohash Converter — Login")
        apply_window_icon(self)
        self.resizable(False, False)
        self.configure(bg=C_BG)
        self._build_ui()

        w, h = 400, 460
        x = (self.winfo_screenwidth()  - w) // 2
        y = (self.winfo_screenheight() - h) // 2
        self.geometry(f"{w}x{h}+{x}+{y}")
        self.deiconify()  # Reveal centered login window

    # ── UI ──────────────────────────────────────────────────────────────

    def _build_ui(self):
        # Gradient header (reused)
        hdr = GradientHeader(self, title="⬡  Geohash Converter",
                             logo_url=LOGO_URL, bg=C_BG)
        hdr.pack(fill="x")

        body = tk.Frame(self, bg="#ffffff", padx=40, pady=20)
        body.pack(fill="both", expand=True)

        tk.Label(body, text="LOGIN", bg="#ffffff", fg=C_TEXT,
                 font=("Segoe UI", 12, "bold")).pack(anchor="w", pady=(4, 14))

        for attr, lbl, show in [("u_var", "Username", ""),
                                 ("p_var", "Password", "●")]:
            tk.Label(body, text=lbl, bg="#ffffff", fg=C_MUTED,
                     font=FONT_LABEL).pack(anchor="w", pady=(0, 2))
            var = tk.StringVar()
            setattr(self, attr, var)
            e = tk.Entry(body, textvariable=var, show=show,
                         bg=C_CARD, fg=C_TEXT, insertbackground=C_TEXT,
                         relief="flat", font=FONT_INPUT, bd=0,
                         highlightthickness=1, highlightbackground="#d1d5db",
                         highlightcolor=C_ACCENT)
            e.pack(fill="x", ipady=8, pady=(0, 10))
            if show:
                e.bind("<Return>", lambda _: self._attempt())
                self._p_entry = e

        self.st_var = tk.StringVar(value="")
        self.st_lbl = tk.Label(body, textvariable=self.st_var,
                               bg="#ffffff", fg=C_MUTED,
                               font=FONT_LABEL, wraplength=320)
        self.st_lbl.pack(pady=(0, 6))

        self.login_btn = make_button(body, "Sign In", self._attempt,
                                     bg=C_ACCENT, pady=8,
                                     font=("Segoe UI", 10, "bold"))
        self.login_btn.pack(fill="x")

        # Contact Info Label at Bottom
        def show_contact_info(_event=None):
            show_contact_dialog(
                self,
                "Contact Information",
                "Contact: danuartrianurrohman@telkominfra.com\n"
                "Phone: +6282116513070",
                icon_text="📞"
            )

        contact_frame = tk.Frame(self, bg=C_BG)
        contact_frame.pack(fill="x", pady=(0, 4))
        contact_label = tk.Label(contact_frame, text="📞 Contact Support", 
                                bg=C_BG, fg=C_ACCENT, font=("Segoe UI", 9, "underline"),
                                cursor="hand2")
        contact_label.pack()
        contact_label.bind("<Button-1>", lambda e: show_contact_info())

        tk.Label(self, text="Credentials verified via remote server",
                 bg=C_BG, fg=C_MUTED, font=FONT_SMALL).pack(pady=6)

    def _attempt(self):
        u = self.u_var.get().strip()
        p = self.p_var.get()
        if not u or not p:
            self._status("Please enter username and password.", C_WARN)
            return
        self.login_btn.configure(state="disabled", text="Connecting…")
        self._status("Fetching credentials…", C_MUTED)
        threading.Thread(target=self._auth, args=(u, p), daemon=True).start()

    def _auth(self, u, p):
        try:
            creds = fetch_credentials(CREDENTIALS_URL)
            ok    = u in creds and creds[u] == p
        except Exception as exc:
            #self.after(0, self._fail, str(exc))
            self.after(0, self._fail, "You are offline! Please check internet connection")
            return
        if ok:
            self.after(0, self._success)
        else:
            self.after(0, self._fail, "Invalid username or password.")

    def _success(self):
        self._status("Login successful! Opening application…", C_OK)
        self.after(600, self._open_main)

    def _fail(self, reason):
        self._status(f"✗ {reason}", C_ERR)
        #self._status("You are offline! Please check internet connection", C_ERR)
        self.login_btn.configure(state="normal", text="Sign In")
        self.p_var.set("")
        self._p_entry.focus_set()

    def _open_main(self):
        self.withdraw()
        GeohashApp(self)

    def _status(self, msg, color):
        self.st_var.set(msg)
        self.st_lbl.configure(fg=color)


# ===========================================================================
# ENTRY POINT
# ===========================================================================

if __name__ == "__main__":
    # Apply ttk theme globally before any window opens
    root = LoginWindow()
    style = ttk.Style(root)
    style.theme_use("clam")
    style.configure("TCombobox",
                     fieldbackground=C_CARD, background=C_CARD,
                     foreground=C_TEXT, bordercolor=C_BORDER,
                     selectbackground=C_ACCENT, selectforeground="white")
    style.configure("TProgressbar",
                     troughcolor=C_CARD, background=C_BLUE2)
    root.mainloop()