'use babel';

import { $, $$, View, ScrollView } from 'atom-space-pen-views';
import { Emitter } from 'event-kit';

class TreeNode extends View {
  static content({ label, icon, children, access, signature }) {
    let syntaxCategory = '';
    let scopeName;
    let language;

    const showIconsExceptions = {};
    if (
      atom.workspace.getActiveTextEditor() != null &&
      atom.workspace.getActiveTextEditor().getGrammar() != null
    ) {
      scopeName = atom.workspace.getActiveTextEditor().getGrammar().scopeName;
    }

    if (scopeName != null) {
      const scopeNameSplit = scopeName.split('.');
      language = scopeNameSplit[scopeNameSplit.length - 1];
    }

    if (icon != null) {
      const iconSplit = icon.split('-');
      syntaxCategory = iconSplit[iconSplit.length - 1];
    }
    if (language in ['python', 'django'] && syntaxCategory === 'member') {
      syntaxCategory = 'function';
    }

    const symbolColored = atom.config.get('symbols-navigator.colorsForSyntax') ? '-colored' : '';

    let iconClass = '';
    if (atom.config.get('symbols-navigator.showSyntaxIcons')) {
      if (!(language in showIconsExceptions)) {
        iconClass = `icon ${icon}${symbolColored}`;
      }
    } else if (language in showIconsExceptions) {
      if (Object.prototype.hasOwnProperty.call(showIconsExceptions, language)) {
        iconClass = `icon ${icon}${symbolColored}`;
      }
    }

    const iconAccess = access ? `icon-${access}` : '';
    const signatureClass = 'signature status-ignored';

    if (children) {
      const collapsed = atom.config.get('symbols-navigator.collapsedByDefault') ? ' collapsed' : '';
      this.li({
        class: `list-nested-item list-selectable-item${collapsed}`,
        title: label,
      }, () => {
        this.div({
          class: 'list-item symbol-root',
        }, () => {
          this.span({
            class: iconAccess,
          }, () => {
            this.span({
              class: iconClass,
            }, label);
            this.span({
              class: signatureClass,
            }, signature);
          });
        });
        this.ul({
          class: 'list-tree',
        }, () => {
          for (const child of children) {
            this.subview('child', new TreeNode(child));
          }
        });
      });
    } else {
      this.li({
        class: 'list-item list-selectable-item',
        title: label,
      }, () => {
        this.span({
          class: iconAccess,
        }, () => {
          this.span({
            class: iconClass,
          }, label);
          this.span({
            class: signatureClass,
          }, signature);
        });
      });
    }
  }

  initialize(item) {
    this.emitter = new Emitter();
    this.item = item;
    this.item.view = this;

    this.on('dblclick', (event) => { this.dblClickItem(event); });
    this.on('click', (event) => { this.clickItem(event); });
  }

  setCollapsed() {
    if (this.item.children) {
      this.toggleClass('collapsed');
    }
  }

  setSelected() {
    this.addClass('selected');
  }

  onDblClick(callback) {
    this.emitter.on('on-dbl-click', callback);
    if (this.item.children) {
      for (const child of this.item.children) {
        child.view.onDblClick(callback);
      }
    }
  }

  onSelect(callback) {
    this.emitter.on('on-select', callback);
    if (this.item.children) {
      for (const child of this.item.children) {
        child.view.onSelect(callback);
      }
    }
  }

  clickItem = (event) => {
    if (this.item.children) {
      const selected = this.hasClass('selected');
      this.removeClass('selected');
      const $target = this.find('.list-item:first');
      const left = $target.position().left;
      const right = $target.children('span').position().left;
      const width = right - left;
      if (event.offsetX <= width) {
        this.toggleClass('collapsed');
      }
      if (selected) {
        this.addClass('selected');
      }
      if (event.offsetX <= width) {
        event.stopPropagation();
      }
    }

    this.emitter.emit('on-select', {
      node: this,
      item: this.item,
    });

    event.stopPropagation();
  }

  dblClickItem = (event) => {
    this.emitter.emit('on-dbl-click', {
      node: this,
      item: this.item,
    });

    event.stopPropagation();
  }
}

export default class TreeView extends ScrollView {
  static content() {
    this.div({
      class: 'symbols-navigator-tree-view',
    }, () => {
      this.ul({
        class: 'list-tree has-collapsable-children',
        outlet: 'root',
      });
    });
  }

  initialize() {
    this.order = {
      class: 1,
      function: 2,
      method: 3,
    };

    super.initialize();
    this.emitter = new Emitter();
  }

  deactivate() {
    this.remove();
  }

  onSelect = (callback) => {
    this.emitter.on('on-select', callback);
  }

  setRoot(root, ignoreRoot = true) {
    this.rootNode = new TreeNode(root);

    this.rootNode.onSelect(({ node }) => {
      this.clearSelect();
      node.setSelected();
    });

    this.rootNode.onDblClick(({ node, item }) => {
      if (item.children) {
        node.setCollapsed();
      } else {
        this.clearSelect();
        node.setSelected();
        this.emitter.emit('on-select', { node, item });
      }
    });

    this.root.empty();
    this.root.append($$(function newElement() {
      this.div(() => {
        if (ignoreRoot) {
          for (const child of root.children) {
            this.subview('child', child.view);
          }
        } else {
          this.subview('root', root.view);
        }
      });
    }));
  }

  traversal = (root, doing) => {
    doing(root.item);
    if (root.item.children) {
      for (const child of root.item.children) {
        this.traversal(child.view, doing);
      }
    }
  }

  toggleTypeVisible = (type) => {
    this.traversal(this.rootNode, (item) => {
      if (item.type === type) {
        item.view.toggle();
      }
    });
  }

  sortByName = () => {
    this.traversal(this.rootNode, (item) => {
      if (item.children != null) {
        item.children.sort((a, b) => {
          const aOrder = (this.order[a.type] != null) ? this.order[a.type] : 99;
          const bOrder = (this.order[b.type] != null) ? this.order[b.type] : 99;

          if ((aOrder - bOrder) !== 0) {
            return aOrder - bOrder;
          }

          return a.name.localeCompare(b.name);
        });
      }
    });

    this.setRoot(this.rootNode.item);
  }

  sortByRow = () => {
    this.traversal(this.rootNode, (item) => {
      if (item.children != null) {
        item.children.sort((a, b) => {
          return a.position.row - b.position.row;
        });
      }
    });

    this.setRoot(this.rootNode.item);
  }

  clearSelect() {
    $('.list-selectable-item').removeClass('selected');
  }

  select(item) {
    this.clearSelect();
    if (item != null) {
      item.view.setSelected();
    }
  }
}
