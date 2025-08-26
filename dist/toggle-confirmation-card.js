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
        }
        
        .wrapped-card {
          display: block;
          position: relative;
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
      
      // Allow card to have normal interactions, clicks will be caught by overlay
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
    const wrapperContainer = this.shadowRoot.querySelector('#wrapper-container');
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => this.handleCancel(e));
    }
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => this.handleConfirm(e));
    }
    
    if (wrapperContainer) {
      // Intercept all clicks on the wrapper and its children
      wrapperContainer.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleCardClick(e);
      }, true); // Use capture phase to catch clicks before they reach the wrapped card
    }
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

