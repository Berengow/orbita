import { useState } from "react";
import {
  CAROUSEL_PLACEMENTS,
  FONTS,
  HOTSPOT_ICONS,
  LOGO_PLACEMENTS,
  MOTIONS,
  NAV_STYLES,
  PRESETS,
  SHAPES,
  SURFACES,
  TRANSITIONS,
} from "@/lib/tour/presets";
import { useTour } from "@/lib/tour/store";
import type { HotspotKind, SceneModules, Theme } from "@/lib/tour/types";
import { Field, Section, SliderRow, SwitchRow, fieldClass } from "./controls";

const MODULES: { key: keyof SceneModules; label: string }[] = [
  { key: "carousel", label: "Карусель сцен" },
  { key: "logo", label: "Логотип" },
  { key: "about", label: "Кнопка «Об аудитории»" },
  { key: "hotspots", label: "Хотспоты" },
  { key: "labels", label: "Подписи точек" },
  { key: "minimap", label: "Мини-карта" },
  { key: "infoCard", label: "Карточка описания" },
  { key: "compass", label: "Компас" },
  { key: "sceneTitle", label: "Название сцены" },
  { key: "arrows", label: "Стрелки сцен" },
  { key: "fullscreen", label: "Полный экран" },
  { key: "loader", label: "Полоса загрузки" },
  { key: "intro", label: "Заставка" },
];

const KIND_LABEL: Record<HotspotKind, string> = {
  scene: "переход",
  info: "текст",
  link: "ссылка",
  image: "кадр",
  video: "видео",
  audio: "звук",
};

