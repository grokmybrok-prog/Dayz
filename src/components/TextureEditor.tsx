/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Upload, Sliders, Palette, RefreshCw, Layers } from 'lucide-react';
import { TextureState } from '../types';
import { renderCamoPattern, hexToRgb } from '../utils/textureUtils';

interface TextureEditorProps {
  texture: TextureState;
  onChange: (updates: Partial<TextureState>) => void;
  onPreviewGenerated: (canvasUrl: string) => void;
}

export default function TextureEditor({ texture, onChange, onPreviewGenerated }: TextureEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);

  // Apply camo pattern and filters to the composited canvas
  const handleRender = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 512;
    const height = 512;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw solid background color
    const rgb = hexToRgb(texture.baseColor);
    ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw uploaded base image if available
    if (uploadedImage) {
      ctx.drawImage(uploadedImage, 0, 0, width, height);
    }

    // 3. Draw Camouflage overlay onto hidden temporary canvas to apply blend mode
    if (texture.activeCamo !== 'none') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        renderCamoPattern(tempCtx, width, height, texture.activeCamo);

        ctx.save();
        ctx.globalAlpha = texture.camoOpacity;
        
        // Handle custom blend mode matching DayZ's materials
        if (texture.camoBlendMode === 'multiply') {
          ctx.globalCompositeOperation = 'multiply';
        } else if (texture.camoBlendMode === 'overlay') {
          ctx.globalCompositeOperation = 'overlay';
        } else if (texture.camoBlendMode === 'soft-light') {
          ctx.globalCompositeOperation = 'soft-light';
        } else {
          ctx.globalCompositeOperation = 'source-over';
        }

        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
      }
    }

    // 4. Apply image adjustment filters (Brightness, Contrast, Saturation)
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const bVal = texture.brightness; // 0.5 to 1.5
    const cVal = texture.contrast;   // 0.5 to 1.5
    const sVal = texture.saturation; // 0.0 to 2.0

    // Contrast precalc
    const factor = (259 * (cVal * 255 + 255)) / (255 * (259 - cVal * 255));

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Sliders adjustment
      // Brightness
      r = r * bVal;
      g = g * bVal;
      b = b * bVal;

      // Contrast
      if (cVal !== 1.0) {
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;
      }

      // Saturation (Luminance preserving)
      if (sVal !== 1.0) {
        const grey = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = grey + sVal * (r - grey);
        g = grey + sVal * (g - grey);
        b = grey + sVal * (b - grey);
      }

      // Clamp back to 0-255
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imgData, 0, 0);

    // Call back to parent with dataURL
    onPreviewGenerated(canvas.toDataURL('image/png'));
  };

  useEffect(() => {
    handleRender();
  }, [texture, uploadedImage]);

  // Handle image upload from user PC
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUploadedImage(img);
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const camoStyles = [
    { id: 'none', name: 'Без камуфляжа (Solid)' },
    { id: 'digital', name: 'Цифровой (Digital)' },
    { id: 'woodland', name: 'Лесной (Woodland)' },
    { id: 'desert', name: 'Пустынный (Desert)' },
    { id: 'winter', name: 'Зимний (Winter)' },
    { id: 'flecktarn', name: 'Флектарн (Flecktarn)' },
    { id: 'tigerstripe', name: 'Тигровый (Tigerstripe)' },
  ];

  return (
    <div className="bg-[#161618] border border-white/10 rounded-xl p-4 flex flex-col gap-4" id="texture_editor_wrapper">
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5 text-orange-500" id="color_palette_icon" />
        <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest" id="editor_title">
          1. Текстурный Композитор (_co map)
        </h2>
      </div>

      {/* Hidden canvas used to process composite */}
      <canvas ref={canvasRef} className="hidden" id="internal_composite_canvas" />

      {/* Image Upload Area */}
      <div className="mb-2" id="upload_block">
        <label className="text-[10px] text-white/50 uppercase block mb-2 font-semibold tracking-wider">
          Базовое изображение изделия
        </label>
        <div className="flex gap-2">
          <button
            id="upload_trigger_btn"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-1.5 px-4 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Загрузить базовый PNG
          </button>
          
          {uploadedImage && (
            <button
              id="clear_upload_btn"
              onClick={clearUploadedImage}
              className="px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-xs text-red-200 rounded transition-colors cursor-pointer"
              title="Сбросить изображение"
            >
              Сброс
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          id="hidden_file_input"
        />
        <p className="text-[10px] text-white/40 mt-1.5 leading-relaxed">
          * Загрузите базовую текстуру DayZ из игры (например, m4_body_co.png) или любую картинку для наложения.
        </p>
      </div>

      {/* Base Color Selection */}
      <div className="mb-2" id="base_color_block">
        <div className="flex justify-between items-center mb-2">
          <label className="text-[10px] text-white/50 uppercase block font-semibold tracking-wider">
            Тонирование / Основной цвет
          </label>
          <span className="font-mono text-xs text-orange-500 font-semibold">{texture.baseColor.toUpperCase()}</span>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative w-12 h-8 rounded overflow-hidden border border-white/10 bg-black/40 shrink-0">
            <input
              type="color"
              value={texture.baseColor}
              onChange={(e) => onChange({ baseColor: e.target.value })}
              className="absolute -inset-2 w-16 h-16 cursor-pointer bg-transparent border-0"
              id="color_picker_input"
            />
          </div>
          <div className="flex flex-wrap gap-1.5" id="presets_colors_grid">
            {['#737c68', '#3b4d3e', '#1c1c1c', '#a5c2d9', '#b38b6d', '#6e5e4d', '#dedede'].map((col) => (
              <button
                key={col}
                id={`preset_color_${col.replace('#', '')}`}
                onClick={() => onChange({ baseColor: col })}
                className="w-6 h-6 rounded border border-white/10 transition-transform cursor-pointer hover:scale-105 active:scale-95"
                style={{ backgroundColor: col }}
                title={col}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Camouflage Selector */}
      <div className="mb-2" id="camouflage_section">
        <div className="flex items-center gap-1.5 mb-2">
          <Layers className="w-3.5 h-3.5 text-orange-400" />
          <label className="text-[10px] text-white/50 uppercase block font-semibold tracking-wider">
            Богемия-Совместимый Камуфляж
          </label>
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-3" id="camo_grid_list">
          {camoStyles.map((style) => (
            <button
              key={style.id}
              id={`camo_style_btn_${style.id}`}
              onClick={() => onChange({ activeCamo: style.id })}
              className={`text-left px-2.5 py-1.5 text-xs font-mono rounded border transition-colors cursor-pointer ${
                texture.activeCamo === style.id
                  ? 'bg-orange-500/5 border-orange-500/60 text-orange-400'
                  : 'bg-black/40 border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>

        {texture.activeCamo !== 'none' && (
          <div className="space-y-4 p-3 bg-black/40 rounded border border-white/10" id="camo_blend_controls">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-white/40 uppercase">Непрозрачность</span>
                <span className="font-mono text-[10px] text-orange-500">{Math.round(texture.camoOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={texture.camoOpacity}
                onChange={(e) => onChange({ camoOpacity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-orange-500"
                id="camo_opacity_range"
              />
            </div>

            <div>
              <span className="block text-[10px] text-white/40 uppercase mb-2">Режим смешивания</span>
              <div className="grid grid-cols-4 gap-1" id="blend_modes_grid">
                {[
                  { id: 'normal', label: 'Over' },
                  { id: 'overlay', label: 'Overlay' },
                  { id: 'multiply', label: 'Mult' },
                  { id: 'soft-light', label: 'Soft' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    id={`blend_mode_btn_${mode.id}`}
                    onClick={() => onChange({ camoBlendMode: mode.id as any })}
                    className={`py-1 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                      texture.camoBlendMode === mode.id
                        ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-bold'
                        : 'bg-black/40 border-white/10 text-white/40 hover:text-white/80'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Adjustments */}
      <div className="space-y-3 pt-3 border-t border-white/10" id="adjustments_controls">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[10px] text-white/50 uppercase font-semibold tracking-wider">Тонкая Коррекция Цвета</span>
        </div>

        {/* Brightness */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
            <span className="text-white/40 uppercase">Яркость</span>
            <span className="text-orange-500 font-bold">{texture.brightness.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="1.7"
            step="0.05"
            value={texture.brightness}
            onChange={(e) => onChange({ brightness: parseFloat(e.target.value) })}
            className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-orange-500"
            id="brightness_range"
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
            <span className="text-white/40 uppercase">Контраст</span>
            <span className="text-orange-500 font-bold">{texture.contrast.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="1.7"
            step="0.05"
            value={texture.contrast}
            onChange={(e) => onChange({ contrast: parseFloat(e.target.value) })}
            className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-orange-500"
            id="contrast_range"
          />
        </div>

        {/* Saturation */}
        <div>
          <div className="flex justify-between items-center mb-1 text-[10px] font-mono">
            <span className="text-white/40 uppercase">Насыщенность</span>
            <span className="text-orange-500 font-bold">{texture.saturation.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.05"
            value={texture.saturation}
            onChange={(e) => onChange({ saturation: parseFloat(e.target.value) })}
            className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-orange-500"
            id="saturation_range"
          />
        </div>

        <button
          id="reset_filters_btn"
          onClick={() => onChange({ brightness: 1.0, contrast: 1.0, saturation: 1.0 })}
          className="w-full flex items-center justify-center gap-1.5 py-1 bg-white/5 hover:bg-white/10 text-[#D1D1D1] border border-white/10 text-xs font-bold rounded transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Сбросить фильтры
        </button>
      </div>
    </div>
  );
}
