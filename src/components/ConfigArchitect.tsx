/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cpu, Server, Copy, Code, Check, HelpCircle, AlertCircle } from 'lucide-react';
import { ConfigPromptState } from '../types';

interface ConfigArchitectProps {
  promptState: ConfigPromptState;
  onChange: (updates: Partial<ConfigPromptState>) => void;
  onCodeGenerated: (code: string) => void;
  generatedCode: string;
}

export default function ConfigArchitect({
  promptState,
  onChange,
  onCodeGenerated,
  generatedCode,
}: ConfigArchitectProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'clothing', label: 'Одежда / Экипировка' },
    { id: 'weapon', label: 'Оружие (Огнестрел)' },
    { id: 'vehicle', label: 'Транспорт / Машины' },
    { id: 'attachment', label: 'Навесное оборудование' },
    { id: 'item', label: 'Базовый предмет' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptState),
      });

      if (!response.ok) {
        throw new Error('Не удалось сгенерировать конфигурационный файл. Просьба проверить backend.');
      }

      const data = await response.json();
      if (data.configText) {
        onCodeGenerated(data.configText);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка подключения к серверу.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Provide high value templates to fill values quickly
  const handleQuickPreset = (type: 'm4' | 'jacket' | 'car') => {
    if (type === 'm4') {
      onChange({
        baseClass: 'M4A1',
        customClass: 'M4A1_CamoBlack',
        itemName: 'M4A1 "Shadow Tactical"',
        category: 'weapon',
        modPrefix: 'Mod_ShadowArms',
      });
    } else if (type === 'jacket') {
      onChange({
        baseClass: 'GorkaJacket_Autumn',
        customClass: 'GorkaJacket_UrbanHunter',
        itemName: 'Куртка Горка "Городской Охотник"',
        category: 'clothing',
        modPrefix: 'Mod_UrbanGear',
      });
    } else if (type === 'car') {
      onChange({
        baseClass: 'Offroad_02',
        customClass: 'Offroad_02_MilitaryRust',
        itemName: 'Внедорожник "Апокалипсис"',
        category: 'vehicle',
        modPrefix: 'Mod_ChernoRides',
      });
    }
  };

  return (
    <div className="bg-[#161618] border border-white/10 rounded-xl p-4 flex flex-col gap-4 h-full" id="config_architect_container">
      <div className="flex items-center gap-2">
        <Cpu className="w-5 h-5 text-orange-500" id="ai_intel_icon" />
        <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest" id="architect_head">
          3. ИИ-Архитектор Мода (config.cpp)
        </h2>
      </div>

      {/* Quick Autofill Presets */}
      <div className="flex flex-wrap gap-1.5 items-center" id="quick_presetting_row">
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider mr-1">Быстрый выбор:</span>
        <button
          id="autofill_preset_m4"
          onClick={() => handleQuickPreset('m4')}
          className="px-2 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded transition-colors cursor-pointer"
        >
          Винтовка M4A1
        </button>
        <button
          id="autofill_preset_jacket"
          onClick={() => handleQuickPreset('jacket')}
          className="px-2 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded transition-colors cursor-pointer"
        >
          Куртка Горка
        </button>
        <button
          id="autofill_preset_car"
          onClick={() => handleQuickPreset('car')}
          className="px-2 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded transition-colors cursor-pointer"
        >
          Внедорожник Offroad
        </button>
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-2 gap-3" id="inputs_form_grid">
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5">
            Категория предмета
          </label>
          <div className="flex gap-1 bg-black/40 p-1 rounded border border-white/10 overflow-x-auto" id="categories_radio_group">
            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`cat_radio_${cat.id}`}
                onClick={() => onChange({ category: cat.id as any })}
                className={`flex-1 whitespace-nowrap px-2 px-1.5 py-1 text-[10px] text-center rounded transition-colors cursor-pointer uppercase ${
                  promptState.category === cat.id
                    ? 'bg-orange-600 text-white font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-white/50 uppercase block font-semibold tracking-wider mb-1">
            Название в HUD игры
          </label>
          <input
            type="text"
            value={promptState.itemName}
            onChange={(e) => onChange({ itemName: e.target.value })}
            placeholder="M4A1 Тактическая"
            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none transition-colors"
            id="item_display_name_input"
          />
        </div>

        <div>
          <label className="block text-[10px] text-white/50 uppercase block font-semibold tracking-wider mb-1">
            Уникальный Префикс Мода
          </label>
          <input
            type="text"
            value={promptState.modPrefix}
            onChange={(e) => onChange({ modPrefix: e.target.value })}
            placeholder="MyMod_Tactical"
            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none transition-colors"
            id="mod_prefix_input"
          />
        </div>

        <div>
          <label className="block text-[10px] text-white/50 uppercase block font-semibold tracking-wider mb-1">
            Ванильный класс-родитель
          </label>
          <input
            type="text"
            value={promptState.baseClass}
            onChange={(e) => onChange({ baseClass: e.target.value })}
            placeholder="M4A1"
            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white focus:border-orange-500 focus:outline-none transition-colors"
            id="parent_class_input"
          />
        </div>

        <div>
          <label className="block text-[10px] text-white/50 uppercase block font-semibold tracking-wider mb-1">
            Ваш новый Кастомный класс
          </label>
          <input
            type="text"
            value={promptState.customClass}
            onChange={(e) => onChange({ customClass: e.target.value })}
            placeholder="MyM4A1_Urban"
            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white focus:border-orange-500 focus:outline-none transition-colors"
            id="custom_class_input"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-[10px] text-white/50 uppercase block font-semibold tracking-wider mb-1">
            Автор мода (для CfgPatches)
          </label>
          <input
            type="text"
            value={promptState.author}
            onChange={(e) => onChange({ author: e.target.value })}
            placeholder="Survivor"
            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none transition-colors"
            id="author_name_input"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-2.5 bg-red-950/30 border border-red-900 rounded text-xs text-red-200 leading-relaxed" id="error_container">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Config compile trigger */}
      <button
        id="generate_config_ai_btn"
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-1.5 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:bg-white/10 disabled:text-neutral-500 text-white text-xs font-bold rounded transition-colors cursor-pointer"
      >
        {loading ? (
          <>
            <Server className="w-3.5 h-3.5 animate-spin text-orange-200" />
            Вычисление связей и скрытых HiddenSelections...
          </>
        ) : (
          <>
            <Code className="w-3.5 h-3.5" />
            Сгенерировать C++ config.cpp через ИИ
          </>
        )}
      </button>

      {/* Compiled output wrapper */}
      <div className="flex-1 min-h-[220px] flex flex-col border border-white/10 rounded bg-[#0F0F11] overflow-hidden" id="compiled_code_preview_frame">
        <div className="flex justify-between items-center bg-[#0F0F11] px-3 py-1.5 border-b border-white/10">
          <span className="text-[9px] font-mono font-bold text-orange-500 tracking-wider flex items-center gap-1.5 uppercase">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
            Config.cpp Generator
          </span>
          {generatedCode && (
            <button
              id="copy_code_btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 transition-colors cursor-pointer font-bold uppercase"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-400" />
                  Скопировано!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  COPY TO CLIPBOARD
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex-1 p-3 overflow-y-auto bg-black/60" id="scrollable_code_viewport">
          {generatedCode ? (
            <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed select-text text-green-500/80">
              {generatedCode}
            </pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40" id="empty_architect_state">
              <Code className="w-8 h-8 text-neutral-700 mb-2 stroke-1 animate-pulse" />
              <p className="text-xs leading-relaxed max-w-xs">
                Введите параметры изделия выше и нажмите сгенерировать. ИИ автоматически определит hiddenSelections и выстроит идеальное дерево классов-наследников мода.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
