'use babel';

export default class StatusBarManager {
  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'status-bar-symbols-nagivator';

    this.container = document.createElement('div');
    this.container.className = 'inline-block';
    this.container.appendChild(this.element);

    this.showOnStatusBar = atom.config.get('symbols-navigator.showOnStatusBar');
  }

  initialize(statusBar) {
    this.statusBar = statusBar;
  }

  update(tag) {
    if (this.showOnStatusBar && tag != null) {
      this.element.textContent = `Symbol: ${tag.label}`;
    } else {
      this.element.textContent = '';
    }
  }

  updateTitle(title) {
    if (this.showOnStatusBar && title != null) {
      this.element.textContent = `Symbol: ${title}`;
    } else {
      this.element.textContent = '';
    }
  }

  attach() {
    this.tile = this.statusBar.addLeftTile({
      item: this.container,
      priority: 100,
    });
  }

  detach() {
    this.tile.destroy();
  }

  setEmptySymbolLabel() {
    this.element.textContent = '';
  }

  setOnStatusBar(showOnStatusBar) {
    this.showOnStatusBar = showOnStatusBar;
  }
}
