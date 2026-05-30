# StrideStack — Design System

> Ciemny, dramatyczny design w stylu sportowego editorial — navy blue jako tło, kremowa biel jako akcent, półprzeźroczyste powierzchnie, grain texture, animacje on-scroll.
> Inspiracja: bam83.webflow.io — storytelling sportowy, duże liczby, filmowy klimat.

---

## Paleta kolorów

| Token CSS          | Wartość                       | Klasa Tailwind       | Użycie                              |
|--------------------|-------------------------------|----------------------|-------------------------------------|
| `--background`     | `#0a1628`                     | `bg-background`      | Główne tło (navy blue)              |
| `--surface`        | `rgba(34, 34, 34, 0.5)`       | `bg-surface`         | Karty, modale, panele               |
| `--surface-raised` | `rgba(34, 34, 34, 0.8)`       | `bg-surface-raised`  | Przyciski, hover, aktywne elementy  |
| `--foreground`     | `#F0EBE3`                     | `text-foreground`    | Tekst główny (ciepła kremowa biel)  |
| `--muted`          | `#5C5855`                     | `text-muted`         | Tekst drugorzędny, etykiety         |
| `--gold`           | `#C8A96E`                     | `text-gold`          | Hero cyfry (Total Distance), wykres |
| `--border-subtle`  | `rgba(240, 235, 227, 0.08)`   | `border-border-subtle` | Wiersze list, subtelne karty      |
| `--border`         | `rgba(240, 235, 227, 0.18)`   | `border-border`      | Kontenery, inputy, zakładki         |
| `--border-strong`  | `rgba(240, 235, 227, 0.55)`   | `border-border-strong` | Aktywne przyciski, separatory     |
| `--danger`         | `#E05444`                     | `text-danger`        | Błędy, usuwanie                     |
| `--success`        | `#5A9E6F`                     | `text-success`       | Sukces, potwierdzenia               |

### Zasady
- Tło zawsze ciemne — navy lub grafitowe powierzchnie, nigdy jasne
- Krem `--foreground` to kolor tekstu i akcentu
- Złoty `--gold` wyłącznie dla hero-cyfr i wykresu
- Inline `style={{}}` z wartościami kolorów — ZABRONIONE; używać tokenów

---

## Typografia

| Rola           | Font       | Klasa           | Styl                                   |
|----------------|------------|-----------------|----------------------------------------|
| Display/nagłówki | Anton    | `font-display`  | All-caps, kondensowane, editorial      |
| Body           | Geist Sans | (domyślna)      | Czysty, neutralny                      |
| Stat numbers   | Anton      | `font-display`  | Ogromne (6xl–[88px]), kremowe lub złote|
| Label/micro    | Geist Sans | `section-label` | 10px, all-caps, letter-spacing 0.14em  |

- Nagłówki sekcji: klasa `.section-label` — label + linia do końca (::after)
- Etykiety: 10px all-caps z letter-spacing, nigdy normalny tekst
- Brak italic wszędzie

---

## Grain texture

CSS overlay na `body::after` — SVG fractalNoise, opacity 0.04, `mix-blend-mode: overlay`.
Definiowany w `globals.css`, nie wymaga żadnych zmian w komponentach.

---

## Layout — Editorial sections

Sekcje oddzielone poziomymi liniami, wielkie cyfry pływają bezpośrednio na tle:

```
WEIGHT ─────────────────────    ← .section-label
128.4 kg                        ← font-display text-6xl

BMI ───────────────────────
22.5  Normal

TOTAL DISTANCE ────────────
247.8 km                        ← font-display text-[88px] text-gold
Run: 180km · Bike: 67.8km
```

Separatory między sekcjami: `border-t border-border` lub `border-t border-border-strong` (mocniejszy).

---

## Utility classes (globals.css)

Gotowe klasy — zmiana w `globals.css` propaguje się na cały interfejs:

