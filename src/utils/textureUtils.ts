/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to calculate Sobel-filtered normals and store glossiness in Alpha channel (_nohq PAA standard)
export function generateDayzNormalMap(
  sourceCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number, // 1 to 10
  invertY: boolean,
  glossiness: number // 0 to 255
): ImageData {
  const srcData = sourceCtx.getImageData(0, 0, width, height);
  const srcPixels = srcData.data;

  const dstData = sourceCtx.createImageData(width, height);
  const dstPixels = dstData.data;

  // Pre-calculate gray values for faster convolution
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0; i < srcPixels.length; i += 4) {
    const r = srcPixels[i];
    const g = srcPixels[i + 1];
    const b = srcPixels[i + 2];
    // Luminance formula
    gray[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  const getPixel = (x: number, y: number): number => {
    // Clamp coordinates to edges
    const cx = Math.max(0, Math.min(width - 1, x));
    const cy = Math.max(0, Math.min(height - 1, y));
    return gray[cy * width + cx];
  };

  const scale = strength * 0.1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Sobel kernel filter
      // Horizontal (Dx)
      // [ -1, 0, 1 ]
      // [ -2, 0, 2 ]
      // [ -1, 0, 1 ]
      const tl = getPixel(x - 1, y - 1);
      const l  = getPixel(x - 1, y);
      const bl = getPixel(x - 1, y + 1);
      const tr = getPixel(x + 1, y - 1);
      const r  = getPixel(x + 1, y);
      const br = getPixel(x + 1, y + 1);

      // Vertical (Dy)
      // [ -1, -2, -1 ]
      // [  0,  0,  0 ]
      // [  1,  2,  1 ]
      const t  = getPixel(x, y - 1);
      const b  = getPixel(x, y + 1);

      const dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dY = (bl + 2 * b + br) - (tl + 2 * t + tr);

      // Derive normal vector
      let nx = -dX * scale;
      let ny = -dY * scale;
      if (invertY) {
        ny = -ny;
      }
      const nz = 128.0; // Flat Z base

      // Normalize
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const nVecX = nx / len;
      const nVecY = ny / len;
      const nVecZ = nz / len;

      const idx = (y * width + x) * 4;
      // DayZ Normal HQ scale (0-255 mapped from [-1, 1])
      dstPixels[idx]     = Math.floor((nVecX + 1.0) * 127.5); // Red (X offset)
      dstPixels[idx + 1] = Math.floor((nVecY + 1.0) * 127.5); // Green (Y offset)
      dstPixels[idx + 2] = Math.floor((nVecZ + 1.0) * 255.0); // Blue (Bump/Geometry depth, always high)
      dstPixels[idx + 3] = Math.max(0, Math.min(255, glossiness)); // Alpha (Glossiness/Specular macro)
    }
  }

  return dstData;
}

