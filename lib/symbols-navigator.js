'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { Disposable, CompositeDisposable } from 'atom';
import SymbolsNavigatorView from './symbols-navigator-view';
import StatusBarManager from './status-bar-manager';

export default {
  config: {
    collapsedByDefault: {
      type: 'boolean',
      default: false,
      description: 'If this option is enabled, then all collapsable elements are displayed collapsed by default.',
      order: 1,
    },
    showAccessIcons: {
      type: 'boolean',
      default: true,
      description: 'If this option is enabled, then access icons will be displayed before each element.',
      order: 2,
    },
    showSyntaxIcons: {
      type: 'boolean',
      default: true,
      description: 'If this option is enabled, then syntax icons will be displayed before each element.',
      order: 3,
    },
    colorsForSyntax: {
      type: 'boolean',
      description: 'Colorize the syntax icons',
      default: true,
      order: 4,
    },
    closeable: {
      title: 'Can be closed by clicking `x`',
      type: 'boolean',
      default: false,
      description: 'If this option is enabled, then symbols-navigator can be closed by clicking the x on the tab.',
      order: 5,
    },
    autoRevealOnStart: {
      type: 'boolean',
      default: false,
      description: 'If this option is enabled, then symbols-navigator will auto reveal on start.',
      order: 6,
    },
    position: {
      title: 'Position',
      type: 'string',
      default: 'Left',
      enum: ['Left', 'Right'],
      description: 'Need to restart/reload Atom after changing the position setting.',
      order: 7,
    },
    sortBy: {
      title: 'Sort By',
      type: 'string',
      default: 'Symbol Name',
      enum: ['Symbol Name', 'Source Row'],
      description: 'Symbols will be sorted by symbol name or source row.',
      order: 8,
    },
    autoHideTypes: {
      title: 'Auto Hide Types',
      type: 'string',
      description: 'Here you can specify a list of types that will be hidden by default (ex: "variable class")',
      default: '',
      order: 9,
    },
    alternativeCtagsBinary: {
      title: 'Alternative Ctags Binary',
      type: 'string',
      description: 'Here you can specify a path to a binary to use for ctags creation instead of the original one in symbols-navigator. For instance, Linux users may want to use the binary available for their distribution (exuberant or universal, usually it is /usr/bin/ctags). Caution, if the path you specify is wrong, symbols-navigator will not work.',
      default: 'default',
      order: 10,
    },
    clickType: {
      title: 'Click Type',
      type: 'string',
      default: 'Double Click',
      enum: ['Single Click', 'Double Click'],
      description: 'Here you can change which clicking event triggers moving cursor to the symbol.',
      order: 11,
    },
    showOnStatusBar: {
      title: 'Show Current Symbol On Status Bar',
      type: 'boolean',
      description: 'If this option is enabled, then symbols-navigator will show current symbol on status bar.',
      default: false,
      order: 12,
    },
  },

  symbolsNavigatorView: null,
  subscriptions: null,

  activate() {
    this.statusBarManager = new StatusBarManager();
    this.symbolsNavigatorView = new SymbolsNavigatorView(this.statusBarManager);
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'symbols-navigator:toggle': () => { this.symbolsNavigatorView.toggle(); },
      'symbols-navigator:toggle-focus': () => { this.symbolsNavigatorView.toggleFocus(); },
    }));

    const showOnAttach = atom.config.get('symbols-navigator.autoRevealOnStart');
    this.viewOpenPromise = atom.workspace.open(this.symbolsNavigatorView, {
      activatePane: showOnAttach,
      activateItem: showOnAttach,
    });

    this.subscriptions.add(atom.config.onDidChange('symbols-navigator.showOnStatusBar', () => {
      this.statusBarManager.setOnStatusBar(atom.config.get('symbols-navigator.showOnStatusBar'));
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
    this.symbolsNavigatorView.destroy();
    this.symbolsNavigatorView = null;
  },

  consumeStatusBar(statusBar) {
    this.statusBarManager.initialize(statusBar);
    this.statusBarManager.attach();
    this.subscriptions.add(new Disposable(() => {
      this.statusBarManager.detach();
    }));
  },
};
