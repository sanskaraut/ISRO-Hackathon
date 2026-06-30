import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

# ============================================================================
# 1. CNN Encoder
# ============================================================================
class CNNEncoder(nn.Module):
    def __init__(self, in_channels=1, out_channels=64):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(in_channels, 32, 3, padding=1),
            nn.BatchNorm2d(32), nn.ReLU(inplace=True),
            nn.Conv2d(32, 32, 3, padding=1),
            nn.BatchNorm2d(32), nn.ReLU(inplace=True),
            nn.Conv2d(32, 64, 3, stride=2, padding=1),
            nn.BatchNorm2d(64), nn.ReLU(inplace=True),

            nn.Conv2d(64, 64, 3, padding=1),
            nn.BatchNorm2d(64), nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, 3, padding=1),
            nn.BatchNorm2d(64), nn.ReLU(inplace=True),
            nn.Conv2d(64, out_channels, 3, stride=2, padding=1),
            nn.BatchNorm2d(out_channels), nn.ReLU(inplace=True),

            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels), nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels), nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, stride=2, padding=1),
            nn.BatchNorm2d(out_channels), nn.ReLU(inplace=True),

            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels), nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels), nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, stride=2, padding=1),
            nn.BatchNorm2d(out_channels), nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.encoder(x)  # [B, C, H/16, W/16]

# ============================================================================
# 2. Temporal Transformer
# ============================================================================
class TemporalTransformer(nn.Module):
    def __init__(self, dim=64, num_heads=4, time_embed_dim=32):
        super().__init__()
        self.num_heads = num_heads
        self.dim = dim
        self.time_embed = nn.Sequential(
            nn.Linear(1, time_embed_dim),
            nn.ReLU(inplace=True),
            nn.Linear(time_embed_dim, dim)
        )
        self.norm1 = nn.LayerNorm(dim)
        self.norm2 = nn.LayerNorm(dim)
        self.norm_cross = nn.LayerNorm(dim)
        self.self_attn = nn.MultiheadAttention(dim, num_heads, batch_first=True)
        self.cross_attn_f0 = nn.MultiheadAttention(dim, num_heads, batch_first=True)
        self.cross_attn_f1 = nn.MultiheadAttention(dim, num_heads, batch_first=True)
        self.ffn = nn.Sequential(
            nn.Linear(dim, dim * 4),
            nn.GELU(),
            nn.Linear(dim * 4, dim)
        )
        self.norm_ffn = nn.LayerNorm(dim)

    def forward(self, f0, f1, timestep):
        B, C, H, W = f0.shape
        if timestep.dim() == 4:
            timestep = timestep.view(B, 1)
        elif timestep.dim() == 1:
            timestep = timestep.unsqueeze(1)
        time_emb = self.time_embed(timestep).unsqueeze(1)  # [B,1,C]
        f0_seq = f0.flatten(2).transpose(1, 2)   # [B, N, C]
        f1_seq = f1.flatten(2).transpose(1, 2)
        f0_seq = f0_seq + time_emb
        f1_seq = f1_seq + time_emb
        # Self-Attn
        attn_f0 = self.self_attn(self.norm1(f0_seq), self.norm1(f0_seq), self.norm1(f0_seq))[0]
        f0_seq = f0_seq + attn_f0
        attn_f1 = self.self_attn(self.norm1(f1_seq), self.norm1(f1_seq), self.norm1(f1_seq))[0]
        f1_seq = f1_seq + attn_f1
        # Cross-Attn
        f0_cross = self.cross_attn_f0(
            query=self.norm_cross(f0_seq),
            key=self.norm_cross(f1_seq),
            value=self.norm_cross(f1_seq)
        )[0]
        f0_seq = f0_seq + f0_cross
        f1_cross = self.cross_attn_f1(
            query=self.norm_cross(f1_seq),
            key=self.norm_cross(f0_seq),
            value=self.norm_cross(f0_seq)
        )[0]
        f1_seq = f1_seq + f1_cross
        # FFN
        f0_seq = f0_seq + self.ffn(self.norm_ffn(f0_seq))
        f1_seq = f1_seq + self.ffn(self.norm_ffn(f1_seq))
        f0_out = f0_seq.transpose(1, 2).reshape(B, C, H, W)
        f1_out = f1_seq.transpose(1, 2).reshape(B, C, H, W)
        return f0_out, f1_out

