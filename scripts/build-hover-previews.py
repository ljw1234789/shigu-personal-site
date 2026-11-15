"""Extract the muted project card loops from the site's already published films."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse, subprocess

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "preview-jordan" / "media"
OUT = ROOT / "assets" / "studio" / "hover"
SOURCES = {
    "yingjun-reno": ("stream/yingjun-reno.mp4", 57.0),
    "solar-distance": ("solar-distance.mp4", 194.4),
    "yingjun-a7": ("stream/yingjun-a7.mp4", 50.4),
    "earth-flat": ("earth-flat.mp4", 127.0),
    "yingjun-huawei": ("stream/yingjun-huawei.mp4", 62.6),
    "sound-candle": ("sound-candle.mp4", 146.9),
}

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--ffmpeg", default="ffmpeg")
args = parser.parse_args()
OUT.mkdir(parents=True, exist_ok=True)

def cut(entry):
    slug, (path, start) = entry
    subprocess.run([
        args.ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(start),
        "-i", str(MEDIA / path), "-t", "4", "-an", "-vf",
        "scale=576:576:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,fps=24",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-preset", "fast",
        "-threads", "3", "-movflags", "+faststart", str(OUT / (slug + ".mp4")),
    ], check=True)

with ThreadPoolExecutor(max_workers=3) as pool:
    list(pool.map(cut, SOURCES.items()))
