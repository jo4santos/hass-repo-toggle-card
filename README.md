# Toggle Confirmation Card

A custom Home Assistant Lovelace card that transforms into red/green confirmation buttons when clicked, providing a clean and intuitive way to confirm actions without modal dialogs.

## Features

- **🔄 Transform Animation**: Card morphs into confirmation buttons when clicked
- **🔴 Red Cancel Button**: Left side with X icon and "Cancelar" text
- **🟢 Green Confirm Button**: Right side with ✓ icon and "Confirmar" text
- **✨ Smooth Animations**: Hover effects, ripples, and transitions
- **🎨 Beautiful Design**: Gradient backgrounds and modern styling
- **⚙️ Visual Editor**: Complete configuration UI in Home Assistant
- **📱 Responsive**: Works on mobile and desktop

## Installation

### Via HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to Frontend
3. Click the three dots menu → Custom repositories
4. Add this URL: `https://github.com/jo4santos/hass-repo-card-counter`
5. Select category: Lovelace
6. Click Add
7. Install "Toggle Confirmation Card"
8. Add the card resource to your dashboard

### Manual Installation

1. Download `toggle-confirmation-card.js` from the `dist/` folder
2. Copy it to `/config/www/` in your Home Assistant installation
3. Add the resource to your dashboard:
   - Go to Settings → Dashboards → Resources
   - Add `/local/toggle-confirmation-card.js` as a JavaScript Module

## Configuration

### Basic Configuration

```yaml
type: custom:toggle-confirmation-card
entity: cover.portao_grande
```

### Full Configuration (matches your current tile card)

```yaml
type: custom:toggle-confirmation-card
entity: cover.portao_grande
name: Abrir / Fechar
icon: mdi:gate
color: red
confirmation:
  text: De certeza que quer ativar o portão GRANDE?
```

## Configuration Options

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `entity` | string | Yes | - | Entity ID to control |
| `name` | string | No | Entity friendly name | Display name for the card |
| `icon` | string | No | Entity icon | Icon to display (mdi:gate, mdi:door, etc.) |
| `color` | string | No | `blue` | Main color theme: red, green, blue, orange |
| `confirmation.text` | string | No | "Are you sure?" | Text shown during confirmation state |

## How It Works

### Normal State
- Shows entity name, icon, and current state
- Styled like a modern tile card
- Hover effects and ripple animations

### Confirmation State (when clicked)
- Card transforms into two large buttons
- **Left (Red)**: Cancel action, returns to normal
- **Right (Green)**: Confirms action and executes toggle
- Beautiful gradient backgrounds and hover effects

### Actions
- **Click card**: Enter confirmation mode
- **Click red button**: Cancel and return to normal
- **Click green button**: Execute `homeassistant.toggle` service and return to normal

## Compared to Standard Tile Card

**Your Current Tile Card:**
```yaml
type: tile
entity: cover.portao_grande
vertical: true
name: Abrir / Fechar
tap_action:
  action: toggle
  confirmation:
    text: De certeza que quer ativar o portão GRANDE?
```

**New Toggle Confirmation Card:**
```yaml
type: custom:toggle-confirmation-card
entity: cover.portao_grande
name: Abrir / Fechar
color: red
confirmation:
  text: De certeza que quer ativar o portão GRANDE?
```

## Advantages

- ✅ **No modal dialogs** - confirmation happens within the card
- ✅ **Large, easy-to-hit buttons** - 50% width each
- ✅ **Clear visual feedback** - red cancel, green confirm
- ✅ **Smooth animations** - professional look and feel
- ✅ **Complete control** - no Home Assistant theme dependencies
- ✅ **Mobile friendly** - large touch targets

## Visual States

1. **Default**: Normal card showing entity info
2. **Hover**: Slight elevation and shadow increase
3. **Confirmation**: Two-button layout with gradients
4. **Button Hover**: Color intensification and elevation
5. **Ripple**: Touch feedback animation

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- All modern mobile browsers

## Support

For issues, feature requests, or contributions, visit the [repository](https://github.com/jo4santos/hass-repo).