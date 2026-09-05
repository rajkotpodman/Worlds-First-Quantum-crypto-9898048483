#!/usr/bin/env python3
"""
Proof-of-Action Behavioral AI Engine
Implements Prompt 24 from Untitled document (1).md
"""

import math
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field

@dataclass
class TouchPoint:
    x: float
    y: float
    pressure: float = 1.0
    timestamp_ms: float = 0.0

@dataclass
class GestureTelemetry:
    gesture_type: str = "SWIPE"
    touch_points: List[TouchPoint] = field(default_factory=list)

@dataclass
class BehaviorEvaluationResult:
    human_confidence_score: float
    reward_multiplier: float
    is_human: bool
    detected_anomalies: List[str] = field(default_factory=list)
    tier: str = "VERIFIED_HUMAN"

class ProofOfActionBehaviorClassifier:
    def __init__(self, human_threshold: float = 0.50):
        self.human_threshold = human_threshold

    def evaluate_telemetry(self, gestures: List[GestureTelemetry]) -> BehaviorEvaluationResult:
        """Evaluates touch dynamics and biomechanical entropy to classify human vs synthetic bot telemetry."""
        if not gestures:
            return BehaviorEvaluationResult(
                human_confidence_score=0.90,
                reward_multiplier=1.0,
                is_human=True,
                detected_anomalies=[],
            )

        anomalies: List[str] = []
        total_points = 0
        total_pressure_variance = 0.0
        total_velocity_variance = 0.0
        is_exact_straight_line = True
        is_constant_pressure = True

        for g in gestures:
            pts = g.touch_points
            total_points += len(pts)
            if len(pts) < 2:
                continue

            # Pressure variance
            pressures = [p.pressure for p in pts]
            p_mean = sum(pressures) / len(pressures)
            p_var = sum((p - p_mean) ** 2 for p in pressures) / len(pressures)
            total_pressure_variance += p_var

            if p_var > 1e-4:
                is_constant_pressure = False

            # Check linearity / curvature
            slopes = []
            for i in range(len(pts) - 1):
                dx = pts[i+1].x - pts[i].x
                dy = pts[i+1].y - pts[i].y
                slopes.append((dx, dy))

            # If all dx and dy increments are identical -> exact straight line script
            if len(slopes) > 1:
                first_dx, first_dy = slopes[0]
                for dx, dy in slopes[1:]:
                    if abs(dx - first_dx) > 1e-3 or abs(dy - first_dy) > 1e-3:
                        is_exact_straight_line = False
                        break

        # Check for synthetic repeated gestures
        if len(gestures) > 1:
            g1_pts = gestures[0].touch_points
            g2_pts = gestures[1].touch_points
            if len(g1_pts) == len(g2_pts) and len(g1_pts) > 0:
                identical_coords = all(
                    abs(p1.x - p2.x) < 1e-5 and abs(p1.y - p2.y) < 1e-5
                    for p1, p2 in zip(g1_pts, g2_pts)
                )
                if identical_coords:
                    anomalies.append("IDENTICAL_REPLAYED_GESTURE_COORDINATES")

        if is_exact_straight_line:
            anomalies.append("ZERO_CURVATURE_SYNTHETIC_ADB_TRAJECTORY")
        if is_constant_pressure:
            anomalies.append("CONSTANT_PRESSURE_BOT_INJECTION")

        is_bot = len(anomalies) > 0
        if is_bot:
            confidence = 0.15
            multiplier = 0.0
            is_human = False
            tier = "BOT_BLOCKED"
        else:
            confidence = min(0.99, max(0.65, 0.50 + total_pressure_variance * 5.0))
            multiplier = min(1.5, max(0.8, confidence * 1.2))
            is_human = confidence >= self.human_threshold
            tier = "VERIFIED_HUMAN"

        return BehaviorEvaluationResult(
            human_confidence_score=round(confidence, 4),
            reward_multiplier=round(multiplier, 4),
            is_human=is_human,
            detected_anomalies=anomalies,
            tier=tier,
        )


class BehaviorClassifier:
    """Backward compatibility wrapper."""
    def __init__(self, human_threshold: float = 0.75):
        self.human_threshold = human_threshold
        self.engine = ProofOfActionBehaviorClassifier(human_threshold=human_threshold)

    def evaluate_touch_telemetry(self, touch_events: List[Dict[str, float]]) -> Dict[str, Any]:
        points = [
            TouchPoint(x=e.get("x", 0.0), y=e.get("y", 0.0), pressure=e.get("pressure", 1.0), timestamp_ms=e.get("timestamp", 0.0))
            for e in touch_events
        ]
        res = self.engine.evaluate_telemetry([GestureTelemetry(gesture_type="TOUCH", touch_points=points)])
        return {
            "human_confidence": res.human_confidence_score,
            "is_human": res.is_human,
            "tier": res.tier,
            "anomalies": res.detected_anomalies,
        }


if __name__ == "__main__":
    classifier = ProofOfActionBehaviorClassifier()
    res = classifier.evaluate_telemetry([GestureTelemetry("SWIPE", [TouchPoint(0, 0), TouchPoint(10, 20)])])
    print(f"Human Confidence: {res.human_confidence_score} -> Human: {res.is_human}")
