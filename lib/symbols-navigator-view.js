'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies
import { Range, CompositeDisposable } from 'atom';
import { jQuery, View } from 'atom-space-pen-views';
import TreeView from './tree-view';
import TagGenerator from './tag-generator';
import TagParser from './tag-parser';

const SYMBOLS_NAVIGATOR = 'atom://symbols-navigator';
const SYMBOLS_NAVIGATOR_TITLE = 'Symbols';
const SYMBOLS_NAVIGATOR_ICON = 'list-unordered';

export default class SymbolsNavigatorView extends View {
  static content() {
    return this.div({
      class: 'symbols-navigator tool-panel focusable-panel',
      tabIndex: -1,
    });
  }

  initialize() {
    this.subscriptions = new CompositeDisposable();
    this.treeView = new TreeView();
    this.append(this.treeView);

    this.cachedStatus = {};
    this.autoHideTypes = atom.config.get('symbols-navigator.autoHideTypes');
    this.nowSortStatus = {};
    this.nowSortStatus[0] = atom.config.get('symbols-navigator.sortBy') === 'Symbol Name';

    this.treeView.onSelect(({ item }) => {
      const editor = atom.workspace.getActiveTextEditor();
      if (item.position.row >= 0 && editor != null) {
        const screenPosition = editor.screenPositionForBufferPosition(item.position);
        const screenRange = new Range(screenPosition, screenPosition);
        const { top, height } = editor.element.pixelRectForScreenRange(screenRange);
        const desiredScrollCenter = top + (height / 2);
        let desiredScrollTop = editor.element.getScrollTop();
        if (
          !((editor.element.getScrollTop() < desiredScrollCenter &&
          desiredScrollCenter < editor.element.getScrollBottom()))
        ) {
          desiredScrollTop = desiredScrollCenter - (editor.element.getHeight() / 2);
        }

        const from = {
          top: editor.element.getScrollTop(),
        };
        const to = {
          top: desiredScrollTop,
        };

        const step = (now) => {
          editor.element.setScrollTop(now);
        };
        const done = () => {
          editor.scrollToBufferPosition(item.position, {
            center: true,
          });
          editor.setCursorBufferPosition(item.position);
          editor.moveToFirstCharacterOfLine();
          editor.element.dispatchEvent(new CustomEvent('focus'));
        };

        jQuery(from).animate(to, {
          duration: this.animationDuration,
          step,
          done,
        });
      }
    });

    atom.config.observe('symbols-navigator.scrollAnimation', (enabled) => {
      this.animationDuration = enabled ? 300 : 0;
    });

    this.refreshTag = false;
    this.subscriptions.add(atom.config.onDidChange('symbols-navigator.sortBy', () => {
      this.nowSortStatus[0] = atom.config.get('symbols-navigator.sortBy') === 'Symbol Name';
      this.refreshTag = true;
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
      this.show();
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
      this.hide();
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
    new TagGenerator(filePath, this.getScopeName()).generate().done((tags) => {
      this.parser = new TagParser(tags, this.getScopeName());
      const { root, types } = this.parser.parse();
      this.treeView.setRoot(root);
      if (this.nowSortStatus[0]) {
        this.treeView.sortByName();
      }

      if (this.autoHideTypes) {
        for (const type in types) {
          if (this.autoHideTypes.indexOf(type) !== -1) {
            this.treeView.toggleTypeVisible(type);
          }
        }
      }
    });
  }

  serialize() {}

  destroy() {
    this.element.remove();
  }

  attached() {
    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem(() => {
      this.removeEventForEditor();
      this.populate();
    }));

    if (atom.packages.isPackageLoaded('tree-view') && this.getDefaultLocation() === 'left') {
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'tree-view:toggle');
    }
  }

  removeEventForEditor() {
    if (this.onEditorSave != null) {
      this.onEditorSave.dispose();
    }

    if (this.onChangeRow != null) {
      this.onChangeRow.dispose();
    }
  }

  detached() {
    this.removeEventForEditor();
    this.subscriptions.dispose();
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
