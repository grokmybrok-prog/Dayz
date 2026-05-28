/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  Download, 
  Eye, 
  Layers, 
  Settings, 
  HelpCircle, 
  Terminal, 
  FolderGit, 
  FileImage, 
  FileText, 
  Hammer,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TextureState, 
  SmdiChannelState, 
  ConfigPromptState 
} from './types';
import TextureEditor from './components/TextureEditor';
import SmdiComposer from './components/SmdiComposer';
import ConfigArchitect from './components/ConfigArchitect';
import ExportGuide from './components/ExportGuide';
import { generateDayzNormalMap } from './utils/textureUtils';

export default function App() {
  // All state buckets inside the studio
  const [texture, setTexture] = useState<TextureState>({
    baseColor: '#5a624f', // Clean tactical camo green
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    activeCamo: 'digital',
    camoOpacity: 0.65,
    camoBlendMode: 'overlay',
  });

  const [smdi, setSmdi] = useState<SmdiChannelState>({
    materialPreset: 'military_fabric',
    specular: 18,
    glossiness: 35,
    metalness: 0,
    aoFactor: 160,
  });

  const [configPrompt, setConfigPrompt] = useState<ConfigPromptState>({
    baseClass: 'M4A1',
    customClass: 'M4A1_TacticalCamo',
    modPrefix: 'Mod_TacticalVenture',
    itemName: 'M4A1 "Chernarus Spec-Ops"',
    category: 'weapon',
    author: 'Ghost_Retexturer',
  });

  // Generated assets URLs
  const [coUrl, setCoUrl] = useState<string>('');
  const [nohqUrl, setNohqUrl] = useState<string>('');
  const [smdiUrl, setSmdiUrl] = useState<string>('');
  const [aiCode, setAiCode] = useState<string>('');

  // Suffix parameters for NormalHQ generator
  const [normalStrength, setNormalStrength] = useState<number>(5.5);
  const [invertNormalY, setInvertNormalY] = useState<boolean>(false);
  
  // Workspace navigation
  const [activeTab, setActiveTab] = useState<'texture' | 'smdi'>('texture');
  const [activePreview, setActivePreview] = useState<'co' | 'nohq' | 'smdi'>('co');

  const hiddenNohqCanvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-calculate Normal map (_nohq) with Gloss in Alpha channel whenever _co or glossiness changes
  useEffect(() => {
    if (!coUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = hiddenNohqCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 512;
      canvas.width = size;
      canvas.height = size;

      // Draw the composed _co texture
      ctx.drawImage(img, 0, 0, size, size);

      // Generate Sobel normal map & inject Glossiness into Alpha channel
      const normalData = generateDayzNormalMap(
        ctx,
        size,
        size,
        normalStrength,
        invertNormalY,
        smdi.glossiness // Enforce Engine standard: Normal Alpha contains Specular Gloss/Smoothness
      );

      ctx.putImageData(normalData, 0, 0);
      setNohqUrl(canvas.toDataURL('image/png'));
    };
    img.src = coUrl;
  }, [coUrl, normalStrength, invertNormalY, smdi.glossiness]);

  // Handle updates safely
  const handleTextureChange = (updates: Partial<TextureState>) => {
    setTexture(prev => ({ ...prev, ...updates }));
  };

  const handleSmdiChange = (updates: Partial<SmdiChannelState>) => {
    setSmdi(prev => ({ ...prev, ...updates }));
  };

  const handlePromptChange = (updates: Partial<ConfigPromptState>) => {
    setConfigPrompt(prev => ({ ...prev, ...updates }));
  };

  // Helper trigger to download a texture with the correct name specification
  const triggerDownload = (dataUrl: string, suffix: string) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    const className = configPrompt.customClass || 'custom_item';
    link.download = `${className.toLowerCase()}${suffix}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#D1D1D1] font-sans overflow-x-hidden" id="app_viewport_root">
      
      {/* Decorative Top Bar Accent lines */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-600 via-orange-500 to-indigo-900" id="top_accent_gradient" />

      {/* Main tactical Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-[#0F0F11] sticky top-0 z-40 backdrop-blur-md" id="main_header_panel">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center font-bold text-black" id="logo_container">
            <Compass className="w-4 h-4 text-black font-bold animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-semibold tracking-tight text-white uppercase flex items-center gap-2" id="project_heading_title">
              DayZ Retexture Studio 
              <span className="text-xs text-orange-500/80 font-mono">v2.8-STABLE</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Active Quick Parameters */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono" id="tactical_parameters_badge">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-orange-500">P: DRIVE ACTIVE</span>
            <span className="text-white/20">|</span>
            <span className="text-white/60">CAMO: {texture.activeCamo.toUpperCase()}</span>
            <span className="text-white/20">|</span>
            <span className="text-white/60">GLOSS: {smdi.glossiness} A</span>
          </div>

          <button
            id="reset_whole_studio_btn"
            onClick={() => {
              setTexture({
                baseColor: '#5a624f',
                brightness: 1.0,
                contrast: 1.0,
                saturation: 1.0,
                activeCamo: 'none',
                camoOpacity: 0.5,
                camoBlendMode: 'overlay',
              });
              setSmdi({
                materialPreset: 'military_fabric',
                specular: 18,
                glossiness: 35,
                metalness: 0,
                aoFactor: 160,
              });
            }}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded transition-colors cursor-pointer"
          >
            СБРОС СТУДИИ
          </button>
        </div>
      </header>

      {/* Main Workspace Layout Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6" id="main_workspace_panel">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="workspace_column_grid">
          
          {/* LEFT PARTITION: Texture and Material State Composers */}
          <div className="lg:col-span-4 flex flex-col gap-4" id="left_partition_controls">
            <div className="flex bg-black/40 p-1 border border-white/10 rounded-lg" id="left_navigation_switches">
              <button
                id="tab_switch_texture_btn"
                onClick={() => setActiveTab('texture')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded uppercase transition-colors cursor-pointer ${
                  activeTab === 'texture'
                    ? 'bg-orange-600 text-white font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                1. Текстура (_co)
              </button>
              <button
                id="tab_switch_smdi_btn"
                onClick={() => setActiveTab('smdi')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded uppercase transition-colors cursor-pointer ${
                  activeTab === 'smdi'
                    ? 'bg-orange-600 text-white font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                2. Физика (_smdi)
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'texture' ? (
                <motion.div
                  key="texture_editor_frame"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  id="texture_editor_animate_wrapper"
                >
                  <TextureEditor
                    texture={texture}
                    onChange={handleTextureChange}
                    onPreviewGenerated={setCoUrl}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="smdi_composer_frame"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  id="smdi_composer_animate_wrapper"
                >
                  <SmdiComposer
                    smdi={smdi}
                    onChange={handleSmdiChange}
                    onPreviewSmdiGenerated={setSmdiUrl}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* MIDDLE PARTITION: Realistic Live Canvas Viewer Screen */}
          <div className="lg:col-span-4 flex flex-col gap-4" id="middle_partition_preview">
            
            {/* Real-time Renderer Box header / tabs */}
            <div className="bg-[#161618] border border-white/10 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden" id="live_viewer_box">
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-orange-500 animate-pulse" />
                  Интерактивный Видеоанализ
                </span>
                <span className="font-mono text-[9px] text-white/40">RES: 512x512 PAA READY</span>
              </div>

              {/* Toggle switch for preview formats */}
              <div className="flex w-full gap-1 bg-black/40 p-1 border border-white/10 rounded" id="preview_format_switchers">
                {[
                  { id: 'co', label: '_co (Diffuse)', url: coUrl },
                  { id: 'nohq', label: '_nohq (NormHQ)', url: nohqUrl },
                  { id: 'smdi', label: '_smdi (Specs)', url: smdiUrl },
                ].map((item) => (
                  <button
                    key={item.id}
                    id={`preview_btn_${item.id}`}
                    onClick={() => setActivePreview(item.id as any)}
                    className={`flex-1 py-1.5 text-[10px] font-mono font-medium rounded text-center transition-colors cursor-pointer ${
                      activePreview === item.id
                        ? 'bg-orange-600 text-white font-bold border border-white/10'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Main Preview Screen viewport */}
              <div className="relative w-full aspect-square bg-[#0F0F11] border border-white/10 rounded overflow-hidden flex items-center justify-center group" id="primary_viewport_box">
                {/* Visual crosshair lines like in game scope */}
                <div className="absolute inset-0 pointer-events-none border border-dashed border-white/5" />
                <div className="absolute top-1/2 left-0 w-full h-[1px] border-t border-dashed border-white/5 pointer-events-none" />
                <div className="absolute left-1/2 top-0 w-[1px] h-full border-l border-dashed border-white/5 pointer-events-none" />

                <AnimatePresence mode="wait">
                  {activePreview === 'co' && coUrl && (
                    <motion.img
                      key="co"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      src={coUrl}
                      className="w-full h-full object-cover select-none selection:bg-transparent"
                      alt="Color Preview"
                      referrerPolicy="no-referrer"
                      id="img_view_co"
                    />
                  )}
                  {activePreview === 'nohq' && nohqUrl && (
                    <motion.img
                      key="nohq"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      src={nohqUrl}
                      className="w-full h-full object-cover select-none selection:bg-transparent"
                      alt="Normal Map Preview"
                      referrerPolicy="no-referrer"
                      id="img_view_nohq"
                    />
                  )}
                  {activePreview === 'smdi' && smdiUrl && (
                    <motion.img
                      key="smdi"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      src={smdiUrl}
                      className="w-full h-full object-cover select-none selection:bg-transparent"
                      alt="SMDI Preset Preview"
                      referrerPolicy="no-referrer"
                      id="img_view_smdi"
                    />
                  )}
                </AnimatePresence>

                {/* Overlaid parameters watermark */}
                <div className="absolute bottom-3 left-3 bg-[#0F0F11]/90 border border-white/10 px-2 py-0.5 rounded font-mono text-[9px] text-orange-400 uppercase tracking-wider" id="preview_metadata_badge">
                  {activePreview === 'co' && 'Color & Camo Composited'}
                  {activePreview === 'nohq' && `NormalHQ | strength ${normalStrength}`}
                  {activePreview === 'smdi' && `SMDI | ${smdi.materialPreset}`}
                </div>
              </div>

              {/* Normal Map tuning parameters (only visible when Normal or SMDI tabs active/relevant) */}
              <div className="w-full p-3 bg-black/45 border border-white/5 rounded-lg space-y-3" id="additional_sobel_tweaks">
                <span className="block text-[10px] uppercase font-bold text-orange-500 tracking-wider">
                  Настройки Генерации NormalHQ (_nohq)
                </span>
                
                <div>
                  <div className="flex justify-between text-[10px] text-white/50 mb-1">
                    <span>Рельефность (Bump Strength)</span>
                    <span className="font-mono text-white/80">{normalStrength.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={normalStrength}
                    onChange={(e) => setNormalStrength(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-orange-500"
                    id="sobel_strength_range"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Инвертировать Ось Y (Green Channel)</span>
                  <button
                    id="toggle_invert_normal_y_btn"
                    onClick={() => setInvertNormalY(!invertNormalY)}
                    className={`px-2 py-1 font-mono text-[10px] rounded border transition-colors cursor-pointer ${
                      invertNormalY
                        ? 'bg-orange-600/30 border-orange-500 text-orange-400 font-bold'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {invertNormalY ? 'ИВЕРТИРОВАНО (DirectX)' : 'СТАНДАРТ (OpenGL)'}
                  </button>
                </div>
              </div>

              {/* Explicit Export Actions for textures */}
              <div className="grid grid-cols-1 gap-2 w-full pt-4 border-t border-white/10" id="individual_export_actions">
                <button
                  id="dl_co_texture_btn"
                  onClick={() => triggerDownload(coUrl, '_co')}
                  className="w-full flex items-center justify-between px-3 py-2 bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 text-xs font-bold rounded transition-colors cursor-pointer uppercase font-mono"
                >
                  <span className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-emerald-400" />
                    Сохранить карту цвета (_co.png)
                  </span>
                  <Download className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  id="dl_nohq_texture_btn"
                  onClick={() => triggerDownload(nohqUrl, '_nohq')}
                  className="w-full flex items-center justify-between px-3 py-2 bg-sky-950/20 border border-sky-500/20 hover:border-sky-500 text-sky-400 text-xs font-bold rounded transition-colors cursor-pointer uppercase font-mono"
                >
                  <span className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-sky-400" />
                    Сохранить карту нормалей (_nohq.png)
                  </span>
                  <Download className="w-4 h-4 text-sky-400" />
                </button>

                <button
                  id="dl_smdi_texture_btn"
                  onClick={() => triggerDownload(smdiUrl, '_smdi')}
                  className="w-full flex items-center justify-between px-3 py-2 bg-purple-950/20 border border-purple-500/20 hover:border-purple-500 text-purple-400 text-xs font-bold rounded transition-colors cursor-pointer uppercase font-mono"
                >
                  <span className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-purple-400" />
                    Сохранить карту материала (_smdi.png)
                  </span>
                  <Download className="w-4 h-4 text-purple-400" />
                </button>
              </div>
            </div>

            {/* Hidden canvas used uniquely to generate DirectX / OpenGL normal maps */}
            <canvas ref={hiddenNohqCanvasRef} className="hidden" id="hidden_nohq_sobel_generator" />
          </div>

          {/* RIGHT PARTITION: CfgBuilder (Gemini Powered) & Packing Instructions */}
          <div className="lg:col-span-4 flex flex-col gap-4" id="right_partition_architect">
            
            <ConfigArchitect
              promptState={configPrompt}
              onChange={handlePromptChange}
              onCodeGenerated={setAiCode}
              generatedCode={aiCode}
            />

            <ExportGuide
              onDownloadAll={() => {}}
              canDownload={!!coUrl}
            />

          </div>

        </div>
      </main>

      {/* Decorative footer status bar */}
      <footer className="h-10 bg-orange-600 px-6 mt-8 flex items-center justify-between text-[10px] font-bold text-black uppercase tracking-tighter" id="main_footer_bar">
        <div className="flex gap-6">
          <span>Project Path: P:\DAYZ_RETEXTURES\WorkDir\ACTIVE_SESSION</span>
          <span>Engine: Enfusion (v2.8 Live)</span>
        </div>
        <div className="hidden sm:block">
          Memory Usage: 420MB / 16GB | ALPHA SYNC: ACTIVE
        </div>
      </footer>
    </div>
  );
}