// Generate procedurally beautiful camouflage canvas pattern
export function renderCamoPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pattern: string
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  if (pattern === 'digital') {
    // Generate Army Digital Pattern (MARPAT style)
    const colors = [
      '#4B5320', // Olive Green
      '#1B4D3E', // Forest Green
      '#7F6244', // Coyote Brown
      '#2E1A11'  // Dark Earth
    ];
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, width, height);

    const size = 16;
    for (let x = 0; x < width; x += size) {
      for (let y = 0; y < height; y += size) {
        if (Math.random() > 0.4) {
          const col = colors[Math.floor(Math.random() * (colors.length - 1)) + 1];
          ctx.fillStyle = col;
          ctx.fillRect(x, y, size, size);
          // Add micro pixels
          if (Math.random() > 0.6) {
            ctx.fillRect(x + size / 2, y, size / 2, size / 2);
          }
        }
      }
    }
  } else if (pattern === 'woodland') {
    // Organic blobs
    const colors = ['#3D5E3A', '#223821', '#8C6C42', '#0A0E0A'];
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, width, height);

    for (let c = 1; c < colors.length; c++) {
      ctx.fillStyle = colors[c];
      for (let i = 0; i < 45; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = 25 + Math.random() * 55;

        // Draw distorted blob using quadratic path
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.arc(x + (Math.random() - 0.5) * r, y + (Math.random() - 0.5) * r, r * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else if (pattern === 'desert') {
    const colors = ['#E2C69C', '#C2A377', '#8E7355', '#EFE0C5'];
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, width, height);

    for (let c = 1; c < colors.length; c++) {
      ctx.fillStyle = colors[c];
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radiusX = 20 + Math.random() * 60;
        const radiusY = 10 + Math.random() * 30;
        const rotation = Math.random() * Math.PI;

        ctx.beginPath();
        ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === 'winter') {
    const colors = ['#F2F5F8', '#CBD3DB', '#8A959E', '#3D4A52'];
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, width, height);

    for (let c = 1; c < colors.length; c++) {
      ctx.fillStyle = colors[c];
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const length = 30 + Math.random() * 60;
        const angle = (Math.random() - 0.5) * 0.4; // flat angles

        ctx.beginPath();
        ctx.ellipse(x, y, length, length * 0.4, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === 'flecktarn') {
    // Speckled micro dots
    const colors = ['#697155', '#494E34', '#313329', '#CBB895', '#A52A2A'];
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, width, height);

    for (let c = 1; c < colors.length; c++) {
      ctx.fillStyle = colors[c];
      for (let i = 0; i < 150; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = 4 + Math.random() * 12;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Scatter surrounding smaller splatters (flecken)
        for (let s = 0; s < 3; s++) {
          ctx.beginPath();
          ctx.arc(
            x + (Math.random() - 0.5) * 25,
            y + (Math.random() - 0.5) * 25,
            r * 0.4,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
  } else if (pattern === 'tigerstripe') {
    // Vertical / horizontal stripes
    const colors = ['#2E332E', '#161916', '#706B5F', '#575E4D'];
    ctx.fillStyle = colors[3]; // Green base
    ctx.fillRect(0, 0, width, height);

    // Other colors
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = colors[c];
      for (let i = 0; i < 18; i++) {
        const y = Math.random() * height;
        const h = 15 + Math.random() * 35;

        ctx.beginPath();
        ctx.moveTo(0, y);
        let curX = 0;
        let curY = y;
        while (curX < width) {
          const stepX = 40 + Math.random() * 80;
          const stepY = (Math.random() - 0.5) * 25;
          curX += stepX;
          curY += stepY;
          ctx.lineTo(curX, curY + (Math.random() - 0.5) * h);
        }
        ctx.lineTo(width, y + h);
        while (curX > 0) {
          const stepX = 40 + Math.random() * 80;
          const stepY = (Math.random() - 0.5) * 25;
          curX -= stepX;
          ctx.lineTo(curX, curY + h + (Math.random() - 0.5) * h);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

// Convert Hex string color to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace(/^#/, '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

// Format fully compiled config.cpp text manually as placeholder, 
// though we also query the intelligent AI server route.
export function generateDefaultDayzConfig(
  baseClass: string,
  customClass: string,
  modPrefix: string,
  itemName: string,
  category: string,
  coPath: string,
  nohqPath: string,
  smdiPath: string
): string {
  const normBase = baseClass || "M4A1";
  const normCustom = customClass || `My_${normBase}_Custom`;
  const normalizedPrefix = modPrefix || "MyMod";

  return `class CfgPatches
{
	class ${normalizedPrefix}_${normCustom}
	{
		units[] = {};
		weapons[] = {"${normCustom}"};
		requiredVersion = 0.1;
		requiredAddons[] = {
			"DZ_Data",
			"DZ_Weapons_Firearms"
		};
	};
};

class CfgWeapons
{
	class ${normBase};
	class ${normCustom}: ${normBase}
	{
		scope = 2;
		displayName = "${itemName || "Custom Modified Rifle"}";
		descriptionShort = "Custom customized high precision retexture. Built with DayZ Retexture Generator.";
		
		hiddenSelections[] = {"camo"};
		hiddenSelectionsTextures[] = {
			"${normalizedPrefix}\\data\\${normCustom}_co.paa"
		};
		hiddenSelectionsMaterials[] = {
			"${normalizedPrefix}\\data\\${normCustom}.rvmat"
		};
	};
};`;
}
