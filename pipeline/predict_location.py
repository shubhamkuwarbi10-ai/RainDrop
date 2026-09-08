import argparse
import rasterio
import json
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def predict_at_location(forecast_tif: str, lat: float, lon: float):
    """
    Extract predicted rainfall for a specific latitude and longitude across all forecasted timesteps.
    """
    with rasterio.open(forecast_tif) as src:
        # Check if coordinates are within the bounding box
        bounds = src.bounds
        if not (bounds.bottom <= lat <= bounds.top and bounds.left <= lon <= bounds.right):
            logging.error(f"Coordinates ({lat}, {lon}) are out of bounds: {bounds}")
            return None
            
        # Convert lat/lon to row/col in the raster
        row, col = src.index(lon, lat)
        
        # Read the time series at this pixel across all bands (timesteps)
        # src.read() returns shape (bands, rows, cols)
        # We can use a window to read just the single pixel to save memory, 
        # or read everything and slice. Let's read just the pixel.
        
        window = rasterio.windows.Window(col, row, 1, 1)
        data = src.read(window=window)
        
        # data shape will be (bands, 1, 1)
        timeseries = data[:, 0, 0].tolist()
        
    logging.info(f"Location: Lat {lat}, Lon {lon}")
    logging.info(f"Predicted Rainfall (mm/hr) over next {len(timeseries)} timesteps:")
    for i, val in enumerate(timeseries):
        logging.info(f"  T+{i+1}: {val:.4f}")
        
    return timeseries

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict rainfall at a specific location")
    parser.add_argument("--forecast-tif", required=True, help="Path to the forecast GeoTIFF (e.g. pysteps_forecast.tif)")
    parser.add_argument("--lat", type=float, required=True, help="Latitude")
    parser.add_argument("--lon", type=float, required=True, help="Longitude")
    
    args = parser.parse_args()
    predict_at_location(args.forecast_tif, args.lat, args.lon)
