/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TextureState {
  baseColor: string; // Hex color
  brightness: number; // 0.5 to 1.5
  contrast: number; // 0.5 to 1.5
  saturation: number; // 0.0 to 2.0
  activeCamo: string; // 'none' | 'digital' | 'woodland' | 'desert' | 'winter' | 'flecktarn' | 'tigerstripe'
  camoOpacity: number; // 0.0 to 1.0
  camoBlendMode: 'multiply' | 'overlay' | 'soft-light' | 'normal';
}

export interface NormalChannelState {
  hasCustomHeightMap: boolean;
  invertY: boolean;
  roughnessCoefficient: number; // For alpha mapping (0-255)
  sourceStrength: number; // Strength of normal map bumps (1 - 10)
  materialType: 'fabric' | 'leather' | 'wood' | 'plastic' | 'metal_rough' | 'metal_smooth';
}

export interface SmdiChannelState {
  materialPreset: 'custom' | 'military_fabric' | 'polished_metal' | 'painted_metal' | 'plastic' | 'leather' | 'wood' | 'glass';
  specular: number; // Red: 0 - 255
  glossiness: number; // Green: 0 - 255
  metalness: number; // Blue: 0 - 255
  aoFactor: number; // Alpha: 0 - 255
}

export interface ConfigPromptState {
  baseClass: string;
  customClass: string;
  modPrefix: string;
  itemName: string;
  category: 'clothing' | 'weapon' | 'vehicle' | 'attachment' | 'item';
  author: string;
}

export interface GeneratedFile {
  name: string;
  path: string;
  language: string;
  content: string;
}
