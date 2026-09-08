import json
import numpy as np
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def calculate_contingency_metrics(obs: np.ndarray, pred: np.ndarray, threshold: float = 0.1):
    """
    Calculate 2x2 contingency table metrics for precipitation nowcasting:
    - Hits (a): Both observed and predicted >= threshold
    - False Alarms (b): Observed < threshold, predicted >= threshold
    - Misses (c): Observed >= threshold, predicted < threshold
    - Correct Negatives (d): Both < threshold
    """
    obs_binary = obs >= threshold
    pred_binary = pred >= threshold

    hits = np.sum(obs_binary & pred_binary)
    false_alarms = np.sum((~obs_binary) & pred_binary)
    misses = np.sum(obs_binary & (~pred_binary))
    correct_negatives = np.sum((~obs_binary) & (~pred_binary))

    # CSI (Critical Success Index / Threat Score) = Hits / (Hits + Misses + False Alarms)
    csi_denom = hits + misses + false_alarms
    csi = float(hits / csi_denom) if csi_denom > 0 else 1.0

    # POD (Probability of Detection) = Hits / (Hits + Misses)
    pod_denom = hits + misses
    pod = float(hits / pod_denom) if pod_denom > 0 else 1.0

    # FAR (False Alarm Ratio) = False Alarms / (Hits + False Alarms)
    far_denom = hits + false_alarms
    far = float(false_alarms / far_denom) if far_denom > 0 else 0.0

    # RMSE (Root Mean Squared Error)
    rmse = float(np.sqrt(np.mean((pred - obs) ** 2)))

    # MAE (Mean Absolute Error)
    mae = float(np.mean(np.abs(pred - obs)))

    return {
        "threshold_mm_hr": threshold,
        "hits": int(hits),
        "false_alarms": int(false_alarms),
        "misses": int(misses),
        "correct_negatives": int(correct_negatives),
        "CSI": round(csi, 4),
        "POD": round(pod, 4),
        "FAR": round(far, 4),
        "RMSE": round(rmse, 4),
        "MAE": round(mae, 4)
    }

def evaluate_predictions(obs_data: np.ndarray, pred_data: np.ndarray, thresholds=[0.1, 2.5, 10.0]):
    """Evaluate nowcast predictions across multiple intensity thresholds."""
    results = {}
    for thresh in thresholds:
        metrics = calculate_contingency_metrics(obs_data, pred_data, threshold=thresh)
        results[f"threshold_{thresh}mm_hr"] = metrics
    return results

if __name__ == "__main__":
    # Self-test simulation if run directly
    np.random.seed(42)
    sample_obs = np.random.exponential(scale=1.5, size=(100, 100))
    # Simulate nowcast prediction with slight spatial noise
    sample_pred = sample_obs + np.random.normal(loc=0.1, scale=0.4, size=(100, 100))
    sample_pred[sample_pred < 0] = 0.0

    res = evaluate_predictions(sample_obs, sample_pred)
    print(json.dumps(res, indent=2))
