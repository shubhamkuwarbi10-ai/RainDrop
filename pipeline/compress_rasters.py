import os
import glob
from pathlib import Path
import logging

try:
    import rasterio
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def compress_geotiffs_in_directory(dir_path: str):
    if not HAS_RASTERIO:
        logging.error("rasterio is required to compress GeoTIFF rasters.")
        return

    path = Path(dir_path)
    if not path.exists():
        return

    tifs = list(path.glob("*.tif"))
    logging.info(f"Compressing {len(tifs)} GeoTIFF rasters in {dir_path} losslessly using DEFLATE...")

    for tif in tifs:
        try:
            original_size = tif.stat().st_size
            temp_output = tif.with_suffix(".tmp.tif")

            with rasterio.open(tif) as src:
                profile = src.profile.copy()
                # Apply lossless DEFLATE compression with floating point predictor
                profile.update(
                    compress="deflate",
                    predictor=3 if "float" in str(src.dtypes[0]) else 2,
                    tiled=True,
                    blockxsize=256,
                    blockysize=256
                )
                with rasterio.open(temp_output, "w", **profile) as dst:
                    for band in range(1, src.count + 1):
                        dst.write(src.read(band), band)

            compressed_size = temp_output.stat().st_size
            ratio = (1 - (compressed_size / original_size)) * 100
            
            # Replace original file with compressed file if smaller
            if compressed_size < original_size:
                temp_output.replace(tif)
                logging.info(f"Compressed {tif.name}: {original_size / 1024 / 1024:.1f}MB -> {compressed_size / 1024 / 1024:.1f}MB ({ratio:.1f}% reduction)")
            else:
                temp_output.unlink()
        except Exception as e:
            logging.warning(f"Failed to compress {tif.name}: {e}")

if __name__ == "__main__":
    compress_geotiffs_in_directory("data/processed")
    compress_geotiffs_in_directory("data/raw/cartodem")
