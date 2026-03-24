#!/usr/bin/env python3
import sys
import os
import tempfile
import shutil

import cv2
import numpy as np
import easyocr

READER = easyocr.Reader(['en'], gpu=False, verbose=False)

def get_char_size(frame_h):
    return max(14, int(frame_h * 0.025))

def detect_plates(frame, debug=False):
    h, w = frame.shape[:2]
    char_h = get_char_size(h)
    results = READER.readtext(frame, contrast_ths=0.5)
    plates = []
    for (bbox, text, conf) in results:
        if conf < 0.25:
            continue
        text = text.strip().upper()
        if len(text) < 2:
            continue
        (tl, tr, br, bl) = bbox
        x_coords = [p[0] for p in bbox]
        y_coords = [p[1] for p in bbox]
        x1 = max(0, int(min(x_coords)))
        y1 = max(0, int(min(y_coords)))
        x2 = min(w, int(max(x_coords)))
        y2 = min(h, int(max(y_coords)))
        bw = x2 - x1
        bh = y2 - y1
        if bw <= 0 or bh <= 0:
            continue
        aspect = bw / bh if bh > 0 else 0
        has_digit = any(c.isdigit() for c in text)
        if aspect > 1.5 and aspect < 8.0 and has_digit and bh >= char_h * 0.5:
            pad = max(4, int(bh * 0.1))
            x1 = max(0, x1 - pad)
            y1 = max(0, y1 - pad)
            x2 = min(w, x2 + pad)
            y2 = min(h, y2 + pad)
            plates.append((x1, y1, x2, y2, conf))
    return plates

def blur_region(frame, x1, y1, x2, y2):
    if x1 >= x2 or y1 >= y2:
        return frame
    roi = frame[y1:y2, x1:x2]
    if roi.size == 0:
        return frame
    blur = cv2.GaussianBlur(roi, (51, 51), 0)
    frame[y1:y2, x1:x2] = blur
    return frame

def process_video(input_path, output_path, skip_frames=2, debug=False):
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        return False, "Cannot open video"

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    if not out.isOpened():
        cap.release()
        return False, "Cannot create output video"

    frame_idx = 0
    cached_plates = []
    cached_frame_idx = -999

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        processed = frame.copy()

        should_detect = (frame_idx % skip_frames == 0) or (frame_idx - cached_frame_idx > 15)
        if should_detect:
            cached_plates = detect_plates(frame, debug)
            cached_frame_idx = frame_idx

        for (x1, y1, x2, y2, conf) in cached_plates:
            processed = blur_region(processed, x1, y1, x2, y2)
            if debug:
                cv2.rectangle(processed, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(processed, f"{conf:.2f}", (x1, y1 - 5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

        out.write(processed)
        frame_idx += 1

        if debug and frame_idx % 30 == 0:
            print(f"  Processed {frame_idx}/{total_frames} frames...", flush=True)

    cap.release()
    out.release()
    return True, f"Processed {frame_idx} frames, {len(cached_plates)} plates found"

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python3 blur_plates.py <input.mp4> <output.mp4> [--debug]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    debug = '--debug' in sys.argv

    print(f"Processing: {input_path}")
    success, msg = process_video(input_path, output_path, skip_frames=2, debug=debug)
    print(msg)
    sys.exit(0 if success else 1)
