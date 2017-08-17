'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies
import { CompositeDisposable } from 'atom';
import SymbolsNavigatorView from './symbols-navigator-view';

export default {
  config: {
    collapsedByDefault: {
      type: 'boolean',
      default: false,
      description: 'If this option is enabled, then all collapsable elements are displayed collapsed by default.',
      order: 1,
    },
    scrollAnimation: {
      type: 'boolean',
      default: true,
      description: 'If this option is enabled, then when you click the item in symbols-navigator, it will scroll to the destination gradually.',
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
    position: {
      title: 'Position',
      type: 'string',
      default: 'Left',
      enum: ['Left', 'Right'],
      description: 'Need to restart/reload Atom after changing the position setting.',
      order: 6,
    },
    sortBy: {
      title: 'Sort By',
      type: 'string',
      default: 'Symbol Name',
      enum: ['Symbol Name', 'Source Row'],
      description: 'Symbols will be sorted by symbol name or source row.',
      order: 7,
    },
    autoHideTypes: {
      title: 'Auto Hide Types',
      type: 'string',
      description: 'Here you can specify a list of types that will be hidden by default (ex: "variable class")',
      default: '',
      order: 8,
    },
    alternativeCtagsBinary: {
      title: 'Alternative Ctags Binary',
      type: 'string',
      description: 'Here you can specify a path to a binary to use for ctags creation instead of the original one in symbols-navigator. For instance, Linux users may want to use the binary available for their distribution (exuberant or universal, usually it is /usr/bin/ctags). Caution, if the path you specify is wrong, symbols-navigator will not work.',
      default: 'default',
      order: 9,
    },
  },

  symbolsNavigatorView: null,
  subscriptions: null,

  activate(state) {
    this.symbolsNavigatorView = new SymbolsNavigatorView(state.symbolsNavigatorViewState);
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'symbols-navigator:toggle': () => { this.symbolsNavigatorView.toggle(); },
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'symbols-navigator:toggle-focus': () => { this.symbolsNavigatorView.toggleFocus(); },
    }));

    this.symbolsNavigatorView.toggle();
  },

  deactivate() {
    this.subscriptions.dispose();
    this.symbolsNavigatorView.destroy();
  },

  serialize() {
    return {
      symbolsNavigatorViewState: this.symbolsNavigatorView.serialize(),
    };
  },
};
