class ToggleConfirmationCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.showingConfirmation = false;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this.config || !this._hass) {
      return;
    }

    const entityId = this.config.entity;
    const entity = this._hass.states[entityId];
    const name = this.config.name || (entity ? entity.attributes.friendly_name : entityId);
    const icon = this.config.icon || (entity ? entity.attributes.icon : 'mdi:help');
    const color = this.config.color || 'blue';
    const confirmationText = this.config.confirmation?.text || 'Are you sure?';

    if (this.showingConfirmation) {
      this.shadowRoot.innerHTML = `
        <style>
          .confirmation-container {
            display: flex;
            height: 100%;
            min-height: 100px;
            border-radius: var(--ha-card-border-radius, 12px);
            overflow: hidden;
            box-shadow: var(--ha-card-box-shadow, 0 2px 6px rgba(0,0,0,0.15));
          }
          
          .confirm-button, .cancel-button {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: none;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            color: white;
            transition: all 0.2s ease;
            padding: 20px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .confirm-button {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          }
          
          .confirm-button:hover {
            background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
          }
          
          .cancel-button {
            background: linear-gradient(135deg, #f44336 0%, #da190b 100%);
          }
          
          .cancel-button:hover {
            background: linear-gradient(135deg, #da190b 0%, #c1150a 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
          }
          
          .button-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          
          .button-text {
            font-size: 14px;
            opacity: 0.9;
          }
          
          .confirm-button:active, .cancel-button:active {
            transform: translateY(0);
          }
          
          .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
          }
          
          @keyframes ripple-animation {
            to {
              transform: scale(2);
              opacity: 0;
            }
          }
        </style>
        
        <div class="confirmation-container">
          <button class="cancel-button" @click="${this.handleCancel}">
            <div class="button-icon">✕</div>
            <div class="button-text">Cancelar</div>
          </button>
          <button class="confirm-button" @click="${this.handleConfirm}">
            <div class="button-icon">✓</div>
            <div class="button-text">Confirmar</div>
          </button>
        </div>
      `;
    } else {
      this.shadowRoot.innerHTML = `
        <style>
          .card {
            background: var(--card-background-color, white);
            border-radius: var(--ha-card-border-radius, 12px);
            box-shadow: var(--ha-card-box-shadow, 0 2px 6px rgba(0,0,0,0.15));
            padding: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
            min-height: 100px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          
          .card:active {
            transform: translateY(0);
          }
          
          .icon {
            font-size: 32px;
            color: ${color === 'red' ? '#f44336' : color === 'green' ? '#4CAF50' : color};
            margin-bottom: 12px;
          }
          
          .name {
            font-size: 18px;
            font-weight: 500;
            color: var(--primary-text-color);
            margin-bottom: 8px;
          }
          
          .state {
            font-size: 14px;
            color: var(--secondary-text-color);
            opacity: 0.8;
          }
          
          .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.1);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
          }
          
          @keyframes ripple-animation {
            to {
              transform: scale(2);
              opacity: 0;
            }
          }
        </style>
        
        <div class="card" @click="${this.handleCardClick}">
          <div class="icon">${this.getIcon(icon)}</div>
          <div class="name">${name}</div>
          <div class="state">${entity ? entity.state : 'unavailable'}</div>
        </div>
      `;
    }

    this.addEventListeners();
  }

  addEventListeners() {
    const cancelBtn = this.shadowRoot.querySelector('.cancel-button');
    const confirmBtn = this.shadowRoot.querySelector('.confirm-button');
    const card = this.shadowRoot.querySelector('.card');
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => this.handleCancel(e));
    }
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => this.handleConfirm(e));
    }
    
    if (card) {
      card.addEventListener('click', (e) => this.handleCardClick(e));
    }
  }

  handleCardClick(e) {
    this.createRipple(e);
    this.showingConfirmation = true;
    this.render();
  }

  handleCancel(e) {
    this.createRipple(e);
    this.showingConfirmation = false;
    this.render();
  }

  handleConfirm(e) {
    this.createRipple(e);
    this.showingConfirmation = false;
    
    // Execute the toggle action
    this._hass.callService('homeassistant', 'toggle', {
      entity_id: this.config.entity
    });
    
    this.render();
  }

  createRipple(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }

  getIcon(iconName) {
    // Simple icon mapping - could be expanded
    const iconMap = {
      'mdi:gate': '🚪',
      'mdi:door': '🚪', 
      'mdi:garage': '🏠',
      'mdi:lock': '🔒',
      'mdi:lightbulb': '💡',
      'mdi:power': '⚡',
      'mdi:toggle-switch': '🔘'
    };
    
    return iconMap[iconName] || '🔘';
  }

  getCardSize() {
    return 2;
  }

  static getConfigElement() {
    return document.createElement('toggle-confirmation-card-editor');
  }

  static getStubConfig() {
    return {
      entity: 'cover.portao_grande',
      name: 'Abrir / Fechar',
      color: 'red',
      confirmation: {
        text: 'De certeza que quer ativar o portão GRANDE?'
      }
    };
  }
}