# ============================================================================
# 3. Flow Network
# ============================================================================
class RIFEFlowNet(nn.Module):
    def __init__(self, feature_dim=64):
        super().__init__()
        self.conv_in = nn.Conv2d(2 * feature_dim, 128, kernel_size=3, padding=1)
        self.encoder = nn.Sequential(
            nn.BatchNorm2d(128), nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, 3, padding=1),
            nn.BatchNorm2d(128), nn.ReLU(inplace=True),
            nn.Conv2d(128, 256, 3, stride=2, padding=1),
            nn.BatchNorm2d(256), nn.ReLU(inplace=True),
            nn.Conv2d(256, 256, 3, padding=1),
            nn.BatchNorm2d(256), nn.ReLU(inplace=True),
            nn.Conv2d(256, 512, 3, stride=2, padding=1),
            nn.BatchNorm2d(512), nn.ReLU(inplace=True),
            nn.Conv2d(512, 512, 3, padding=1),
            nn.BatchNorm2d(512), nn.ReLU(inplace=True),
        )
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(512, 256, 4, stride=2, padding=1),
            nn.BatchNorm2d(256), nn.ReLU(inplace=True),
            nn.Conv2d(256, 256, 3, padding=1),
            nn.BatchNorm2d(256), nn.ReLU(inplace=True),
            nn.ConvTranspose2d(256, 128, 4, stride=2, padding=1),
            nn.BatchNorm2d(128), nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, 3, padding=1),
            nn.BatchNorm2d(128), nn.ReLU(inplace=True),
            nn.Conv2d(128, 2, 3, padding=1)
        )

    def forward(self, f0, f1):
        x = torch.cat([f0, f1], dim=1)
        x = self.conv_in(x)
        x = self.encoder(x)
        flow = self.decoder(x)
        return flow  # [B, 2, H/16, W/16]

# ============================================================================
# 4. Warping & Fusion
# ============================================================================
class WarpingModule(nn.Module):
    def forward(self, frame, flow):
        B, _, H, W = frame.shape
        grid_y, grid_x = torch.meshgrid(
            torch.arange(H, device=frame.device),
            torch.arange(W, device=frame.device),
            indexing='ij'
        )
        grid = torch.stack([grid_x, grid_y], dim=0).float()
        grid = grid.unsqueeze(0).expand(B, -1, -1, -1).clone()
        grid = grid + flow
        grid[:, 0] = 2.0 * grid[:, 0] / (W - 1) - 1.0
        grid[:, 1] = 2.0 * grid[:, 1] / (H - 1) - 1.0
        grid = grid.permute(0, 2, 3, 1)
        return F.grid_sample(frame, grid, mode='bilinear', align_corners=True)

class FusionModule(nn.Module):
    def __init__(self):
        super().__init__()
        self.fusion = nn.Sequential(
            nn.Conv2d(6, 32, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 32, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 1, 3, padding=1),
            nn.Sigmoid()
        )
    def forward(self, warped0, warped1, frame0, frame2, flow):
        x = torch.cat([warped0, warped1, frame0, frame2, flow], dim=1)
        return self.fusion(x)

# ============================================================================
# 5. Complete Model
# ============================================================================
class CNN_Attention_RIFE_Temporal(nn.Module):
    def __init__(self, feature_dim=64):
        super().__init__()
        self.encoder = CNNEncoder(in_channels=1, out_channels=feature_dim)
        self.transformer = TemporalTransformer(dim=feature_dim)
        self.flow_net = RIFEFlowNet(feature_dim=feature_dim)
        self.warper = WarpingModule()
        self.fusion = FusionModule()

    def forward(self, frame0, frame2, timestep):
        B, _, H, W = frame0.shape
        timestep_4d = timestep.view(B, 1, 1, 1)

        f0 = self.encoder(frame0)   # [B, C, H/16, W/16]
        f2 = self.encoder(frame2)
        f0, f2 = self.transformer(f0, f2, timestep)

        flow = self.flow_net(f0, f2)   # [B, 2, H/16, W/16]

        flow_up = F.interpolate(flow, size=(H, W), mode='bilinear', align_corners=True)
        scale_factor = H / flow.shape[2]   # = 16
        flow_up = flow_up * scale_factor

        warped0 = self.warper(frame0, flow_up * timestep_4d)
        warped2 = self.warper(frame2, -flow_up * (1 - timestep_4d))

        flow_normalised = flow_up / (scale_factor + 1e-6)
        output = self.fusion(warped0, warped2, frame0, frame2, flow_normalised)
        return output

# ============================================================================
# 6. Utilities (padding/cropping)
# ============================================================================
def pad_to_multiple_of_16(x: torch.Tensor):
    _, _, H, W = x.shape
    pad_h = (16 - H % 16) % 16
    pad_w = (16 - W % 16) % 16
    if pad_h > 0 or pad_w > 0:
        x = F.pad(x, (0, pad_w, 0, pad_h), mode='reflect')
    return x, H, W

def crop_to_original(x: torch.Tensor, H: int, W: int) -> torch.Tensor:
    return x[:, :, :H, :W]
