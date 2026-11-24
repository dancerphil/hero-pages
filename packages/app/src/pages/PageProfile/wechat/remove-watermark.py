import sys
from pathlib import Path

import cv2
import numpy as np

REF = Path(__file__).with_name('1.png')
Y0, X0 = 1036, 2358

src, dst = sys.argv[1], sys.argv[2]
ref = cv2.imread(str(REF))
img = cv2.imread(src)
h, w, _ = ref.shape

box = np.zeros((h, w), bool)
box[Y0:, X0:] = True

rough = ((ref.min(axis=2) > 90) & box).astype(np.uint8) * 255
rough = cv2.dilate(rough, np.ones((5, 5), np.uint8), iterations=2)
bg = cv2.inpaint(ref, rough, 15, cv2.INPAINT_NS).astype(np.float32)

denom = np.maximum(255 - bg, 1)
alpha = ((ref.astype(np.float32) - bg) * (255 - bg)).sum(axis=2) / (denom ** 2).sum(axis=2)
alpha = np.clip(alpha, 0, 0.95) * (rough > 0)

a = alpha[..., None]
clean = (img.astype(np.float32) - 255 * a) / (1 - a)
out = np.where(a > 0, clean, img)

cv2.imwrite(dst, np.clip(out, 0, 255).astype(np.uint8))