customElements.define('toggle-confirmation-card', ToggleConfirmationCard);

// Add to custom card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'toggle-confirmation-card',
  name: 'Toggle Confirmation Card',
  description: 'Card that transforms into red/green confirmation buttons when clicked',
  preview: false,
  documentationURL: 'https://github.com/jo4santos/hass-repo/tree/main/cards/toggle_confirmation_card',
});

// Configuration editor
class ToggleConfirmationCardEditor extends HTMLElement {
  setConfig(config) {
    this.config = { ...config };
    this.render();
  }

  render() {
    this.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label>Entity (required):</label>
          <input type="text" .value="${this.config.entity || ''}" @change="${this.entityChanged}" 
                 placeholder="cover.portao_grande" style="width: 100%; padding: 8px; margin-top: 4px;">
        </div>
        <div>
          <label>Name (optional):</label>
          <input type="text" .value="${this.config.name || ''}" @change="${this.nameChanged}"
                 placeholder="Abrir / Fechar" style="width: 100%; padding: 8px; margin-top: 4px;">
        </div>
        <div>
          <label>Icon (optional):</label>
          <input type="text" .value="${this.config.icon || ''}" @change="${this.iconChanged}"
                 placeholder="mdi:gate" style="width: 100%; padding: 8px; margin-top: 4px;">
        </div>
        <div>
          <label>Color:</label>
          <select @change="${this.colorChanged}" style="width: 100%; padding: 8px; margin-top: 4px;">
            <option value="red" ${this.config.color === 'red' ? 'selected' : ''}>Red</option>
            <option value="green" ${this.config.color === 'green' ? 'selected' : ''}>Green</option>
            <option value="blue" ${this.config.color === 'blue' ? 'selected' : ''}>Blue</option>
            <option value="orange" ${this.config.color === 'orange' ? 'selected' : ''}>Orange</option>
          </select>
        </div>
        <div>
          <label>Confirmation Text:</label>
          <input type="text" .value="${this.config.confirmation?.text || ''}" @change="${this.confirmationChanged}"
                 placeholder="Are you sure?" style="width: 100%; padding: 8px; margin-top: 4px;">
        </div>
      </div>
    `;
    
    this.addEventListeners();
  }
  
  addEventListeners() {
    this.querySelector('input[placeholder="cover.portao_grande"]')?.addEventListener('change', (e) => this.entityChanged(e));
    this.querySelector('input[placeholder="Abrir / Fechar"]')?.addEventListener('change', (e) => this.nameChanged(e));
    this.querySelector('input[placeholder="mdi:gate"]')?.addEventListener('change', (e) => this.iconChanged(e));
    this.querySelector('select')?.addEventListener('change', (e) => this.colorChanged(e));
    this.querySelector('input[placeholder="Are you sure?"]')?.addEventListener('change', (e) => this.confirmationChanged(e));
  }

  entityChanged(e) {
    this.config = { ...this.config, entity: e.target.value };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config } }));
  }

  nameChanged(e) {
    this.config = { ...this.config, name: e.target.value };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config } }));
  }
  
  iconChanged(e) {
    this.config = { ...this.config, icon: e.target.value };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config } }));
  }

  colorChanged(e) {
    this.config = { ...this.config, color: e.target.value };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config } }));
  }

  confirmationChanged(e) {
    this.config = { 
      ...this.config, 
      confirmation: { text: e.target.value }
    };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config } }));
  }
}

customElements.define('toggle-confirmation-card-editor', ToggleConfirmationCardEditor);