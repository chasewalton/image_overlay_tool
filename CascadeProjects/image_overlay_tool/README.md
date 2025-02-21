# Image Overlay Tool

A simple GUI application that allows you to overlay two PNG images with controls for opacity, rotation, and scaling.

## Features

- Load two PNG images (base and overlay)
- Adjust overlay opacity (0-100%)
- Rotate overlay image (0-360 degrees)
- Scale overlay image (10%-200%)
- Live preview of the result
- Save the final image as PNG

## Requirements

- Python 3.x
- Pillow (PIL)
- tkinter (usually comes with Python)

## Installation

1. Install the required packages:
```bash
pip install -r requirements.txt
```

## Usage

1. Run the program:
```bash
python image_overlay.py
```

2. Click "Load Base Image" to select your background image
3. Click "Load Overlay Image" to select the image to overlay
4. Use the sliders to adjust:
   - Opacity of the overlay image
   - Rotation of the overlay image
   - Scale of the overlay image
5. Click "Save Result" when you're satisfied with the preview

The overlay image will be automatically centered on the base image.
