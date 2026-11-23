"""Export nn-v6-full to ONNX for the browser. Run from PageGomoku: python -m python.games.gomoku.export_onnx"""
from pathlib import Path

import onnx
import torch

from .models.value_cnn import build_model_from_state_dict

HERE = Path(__file__).parent
OUT = HERE.parents[5] / "public" / "gomoku" / "nn-v6-full.onnx"

state = torch.load(HERE / "checkpoints" / "v6-full" / "best.pth", map_location="cpu", weights_only=True)
model = build_model_from_state_dict(state)
model.load_state_dict(state)
model.eval()
OUT.parent.mkdir(parents=True, exist_ok=True)
torch.onnx.export(
    model,
    torch.zeros(1, 3, 15, 15),
    OUT,
    input_names=["board"],
    output_names=["value", "policy"],
    opset_version=17,
)

onnx.save_model(onnx.load(OUT), OUT, save_as_external_data=False)
OUT.with_name(OUT.name + ".data").unlink(missing_ok=True)
