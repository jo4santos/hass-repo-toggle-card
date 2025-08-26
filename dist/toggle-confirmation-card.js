class ToggleConfirmationCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.showingConfirmation = false;
    this.resetTimer = null;
    this.timeRemaining = 0;
    this.timerInterval = null;
  }

  setConfig(config) {
    if (!config.card) {
      throw new Error('You need to define a card configuration to wrap');
    }
    this.config = config;
    this.createWrappedCard();
  }
  
  async createWrappedCard() {
    if (this.wrappedCardElement) {
      this.wrappedCardElement.remove();
    }
    
    const cardConfig = this.config.card;
    const cardType = cardConfig.type;
    
    // Handle custom card types by waiting for them to be defined
    if (cardType.includes('custom:')) {
      const elementName = cardType.replace('custom:', '');
      if (!customElements.get(elementName)) {
        console.warn(`Custom card ${elementName} not yet loaded, waiting...`);
        await customElements.whenDefined(elementName);
      }
      this.wrappedCardElement = document.createElement(elementName);
    } else {
      // Handle built-in card types
      const elementName = `hui-${cardType}-card`;
      this.wrappedCardElement = document.createElement(elementName);
    }
    
    // Set config and hass
    if (this.wrappedCardElement.setConfig) {
      this.wrappedCardElement.setConfig(cardConfig);
    }
    
    if (this._hass && this.wrappedCardElement.hass !== undefined) {
      this.wrappedCardElement.hass = this._hass;
    }
  }

  set hass(hass) {
    this._hass = hass;
    
    // Pass hass to wrapped card
    if (this.wrappedCardElement && this.wrappedCardElement.hass !== undefined) {
      this.wrappedCardElement.hass = hass;
    }
    
    // Delay render to ensure wrapped card is ready
    setTimeout(() => this.render(), 0);
  }

  render() {
    if (!this.config || !this._hass || !this.wrappedCardElement) {
      return;
    }

    const confirmationText = this.config.confirmation?.text || 'Are you sure?';

    if (this.showingConfirmation) {
      this.renderConfirmationButtons(confirmationText);
    } else {
      this.renderWrappedCard();
    }
  }
  
  renderWrappedCard() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
        }
        
        .wrapper-container {
          position: relative;
          cursor: pointer;
          transition: 0.3s ease-out;
        }
        
        .wrapper-container:hover {
          transform: translateY(-1px);
        }
        
        .click-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
          background: transparent;
        }
        
        .wrapped-card {
          pointer-events: none;
          display: block;
        }
        
        .wrapped-card > * {
          pointer-events: none !important;
        }
      </style>
      
      <div class="wrapper-container" id="wrapper-container">
        <div class="click-overlay" id="click-overlay"></div>
        <div class="wrapped-card" id="wrapped-card"></div>
      </div>
    `;
    
    // Insert the wrapped card
    const wrappedCardContainer = this.shadowRoot.querySelector('#wrapped-card');
    if (this.wrappedCardElement && wrappedCardContainer) {
      // Ensure the card is properly rendered
      if (this.wrappedCardElement.hass !== this._hass) {
        this.wrappedCardElement.hass = this._hass;
      }
      
      wrappedCardContainer.appendChild(this.wrappedCardElement);
    }
    
    this.addEventListeners();
  }
  
  
  renderConfirmationButtons(confirmationText) {
    this.shadowRoot.innerHTML = `
      <style>
        .confirmation-container {
          display: flex;
          flex-direction: column;
          min-height: 120px;
          border-radius: var(--ha-card-border-radius, 12px);
          border-width: var(--ha-card-border-width, 1px);
          border-style: solid;
          border-color: var(--ha-card-border-color, var(--divider-color, #e0e0e0));
          color: var(--primary-text-color);
          transition: 0.3s ease-out;
          position: relative;
          overflow: hidden;
          background: var(--card-background-color, white);
        }
        
        .confirmation-text {
          background: var(--card-background-color, white);
          padding: 16px;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
          color: var(--primary-text-color);
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
          flex-shrink: 0;
        }
        
        .buttons-container {
          display: flex;
          flex: 1;
        }
        
        .timer-display {
          position: absolute;
          bottom: 8px;
          right: 12px;
          font-size: 11px;
          opacity: 0.6;
          color: var(--secondary-text-color);
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
          padding: 12px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .confirm-button {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        }
        
        .confirm-button:hover {
          background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
          transform: translateY(-1px);
        }
        
        .cancel-button {
          background: linear-gradient(135deg, #f44336 0%, #da190b 100%);
        }
        
        .cancel-button:hover {
          background: linear-gradient(135deg, #da190b 0%, #c1150a 100%);
          transform: translateY(-1px);
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
        <div class="confirmation-text">${confirmationText}</div>
        <div class="buttons-container">
          <button class="cancel-button" @click="${this.handleCancel}">
            <div class="button-icon">✕</div>
            <div class="button-text">Cancelar</div>
          </button>
          <button class="confirm-button" @click="${this.handleConfirm}">
            <div class="button-icon">✓</div>
            <div class="button-text">Confirmar</div>
          </button>
        </div>
        <div class="timer-display">${this.timeRemaining}s</div>
      </div>
    `;
    
    this.addEventListeners();
  }


  addEventListeners() {
    const cancelBtn = this.shadowRoot.querySelector('.cancel-button');
    const confirmBtn = this.shadowRoot.querySelector('.confirm-button');
    const clickOverlay = this.shadowRoot.querySelector('#click-overlay');
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => this.handleCancel(e));
    }
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => this.handleConfirm(e));
    }
    
    if (clickOverlay) {
      clickOverlay.addEventListener('click', (e) => this.handleCardClick(e));
    }
  }

  handleCardClick(e) {
    this.createRipple(e);
    this.showingConfirmation = true;
    this.startResetTimer();
    this.render();
  }

  handleCancel(e) {
    this.createRipple(e);
    this.clearResetTimer();
    this.showingConfirmation = false;
    this.render();
  }

  handleConfirm(e) {
    this.createRipple(e);
    this.clearResetTimer();
    this.showingConfirmation = false;
    
    // Execute the configured action
    this.executeAction();
    
    this.render();
  }
  
  executeAction() {
    const action = this.config.action;
    
    if (!action) {
      console.warn('No action configured');
      return;
    }
    
    switch (action.action) {
      case 'call-service':
        this._hass.callService(action.service_domain, action.service, action.service_data || {});
        break;
      case 'toggle':
        if (action.entity) {
          this._hass.callService('homeassistant', 'toggle', {
            entity_id: action.entity
          });
        }
        break;
      case 'navigate':
        if (action.navigation_path) {
          window.history.pushState(null, '', action.navigation_path);
          window.dispatchEvent(new CustomEvent('location-changed'));
        }
        break;
      case 'url':
        if (action.url_path) {
          window.open(action.url_path, action.new_tab ? '_blank' : '_self');
        }
        break;
      case 'more-info':
        if (action.entity) {
          const event = new CustomEvent('hass-more-info', {
            detail: { entityId: action.entity },
            bubbles: true,
            composed: true
          });
          this.dispatchEvent(event);
        }
        break;
      default:
        console.warn(`Unknown action type: ${action.action}`);
    }
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

  startResetTimer() {
    this.timeRemaining = 10;
    
    this.resetTimer = setTimeout(() => {
      this.showingConfirmation = false;
      this.render();
    }, 10000);
    
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.clearResetTimer();
      } else {
        // Update only the timer display
        const timerDisplay = this.shadowRoot.querySelector('.timer-display');
        if (timerDisplay) {
          timerDisplay.textContent = `${this.timeRemaining}s`;
        }
      }
    }, 1000);
  }
  
  clearResetTimer() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timeRemaining = 0;
  }

  disconnectedCallback() {
    this.clearResetTimer();
  }
  
  getCardSize() {
    return 2;
  }

  static getConfigElement() {
    return document.createElement('toggle-confirmation-card-editor');
  }

  static getStubConfig() {
    return {
      card: {
        type: 'tile',
        entity: 'cover.portao_grande',
        vertical: true,
        name: 'Abrir / Fechar'
      },
      confirmation: {
        text: 'De certeza que quer ativar o portão GRANDE?'
      },
      action: {
        action: 'toggle',
        entity: 'cover.portao_grande'
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
  description: 'Wrapper card that adds confirmation buttons to any card, or standalone confirmation card',
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
          <label>Card Configuration (JSON):</label>
          <textarea id="card-config" rows="6" style="width: 100%; padding: 8px; margin-top: 4px; font-family: monospace;" 
                    placeholder='{\n  "type": "tile",\n  "entity": "cover.portao_grande",\n  "vertical": true,\n  "name": "Abrir / Fechar"\n}'>${this.config.card ? JSON.stringify(this.config.card, null, 2) : ''}</textarea>
        </div>
        
        <div>
          <label>Confirmation Text:</label>
          <input type="text" .value="${this.config.confirmation?.text || ''}" @change="${this.confirmationChanged}"
                 placeholder="Are you sure?" style="width: 100%; padding: 8px; margin-top: 4px;">
        </div>
        
        <div>
          <label>Action Type:</label>
          <select id="action-type" style="width: 100%; padding: 8px; margin-top: 4px;">
            <option value="toggle" ${this.config.action?.action === 'toggle' ? 'selected' : ''}>Toggle Entity</option>
            <option value="call-service" ${this.config.action?.action === 'call-service' ? 'selected' : ''}>Call Service</option>
            <option value="navigate" ${this.config.action?.action === 'navigate' ? 'selected' : ''}>Navigate</option>
            <option value="more-info" ${this.config.action?.action === 'more-info' ? 'selected' : ''}>More Info</option>
          </select>
        </div>
        
        ${this.renderActionConfig()}
      </div>
    `;
    
    this.addEventListeners();
  }
  
  
  renderActionConfig() {
    const actionType = this.config.action?.action || 'toggle';
    
    switch (actionType) {
      case 'toggle':
        return `
          <div>
            <label>Entity to Toggle:</label>
            <input type="text" .value="${this.config.action?.entity || this.config.entity || ''}" @change="${this.actionEntityChanged}"
                   placeholder="cover.portao_grande" style="width: 100%; padding: 8px; margin-top: 4px;">
          </div>
        `;
      case 'call-service':
        return `
          <div>
            <label>Service Domain:</label>
            <input type="text" .value="${this.config.action?.service_domain || ''}" @change="${this.serviceDomainChanged}"
                   placeholder="homeassistant" style="width: 100%; padding: 8px; margin-top: 4px;">
          </div>
          <div>
            <label>Service:</label>
            <input type="text" .value="${this.config.action?.service || ''}" @change="${this.serviceChanged}"
                   placeholder="toggle" style="width: 100%; padding: 8px; margin-top: 4px;">
          </div>
          <div>
            <label>Service Data (JSON):</label>
            <textarea rows="3" .value="${JSON.stringify(this.config.action?.service_data || {}, null, 2)}" @change="${this.serviceDataChanged}"
                      placeholder='{"entity_id": "cover.portao_grande"}' style="width: 100%; padding: 8px; margin-top: 4px; font-family: monospace;"></textarea>
          </div>
        `;
      case 'navigate':
        return `
          <div>
            <label>Navigation Path:</label>
            <input type="text" .value="${this.config.action?.navigation_path || ''}" @change="${this.navigationPathChanged}"
                   placeholder="/lovelace/dashboard" style="width: 100%; padding: 8px; margin-top: 4px;">
          </div>
        `;
      case 'more-info':
        return `
          <div>
            <label>Entity:</label>
            <input type="text" .value="${this.config.action?.entity || ''}" @change="${this.actionEntityChanged}"
                   placeholder="cover.portao_grande" style="width: 100%; padding: 8px; margin-top: 4px;">
          </div>
        `;
      default:
        return '';
    }
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