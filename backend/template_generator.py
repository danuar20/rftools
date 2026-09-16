"""
Sample Reference Template Generator for RF TOOLS
Generates downloadable Excel (.xlsx) templates for all 6 calculation workflows.
"""

import io
import openpyxl
from openpyxl.comments import Comment

def generate_template(template_id: str) -> tuple[bytes, str]:
    """
    Generates template workbook in-memory.
    Returns (xlsx_bytes, filename).
    """
    tid = template_id.lower().strip()
    wb = openpyxl.Workbook()
    ws = wb.active

    if tid in ("point", "point_kml", "sample_point_kml"):
        filename = "Sample_Point_KML.xlsx"
        ws.title = "Sheet1"
        ws.append(["SITE_ID", "SITENAME", "Site", "LONG", "LAT"])
        rows = [
            ["JKT001", "Jakarta_Monas_01", 106.827153, -6.175392],
            ["JKT002", "Jakarta_GBK_02", 106.801444, -6.243589],
            ["BDG001", "Bandung_GedungSate_01", 107.619123, -6.917464],
            ["SUB001", "Surabaya_TuguPahlawan_01", 112.737829, -7.245842],
        ]
        for idx, r in enumerate(rows, start=2):
            ws.append([r[0], r[1], f"{r[0]} : {r[1]}", r[2], r[3]])

    elif tid in ("prb", "prb_kml", "sample_prb_kml"):
        filename = "Sample_PRB_KML.xlsx"
        ws.title = "Sheet1"
        headers = [
            "WEEK", "SITEID", "SITENAME", "CELLNAME", "BEAM", "DL PRB BDBH", "UL PRB BDBH",
            "RRC User BDBH", "PAYLOAD (MB)", "BW (MHz)", "LONG", "LAT", "DIRECTION",
            "CLASS REV", "NOP", "RTPO", "PROPINSI", "KABUPATEN", "KECAMATAN", "DESA",
            "SDR", "ANTENNA_TYPE", "TOWER_HEIGHT", "ANTENNA_HEIGHT", "M-Tilt", "E-Tilt", "PCI"
        ]
        ws.append(headers)

        comment_text = "\n".join(["Example:", "LTE700", "LTE900", "LTE1800", "LTE2100", "LTE2300-1st", "LTE2300-2nd", "LTE2300-3rd"])
        beam_comment = Comment(comment_text, "RF TOOLS Engine")
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

    elif tid in ("isd_a", "sample_isd_filea"):
        filename = "Sample_ISD_FileA.xlsx"
        ws.title = "Sheet1"
        ws.append(["SITE_ID", "LAT", "LONG"])
        ws.append(["SITE_A01", -6.175392, 106.827153])
        ws.append(["SITE_A02", -6.917464, 107.619123])

    elif tid in ("isd_b", "sample_isd_fileb"):
        filename = "Sample_ISD_FileB.xlsx"
        ws.title = "Sheet1"
        ws.append(["SITE_ID", "LAT", "LONG"])
        ws.append(["SITE_B01", -6.243589, 106.801444])
        ws.append(["SITE_B02", -6.183333, 106.841667])
        ws.append(["SITE_B03", -6.921852, 107.607140])

    elif tid in ("geohash", "sample_geohash", "geohash_to_shp", "geohash_to_latlon"):
        filename = "Sample_Geohash.xlsx"
        ws.title = "Sheet1"
        ws.append(["SITE_ID", "SITENAME", "GEOHASH", "TRAFFIC_GB"])
        ws.append(["JKT01", "Monas_Center", "qqgu4u2", 142.5])
        ws.append(["JKT02", "Gambir_Station", "qqgu4uq", 210.8])
        ws.append(["JKT03", "Thamrin_Tower", "qqgu4ev", 380.2])
        ws.append(["JKT04", "Senayan_Stadium", "qqgu1m7", 195.4])

    elif tid in ("latlon", "sample_latlon", "latlon_to_geohash"):
        filename = "Sample_LatLon.xlsx"
        ws.title = "Sheet1"
        ws.append(["SITE_ID", "SITENAME", "LAT", "LONG"])
        ws.append(["JKT01", "Monas_Center", -6.175392, 106.827153])
        ws.append(["JKT02", "Gambir_Station", -6.176650, 106.830670])
        ws.append(["JKT03", "Thamrin_Tower", -6.191200, 106.823400])
        ws.append(["JKT04", "Senayan_Stadium", -6.218500, 106.802600])

    else:
        raise ValueError(f"Unknown template identifier: {template_id}")

    bio = io.BytesIO()
    wb.save(bio)
    return bio.getvalue(), filename
