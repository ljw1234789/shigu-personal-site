"""Build the homepage showreel from the six media files already published on the site."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "preview-jordan/media"
OUTPUT = ROOT / "assets/studio"

# Each cut contains the runtime and one wide shot or three vertical shots at
# the listed source times. Source dialogue is omitted from the montage.
CUTS = [
    (2.9, [("stream/yingjun-reno.mp4", 28.9), ("stream/yingjun-reno.mp4", 2.1), ("stream/yingjun-reno.mp4", 8.0)]),
    (2.0, [("solar-distance.mp4", 141.8)]),
    (1.7, [("solar-distance.mp4", 194.4)]),
    (2.6, [("stream/yingjun-a7.mp4", 50.4), ("stream/yingjun-huawei.mp4", 62.6), ("stream/yingjun-a7.mp4", 98.6)]),
    (1.9, [("earth-flat.mp4", 127.2)]),
    (1.4, [("earth-flat.mp4", 169.8)]),
    (2.0, [("sound-candle.mp4", 146.9)]),
    (1.6, [("sound-candle.mp4", 173.6)]),
]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", default="ffmpeg")
    parser.add_argument("--scratch", type=Path)
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)

    def run(*options):
        subprocess.run([args.ffmpeg, "-hide_banner", "-loglevel", "error", "-y", *map(str, options)], check=True)

    with tempfile.TemporaryDirectory(prefix="studio-reel-", dir=args.scratch) as temp:
        scratch = Path(temp)

        def render(item):
            index, (duration, shots) = item
            triptych = len(shots) == 3
            width = 396 if triptych else 1200
            inputs = []
            for filename, time in shots:
                inputs.extend(("-ss", time, "-i", MEDIA / filename))
            sizing = f"scale={width}:600:force_original_aspect_ratio=increase,crop={width}:600,setsar=1,fps=24,format=yuv420p"
            if triptych:
                filters = ";".join(f"[{i}:v]{sizing}[v{i}]" for i in range(3))
                filters += ";[v0][v1][v2]xstack=inputs=3:layout=0_0|402_0|804_0:fill=0x191a17[v]"
                framing = ["-filter_complex_threads", "2", "-filter_complex", filters, "-map", "[v]"]
            else:
                framing = ["-map", "0:v:0", "-vf", sizing]
            dest = scratch / f"{index:02}.mp4"
            run(*inputs, *framing, "-t", duration, "-an", "-c:v", "libx264", "-threads", "3",
                "-preset", "fast", "-crf", "22", "-pix_fmt", "yuv420p", "-video_track_timescale", "24000", dest)
            return dest

        with ThreadPoolExecutor(max_workers=3) as pool:
            cuts = list(pool.map(render, enumerate(CUTS)))
        manifest = scratch / "concat.txt"
        manifest.write_text("".join(f"file {clip.name}\n" for clip in cuts))
        run("-f", "concat", "-safe", "0", "-i", manifest, "-c", "copy", "-movflags", "+faststart", OUTPUT / "showreel.mp4")
        run("-i", OUTPUT / "showreel.mp4", "-t", "12", "-an", "-c:v", "libx264", "-crf", "25",
            "-preset", "fast", "-movflags", "+faststart", OUTPUT / "reel-preview.mp4")
        run("-ss", "0.45", "-i", OUTPUT / "showreel.mp4", "-frames:v", "1", "-q:v", "3", OUTPUT / "reel-poster.jpg")

if __name__ == "__main__":
    main()
