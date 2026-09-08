from math import sqrt


def calculate_calibration_metrics(observed: list[float], predicted: list[float]) -> dict[str, float | int]:
    if len(observed) != len(predicted) or not observed:
        raise ValueError("Calibration samples must be non-empty and equal length")
    errors = [prediction - actual for actual, prediction in zip(observed, predicted)]
    absolute = [abs(error) for error in errors]
    return {
        "sample_count": len(errors),
        "mae_cm": sum(absolute) / len(errors),
        "rmse_cm": sqrt(sum(error * error for error in errors) / len(errors)),
        "bias_cm": sum(errors) / len(errors),
        "max_absolute_error_cm": max(absolute),
    }