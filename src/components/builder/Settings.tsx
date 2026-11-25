import { useEffect, useState } from "react";
import {
  FONTS,
  HOTSPOT_ICONS,
  MOTIONS,
  NAV_LOOKS,
  NAV_STYLES,
  PRESETS,
  SURFACES,
  TRANSITIONS,
  lookFor,
} from "@/lib/tour/presets";
import { useTour } from "@/lib/tour/store";
import type { HotspotKind, NavStyle, SceneModules, Theme } from "@/lib/tour/types";
import { Field, SliderRow, SwitchRow, fieldClass } from "./controls";
import { ViewThumb } from "./ViewThumb";

const KIND_LABEL: Record<HotspotKind, string> = {
  scene: "переход",
  info: "текст",
  link: "ссылка",
  image: "кадр",
  video: "видео",
  audio: "звук",
};

const MODULES: { key: keyof SceneModules; label: string }[] = [
  { key: "carousel", label: "Карусель" },
  { key: "arrows", label: "Стрелки" },
  { key: "sceneTitle", label: "Название сцены" },
  { key: "labels", label: "Подписи точек" },
  { key: "hotspots", label: "Точки" },
  { key: "infoCard", label: "Карточка описания" },
  { key: "logo", label: "Логотип" },
  { key: "compass", label: "Компас" },
  { key: "minimap", label: "Мини-карта" },
  { key: "fullscreen", label: "Полный экран" },
  { key: "loader", label: "Индикатор загрузки" },
  { key: "intro", label: "Заставка" },
  { key: "about", label: "Кнопка «об аудитории»" },
];

type Tab = "scene" | "hotspot" | "tour" | "carousel" | "design" | "presets";

