#!/usr/bin/env python3
"""Checks a zip exported by the generator: every STL body must be watertight with outward normals.

Usage: python3 tests/check_export.py path/to/export.zip
"""
import sys, zipfile, io

try:
    import trimesh
except ImportError:
    sys.exit("Нужен trimesh: pip install trimesh")


def main(path):
    ok = True
    with zipfile.ZipFile(path) as z:
        stls = [n for n in z.namelist() if n.lower().endswith(".stl")]
        if not stls:
            sys.exit("В архиве нет STL")
        for name in sorted(stls):
            mesh = trimesh.load(io.BytesIO(z.read(name)), file_type="stl")
            bodies = mesh.split(only_watertight=False)
            leaky = [b for b in bodies if not b.is_watertight]
            inverted = [b for b in bodies if b.volume < 0]
            lo, hi = mesh.bounds
            size = " × ".join(f"{v:.1f}" for v in (hi - lo))
            status = "OK" if not leaky and not inverted else "ОШИБКА"
            if status != "OK":
                ok = False
            print(f"{status:7} {name:40} {size:>22} мм  тел: {len(bodies):3}  "
                  f"незамкнутых: {len(leaky)}  вывернутых: {len(inverted)}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
