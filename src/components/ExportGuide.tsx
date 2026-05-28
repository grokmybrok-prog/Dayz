/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle, ExternalLink, Download, FileCode, CheckCircle2 } from 'lucide-react';

interface ExportGuideProps {
  onDownloadAll: () => void;
  canDownload: boolean;
}

export default function ExportGuide({ onDownloadAll, canDownload }: ExportGuideProps) {
  return (
    <div className="bg-[#161618] border border-white/10 rounded-xl p-4 flex flex-col gap-4" id="export_guide_outer">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-orange-500" id="guide_title_icon" />
        <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest" id="export_guide_title">
          Руководство по Запаковке Мода
        </h2>
      </div>

      <div className="space-y-4 text-xs text-[#D1D1D1] leading-relaxed" id="guide_body_main">
        {/* Step 1: Exporting */}
        <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
          <h3 className="font-semibold text-orange-400 mb-1.5 flex items-center gap-1.5 uppercase font-mono text-[10px]">
            <span className="w-4 h-4 rounded-full bg-white/5 text-[9px] text-[#D1D1D1] text-center flex items-center justify-center border border-white/10 font-bold">1</span>
            Экспорт созданных текстур в PNG
          </h3>
          <p className="mb-2 text-[#D1D1D1]/80">
            Используйте кнопки под интерактивным превью (в центре экрана) для сохранения каждого файла.
            Каждый суффикс выполняет строгую задачу в движке DayZ (Enforce Engine):
          </p>
          <ul className="list-disc pl-4 space-y-1.5 font-mono text-[10px] text-[#D1D1D1]/60">
            <li>
              <strong className="text-emerald-400">_co.png</strong> — Цвет изделия (RGB) и прозрачность (Alpha).
            </li>
            <li>
              <strong className="text-emerald-400">_nohq.png</strong> — Карта нормалей (RGB) и Глянец/Отражения (Alpha).
            </li>
            <li>
              <strong className="text-emerald-400">_smdi.png</strong> — Свойства материала. R = Сила спекуляра, G = Гладкость, B = Металличность.
            </li>
          </ul>
        </div>

        {/* Step 2: Converting to BI PAA Format */}
        <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
          <h3 className="font-semibold text-orange-400 mb-1.5 flex items-center gap-1.5 uppercase font-mono text-[10px]">
            <span className="w-4 h-4 rounded-full bg-white/5 text-[9px] text-[#D1D1D1] text-center flex items-center justify-center border border-white/10 font-bold">2</span>
            Конвертация в формат PAA (Теги Богемии)
          </h3>
          <p className="mb-2 text-[#D1D1D1]/80">
            Официальный движок DayZ считывает текстуры только в формате <code className="px-1 py-0.5 bg-black/60 text-orange-500 font-mono text-[10px] border border-white/10 rounded">.paa</code>. Выполните следующее:
          </p>
          <ol className="list-decimal pl-4 space-y-1.5 text-[#D1D1D1]/80">
            <li>Скачайте официальный инструментарий <strong>DayZ Tools</strong> из Steam (вкладка Библиотека &gt; Инструменты).</li>
            <li>Запустите утилиту <strong>TexView 2</strong>.</li>
            <li>Откройте экспортированный PNG-файл (например, <code className="font-mono text-[10px] text-emerald-400">item_co.png</code>).</li>
            <li>Нажмите <strong>File &gt; Save As</strong> и выберите имя с окончанием PAA (<code className="font-mono text-[10px] text-orange-500">item_co.paa</code>).</li>
            <li>
              <em>Важно:</em> <strong className="text-orange-400">Абсолютно критично!</strong> TexView 2 автоматически считает альфа-каналы и преобразует глянцевитость в канале Alpha карты <code className="font-mono">_nohq</code> корректно только если сохранен верный суффикс!
            </li>
          </ol>
        </div>

        {/* Step 3: Mod Folder Layout */}
        <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
          <h3 className="font-semibold text-orange-400 mb-1.5 flex items-center gap-1.5 uppercase font-mono text-[10px]">
            <span className="w-4 h-4 rounded-full bg-white/5 text-[9px] text-[#D1D1D1] text-center flex items-center justify-center border border-white/10 font-bold">3</span>
            Структура Папок Вашего Мода
          </h3>
          <p className="mb-2 text-[#D1D1D1]/80">Ваша папка P-диска или рабочей директории должна иметь следующий вид:</p>
          <div className="bg-[#0F0F11]/80 p-2.5 rounded border border-white/10 font-mono text-[10px] text-[#D1D1D1]/60 space-y-0.5" id="folder_tree_box">
            <div className="text-white">📁 @MyCustomRetexturesMod/</div>
            <div>├── 📁 AddOns/</div>
            <div>│   └── 📄 mymod_data.pbo <span className="text-[#D1D1D1]/40">(Скомпилированная папка)</span></div>
            <div className="text-white">└── 📁 mymod_data/ <span className="text-[#D1D1D1]/40">(Исходник перед компиляцией)</span></div>
            <div>    ├── 📄 config.cpp <span className="text-orange-500 font-bold">(Ваш ИИ-конфиг)</span></div>
            <div>    └── 📁 data/</div>
            <div>        ├── 📄 custom_item_co.paa</div>
            <div>        ├── 📄 custom_item_nohq.paa</div>
            <div>        ├── 📄 custom_item_smdi.paa</div>
            <div>        └── 📄 custom_item.rvmat</div>
          </div>
        </div>

        {/* Step 4: Compiling with Addon Builder */}
        <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
          <h3 className="font-semibold text-orange-400 mb-1.5 flex items-center gap-1.5 uppercase font-mono text-[10px]">
            <span className="w-4 h-4 rounded-full bg-white/5 text-[9px] text-[#D1D1D1] text-center flex items-center justify-center border border-white/10 font-bold">4</span>
            Запаковка в PBO и Пуск
          </h3>
          <ul className="list-disc pl-4 space-y-1 text-[#D1D1D1]/80">
            <li>Запустите <strong>Addon Builder</strong> (входит в DayZ Tools).</li>
            <li>В качестве Source Directory укажите вашу папку <code className="font-mono">mymod_data</code>.</li>
            <li>В Destination Directory укажите <code className="font-mono">@MyCustomRetexturesMod\AddOns</code>.</li>
            <li>Нажмите <strong>Pack</strong>. Сгенерируется готовый PBO файл!</li>
            <li>Для тестирования локально добавьте параметр запуска в DayZ Launcher: <code className="font-mono text-[10px] bg-black/60 px-1.5 py-0.5 border border-white/10 text-orange-500 rounded">-mod=@MyCustomRetexturesMod</code>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
