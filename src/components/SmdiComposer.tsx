/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Shield, Eye, Settings, HelpCircle, Layers } from 'lucide-react';
import { SmdiChannelState } from '../types';

interface SmdiComposerProps {
  smdi: SmdiChannelState;
  onChange: (updates: Partial<SmdiChannelState>) => void;
  onPreviewSmdiGenerated: (dataUrl: string) => void;
}

export default function SmdiComposer({ smdi, onChange, onPreviewSmdiGenerated }: SmdiComposerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Material configurations according to Bohemia Interactive SuperShader guidelines
  const presets: Record<string, { specular: number; glossiness: number; metalness: number; aoFactor: number; label: string }> = {
    military_fabric: { specular: 18, glossiness: 35, metalness: 0, aoFactor: 125, label: "Армейская ткань (Хлопок/Нейлон)" },
    leather: { specular: 30, glossiness: 75, metalness: 0, aoFactor: 160, label: "Огрубевшая Кожа (Ремни/Кобуры)" },
    polished_metal: { specular: 230, glossiness: 220, metalness: 255, aoFactor: 240, label: "Полированная Сталь (Ресиверы/Затворы)" },
    painted_metal: { specular: 45, glossiness: 120, metalness: 10, aoFactor: 200, label: "Окрашенный Металл (Каски/Стволы)" },
    plastic: { specular: 42, glossiness: 110, metalness: 0, aoFactor: 180, label: "Матовый Оружейный Пластик (Цевье)" },
    wood: { specular: 22, glossiness: 65, metalness: 0, aoFactor: 140, label: "Лакированное Дерево (Приклады)" },
    glass: { specular: 180, glossiness: 245, metalness: 0, aoFactor: 255, label: "Оптическое Стекло (Прицелы)" },
  };

  const handleApplyPreset = (key: string) => {
    if (key === 'custom') return;
    const preset = presets[key];
    if (preset) {
      onChange({
        materialPreset: key as any,
        specular: preset.specular,
        glossiness: preset.glossiness,
        metalness: preset.metalness,
        aoFactor: preset.aoFactor,
      });
    }
  };

  const drawSmdiMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 256;
    const height = 256;
    canvas.width = width;
    canvas.height = height;

    const imgData = ctx.createImageData(width, height);
    const pixels = imgData.data;

    // Fill each pixel according to standard Bohemia SMDI:
    // Red Channel (0)   = Specular Output
    // Green Channel (1) = Glossiness Output
    // Blue Channel (2)  = Metallic Output
    // Alpha Channel (3) = ambient occlusion or constant alpha (solid 255 for opaque, or custom)
    const spec = smdi.specular;
    const gloss = smdi.glossiness;
    const metal = smdi.metalness;
    const ao = smdi.aoFactor;

    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i]     = spec;  // R
      pixels[i + 1] = gloss; // G
      pixels[i + 2] = metal; // B
      pixels[i + 3] = ao;    // A (Normally full detail 255 or AO)
    }

    ctx.putImageData(imgData, 0, 0);
    onPreviewSmdiGenerated(canvas.toDataURL('image/png'));
  };

  useEffect(() => {
    drawSmdiMap();
  }, [smdi.specular, smdi.glossiness, smdi.metalness, smdi.aoFactor]);

  return (
    <div className="bg-[#161618] border border-white/10 rounded-xl p-4 flex flex-col gap-4" id="smdi_composer_wrapper">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-orange-500" id="smdi_icon_shield" />
        <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest" id="smdi_composer_title">
          2. Текстурный Маппинг (_smdi [_nohq alpha])
        </h2>
      </div>

      <canvas ref={canvasRef} className="hidden" id="internal_smdi_canvas" />

      {/* Preset Selector */}
      <div className="mb-2" id="preset_selector_smdi">
        <label className="text-[10px] text-white/50 uppercase block font-semibold tracking-wider mb-2.5">
          Шаблоны игровых материалов (Рекомендуется)
        </label>
        <div className="grid grid-cols-1 gap-1.5" id="presets_smdi_list">
          {Object.entries(presets).map(([key, item]) => (
            <button
              key={key}
              id={`preset_smdi_btn_${key}`}
              onClick={() => handleApplyPreset(key)}
              className={`flex justify-between items-center px-3 py-1.5 text-xs font-mono rounded border transition-colors text-left cursor-pointer ${
                smdi.materialPreset === key
                  ? 'bg-orange-500/5 border-orange-500/60 text-orange-400'
                  : 'bg-black/40 border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              <span className="font-mono text-[9px] text-[#D1D1D1]/40">
                ({item.specular},{item.glossiness},{item.metalness})
              </span>
            </button>
          ))}
          <button
            id="preset_smdi_btn_custom"
            onClick={() => onChange({ materialPreset: 'custom' })}
            className={`flex justify-between items-center px-3 py-1.5 text-xs font-mono rounded border transition-colors text-left cursor-pointer ${
              smdi.materialPreset === 'custom'
                ? 'bg-orange-500/5 border-orange-500/60 text-orange-400 font-bold'
                : 'bg-black/40 border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>Настроить вручную (Пользовательский)</span>
            <span className="font-mono text-[9px] text-orange-500">Custom</span>
          </button>
        </div>
      </div>

      {/* Manual channels config */}
      <div className="space-y-3 pt-3 border-t border-white/10" id="manual_channels_sliders">
        <div className="flex items-center gap-1">
          <Settings className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[10px] text-white/50 uppercase font-semibold tracking-wider">Ручной Микшер Каналов SMDI</span>
        </div>

        {/* RED: Specular */}
        <div className="p-3 bg-red-950/20 border border-red-500/20 rounded">
          <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
            <span className="text-red-400 font-medium flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 inline-block" />
              Канал RED: Спекуляр
            </span>
            <span className="text-red-300 font-bold">{smdi.specular} (8-bit)</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={smdi.specular}
            onChange={(e) => onChange({ specular: parseInt(e.target.value), materialPreset: 'custom' })}
            className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-red-500"
            id="specular_red_range"
          />
          <p className="text-[9px] text-[#D1D1D1]/40 mt-1 leading-normal">
            * Сила отраженного света. Ткань ~18, Металлы ~200-240.
          </p>
        </div>

        {/* GREEN: Glossiness */}
        <div className="p-3 bg-emerald-950/20 border border-[#10b981]/20 rounded">
          <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
            <span className="text-emerald-400 font-medium flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block" />
              Канал GREEN: Гладкость
            </span>
            <span className="text-emerald-300 font-bold">{smdi.glossiness} (8-bit)</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={smdi.glossiness}
            onChange={(e) => onChange({ glossiness: parseInt(e.target.value), materialPreset: 'custom' })}
            className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-emerald-500"
            id="glossiness_green_range"
          />
          <p className="text-[9px] text-[#D1D1D1]/40 mt-1 leading-normal">
            * Микро-шероховатость. 0 = матовый, 255 = зеркальный. (Дублируется в Альфа-канал _nohq).
          </p>
        </div>

        {/* BLUE: Metalness */}
        <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded">
          <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
            <span className="text-blue-400 font-medium flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 inline-block" />
              Канал BLUE: Металличность
            </span>
            <span className="text-blue-300 font-bold">{smdi.metalness} (8-bit)</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={smdi.metalness}
            onChange={(e) => onChange({ metalness: parseInt(e.target.value), materialPreset: 'custom' })}
            className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-blue-500"
            id="metalness_blue_range"
          />
          <p className="text-[9px] text-[#D1D1D1]/40 mt-1 leading-normal">
            * 255 = металлический сплав, 0 = пластик, дерево, кожа, ткань.
          </p>
        </div>

        {/* ALPHA: AO */}
        <div className="p-3 bg-black/40 border border-white/10 rounded">
          <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
            <span className="text-white/60 font-medium flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded-full bg-white/60 shrink-0 inline-block" />
              Канал ALPHA: Поглощение (AO)
            </span>
            <span className="text-white/40 font-bold">{smdi.aoFactor} (8-bit)</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={smdi.aoFactor}
            onChange={(e) => onChange({ aoFactor: parseInt(e.target.value), materialPreset: 'custom' })}
            className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-white"
            id="ao_alpha_range"
          />
          <p className="text-[9px] text-[#D1D1D1]/40 mt-1 leading-normal">
            * Окружающее затенение (Ambient Occlusion). Стандарт = 255.
          </p>
        </div>
      </div>
    </div>
  );
}
