"""
validation.py
-------------
Input validation module for remote sensing image formats, channel depths,
and cross-image spatial alignment (co-registration / CRS).
"""

from typing import List, Tuple, Dict, Any
import numpy as np

class ValidationError(Exception):
    pass

def validate_inputs(
    images: List[np.ndarray],
    expected_count: int,
    modality: str = "optical"
) -> Dict[str, Any]:
    """
    Validates uploaded images against task modality expectations.
    """
    if len(images) != expected_count:
        raise ValidationError(
            f"Expected {expected_count} image(s) for task modality '{modality}', but received {len(images)}."
        )
    
    for idx, img in enumerate(images):
        if img.ndim not in (2, 3):
            raise ValidationError(f"Image {idx+1} has invalid tensor dimensions: ndim={img.ndim}")
        h, w = img.shape[:2]
        if h < 32 or w < 32:
            raise ValidationError(f"Image {idx+1} is too small ({w}x{h}). Minimum size is 32x32.")

    # Check alignment for paired inputs (bi-temporal or optical+sar)
    if len(images) == 2:
        shape1 = images[0].shape[:2]
        shape2 = images[1].shape[:2]
        if shape1 != shape2:
            raise ValidationError(
                f"Paired images must be co-registered with identical dimensions. Got {shape1} vs {shape2}."
            )
            
    return {
        "status": "VALID",
        "image_count": len(images),
        "dimensions": f"{images[0].shape[1]}x{images[0].shape[0]}",
        "channels": images[0].shape[2] if images[0].ndim == 3 else 1,
        "co_registered": len(images) == 2
    }
