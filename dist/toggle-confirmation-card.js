class ToggleConfirmationCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.showingConfirmation = false;
    this.resetTimer = null;
    this.timeRemaining = 0;
    this.timerInterval = null;
    // Unique ID for debugging timer issues
    this.cardId = Math.random().toString(36).substr(2, 9);
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
      // Clear timers when switching back to normal view
      this.clearResetTimer();
      this.renderWrappedCard();
    }
  }
  
  renderWrappedCard() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          height: auto;
        }
        
        .wrapper-container {
          position: relative;
          cursor: pointer;
        }
        
        .wrapped-card {
          display: block;
          position: relative;
          height: auto;
          min-height: inherit;
        }
        
      </style>
      
      <div class="wrapper-container" id="wrapper-container">
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
      
      // Insert the card
      wrappedCardContainer.appendChild(this.wrappedCardElement);
      
      // Add click/touch interception directly to the wrapped card
      this.interceptWrappedCardEvents();
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
          font-size: 12px;
          font-weight: 600;
          opacity: 0.9;
          color: var(--primary-text-color);
          background: rgba(0, 0, 0, 0.3);
          padding: 4px 8px;
          border-radius: 12px;
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
          padding: 12px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .confirm-button {
          background: #4CAF50;
        }
        
        .cancel-button {
          background: #f44336;
        }
        
        .button-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .button-text {
          font-size: 14px;
          opacity: 0.9;
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
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => this.handleCancel(e));
    }
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => this.handleConfirm(e));
    }
  }
  
  interceptWrappedCardEvents() {
    if (!this.wrappedCardElement) return;
    
    // Intercept click events (desktop and mobile)
    this.wrappedCardElement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleCardClick(e);
    }, true); // Use capture phase
    
    // Intercept touch events specifically for mobile
    this.wrappedCardElement.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleCardClick(e);
    }, true);
    
    // Don't prevent touchstart to allow hover effects to work on mobile
    this.wrappedCardElement.addEventListener('touchstart', (e) => {
      // Let touchstart pass through for hover effects
    }, true);
  }

  handleCardClick(e) {
    this.showingConfirmation = true;
    this.startResetTimer();
    this.render();
  }

  handleCancel(e) {
    this.clearResetTimer();
    this.showingConfirmation = false;
    this.render();
  }

  handleConfirm(e) {
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


  startResetTimer() {
    // Clear any existing timers first to prevent conflicts
    this.clearResetTimer();
    
    this.timeRemaining = 10;
    
    // Update display immediately
    const timerDisplay = this.shadowRoot.querySelector('.timer-display');
    if (timerDisplay) {
      timerDisplay.textContent = `${this.timeRemaining}s`;
    }
    
    this.timerInterval = setInterval(() => {
      if (!this.showingConfirmation) {
        // If confirmation was cancelled, clear the timer
        this.clearResetTimer();
        return;
      }
      
      this.timeRemaining--;
      
      // Update timer display
      const timerDisplay = this.shadowRoot.querySelector('.timer-display');
      if (timerDisplay) {
        timerDisplay.textContent = `${this.timeRemaining}s`;
      }
      
      if (this.timeRemaining <= 0) {
        this.clearResetTimer();
        this.showingConfirmation = false;
        this.render();
      }
    }, 1000);
  }
  
  clearResetTimer() {
    if (this.resetTimer !== null && this.resetTimer !== undefined) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    if (this.timerInterval !== null && this.timerInterval !== undefined) {
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
    return null; // No visual editor - code only
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