| Klasa              | Co robi                                                         |
|--------------------|-----------------------------------------------------------------|
| `.btn-primary`     | `bg-surface-raised` + `border border-border-strong` + krem tekst, `w-full`, padding 14px |
| `.card-surface`    | `bg-surface` + `border border-border-subtle`                   |
| `.input-ui`        | Input z `bg-surface`, `border-border`, `color-scheme: dark`    |
| `.border-dashed-ui`| `border: 2px dashed var(--border)` — upload area               |
| `.robot-wobble`    | `animation: robotWobble 4s ease-in-out infinite`               |
| `.section-label`   | Etykieta 10px all-caps + `::after` linia do końca              |
| `.font-display`    | Anton font family                                              |

---

## Animacje on-scroll (Framer Motion)

```tsx
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

<motion.div
  initial={{ opacity: 0, y: 48 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-60px' }}
  transition={{ duration: 0.65, ease, delay }}
>
```

Wrapper `<Reveal delay={n}>` w `page.tsx` — używać do każdej nowej sekcji.
`once: true` — animacja tylko przy pierwszym wejściu w viewport.

---

## Przyciski

| Typ       | Klasa / styl                                       |
|-----------|----------------------------------------------------|
| Primary   | `.btn-primary`                                     |
| Secondary | `border border-border text-muted hover:text-foreground` |
| Danger    | `bg-danger text-white`                             |
| Toggle aktywny | `bg-surface-raised text-foreground`          |
| Toggle nieaktywny | `text-muted hover:text-foreground`        |

- Brak `border-radius` — kanciaste
- Active: `active:opacity-75`

---

## Karty

Karty (`.card-surface`) tylko tam gdzie muszą grupować elementy — wykres, tabela segmentów.
Dla hero-stats: brak karty, liczba bezpośrednio na tle.

---

## Nawigacja (BottomNav)

- Tło: `bg-background` (navy)
- Border top: `border-t border-border`
- Aktywny link: `text-foreground`
- Nieaktywny: `text-muted`
- Przycisk +: `bg-surface-raised border border-border-strong text-foreground`

---

## Wykres (WeightChart)

- Kontener: `.card-surface`
- Linia danych: `#C8A96E` (gold)
- Siatka: `rgba(240, 235, 227, 0.06)`
- Osie tick: `#5C5855` (muted)
- Tooltip: `bg-surface`, border `border-border`

---

## Mascot — Robot

SVG z kremowym ciałem (`#F0EBE3`) i niebieskimi oczami (`#3B82F6`) — jasny na ciemnym tle.
Klasa `.robot-wobble` na wrapper div. Pozycja: `absolute bottom-4 right-0 pointer-events-none`.

---

## Custom Cursor

Komponent `src/components/CustomCursor.tsx` — tylko na urządzeniach z myszą (`pointer: fine`).

- **Kropka** — 4px, kremowa `#F0EBE3`, podąża natychmiastowo (`stiffness: 2000`)
- **Obwód** — 36px, kremowy, leniwie dogania (`stiffness: 200, damping: 25`)
- **Hover** (przyciski, linki, inputy) — obwód rośnie do 52px i zmienia kolor na złoty `#C8A96E`, kropka też zmienia kolor
- Domyślny kursor ukryty przez `* { cursor: none !important }` w `globals.css` pod `@media (pointer: fine)`
- Na telefonie/touch — bez zmian, natywny kursor (żaden)

---

## Co NIE pasuje do tego designu

- Jasne/kremowe tło — odwrotność obecnego
- Inline `style={{}}` dla wartości designu — używać tokenów i utility classes
- Flat shadow `4px 4px 0px` — niewidoczny na ciemnym tle
- Neonowe kolory, gradienty, glow effects
- `rounded-2xl`, `rounded-3xl` — kanciaste lub max `rounded-sm`
- Animacje scale/rotate
- Dużo kart z tłem — editorial to cyfry na tle
