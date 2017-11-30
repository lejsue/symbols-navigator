'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';
import TreeView from './tree-view';
import TagGenerator from './tag-generator';
import TagParser from './tag-parser';

const SYMBOLS_NAVIGATOR = 'atom://symbols-navigator';
const SYMBOLS_NAVIGATOR_TITLE = 'Symbols';
const SYMBOLS_NAVIGATOR_ICON = 'list-unordered';

export default class SymbolsNavigatorView {
  constructor() {
    this.element = document.createElement('div');
    this.element.classList.add('symbols-navigator', 'tool-panel', 'focusable-panel');
    this.element.tabIndex = -1;

    this.subscriptions = new CompositeDisposable();
    this.treeView = new TreeView();
    this.element.appendChild(this.treeView.element);

    this.autoHideTypes = atom.config.get('symbols-navigator.autoHideTypes');
    this.sortByName = atom.config.get('symbols-navigator.sortBy') === 'Symbol Name';

    this.refreshTag = false;
    this.subscriptions.add(atom.config.onDidChange('symbols-navigator.sortBy', () => {
      this.sortByName = atom.config.get('symbols-navigator.sortBy') === 'Symbol Name';
      this.refreshTag = true;
    }));

    this.subscriptions.add(atom.config.onDidChange('symbols-navigator.autoHideTypes', () => {
      this.autoHideTypes = atom.config.get('symbols-navigator.autoHideTypes');
      this.refreshTag = true;
    }));

    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem(() => {
      this.removeEventForEditor();
      this.populate();
    }));
  }

  getEditor() {
    return atom.workspace.getActiveTextEditor();
  }

  getScopeName() {
    if (
      atom.workspace.getActiveTextEditor() != null &&
      atom.workspace.getActiveTextEditor().getGrammar() != null
    ) {
      return atom.workspace.getActiveTextEditor().getGrammar().scopeName;
    }

    return undefined;
  }

  populate() {
    const editor = this.getEditor();
    if (editor != null) {
      let filePath = editor.getPath();
      if (filePath !== this.previousFilePath || this.refreshTag) {
        this.generateTags(filePath);
        this.refreshTag = false;
      }

      this.previousFilePath = filePath;

      this.onEditorSave = editor.onDidSave((event) => {
        filePath = event.path;
        this.generateTags(filePath);
      });

      this.onChangeRow = editor.onDidChangeCursorPosition(
        ({ oldBufferPosition, newBufferPosition }) => {
          if (oldBufferPosition.row !== newBufferPosition.row) {
            this.focusCurrentCursorTag();
          }
        },
      );
    } else {
      this.previousFilePath = '';
      this.treeView.setEmptyRoot();
    }
  }

  focusCurrentCursorTag() {
    let editor;
    if ((editor = this.getEditor()) && (this.parser != null)) {
      const { row } = editor.getCursorBufferPosition();
      const tag = this.parser.getNearestTag(row);
      this.treeView.select(tag);
    }
  }

  generateTags(filePath) {
    new TagGenerator(filePath, this.getScopeName()).generate().then((tags) => {
      this.parser = new TagParser(tags, this.getScopeName());
      const { root, types } = this.parser.parse();
      this.treeView.setRoot(root, this.sortByName);

      if (this.autoHideTypes) {
        const hiddenTypes = this.autoHideTypes.split(' ');
        for (const type of types) {
          if (hiddenTypes.indexOf(type) !== -1) {
            this.treeView.toggleTypeVisible(type);
          }
        }
      }
    });
  }

  serialize() {}

  destroy() {
    this.removeEventForEditor();
    this.subscriptions.dispose();
    this.element.remove();
  }

  removeEventForEditor() {
    if (this.onEditorSave != null) {
      this.onEditorSave.dispose();
    }

    if (this.onChangeRow != null) {
      this.onChangeRow.dispose();
    }
  }

  unfocus() {
    atom.workspace.getCenter().activate();
  }

  hasFocus() {
    return document.activeElement === this.element;
  }

  toggleFocus() {
    if (this.hasFocus()) {
      this.unfocus();
    } else {
      this.show();
      this.element.focus();
    }
  }

  toggle() {
    atom.workspace.toggle(this);
  }

  hide() {
    atom.workspace.hide(this);
  }

  show() {
    atom.workspace.open(this, {
      searchAllPanes: true,
      activatePane: false,
      activateItem: false,
    }).then(() => {
      atom.workspace.paneContainerForURI(this.getURI()).show();
    });
  }

  getURI() {
    return SYMBOLS_NAVIGATOR;
  }

  getTitle() {
    return SYMBOLS_NAVIGATOR_TITLE;
  }

  getIconName() {
    return SYMBOLS_NAVIGATOR_ICON;
  }

  getDefaultLocation() {
    return atom.config.get('symbols-navigator.position').toLowerCase();
  }

  getAllowedLocations() {
    return ['left', 'right'];
  }

  isPermanentDockItem() {
    return !atom.config.get('symbols-navigator.closeable');
  }
}
