# Extractable Components

## Layout Components

## AppShell

- Source: `app/app.js` (`shell`, `currentCrumb`, `navItem`)
- Category: layout
- Description: Persistent SLAKE brand switcher, sidebar navigation, sticky search topbar, attention count, workspace slot, and toast.
- Extractable props: `activeItem` (string, default: `"Production"`), `breadcrumb` (string, default: `"Production"`), `attentionCount` (number, default: `3`), `showToast` (boolean, default: `false`)
- Hardcoded: SLAKE brand mark and description, navigation labels, search placeholder, permission-neutral workspace profile, colors, spacing, and icon geometry

## Basic Components

The prototype's buttons, cards, pills, form controls, thumbnails, evidence chips, and status rows are CSS primitives embedded in the monolithic screen templates. Per the Superdesign workflow, these remain inline rather than being extracted as separate DraftComponents.