export function Settings() {
  const project = useTour((s) => s.project);
  const selectedId = useTour((s) => s.selectedHotspotId);
  const update = useTour((s) => s.update);
  const applyPreset = useTour((s) => s.applyPreset);
  const setLogo = useTour((s) => s.setLogo);
  const setAudio = useTour((s) => s.setAudio);
  const removeHotspot = useTour((s) => s.removeHotspot);
  const setSelected = useTour((s) => s.setSelected);
  const replaceSceneImage = useTour((s) => s.replaceSceneImage);
  const removeScene = useTour((s) => s.removeScene);
  const [open, setOpen] = useState<Record<string, boolean>>({
    look: true,
    scene: true,
    modules: true,
  });

  if (!project) return null;
  const scene = project.scenes.find((item) => item.id === project.activeSceneId) ?? null;
  const hotspot = scene?.hotspots.find((item) => item.id === selectedId) ?? null;
  const theme = project.theme;
  const settings = project.settings;
  const toggle = (key: string) => setOpen((state) => ({ ...state, [key]: !state[key] }));

  return (
    <div className="h-full overflow-auto px-4 pb-8">
      <header className="sticky top-0 z-10 bg-surface pt-4 pb-3">
        <h2 className="text-sm font-medium">Настройки тура</h2>
        <p className="text-2xs text-pretty text-faint">Всё, что включено, сразу видно в центре.</p>
      </header>

      <SwitchRow label="Звук" on={settings.soundEnabled} onChange={(value) => update((draft) => { draft.settings.soundEnabled = value; }, "coalesce", "sound")} />
      <SwitchRow label="Автоповорот" on={settings.autorotate} onChange={(value) => update((draft) => { draft.settings.autorotate = value; }, "coalesce", "spin")} />
      <SwitchRow label="Гироскоп телефона" on={settings.gyro} onChange={(value) => update((draft) => { draft.settings.gyro = value; }, "coalesce", "gyro")} />

      <Section title="Оформление" open={!!open.look} onToggle={() => toggle("look")}>
        <div className="grid grid-cols-3 gap-2 pb-2">
          {PRESETS.map((preset) => {
            const active = theme.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`rounded-lg border px-2 py-2 text-left ${active ? "border-accent" : "border-line"}`}
              >
                <span className="mb-1 flex gap-1">
                  <i className="size-2.5 rounded-full" style={{ background: preset.accent }} />
                  <i className="size-2.5 rounded-full" style={{ background: preset.point }} />
                </span>
                <span className="block text-2xs">{preset.name}</span>
              </button>
            );
          })}
        </div>
        <ColorRow label="Акцент" value={theme.accent} onChange={(value) => update((draft) => { draft.theme.accent = value; draft.theme.preset = "custom"; }, "coalesce", "accent")} />
        <ColorRow label="Панели" value={theme.panel} onChange={(value) => update((draft) => { draft.theme.panel = value; draft.theme.preset = "custom"; }, "coalesce", "panel")} />
        <ColorRow label="Текст" value={theme.text} onChange={(value) => update((draft) => { draft.theme.text = value; draft.theme.preset = "custom"; }, "coalesce", "ink")} />
        <ColorRow label="Точки" value={theme.point} onChange={(value) => update((draft) => { draft.theme.point = value; draft.theme.preset = "custom"; }, "coalesce", "point")} />
        <Field label="Шрифт тура">
          <select className={fieldClass} value={theme.font} onChange={(event) => update((draft) => { draft.theme.font = event.target.value; }, "skip")} style={{ fontFamily: theme.font }}>
            {FONTS.map((font) => (
              <option key={font.id} value={font.id} style={{ fontFamily: font.id }}>{font.label}</option>
            ))}
          </select>
        </Field>
        <SliderRow label="Скругление" min={0} max={28} step={1} value={theme.radius} text={`${theme.radius}px`} onChange={(value) => update((draft) => { draft.theme.radius = value; }, "coalesce", "radius")} />
        <SliderRow label="Плотность" min={0.45} max={1} step={0.01} value={theme.opacity} text={theme.opacity.toFixed(2)} onChange={(value) => update((draft) => { draft.theme.opacity = value; }, "coalesce", "opacity")} />
        <SliderRow label="Размытие" min={0} max={32} step={1} value={theme.blur} text={`${theme.blur}px`} onChange={(value) => update((draft) => { draft.theme.blur = value; }, "coalesce", "blur")} />
        <SliderRow label="Размер точек" min={0.7} max={1.6} step={0.01} value={theme.pointScale} text={theme.pointScale.toFixed(2)} onChange={(value) => update((draft) => { draft.theme.pointScale = value; }, "coalesce", "pscale")} />
        <Field label="Форма точек">
          <select className={fieldClass} value={theme.pointShape} onChange={(event) => update((draft) => { draft.theme.pointShape = event.target.value as typeof theme.pointShape; }, "skip")}>
            {SHAPES.map((shape) => <option key={shape.id} value={shape.id}>{shape.label}</option>)}
          </select>
        </Field>
        <SliderRow label="Масштаб интерфейса" min={0.85} max={1.25} step={0.01} value={theme.uiScale} text={theme.uiScale.toFixed(2)} onChange={(value) => update((draft) => { draft.theme.uiScale = value; }, "coalesce", "uiscale")} />
        <SliderRow label="Тень панелей" min={0} max={48} step={1} value={theme.shadow} text={`${theme.shadow}px`} onChange={(value) => update((draft) => { draft.theme.shadow = value; }, "coalesce", "shadow")} />
        <SliderRow label="Интервалы" min={4} max={24} step={1} value={theme.gap} text={`${theme.gap}px`} onChange={(value) => update((draft) => { draft.theme.gap = value; }, "coalesce", "gap")} />
        <Field label="Движение точек" hint="Общее для всех точек. У отдельной точки можно выбрать своё.">
          <select className={fieldClass} value={theme.hotspotMotion} onChange={(event) => update((draft) => { draft.theme.hotspotMotion = event.target.value as Theme["hotspotMotion"]; }, "skip")}>
            {MOTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Свой CSS" hint="Попадает в тур как есть. Удобно для переменных --orb-accent, --orb-radius, --orb-point.">
          <textarea className={`${fieldClass} min-h-20 font-mono text-xs`} value={theme.customCss} placeholder=".orb-title { letter-spacing: 0.2em; }" onChange={(event) => update((draft) => { draft.theme.customCss = event.target.value.slice(0, 4000); }, "coalesce", "css")} />
        </Field>
        <div className="flex flex-wrap gap-2 py-2">
          <button type="button" className="h-10 rounded-lg border border-line px-3 text-sm" onClick={() => downloadTheme(theme)}>Скачать тему</button>
          <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-line px-3 text-sm">
            Открыть тему
            <input type="file" accept="application/json,.json" className="hidden" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importTheme(file, update);
              event.target.value = "";
            }} />
          </label>
        </div>
      </Section>

      <Section title="Сцена" open={!!open.scene} onToggle={() => toggle("scene")}>
        {scene ? (
          <>
            <Field label="Название">
              <input className={fieldClass} value={scene.name} onChange={(event) => update((draft) => {
                const current = draft.scenes.find((item) => item.id === scene.id);
                if (current) current.name = event.target.value;
              }, "coalesce", "scene-name")} />
            </Field>
            <Field label="Описание на панораме">
              <textarea className={`${fieldClass} min-h-20 resize-y`} value={scene.description} onChange={(event) => update((draft) => {
                const current = draft.scenes.find((item) => item.id === scene.id);
                if (current) current.description = event.target.value;
              }, "coalesce", "scene-text")} />
            </Field>
            <Field label="Группа" hint="Этаж, зона или тема. Нужна для навигации «Группы».">
              <input className={fieldClass} value={scene.group} placeholder="Например, 2 этаж" onChange={(event) => update((draft) => {
                const current = draft.scenes.find((item) => item.id === scene.id);
                if (current) current.group = event.target.value;
              }, "coalesce", "scene-group")} />
            </Field>
            <SwitchRow label="Избранная сцена" hint="Звезда на превью в карусели." on={scene.featured} onChange={(value) => update((draft) => {
              const current = draft.scenes.find((item) => item.id === scene.id);
              if (current) current.featured = value;
            }, "coalesce", "scene-feature")} />
            <ColorRow label="Цвет точек этой сцены" value={scene.pointColor || theme.point} onChange={(value) => update((draft) => {
              const current = draft.scenes.find((item) => item.id === scene.id);
              if (current) current.pointColor = value;
            }, "coalesce", "scene-point")} />
            {scene.pointColor ? (
              <button type="button" className="mb-2 text-sm text-muted" onClick={() => update((draft) => {
                const current = draft.scenes.find((item) => item.id === scene.id);
                if (current) current.pointColor = "";
              })}>Вернуть цвет точек тура</button>
            ) : null}
            <button type="button" className="mb-2 text-sm text-muted" onClick={() => update((draft) => {
              const index = draft.scenes.findIndex((item) => item.id === scene.id);
              const source = draft.scenes[index - 1] ?? draft.scenes[index + 1];
              const current = draft.scenes[index];
              if (!source || !current) return;
              current.modules = structuredClone(source.modules);
              current.group = source.group;
            })}>Скопировать модули соседней сцены</button>
            <div className="flex gap-2 py-2">
              <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-line px-3 text-sm">
                Заменить фото
                <input type="file" accept="image/*" className="hidden" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void replaceSceneImage(scene.id, file);
                  event.target.value = "";
                }} />
              </label>
              <button type="button" className="h-10 px-3 text-sm text-muted" onClick={() => removeScene(scene.id)}>Удалить</button>
            </div>
            <p className="pt-2 text-2xs text-muted">Точки</p>
            <ul className="space-y-1">
              {scene.hotspots.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => setSelected(item.id)} className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm ${item.id === hotspot?.id ? "bg-surface-3" : "hover:bg-surface-2"}`}>
                    <span className="truncate">{item.title || "Без названия"}</span>
                    <span className="text-2xs text-faint">{KIND_LABEL[item.kind]}</span>
                  </button>
                </li>
              ))}
              {scene.hotspots.length === 0 ? <li className="py-2 text-sm text-faint">На панораме пока нет точек.</li> : null}
            </ul>
            {hotspot ? (
              <div id={`hotspot-${hotspot.id}`} className="mt-2 rounded-xl border border-line p-3">
                <Field label="Подпись">
                  <input className={fieldClass} value={hotspot.title} onChange={(event) => update((draft) => {
                    const current = draft.scenes.flatMap((item) => item.hotspots).find((item) => item.id === hotspot.id);
                    if (current) current.title = event.target.value;
                  }, "coalesce", `hs:${hotspot.id}:title`)} />
                </Field>
                {hotspot.kind === "scene" ? (
                  <Field label="Ведёт в сцену">
                    <select className={fieldClass} value={hotspot.targetSceneId} onChange={(event) => update((draft) => {
                      const current = draft.scenes.flatMap((item) => item.hotspots).find((item) => item.id === hotspot.id);
                      if (current) current.targetSceneId = event.target.value;
                    }, "skip")}>
                      {project.scenes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </Field>
                ) : null}
                {hotspot.kind === "link" || hotspot.kind === "image" || hotspot.kind === "video" || hotspot.kind === "audio" ? (
                  <Field label={hotspot.kind === "video" ? "Ссылка на ролик или файл" : hotspot.kind === "audio" ? "Ссылка на аудио" : hotspot.kind === "image" ? "Ссылка на изображение" : "Ссылка"} hint={hotspot.kind === "video" ? "YouTube, Vimeo или прямой адрес файла." : "Только https-адрес. Откроется внутри тура или в новой вкладке."}>
                    <input className={fieldClass} value={hotspot.url} placeholder="https://" onChange={(event) => update((draft) => {
                      const current = draft.scenes.flatMap((item) => item.hotspots).find((item) => item.id === hotspot.id);
                      if (current) current.url = event.target.value;
                    }, "coalesce", `hs:${hotspot.id}:url`)} />
                  </Field>
                ) : null}
                {hotspot.kind !== "scene" ? (
                  <Field label={hotspot.kind === "info" ? "Текст" : "Подпись внутри"}>
                    <textarea className={`${fieldClass} min-h-20`} value={hotspot.text} onChange={(event) => update((draft) => {
                      const current = draft.scenes.flatMap((item) => item.hotspots).find((item) => item.id === hotspot.id);
                      if (current) current.text = event.target.value;
                    }, "coalesce", `hs:${hotspot.id}:text`)} />
                  </Field>
                ) : null}
                <Field label="Значок">
                  <select className={fieldClass} value={hotspot.icon} onChange={(event) => update((draft) => {
                    const current = draft.scenes.flatMap((item) => item.hotspots).find((item) => item.id === hotspot.id);
                    if (current) current.icon = event.target.value as typeof current.icon;
                  }, "skip")}>
                    {HOTSPOT_ICONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </Field>
                <Field label="Анимация">
                  <select className={fieldClass} value={hotspot.motion} onChange={(event) => update((draft) => {
                    const current = draft.scenes.flatMap((item) => item.hotspots).find((item) => item.id === hotspot.id);
                    if (current) current.motion = event.target.value as typeof current.motion;
                  }, "skip")}>
                    <option value="theme">Как в оформлении</option>
                    {MOTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </Field>
                {hotspot.kind !== "scene" ? (
                  <Field label="Как открывается" hint="«Сразу открыть» имеет смысл для внешней ссылки.">
                    <select className={fieldClass} value={hotspot.surface} onChange={(event) => update((draft) => {
                      const current = draft.scenes.flatMap((item) => item.hotspots).find((item) => item.id === hotspot.id);
                      if (current) current.surface = event.target.value as typeof current.surface;
                    }, "skip")}>
                      {SURFACES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                  </Field>
                ) : null}
                <p className="py-1 text-2xs tabular-nums text-faint">yaw {hotspot.yaw.toFixed(1)}° · pitch {hotspot.pitch.toFixed(1)}°</p>
                <button type="button" className="text-sm text-muted" onClick={() => removeHotspot(hotspot.id)}>Удалить точку</button>
              </div>
            ) : null}
          </>
        ) : <p className="text-sm text-muted">Сначала добавьте сцену.</p>}
      </Section>

      <Section title="Модули" open={!!open.modules} onToggle={() => toggle("modules")}>
        {scene ? MODULES.map((item) => (
          <SwitchRow
            key={item.key}
            label={item.label}
            on={scene.modules[item.key]}
            onChange={(value) => update((draft) => {
              const current = draft.scenes.find((entry) => entry.id === scene.id);
              if (current) current.modules[item.key] = value;
            }, "coalesce", `mod:${item.key}`)}
          />
        )) : <p className="text-sm text-muted">Модули включаются для каждой сцены отдельно.</p>}
      </Section>

      <Section title="Камера" open={!!open.camera} onToggle={() => toggle("camera")}>
        <SliderRow label="Скорость автоповорота" min={-8} max={8} step={0.1} value={settings.autorotateSpeed} text={`${settings.autorotateSpeed.toFixed(1)}°/с`} onChange={(value) => update((draft) => { draft.settings.autorotateSpeed = value; }, "coalesce", "speed")} />
        <SliderRow label="Минимальный зум" min={30} max={90} step={1} value={settings.minHfov} text={`${settings.minHfov}°`} onChange={(value) => update((draft) => { draft.settings.minHfov = value; }, "coalesce", "minfov")} />
        <SliderRow label="Максимальный обзор" min={90} max={140} step={1} value={settings.maxHfov} text={`${settings.maxHfov}°`} onChange={(value) => update((draft) => { draft.settings.maxHfov = value; }, "coalesce", "maxfov")} />
        <SliderRow label="Смещение севера" min={0} max={360} step={1} value={settings.northOffset} text={`${settings.northOffset}°`} onChange={(value) => update((draft) => { draft.settings.northOffset = value; }, "coalesce", "north")} />
      </Section>

      <Section title="Логотип" open={!!open.logo} onToggle={() => toggle("logo")}>
        <Field label="Текст">
          <input className={fieldClass} value={settings.logoText} onChange={(event) => update((draft) => { draft.settings.logoText = event.target.value; }, "coalesce", "logotext")} />
        </Field>
        <Field label="Положение">
          <select className={fieldClass} value={settings.logoPlacement} onChange={(event) => update((draft) => { draft.settings.logoPlacement = event.target.value as typeof settings.logoPlacement; }, "skip")}>
            {LOGO_PLACEMENTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <div className="flex gap-2 py-2">
          <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-line px-3 text-sm">
            Загрузить знак
            <input type="file" accept="image/*" className="hidden" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void setLogo(file);
              event.target.value = "";
            }} />
          </label>
          {settings.logoId ? <button type="button" className="text-sm text-muted" onClick={() => void setLogo(null)}>Убрать</button> : null}
        </div>
      </Section>

      <Section title="Об аудитории" open={!!open.about} onToggle={() => toggle("about")}>
        <Field label="Заголовок">
          <input className={fieldClass} value={settings.aboutTitle} onChange={(event) => update((draft) => { draft.settings.aboutTitle = event.target.value; }, "coalesce", "about-title")} />
        </Field>
        <Field label="Текст">
          <textarea className={`${fieldClass} min-h-24`} value={settings.aboutBody} onChange={(event) => update((draft) => { draft.settings.aboutBody = event.target.value; }, "coalesce", "about-body")} />
        </Field>
      </Section>

      <Section title="Навигация" open={!!open.carousel} onToggle={() => toggle("carousel")}>
        <Field label="Тип" hint={NAV_STYLES.find((item) => item.id === settings.nav)?.hint}>
          <select className={fieldClass} value={settings.nav} onChange={(event) => update((draft) => { draft.settings.nav = event.target.value as typeof settings.nav; }, "skip")}>
            {NAV_STYLES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        {settings.nav === "strip" || settings.nav === "side" ? (
          <Field label="Край" hint="Для ленты и колонки. У колонки «снизу» становится левым краем.">
            <select className={fieldClass} value={settings.carouselPlacement} onChange={(event) => update((draft) => { draft.settings.carouselPlacement = event.target.value as typeof settings.carouselPlacement; }, "skip")}>
              {CAROUSEL_PLACEMENTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </Field>
        ) : null}
        <SliderRow label="Размер превью" min={64} max={140} step={2} value={settings.thumbSize} text={`${settings.thumbSize}px`} onChange={(value) => update((draft) => { draft.settings.thumbSize = value; }, "coalesce", "thumb")} />
        <Field label="Переход между сценами">
          <select className={fieldClass} value={settings.transition} onChange={(event) => update((draft) => { draft.settings.transition = event.target.value as typeof settings.transition; }, "skip")}>
            {TRANSITIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <SwitchRow label="Маршрут сам" hint="В просмотре сцены сменяют друг друга. Пауза, пока открыта карточка или заставка." on={settings.guide} onChange={(value) => update((draft) => { draft.settings.guide = value; }, "coalesce", "guide")} />
        <SliderRow label="Пауза маршрута" min={3} max={30} step={1} value={settings.guideSeconds} text={`${settings.guideSeconds} с`} onChange={(value) => update((draft) => { draft.settings.guideSeconds = value; }, "coalesce", "guide-sec")} />
        <SwitchRow label="Ссылка на ракурс" hint="В адресе страницы запоминаются сцена и поворот. На GitHub Pages обновление не сбрасывает зал." on={settings.deepLink} onChange={(value) => update((draft) => { draft.settings.deepLink = value; }, "coalesce", "deeplink")} />
        <SwitchRow label="Без надписи ORBITA" hint="Прячет стандартный знак, если вы не загрузили свой логотип." on={settings.hideBrand} onChange={(value) => update((draft) => { draft.settings.hideBrand = value; }, "coalesce", "brand")} />
      </Section>

      <Section title="Карта" open={!!open.map} onToggle={() => toggle("map")}>
        <p className="text-sm text-pretty text-muted">Включите мини-карту в модулях сцены. В редакторе точки плана можно перетаскивать.</p>
      </Section>

      <Section title="Звук" open={!!open.audio} onToggle={() => toggle("audio")}>
        <p className="pb-2 text-sm text-muted">{settings.audioName || "Дорожка не выбрана"}</p>
        <div className="flex gap-2">
          <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-line px-3 text-sm">
            Загрузить аудио
            <input type="file" accept="audio/*" className="hidden" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void setAudio(file);
              event.target.value = "";
            }} />
          </label>
          {settings.audioId ? <button type="button" className="text-sm text-muted" onClick={() => void setAudio(null)}>Убрать</button> : null}
        </div>
      </Section>

      <Section title="Заставка" open={!!open.intro} onToggle={() => toggle("intro")}>
        <Field label="Заголовок">
          <input className={fieldClass} value={settings.introTitle} onChange={(event) => update((draft) => { draft.settings.introTitle = event.target.value; }, "coalesce", "intro-title")} />
        </Field>
        <Field label="Подзаголовок">
          <textarea className={`${fieldClass} min-h-20`} value={settings.introSubtitle} onChange={(event) => update((draft) => { draft.settings.introSubtitle = event.target.value; }, "coalesce", "intro-sub")} />
        </Field>
        <Field label="Кнопка">
          <input className={fieldClass} value={settings.introButton} onChange={(event) => update((draft) => { draft.settings.introButton = event.target.value; }, "coalesce", "intro-btn")} />
        </Field>
        <p className="text-2xs text-pretty text-faint">Заставка показывается в режиме просмотра у тех сцен, где включён модуль «Заставка».</p>
      </Section>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex h-11 items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <span className="relative size-8 overflow-hidden rounded-md border border-line">
        <input aria-label={label} type="color" value={toHex(value)} onChange={(event) => onChange(event.target.value)} className="absolute -inset-1 size-12 cursor-pointer border-0 bg-transparent p-0" />
      </span>
    </label>
  );
}

function toHex(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#e39b3c";
}

const THEME_KEYS = [
  "accent", "panel", "text", "point", "font", "radius", "opacity", "blur",
  "pointScale", "pointShape", "uiScale", "shadow", "gap", "hotspotMotion", "customCss",
] as const;

function downloadTheme(theme: Theme) {
  const blob = new Blob([JSON.stringify(theme, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "orbita-theme.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function importTheme(file: File, update: (recipe: (draft: { theme: Theme }) => void, hist?: "skip") => void) {
  try {
    const data = JSON.parse(await file.text()) as Partial<Theme>;
    if (!data || typeof data !== "object") return;
    update((draft) => {
      for (const key of THEME_KEYS) {
        if (data[key] !== undefined) draft.theme[key] = data[key] as never;
      }
      draft.theme.preset = "custom";
    }, "skip");
  } catch {
    /* a bad file just leaves the current theme */
  }
}
