import tkinter as tk
from tkinter import filedialog, ttk
from PIL import Image, ImageTk
import os

class ImageOverlayTool:
    def __init__(self, root):
        self.root = root
        self.root.title("Image Overlay Tool")
        
        # Image variables
        self.base_image = None
        self.overlay_image = None
        self.base_image_path = None
        self.overlay_image_path = None
        self.result_image = None
        
        # Create main frame
        self.main_frame = ttk.Frame(root, padding="10")
        self.main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Create buttons for loading images
        ttk.Button(self.main_frame, text="Load Base Image", command=self.load_base_image).grid(row=0, column=0, pady=5)
        ttk.Button(self.main_frame, text="Load Overlay Image", command=self.load_overlay_image).grid(row=0, column=1, pady=5)
        
        # Create sliders frame
        self.controls_frame = ttk.LabelFrame(self.main_frame, text="Controls", padding="5")
        self.controls_frame.grid(row=1, column=0, columnspan=2, pady=10, sticky=(tk.W, tk.E))
        
        # Opacity slider
        ttk.Label(self.controls_frame, text="Opacity:").grid(row=0, column=0)
        self.opacity_var = tk.DoubleVar(value=0.5)
        self.opacity_slider = ttk.Scale(self.controls_frame, from_=0, to=1, orient=tk.HORIZONTAL, 
                                      variable=self.opacity_var, command=self.update_preview)
        self.opacity_slider.grid(row=0, column=1, sticky=(tk.W, tk.E))
        
        # Rotation slider
        ttk.Label(self.controls_frame, text="Rotation:").grid(row=1, column=0)
        self.rotation_var = tk.DoubleVar(value=0)
        self.rotation_slider = ttk.Scale(self.controls_frame, from_=0, to=360, orient=tk.HORIZONTAL,
                                       variable=self.rotation_var, command=self.update_preview)
        self.rotation_slider.grid(row=1, column=1, sticky=(tk.W, tk.E))
        
        # Scale slider
        ttk.Label(self.controls_frame, text="Scale:").grid(row=2, column=0)
        self.scale_var = tk.DoubleVar(value=1.0)
        self.scale_slider = ttk.Scale(self.controls_frame, from_=0.1, to=10.0, orient=tk.HORIZONTAL,
                                    variable=self.scale_var, command=self.update_preview)
        self.scale_slider.grid(row=2, column=1, sticky=(tk.W, tk.E))
        
        # X Position slider
        ttk.Label(self.controls_frame, text="X Position:").grid(row=3, column=0)
        self.x_pos_var = tk.IntVar(value=0)
        self.x_pos_slider = ttk.Scale(self.controls_frame, from_=-500, to=500, orient=tk.HORIZONTAL,
                                    variable=self.x_pos_var, command=self.update_preview)
        self.x_pos_slider.grid(row=3, column=1, sticky=(tk.W, tk.E))
        
        # Y Position slider
        ttk.Label(self.controls_frame, text="Y Position:").grid(row=4, column=0)
        self.y_pos_var = tk.IntVar(value=0)
        self.y_pos_slider = ttk.Scale(self.controls_frame, from_=-500, to=500, orient=tk.HORIZONTAL,
                                    variable=self.y_pos_var, command=self.update_preview)
        self.y_pos_slider.grid(row=4, column=1, sticky=(tk.W, tk.E))
        
        # Preview frame with scrollbars
        preview_frame = ttk.Frame(self.main_frame)
        preview_frame.grid(row=2, column=0, columnspan=2, pady=10, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Create scrollbars
        self.h_scrollbar = ttk.Scrollbar(preview_frame, orient=tk.HORIZONTAL)
        self.v_scrollbar = ttk.Scrollbar(preview_frame, orient=tk.VERTICAL)
        
        # Create canvas with scrollbars
        self.canvas = tk.Canvas(preview_frame, width=800, height=800, bg='gray',
                              xscrollcommand=self.h_scrollbar.set,
                              yscrollcommand=self.v_scrollbar.set)
        
        # Configure scrollbars
        self.h_scrollbar.config(command=self.canvas.xview)
        self.v_scrollbar.config(command=self.canvas.yview)
        
        # Grid layout for canvas and scrollbars
        self.canvas.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        self.h_scrollbar.grid(row=1, column=0, sticky=(tk.W, tk.E))
        self.v_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        
        # Configure grid weights
        preview_frame.grid_rowconfigure(0, weight=1)
        preview_frame.grid_columnconfigure(0, weight=1)
        
        # Save button
        ttk.Button(self.main_frame, text="Save Result", command=self.save_result).grid(row=3, column=0, columnspan=2, pady=5)
        
    def load_base_image(self):
        self.base_image_path = filedialog.askopenfilename(filetypes=[("PNG files", "*.png")])
        if self.base_image_path:
            self.base_image = Image.open(self.base_image_path)
            self.update_preview()
    
    def load_overlay_image(self):
        self.overlay_image_path = filedialog.askopenfilename(filetypes=[("PNG files", "*.png")])
        if self.overlay_image_path:
            self.overlay_image = Image.open(self.overlay_image_path)
            self.update_preview()
    
    def update_preview(self, *args):
        if not self.base_image or not self.overlay_image:
            return
            
        # Create copies of original images
        base = self.base_image.copy()
        overlay = self.overlay_image.copy()
        
        # Scale overlay
        scale = self.scale_var.get()
        new_size = tuple(int(dim * scale) for dim in overlay.size)
        overlay = overlay.resize(new_size, Image.Resampling.LANCZOS)
        
        # Rotate overlay
        overlay = overlay.rotate(self.rotation_var.get(), expand=True, resample=Image.Resampling.BICUBIC)
        
        # Create new blank image with RGBA
        result = Image.new('RGBA', base.size, (0, 0, 0, 0))
        
        # Paste base image
        result.paste(base, (0, 0))
        
        # Calculate position with offset
        x = (base.size[0] - overlay.size[0]) // 2 + self.x_pos_var.get()
        y = (base.size[1] - overlay.size[1]) // 2 + self.y_pos_var.get()
        
        # Create mask for overlay
        overlay.putalpha(int(255 * self.opacity_var.get()))
        
        # Paste overlay
        result.paste(overlay, (x, y), overlay)
        
        # Store result for saving
        self.result_image = result
        
        # Display preview (maintain aspect ratio)
        preview = result.copy()
        # Calculate scaling to fit in canvas while maintaining aspect ratio
        canvas_ratio = 800 / 800  # canvas width / height
        image_ratio = preview.width / preview.height
        
        if image_ratio > canvas_ratio:
            # Image is wider than canvas
            new_width = 800
            new_height = int(800 / image_ratio)
        else:
            # Image is taller than canvas
            new_height = 800
            new_width = int(800 * image_ratio)
            
        if preview.width > 800 or preview.height > 800:
            preview = preview.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        photo = ImageTk.PhotoImage(preview)
        self.canvas.delete("all")
        self.canvas.create_image(400, 400, image=photo)
        self.canvas.image = photo
        
        # Update canvas scroll region
        self.canvas.config(scrollregion=self.canvas.bbox("all"))
    
    def save_result(self):
        if self.result_image:
            save_path = filedialog.asksaveasfilename(defaultextension=".png",
                                                    filetypes=[("PNG files", "*.png")])
            if save_path:
                self.result_image.save(save_path)

if __name__ == "__main__":
    root = tk.Tk()
    app = ImageOverlayTool(root)
    root.mainloop()
