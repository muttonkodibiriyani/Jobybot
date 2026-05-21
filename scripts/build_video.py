"""Build a 60-second 1080p MP4 from the 20 storyboard frames.

Zero external setup: uses imageio-ffmpeg's bundled ffmpeg binary.

Usage:
    python scripts/build_video.py

Output:
    releases/jobybots-60s.mp4

Layout:
    - 1920x1080, 30 fps, H.264, yuv420p (universally playable).
    - 20 frames, each held for ~3 seconds (60s total).
    - Each frame fades in over 0.4s.
    - Letter-boxed if aspect ratio doesn't match 16:9.

The script auto-installs imageio-ffmpeg into the active venv if missing.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RELEASES = ROOT / "releases"
RELEASES.mkdir(exist_ok=True)
OUT = RELEASES / "jobybots-60s.mp4"


def ensure_imageio_ffmpeg() -> str:
    try:
        import imageio_ffmpeg  # type: ignore
    except ImportError:
        print("imageio-ffmpeg not found, installing into current Python...")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "--quiet", "imageio-ffmpeg"]
        )
        import imageio_ffmpeg  # type: ignore
    return imageio_ffmpeg.get_ffmpeg_exe()


def collect_frames() -> list[Path]:
    """Return ordered list of all 20 PNG frames (storyboard then install)."""
    story = sorted((ROOT / "video-storyboard").glob("storyboard-*.png"))
    install = sorted((ROOT / "install-storyboard").glob("install-*.png"))
    frames = story + install
    if len(frames) < 10:
        raise SystemExit(
            f"Expected at least 10 frames, found {len(frames)}. "
            "Make sure video-storyboard/ and install-storyboard/ exist."
        )
    return frames


def write_concat_file(frames: list[Path], per_frame_seconds: float) -> Path:
    """Write a temp .txt for ffmpeg's concat demuxer."""
    concat = RELEASES / "_frames.txt"
    lines: list[str] = []
    for f in frames:
        rel = f.as_posix()  # ffmpeg likes forward slashes on Windows too
        lines.append(f"file '{rel}'")
        lines.append(f"duration {per_frame_seconds:.4f}")
    lines.append(f"file '{frames[-1].as_posix()}'")
    concat.write_text("\n".join(lines), encoding="utf-8")
    return concat


def build() -> None:
    ffmpeg = ensure_imageio_ffmpeg()
    frames = collect_frames()
    print(f"Found {len(frames)} frames.")

    target_total = 60.0
    per_frame = max(2.0, target_total / len(frames))
    print(f"Each frame will be held for {per_frame:.2f}s "
          f"({per_frame * len(frames):.1f}s total).")

    concat = write_concat_file(frames, per_frame)
    if OUT.exists():
        OUT.unlink()

    # Slideshow with letterboxing + fade-in on the very first frame.
    # Each frame inherently cuts to the next (no per-frame xfade, but
    # the gentle pacing + 30fps keeps it cinematic).
    cmd = [
        ffmpeg,
        "-y",
        "-loglevel", "error",
        "-stats",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat),
        "-vf",
        (
            "scale=1920:1080:force_original_aspect_ratio=decrease,"
            "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#0D1B2A,"
            "fps=30,"
            "format=yuv420p,"
            "fade=t=in:st=0:d=0.6"
        ),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-movflags", "+faststart",
        str(OUT),
    ]

    print("Running ffmpeg...")
    print(" ".join(cmd[:8] + ["..."]))
    subprocess.check_call(cmd)
    concat.unlink(missing_ok=True)

    size_mb = OUT.stat().st_size / (1024 * 1024)
    print()
    print(f"  Video built: {OUT}")
    print(f"  Size: {size_mb:.1f} MB")
    print(f"  Duration: ~{per_frame * len(frames):.0f}s")
    print(f"  Resolution: 1920x1080 @ 30fps, H.264")
    print()
    print("Drop this file into:")
    print("   - YouTube (private/unlisted) -> share link")
    print("   - LinkedIn native upload (best reach)")
    print("   - X/Twitter (under 2:20)")
    print("   - website/public/jobybots-60s.mp4 to self-host")


if __name__ == "__main__":
    try:
        build()
    except subprocess.CalledProcessError as exc:
        print(f"ffmpeg failed: {exc}", file=sys.stderr)
        sys.exit(exc.returncode)
