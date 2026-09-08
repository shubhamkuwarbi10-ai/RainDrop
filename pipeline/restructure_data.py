import os
import shutil
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def restructure_dataset():
    base_dir = Path(__file__).parent.parent
    raw_dir = base_dir / "data" / "raw"
    imerg_dir = raw_dir / "imerg"
    cartodem_zips_dir = raw_dir / "cartodem_zips"
    
    imerg_dir.mkdir(parents=True, exist_ok=True)
    cartodem_zips_dir.mkdir(parents=True, exist_ok=True)
    
    dataset_dir = base_dir / "dataset"
    if not dataset_dir.exists():
        logging.info("dataset/ directory not found or already restructured.")
        return

    # 1. Move HDF5 files into data/raw/imerg/
    hdf5_files = list(dataset_dir.glob("*.HDF5")) + list(dataset_dir.glob("*.hdf5"))
    logging.info(f"Moving {len(hdf5_files)} HDF5 rainfall files to data/raw/imerg/...")
    for hf in hdf5_files:
        if hf.exists():
            target = imerg_dir / hf.name
            try:
                shutil.move(str(hf), str(target))
            except Exception as e:
                logging.warning(f"Could not move {hf.name}: {e}")
        
    # 2. Move DEM zip files from dataset/DEM data/ to data/raw/cartodem_zips/
    dem_data_dir = dataset_dir / "DEM data"
    if dem_data_dir.exists():
        zip_files = list(dem_data_dir.glob("*.zip"))
        logging.info(f"Moving {len(zip_files)} CartoDEM zip archives to data/raw/cartodem_zips/...")
        for zf in zip_files:
            if zf.exists():
                target = cartodem_zips_dir / zf.name
                try:
                    shutil.move(str(zf), str(target))
                except Exception as e:
                    logging.warning(f"Could not move {zf.name}: {e}")
            
    # 3. Clean up leftover unzipped temp folder in dataset/
    shutil.rmtree(dataset_dir, ignore_errors=True)
    logging.info("Restructuring complete! Clean directory hierarchy created under data/raw/.")

if __name__ == "__main__":
    restructure_dataset()