export function Settings() {
  const project = useTour((s) => s.project);
  const selectedId = useTour((s) => s.selectedHotspotId);
  const update = useTour((s) => s.update);
  const applyPreset = useTour((s) => s.applyPreset);
  const setLogo = useTour((s) => s.setLogo);
  const setSceneThumb = useTour((s) => s.setSceneThumb);
  const urls = useTour((s) => s.urls);
  const setAudio = useTour((s) => s.setAudio);
  const removeHotspot = useTour((s) => s.removeHotspot);
  const replaceSceneImage = useTour((s) => s.replaceSceneImage);
  const removeScene = useTour((s) => s.removeScene);
  const setSelected = useTour((s) => s.setSelected);
  const [tab, setTab] = useState<Tab>("scene");

  useEffect(() => {
    if (selectedId) setTab("hotspot");
  }, [selectedId]);

  if (!project) return null;
  const scene = project.scenes.find((item) => item.id === project.activeSceneId) ?? null;
  const hotspot = scene?.hotspots.find((item) => item.id === selectedId) ?? null;
  const theme = project.theme;
  const settings = project.settings;

  const tabs: { id: Tab; label: string; disabled?: boolean }[] = [
    { id: "scene", label: "Сцена" },
    { id: "hotspot", label: "Точка", disabled: !hotspot },
    { id: "tour", label: "Тур" },
    { id: "carousel", label: "Карусель" },
    { id: "design", label: "Дизайн" },
    { id: "presets", label: "Пресеты" },
  ];

  return (
    <div className="flex h-full flex-col bg-surface">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 px-3 pt-2.5 pb-2 backdrop-blur">
        <div className="flex gap-0.5 overflow-x-auto">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                tab === item.id ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface-2 hover:text-fg"
              } disabled:opacity-30`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-4 pb-10">
        {tab === "scene" && scene && (
          <div className="pt-4 space-y-1">
            <Section title="Сцена">
              <Field label="Название">
                <input className={fieldClass} value={scene.name} onChange={(e) => update((d) => {
                  const s = d.scenes.find((i) => i.id === scene.id);
                  if (s) s.name = e.target.value;
                }, "coalesce", "scene-name")} />
              </Field>
              <Field label="Описание">
                <textarea className={`${fieldClass} min-h-16`} value={scene.description} onChange={(e) => update((d) => {
                  const s = d.scenes.find((i) => i.id === scene.id);
                  if (s) s.description = e.target.value;
                }, "coalesce", "scene-desc")} />
              </Field>
              <Field label="Группа / этаж">
                <input className={fieldClass} value={scene.group} placeholder="1 этаж, Гостиная..." onChange={(e) => update((d) => {
                  const s = d.scenes.find((i) => i.id === scene.id);
                  if (s) s.group = e.target.value;
                }, "coalesce", "scene-group")} />
              </Field>
              <SwitchRow label="Избранная" on={scene.featured} onChange={(v) => update((d) => {
                const s = d.scenes.find((i) => i.id === scene.id);
                if (s) s.featured = v;
              }, "skip")} />
              <Field label="Цвет точек">
                <span className="flex items-center gap-2">
                  <input type="color" aria-label="Цвет точек сцены" value={toHex(scene.pointColor || theme.point)} onChange={(e) => update((d) => {
                    const s = d.scenes.find((i) => i.id === scene.id);
                    if (s) s.pointColor = e.target.value;
                  }, "coalesce", "scene-point")} className="h-8 w-12 cursor-pointer rounded border border-line bg-transparent" />
                  {scene.pointColor ? (
                    <button type="button" className="text-xs text-muted" onClick={() => update((d) => {
                      const s = d.scenes.find((i) => i.id === scene.id);
                      if (s) s.pointColor = "";
                    }, "skip")}>Как в теме</button>
                  ) : <span className="text-2xs text-faint">Как в теме</span>}
                </span>
              </Field>
              <SliderRow label="Поле зрения" value={Math.round(scene.hfov)} min={40} step={1} max={120} text={`${Math.round(scene.hfov)}°`} onChange={(v) => update((d) => {
                const s = d.scenes.find((i) => i.id === scene.id);
                if (s) s.hfov = v;
              }, "coalesce", "scene-hfov")} />
            </Section>
            <Section title="Что показывать на этой сцене">
              {MODULES.map((item) => (
                <SwitchRow
                  key={item.key}
                  label={item.label}
                  on={scene.modules[item.key]}
                  onChange={(v) => update((d) => {
                    const s = d.scenes.find((i) => i.id === scene.id);
                    if (s) s.modules[item.key] = v;
                  }, "skip")}
                />
              ))}
              <button
                type="button"
                className="mt-2 h-8 w-full rounded-lg border border-line text-xs hover:bg-surface-2"
                onClick={() => update((d) => {
                  const src = d.scenes.find((i) => i.id === scene.id);
                  if (!src) return;
                  d.scenes.forEach((item) => {
                    if (item.id !== src.id) item.modules = { ...src.modules };
                  });
                })}
              >
                Скопировать модули на все сцены
              </button>
            </Section>
            <Section title="Точки на сцене">
              {scene.hotspots.length === 0 ? (
                <p className="text-xs text-pretty text-muted">Пока нет. Нажмите «Поставить точку» под панорамой или клавишу H.</p>
              ) : scene.hotspots.map((item) => (
                <button key={item.id} type="button" onClick={() => setSelected(item.id)} className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-2">
                  <span className="min-w-0 truncate">{item.title || KIND_LABEL[item.kind]}</span>
                  <span className="shrink-0 text-2xs text-faint">{KIND_LABEL[item.kind]}</span>
                </button>
              ))}
            </Section>
            <div className="mt-4 flex gap-2">
              <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-line px-3 text-xs hover:bg-surface-2">
                Заменить панораму
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void replaceSceneImage(scene.id, file);
                  e.target.value = "";
                }} />
              </label>
              <button type="button" className="h-8 rounded-lg border border-line px-3 text-xs text-red-400 hover:bg-surface-2" onClick={() => removeScene(scene.id)}>Удалить</button>
            </div>
          </div>
        )}

        {tab === "hotspot" && hotspot && (
          <div className="pt-4 space-y-1">
            <Section title="Точка">
              <Field label="Тип">
                <select className={fieldClass} value={hotspot.kind} onChange={(e) => update((d) => {
                  const hs = d.scenes.find((s) => s.id === scene?.id)?.hotspots.find((h) => h.id === hotspot.id);
                  if (hs) hs.kind = e.target.value as HotspotKind;
                }, "skip")}>
                  {Object.entries(KIND_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </Field>
              <Field label="Заголовок">
                <input className={fieldClass} value={hotspot.title} onChange={(e) => update((d) => {
                  const hs = d.scenes.find((s) => s.id === scene?.id)?.hotspots.find((h) => h.id === hotspot.id);
                  if (hs) hs.title = e.target.value;
                }, "coalesce", "hs-title")} />
              </Field>
              <Field label="Текст">
                <textarea className={`${fieldClass} min-h-20`} value={hotspot.text} onChange={(e) => update((d) => {
                  const hs = d.scenes.find((s) => s.id === scene?.id)?.hotspots.find((h) => h.id === hotspot.id);
                  if (hs) hs.text = e.target.value;
                }, "coalesce", "hs-text")} />
              </Field>
              <p className="-mt-1 mb-2 text-2xs text-faint">Можно простые теги: b, i, a, p, ul, li. Ссылки только https.</p>
              {hotspot.kind === "scene" && (
                <Field label="Целевая сцена">
                  <select className={fieldClass} value={hotspot.targetSceneId} onChange={(e) => update((d) => {
                    const hs = d.scenes.find((s) => s.id === scene?.id)?.hotspots.find((h) => h.id === hotspot.id);
                    if (hs) hs.targetSceneId = e.target.value;
                  }, "skip")}>
                    <option value="">— выбрать —</option>
                    {project.scenes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
              )}
              {(hotspot.kind === "link" || hotspot.kind === "image" || hotspot.kind === "video" || hotspot.kind === "audio") && (
                <Field label="URL">
                  <input className={fieldClass} value={hotspot.url} placeholder="https://..." onChange={(e) => update((d) => {
                    const hs = d.scenes.find((s) => s.id === scene?.id)?.hotspots.find((h) => h.id === hotspot.id);
                    if (hs) hs.url = e.target.value;
                  }, "coalesce", "hs-url")} />
                </Field>
              )}
              <Field label="Иконка">
                <select className={fieldClass} value={hotspot.icon} onChange={(e) => update((d) => {
                  const hs = d.scenes.find((s) => s.id === scene?.id)?.hotspots.find((h) => h.id === hotspot.id);
                  if (hs) hs.icon = e.target.value as typeof hs.icon;
                }, "skip")}>
                  {HOTSPOT_ICONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </Field>
              <Field label="Анимация">
                <select className={fieldClass} value={hotspot.motion} onChange={(e) => update((d) => {
                  const hs = d.scenes.find((s) => s.id === scene?.id)?.hotspots.find((h) => h.id === hotspot.id);
                  if (hs) hs.motion = e.target.value as typeof hs.motion;
                }, "skip")}>
                  <option value="theme">Как в теме</option>
                  {MOTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </Field>
              <Field label="Отображение">
                <select className={fieldClass} value={hotspot.surface} onChange={(e) => update((d) => {
                  const hs = d.scenes.find((s) => s.id === scene?.id)?.hotspots.find((h) => h.id === hotspot.id);
                  if (hs) hs.surface = e.target.value as typeof hs.surface;
                }, "skip")}>
                  {SURFACES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </Field>
              <SwitchRow label="Открывать в новой вкладке" hint="Выключено — карточка над точкой. Включено — новая вкладка." on={hotspot.openInNewTab} onChange={(v) => update((d) => {
                const hs = d.scenes.find((s) => s.id === scene?.id)?.hotspots.find((h) => h.id === hotspot.id);
                if (hs) hs.openInNewTab = v;
              }, "skip")} />
            </Section>
            <Section title="Вид этой точки">
              <Field label="Цвет" hint="Пусто — цвет сцены или темы.">
                <span className="flex items-center gap-2">
                  <input type="color" aria-label="Цвет точки" value={toHex(hotspot.color || scene?.pointColor || theme.point)} onChange={(e) => update((d) => {
                    const hs = d.scenes.find((s) => s.id === scene?.id)?.hotspots.find((h) => h.id === hotspot.id);
                    if (hs) hs.color = e.target.value;
                  }, "coalesce", "hs-color")} className="h-8 w-12 cursor-pointer rounded border border-line bg-transparent" />
                  <button type="button" className="text-xs text-muted" onClick={() => update((d) => {
                    const hs = d.scenes.find((s) => s.id === scene?.id)?.hotspots.find((h) => h.id === hotspot.id);
                    if (hs) hs.color = "";
                  }, "skip")}>{hotspot.color ? "Как в теме" : "Сейчас как в теме"}</button>
                </span>
              </Field>
              <SliderRow label="Размер" value={Math.round((hotspot.scale || 1) * 100)} min={40} step={1} max={240} text={`${Math.round((hotspot.scale || 1) * 100)}%`} onChange={(v) => update((d) => {
                const hs = d.scenes.find((s) => s.id === scene?.id)?.hotspots.find((h) => h.id === hotspot.id);
                if (hs) hs.scale = v / 100;
              }, "coalesce", "hs-scale")} />
            </Section>
            <button type="button" className="mt-3 h-8 w-full rounded-lg border border-line text-xs hover:bg-surface-2" onClick={() => update((d) => {
              const list = d.scenes.find((s) => s.id === scene?.id)?.hotspots ?? [];
              const src = list.find((h) => h.id === hotspot.id);
              if (!src) return;
              list.forEach((h) => {
                if (h.id === src.id) return;
                h.icon = src.icon;
                h.motion = src.motion;
                h.surface = src.surface;
                h.openInNewTab = src.openInNewTab;
                h.color = src.color;
                h.scale = src.scale;
              });
            })}>Скопировать стиль на точки сцены</button>
            <button type="button" className="mt-2 h-8 w-full rounded-lg border border-line text-xs text-red-400 hover:bg-surface-2" onClick={() => removeHotspot(hotspot.id)}>Удалить точку</button>
          </div>
        )}

        {tab === "tour" && (
          <div className="pt-4">
            <Section title="Навигация">
              <Field label="Стартовая сцена" hint="Скачанный сайт и «Просмотр» откроются с неё. Пусто — с той, что открыта сейчас.">
                <select className={fieldClass} value={settings.startSceneId} onChange={(e) => update((d) => { d.settings.startSceneId = e.target.value; }, "skip")}>
                  <option value="">Как сейчас открыта</option>
                  {project.scenes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </Field>
              <p className="mb-2 text-2xs text-muted">Тип, стиль и свои миниатюры — во вкладке «Карусель».</p>
            </Section>

            <Section title="Видимость и положение">
              <SwitchRow label="Скрыть бренд ORBITA" on={settings.hideBrand} onChange={(v) => update((d) => { d.settings.hideBrand = v; }, "skip")} />
            </Section>

            <Section title="Логотип">
              <Field label="Файл логотипа">
                <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-line px-3 text-xs hover:bg-surface-2">
                  {settings.logoId ? "Заменить" : "Загрузить"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void setLogo(file);
                    e.target.value = "";
                  }} />
                </label>
                {settings.logoId && <button type="button" className="ml-2 text-xs text-muted hover:text-fg" onClick={() => setLogo(null)}>Удалить</button>}
              </Field>
              <Field label="Положение">
                <select className={fieldClass} value={settings.logoPlacement} onChange={(e) => update((d) => { d.settings.logoPlacement = e.target.value as typeof settings.logoPlacement; }, "skip")}>
                  <option value="top-left">Сверху слева</option>
                  <option value="top-center">Сверху по центру</option>
                  <option value="top-right">Сверху справа</option>
                </select>
              </Field>
              <Field label="Текст рядом с логотипом">
                <input className={fieldClass} value={settings.logoText} onChange={(e) => update((d) => { d.settings.logoText = e.target.value; }, "coalesce", "logo-text")} />
              </Field>
            </Section>

            <Section title="Поведение">
              <SwitchRow label="Автоповорот" on={settings.autorotate} onChange={(v) => update((d) => { d.settings.autorotate = v; }, "skip")} />
              <SliderRow label="Скорость поворота" value={settings.autorotateSpeed} min={-8} step={0.1} max={8} text={settings.autorotateSpeed.toFixed(1)} onChange={(v) => update((d) => { d.settings.autorotateSpeed = v; }, "coalesce", "spin-speed")} />
              <SwitchRow label="Гироскоп (мобильные)" on={settings.gyro} onChange={(v) => update((d) => { d.settings.gyro = v; }, "skip")} />
              <SwitchRow label="Звук" on={settings.soundEnabled} onChange={(v) => update((d) => { d.settings.soundEnabled = v; }, "skip")} />
              <SwitchRow label="Гид (автопереход)" on={settings.guide} onChange={(v) => update((d) => { d.settings.guide = v; }, "skip")} />
              {settings.guide ? (
                <SliderRow label="Секунд на сцену" value={settings.guideSeconds} min={3} step={1} max={60} text={`${settings.guideSeconds} с`} onChange={(v) => update((d) => { d.settings.guideSeconds = v; }, "coalesce", "guide-sec")} />
              ) : null}
              <SwitchRow label="Deep link (хеш в URL)" on={settings.deepLink} onChange={(v) => update((d) => { d.settings.deepLink = v; }, "skip")} />
              <SliderRow label="Север, градусы" value={settings.northOffset} min={0} step={1} max={360} text={`${Math.round(settings.northOffset)}°`} onChange={(v) => update((d) => { d.settings.northOffset = v; }, "coalesce", "north")} />
              <SliderRow label="Мин. зум" value={settings.minHfov} min={30} step={1} max={90} text={`${Math.round(settings.minHfov)}°`} onChange={(v) => update((d) => { d.settings.minHfov = v; }, "coalesce", "minfov")} />
              <SliderRow label="Макс. зум" value={settings.maxHfov} min={70} step={1} max={140} text={`${Math.round(settings.maxHfov)}°`} onChange={(v) => update((d) => { d.settings.maxHfov = v; }, "coalesce", "maxfov")} />
              <SliderRow label="Размер логотипа" value={Math.round(settings.logoScale * 100)} min={60} step={1} max={200} text={`${Math.round(settings.logoScale * 100)}%`} onChange={(v) => update((d) => { d.settings.logoScale = v / 100; }, "coalesce", "logo-scale")} />
              <SliderRow label="Размер названия" value={Math.round(settings.titleScale * 100)} min={70} step={1} max={180} text={`${Math.round(settings.titleScale * 100)}%`} onChange={(v) => update((d) => { d.settings.titleScale = v / 100; }, "coalesce", "title-scale")} />
            </Section>
            <Section title="Заставка">
              <Field label="Заголовок">
                <input className={fieldClass} value={settings.introTitle} onChange={(e) => update((d) => { d.settings.introTitle = e.target.value; }, "coalesce", "intro-title")} />
              </Field>
              <Field label="Подзаголовок">
                <textarea className={`${fieldClass} min-h-16`} value={settings.introSubtitle} onChange={(e) => update((d) => { d.settings.introSubtitle = e.target.value; }, "coalesce", "intro-sub")} />
              </Field>
              <Field label="Кнопка">
                <input className={fieldClass} value={settings.introButton} onChange={(e) => update((d) => { d.settings.introButton = e.target.value; }, "coalesce", "intro-btn")} />
              </Field>
              <p className="text-2xs text-faint">Показывается, если на сцене включён модуль «Заставка».</p>
            </Section>
            <Section title="Об аудитории">
              <Field label="Заголовок кнопки">
                <input className={fieldClass} value={settings.aboutTitle} onChange={(e) => update((d) => { d.settings.aboutTitle = e.target.value; }, "coalesce", "about-title")} />
              </Field>
              <Field label="Текст">
                <textarea className={`${fieldClass} min-h-20`} value={settings.aboutBody} onChange={(e) => update((d) => { d.settings.aboutBody = e.target.value; }, "coalesce", "about-body")} />
              </Field>
            </Section>

            <Section title="Звук">
              <Field label="Фоновый трек">
                <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-line px-3 text-xs hover:bg-surface-2">
                  {settings.audioId ? "Заменить" : "Загрузить"}
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void setAudio(file);
                    e.target.value = "";
                  }} />
                </label>
                {settings.audioId && <button type="button" className="ml-2 text-xs text-muted hover:text-fg" onClick={() => setAudio(null)}>Удалить</button>}
              </Field>
            </Section>
          </div>
        )}

        {tab === "carousel" && (
          <div className="pt-4">
            <Section title="Тип">
              <div className="grid gap-1.5">
                {NAV_STYLES.map((nav) => (
                  <button
                    key={nav.id}
                    type="button"
                    onClick={() => update((d) => { d.settings.nav = nav.id; }, "skip")}
                    className={`rounded-lg border px-3 py-2 text-left ${settings.nav === nav.id ? "border-accent bg-accent/10" : "border-line hover:bg-surface-2"}`}
                  >
                    <span className="block text-sm font-medium">{nav.label}</span>
                    <span className="mt-0.5 block text-2xs text-muted">{nav.hint}</span>
                  </button>
                ))}
              </div>
            </Section>
            <Section title={`Стиль · ${NAV_STYLES.find((item) => item.id === settings.nav)?.label}`}>
              <p className="mb-2 text-2xs text-muted">Стиль запоминается отдельно для каждого типа.</p>
              <div className="grid gap-1.5">
                {NAV_LOOKS[settings.nav].map((look) => {
                  const active = lookFor(settings.nav, settings.navLooks) === look.id;
                  return (
                    <button
                      key={look.id}
                      type="button"
                      onClick={() => update((d) => {
                        d.settings.navLooks = { ...d.settings.navLooks, [d.settings.nav]: look.id };
                      }, "skip")}
                      className={`rounded-lg border px-3 py-2 text-left ${active ? "border-accent bg-accent/10" : "border-line hover:bg-surface-2"}`}
                    >
                      <LookMark id={look.id} />
                      <span className="mt-1.5 block text-sm font-medium">{look.label}</span>
                      <span className="block text-2xs text-muted">{look.hint}</span>
                    </button>
                  );
                })}
              </div>
            </Section>
            <Section title="Карточка">
              <p className="mb-2 text-2xs text-pretty text-muted">Во всех типах одна и та же карточка, что в поиске: кадр, имя и текст. Меняется только раскладка.</p>
              <SwitchRow label="Строка поиска" hint="В типе «Поиск» поле есть всегда. Включите, чтобы оно появилось и в остальных." on={settings.navFilter} onChange={(v) => update((d) => { d.settings.navFilter = v; }, "skip")} />
              <Field label="Текст карточки">
                <select className={fieldClass} value={settings.navDetail} onChange={(e) => update((d) => { d.settings.navDetail = e.target.value as typeof settings.navDetail; }, "skip")}>
                  <option value="none">Без текста</option>
                  <option value="name">Только имя</option>
                  <option value="note">Имя и описание</option>
                  <option value="full">Имя, описание и группа</option>
                </select>
              </Field>
              <Field label="Плотность">
                <select className={fieldClass} value={settings.navDensity} onChange={(e) => update((d) => { d.settings.navDensity = e.target.value as typeof settings.navDensity; }, "skip")}>
                  <option value="compact">Компактно</option>
                  <option value="regular">Обычно</option>
                  <option value="comfy">Просторно</option>
                </select>
              </Field>
              <Field label="Форма кадра">
                <select className={fieldClass} value={settings.navImage} onChange={(e) => update((d) => { d.settings.navImage = e.target.value as typeof settings.navImage; }, "skip")}>
                  <option value="rounded">Скруглённый</option>
                  <option value="square">Прямой</option>
                  <option value="circle">Круг</option>
                </select>
              </Field>
              <SliderRow label="Ширина карточки" value={settings.navCardWidth} min={160} step={2} max={340} text={`${settings.navCardWidth}px`} onChange={(v) => update((d) => { d.settings.navCardWidth = v; }, "coalesce", "cardw")} />
              <SliderRow label="Отступ" value={settings.navGap} min={2} step={1} max={24} text={`${settings.navGap}px`} onChange={(v) => update((d) => { d.settings.navGap = v; }, "coalesce", "cardgap")} />
              <SwitchRow label="Номер сцены" hint="Маленькая цифра порядка перед названием." on={settings.navIndex} onChange={(v) => update((d) => { d.settings.navIndex = v; }, "skip")} />
              <SliderRow label="Размер текста" value={settings.navTextSize} min={10} step={1} max={22} text={`${settings.navTextSize}px`} onChange={(v) => update((d) => { d.settings.navTextSize = v; }, "coalesce", "cardtext")} />
              <SliderRow label="Скругление карточки" value={settings.navRadius} min={0} step={1} max={28} text={`${settings.navRadius}px`} onChange={(v) => update((d) => { d.settings.navRadius = v; }, "coalesce", "cardr")} />
              <Field label="Цвет текста" hint="Пустое значение — цвет темы.">
                <div className="flex items-center gap-2">
                  <input type="color" className="h-9 w-12 cursor-pointer rounded-md border border-line bg-transparent" value={settings.navTextColor || "#ffffff"} onChange={(e) => update((d) => { d.settings.navTextColor = e.target.value; }, "skip")} />
                  <button type="button" className="h-8 rounded-md border border-line px-2 text-2xs hover:bg-surface-2" onClick={() => update((d) => { d.settings.navTextColor = ""; }, "skip")}>Как в теме</button>
                </div>
              </Field>
            </Section>
            <Section title="Поведение">
              <SwitchRow label="Плавная прокрутка" hint="Лента едет плавно. Выключите, если нужен мгновенный сдвиг." on={settings.navSmooth} onChange={(v) => update((d) => { d.settings.navSmooth = v; }, "skip")} />
              <SwitchRow label="Стрелки перехода" hint="Кнопки предыдущей и следующей панорамы." on={settings.navArrows} onChange={(v) => update((d) => { d.settings.navArrows = v; }, "skip")} />
              <SwitchRow label="Стрелки прокрутки" hint="Маленькие стрелки по краям ленты." on={settings.navNudge} onChange={(v) => update((d) => { d.settings.navNudge = v; }, "skip")} />
              <SwitchRow label="Затемнение краёв" hint="Подсказка, что ленту можно листать дальше." on={settings.navFade} onChange={(v) => update((d) => { d.settings.navFade = v; }, "skip")} />
            </Section>
            <Section title="Размер и положение">
              <Field label="Положение" hint="Для ленты, колонки и плавающей. Сетка и шторка открываются своей кнопкой.">
                <select className={fieldClass} value={settings.carouselPlacement} onChange={(e) => update((d) => { d.settings.carouselPlacement = e.target.value as typeof settings.carouselPlacement; }, "skip")}>
                  <option value="bottom">Снизу</option>
                  <option value="left">Слева</option>
                  <option value="right">Справа</option>
                </select>
              </Field>
              <Field label="Переход между сценами">
                <select className={fieldClass} value={settings.transition} onChange={(e) => update((d) => { d.settings.transition = e.target.value as typeof settings.transition; }, "skip")}>
                  {TRANSITIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </Field>
              <SliderRow label="Размер превью" value={settings.thumbSize} min={48} step={1} max={240} text={`${settings.thumbSize}px`} onChange={(v) => update((d) => { d.settings.thumbSize = v; }, "coalesce", "thumb")} />
              <SliderRow label="Ширина карусели" value={settings.navRail} min={320} step={10} max={1400} text={`${settings.navRail}px`} onChange={(v) => update((d) => { d.settings.navRail = v; }, "coalesce", "rail")} />
              <SliderRow label="Плотность панели" value={Math.round(settings.navOpacity * 100)} min={35} step={1} max={100} text={`${Math.round(settings.navOpacity * 100)}%`} onChange={(v) => update((d) => { d.settings.navOpacity = v / 100; }, "coalesce", "navop")} />
              <ColorRow label="Фон карусели" value={settings.navBg || theme.panel} onChange={(v) => update((d) => { d.settings.navBg = v; }, "skip")} />
              <button type="button" className="mb-2 text-2xs text-muted" onClick={() => update((d) => { d.settings.navBg = ""; }, "skip")}>Фон как в теме</button>
              <ColorRow label="Обводка" value={settings.navBorder || theme.text} onChange={(v) => update((d) => { d.settings.navBorder = v; }, "skip")} />
              <button type="button" className="mb-2 text-2xs text-muted" onClick={() => update((d) => { d.settings.navBorder = ""; }, "skip")}>Обводка как в теме</button>
              <ColorRow label="Активная карточка" value={settings.navActive || theme.accent} onChange={(v) => update((d) => { d.settings.navActive = v; }, "skip")} />
              <button type="button" className="mb-2 text-2xs text-muted" onClick={() => update((d) => { d.settings.navActive = ""; }, "skip")}>Активная как в теме</button>
            </Section>
            <Section title="Миниатюры">
              <p className="mb-2 text-2xs text-pretty text-muted">По умолчанию кадр стартового ракурса. Своя картинка заменяет его только в карусели.</p>
              <div className="space-y-2">
                {project.scenes.map((item) => {
                  const custom = Boolean(item.thumbId && urls[item.thumbId]);
                  const src = custom ? urls[item.thumbId] : urls[item.imageId];
                  return (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="pano-thumb h-11 w-16 shrink-0 rounded-md">
                        {src ? <ViewThumb src={src} yaw={item.yaw} pitch={item.pitch} hfov={item.hfov} custom={custom} /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs">{item.name}</span>
                        <input
                          className={`${fieldClass} mt-1 h-7 text-2xs`}
                          value={item.caption}
                          placeholder="Своя подпись"
                          onChange={(e) => update((d) => {
                            const scene = d.scenes.find((entry) => entry.id === item.id);
                            if (scene) scene.caption = e.target.value;
                          }, "coalesce", "caption-" + item.id)}
                        />
                      </span>
                      <label className="inline-flex h-7 cursor-pointer items-center rounded-md border border-line px-2 text-2xs hover:bg-surface-2">
                        Своя
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void setSceneThumb(item.id, file);
                          e.target.value = "";
                        }} />
                      </label>
                      {item.thumbId ? (
                        <button type="button" className="h-7 rounded-md px-1.5 text-2xs text-muted hover:text-fg" onClick={() => void setSceneThumb(item.id, null)}>Сброс</button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        )}

        {tab === "design" && (
          <div className="pt-4">
            <Section title="Цвета">
              <ColorRow label="Акцент" value={theme.accent} onChange={(v) => update((d) => { d.theme.accent = v; d.theme.preset = "custom"; }, "coalesce", "accent")} />
              <ColorRow label="Панели" value={theme.panel} onChange={(v) => update((d) => { d.theme.panel = v; d.theme.preset = "custom"; }, "coalesce", "panel")} />
              <ColorRow label="Текст" value={theme.text} onChange={(v) => update((d) => { d.theme.text = v; d.theme.preset = "custom"; }, "coalesce", "ink")} />
              <ColorRow label="Точки" value={theme.point} onChange={(v) => update((d) => { d.theme.point = v; d.theme.preset = "custom"; }, "coalesce", "point")} />
            </Section>
            <Section title="Типографика и форма">
              <Field label="Шрифт">
                <select className={fieldClass} value={theme.font} onChange={(e) => update((d) => { d.theme.font = e.target.value; d.theme.preset = "custom"; }, "skip")}>
                  {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </Field>
              <SliderRow label="Скругление" value={theme.radius} min={0} step={1} max={28} text={`${theme.radius}px`} onChange={(v) => update((d) => { d.theme.radius = v; d.theme.preset = "custom"; }, "coalesce", "radius")} />
              <SliderRow label="Прозрачность панелей" value={Math.round(theme.opacity * 100)} min={45} step={1} max={100} text={`${Math.round(theme.opacity * 100)}%`} onChange={(v) => update((d) => { d.theme.opacity = v / 100; d.theme.preset = "custom"; }, "coalesce", "opacity")} />
              <SliderRow label="Размытие" value={theme.blur} min={0} step={1} max={32} text={`${theme.blur}px`} onChange={(v) => update((d) => { d.theme.blur = v; d.theme.preset = "custom"; }, "coalesce", "blur")} />
              <SliderRow label="Масштаб UI" value={Math.round(theme.uiScale * 100)} min={85} step={1} max={125} text={`${Math.round(theme.uiScale * 100)}%`} onChange={(v) => update((d) => { d.theme.uiScale = v / 100; d.theme.preset = "custom"; }, "coalesce", "scale")} />
              <SliderRow label="Тень панелей" value={theme.shadow} min={0} step={1} max={48} text={`${theme.shadow}px`} onChange={(v) => update((d) => { d.theme.shadow = v; d.theme.preset = "custom"; }, "coalesce", "shadow")} />
              <SliderRow label="Интервал темы" value={theme.gap} min={4} step={1} max={24} text={`${theme.gap}px`} onChange={(v) => update((d) => { d.theme.gap = v; d.theme.preset = "custom"; }, "coalesce", "gap")} />
            </Section>
            <Section title="Точки">
              <SliderRow label="Размер" value={Math.round(theme.pointScale * 100)} min={40} step={1} max={240} text={`${Math.round(theme.pointScale * 100)}%`} onChange={(v) => update((d) => { d.theme.pointScale = v / 100; d.theme.preset = "custom"; }, "coalesce", "pscale")} />
              <SliderRow label="Толщина обводки" value={theme.pointBorder} min={0} step={1} max={8} text={`${theme.pointBorder}px`} onChange={(v) => update((d) => { d.theme.pointBorder = v; d.theme.preset = "custom"; }, "coalesce", "pborder")} />
              <SliderRow label="Размер подписи" value={Math.round(theme.labelScale * 100)} min={70} step={1} max={180} text={`${Math.round(theme.labelScale * 100)}%`} onChange={(v) => update((d) => { d.theme.labelScale = v / 100; d.theme.preset = "custom"; }, "coalesce", "label")} />
              <Field label="Форма">
                <select className={fieldClass} value={theme.pointShape} onChange={(e) => update((d) => { d.theme.pointShape = e.target.value as typeof theme.pointShape; d.theme.preset = "custom"; }, "skip")}>
                  <option value="circle">Круг</option>
                  <option value="diamond">Ромб</option>
                  <option value="square">Квадрат</option>
                </select>
              </Field>
              <Field label="Анимация по умолчанию">
                <select className={fieldClass} value={theme.hotspotMotion} onChange={(e) => update((d) => { d.theme.hotspotMotion = e.target.value as typeof theme.hotspotMotion; }, "skip")}>
                  {MOTIONS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </Field>
            </Section>
            <Section title="Дополнительно">
              <Field label="Свой CSS">
                <textarea className={`${fieldClass} min-h-24 font-mono text-xs`} value={theme.customCss} placeholder=".orb-thumb { border-radius: 16px; }" onChange={(e) => update((d) => { d.theme.customCss = e.target.value; }, "coalesce", "css")} />
              </Field>
              <div className="mt-2 flex gap-2">
                <button type="button" className="h-8 rounded-lg border border-line px-3 text-xs" onClick={() => downloadTheme(theme)}>Экспорт темы</button>
                <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-line px-3 text-xs">
                  Импорт
                  <input type="file" accept=".json" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void importTheme(file, update);
                    e.target.value = "";
                  }} />
                </label>
              </div>
            </Section>
          </div>
        )}

        {tab === "presets" && (
          <div className="pt-4">
            <Section title="Темы оформления">
              <div className="inspector-grid grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => {
                  const active = theme.preset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={`group rounded-xl border p-2.5 text-left transition-colors ${active ? "border-accent bg-accent/10" : "border-line hover:border-muted hover:bg-surface-2"}`}
                    >
                      <span className="mb-2 flex gap-1.5">
                        <i className="size-3.5 rounded-full border border-white/20" style={{ background: preset.accent }} />
                        <i className="size-3.5 rounded-full border border-white/20" style={{ background: preset.panel }} />
                        <i className="size-3.5 rounded-full border border-white/20" style={{ background: preset.text }} />
                      </span>
                      <span className="block text-sm font-medium">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </Section>
            <Section title="Быстрые стили навигации">
              <div className="inspector-grid grid grid-cols-2 gap-2">
                {NAV_STYLES.map((nav) => (
                  <button
                    key={nav.id}
                    type="button"
                    onClick={() => update((d) => { d.settings.nav = nav.id; }, "skip")}
                    className={`rounded-lg border px-3 py-2 text-left text-xs ${settings.nav === nav.id ? "border-accent bg-accent/10" : "border-line hover:bg-surface-2"}`}
                  >
                    <span className="block font-medium">{nav.label}</span>
                    <span className="mt-0.5 block text-2xs text-muted line-clamp-2">{nav.hint}</span>
                  </button>
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function LookMark({ id }: { id: string }) {
  if (id === "chips" || id === "bubbles") {
    return (
      <span className="flex gap-1">
        <i className="size-4 rounded-full bg-fg/80" />
        <i className="size-4 rounded-full bg-fg/40" />
        <i className="size-4 rounded-full bg-fg/20" />
      </span>
    );
  }
  if (id === "polaroid") {
    return (
      <span className="flex gap-1">
        <i className="h-5 w-4 rounded-sm bg-[#f6f1ea] shadow-sm" />
        <i className="h-5 w-4 rounded-sm bg-[#f6f1ea]/70" />
      </span>
    );
  }
  if (id === "cinema" || id === "posters") {
    return (
      <span className="flex gap-1">
        <i className="h-4 w-7 rounded-sm bg-fg/70" />
        <i className="h-4 w-7 rounded-sm bg-fg/35" />
      </span>
    );
  }
  return (
    <span className="flex gap-1">
      <i className="h-4 w-6 rounded bg-fg/70" />
      <i className="h-4 w-6 rounded bg-fg/40" />
      <i className="h-4 w-6 rounded bg-fg/20" />
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex h-10 items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <span className="relative size-7 overflow-hidden rounded-md border border-line">
        <input aria-label={label} type="color" value={toHex(value)} onChange={(e) => onChange(e.target.value)} className="absolute -inset-1 size-10 cursor-pointer border-0 bg-transparent p-0" />
      </span>
    </label>
  );
}

function toHex(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#e39b3c";
}

const THEME_KEYS = [
  "accent", "panel", "text", "point", "font", "radius", "opacity", "blur",
  "pointScale", "pointShape", "uiScale", "shadow", "gap", "hotspotMotion", "customCss", "pointBorder", "labelScale",
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
    /* ignore bad files */
  }
}
