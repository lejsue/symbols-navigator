'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { Point } from 'atom';
import { Emitter } from 'event-kit';

class TreeNode {
  constructor(item) {
    const { label, icon, children, access, signature, position } = item;
    this.emitter = new Emitter();
    this.item = item;
    this.item.view = this;

    let syntaxCategory = '';
    let scopeName;
    let language;

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

    if (['python', 'django'].indexOf(language) !== -1 && syntaxCategory === 'member') {
      syntaxCategory = 'function';
    }

    const symbolColored = atom.config.get('symbols-navigator.colorsForSyntax') ? '-colored' : '';
    const syntaxCategoryClass = icon ? [`${icon}${symbolColored}`] : [];

    const iconClass = ['icon'];
    if (atom.config.get('symbols-navigator.showSyntaxIcons')) {
      iconClass.push(...syntaxCategoryClass);
    }

    const iconAccess = access ? [`icon-${access}`] : [];
    const signatureClass = ['signature', 'status-ignored'];
    const collapsed = atom.config.get('symbols-navigator.collapsedByDefault') ? ['collapsed'] : [];

    const accessElement = document.createElement('span');
    accessElement.classList.add(...iconAccess);

    const nameElement = document.createElement('span');
    nameElement.classList.add(...iconClass);
    nameElement.innerHTML = label;

    const signatureElement = document.createElement('span');
    signatureElement.classList.add(...signatureClass);
    signatureElement.innerHTML = signature;

    accessElement.appendChild(nameElement);
    accessElement.appendChild(signatureElement);

    this.element = document.createElement('li');

    if (children) {
      this.element.classList.add('list-nested-item', 'list-selectable-item', ...collapsed);
      this.element.title = label;

      const symbolRoot = document.createElement('div');
      symbolRoot.classList.add('list-item', 'symbol-root');

      const childElement = document.createElement('ul');
      childElement.classList.add('list-tree');

      for (const child of children) {
        const childTreeNode = new TreeNode(child);
        childElement.appendChild(childTreeNode.element);
      }

      symbolRoot.appendChild(accessElement);
      this.element.appendChild(symbolRoot);
      this.element.appendChild(childElement);
    } else {
      this.element.classList.add('list-item', 'symbol-item', 'list-selectable-item');
      this.element.title = label;
      if (position) {
        this.element.dataset.row = position.row;
        this.element.dataset.column = position.column;
      }

      this.element.appendChild(accessElement);
    }
  }

  setSelected() {
    this.element.classList.add('selected');
  }

  hide() {
    this.element.style.display = 'none';
  }
}

export default class TreeView {
  constructor() {
    this.element = document.createElement('div');
    this.element.classList.add('symbols-navigator-tree-view');

    this.list = document.createElement('ul');
    this.list.classList.add('list-tree', 'has-collapsable-children');

    this.element.appendChild(this.list);

    this.element.addEventListener('click', (event) => {
      this.clearSelect();
      this.onClick(event);
    });

    this.element.addEventListener('dblclick', (event) => {
      this.onDblClick(event);
    });

    this.order = {
      class: 1,
      function: 2,
      method: 3,
    };

    this.emitter = new Emitter();
  }

  destroy() {
    this.remove();
  }

  setRoot(rootData, sortByName = true, ignoreRoot = true) {
    if (sortByName) {
      this.sortByName(rootData);
    } else {
      this.sortByRow(rootData);
    }

    this.rootNode = new TreeNode(rootData);

    while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild);
    }

    if (ignoreRoot) {
      for (const child of rootData.children) {
        this.list.appendChild(child.view.element);
      }
    } else {
      this.list.appendChild(rootData.view.element);
    }
  }

  setEmptyRoot() {
    this.rootNode = new TreeNode({});
    while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild);
    }
  }

  traversal = (node, doing) => {
    doing(node);
    if (node.children) {
      for (const child of node.children) {
        this.traversal(child, doing);
      }
    }
  }

  toggleTypeVisible = (type) => {
    this.traversal(this.rootNode.item, (item) => {
      if (item.type === type) {
        item.view.hide();
      }
    });
  }

  sortByName = (rootData) => {
    this.traversal(rootData, (node) => {
      if (node.children != null) {
        node.children.sort((a, b) => {
          const aOrder = (this.order[a.type] != null) ? this.order[a.type] : 99;
          const bOrder = (this.order[b.type] != null) ? this.order[b.type] : 99;

          if ((aOrder - bOrder) !== 0) {
            return aOrder - bOrder;
          }

          return a.name.localeCompare(b.name);
        });
      }
    });
  }

  sortByRow = (rootData) => {
    this.traversal(rootData, (node) => {
      if (node.children != null) {
        node.children.sort((a, b) => {
          return a.position.row - b.position.row;
        });
      }
    });
  }

  onClick(event) {
    const target = event.target;
    let currentNode;
    let collapsed = false;
    let moveCursor = false;

    event.stopPropagation();

    if (target.classList.contains('list-nested-item')) {
      currentNode = target;
    } else if (target.classList.contains('list-tree')) {
      currentNode = target.closest('.list-nested-item');
    } else if (target.classList.contains('symbol-root')) {
      currentNode = target.closest('.list-nested-item');
      const left = currentNode.getBoundingClientRect().left;
      const right = currentNode.querySelector('span').getBoundingClientRect().left;
      const width = right - left;
      collapsed = event.offsetX <= width;
    } else if (target.closest('.list-item').classList.contains('symbol-root')) {
      currentNode = target.closest('.list-nested-item');
    } else {
      currentNode = target.closest('.list-item');
      moveCursor = true;
    }

    if (collapsed) {
      currentNode.classList.toggle('collapsed');
    }
    currentNode.classList.add('selected');

    if (atom.config.get('symbols-navigator.clickType') === 'Single Click') {
      const editor = atom.workspace.getActiveTextEditor();
      if (moveCursor && currentNode.dataset.row && currentNode.dataset.row >= 0 && editor != null) {
        const position = new Point(parseInt(currentNode.dataset.row, 10));
        editor.scrollToBufferPosition(position, {
          center: true,
        });
        editor.setCursorBufferPosition(position);
        editor.moveToFirstCharacterOfLine();
        editor.element.dispatchEvent(new CustomEvent('focus'));
      }
    }
  }

  onDblClick(event) {
    const target = event.target;
    let currentNode = target;
    let collapsed = false;
    let moveCursor = false;

    event.stopPropagation();

    if (target.classList.contains('list-nested-item')) {
      collapsed = true;
    } else if (target.classList.contains('list-tree')) {
      currentNode = null;
    } else if (target.classList.contains('symbol-root') || target.closest('.list-item').classList.contains('symbol-root')) {
      currentNode = target.closest('.list-nested-item');
      collapsed = true;
    } else {
      currentNode = target.closest('.list-item');
      moveCursor = true;
    }

    if (collapsed) {
      currentNode.classList.toggle('collapsed');
    }

    if (atom.config.get('symbols-navigator.clickType') === 'Double Click') {
      const editor = atom.workspace.getActiveTextEditor();
      if (moveCursor && currentNode.dataset.row && currentNode.dataset.row >= 0 && editor != null) {
        const position = new Point(parseInt(currentNode.dataset.row, 10));
        editor.scrollToBufferPosition(position, {
          center: true,
        });
        editor.setCursorBufferPosition(position);
        editor.moveToFirstCharacterOfLine();
        editor.element.dispatchEvent(new CustomEvent('focus'));
      }
    }
  }

  clearSelect() {
    const allItems = document.querySelectorAll('.list-selectable-item');
    for (const item of allItems) {
      item.classList.remove('selected');
    }
  }

  select(item) {
    this.clearSelect();
    if (item != null) {
      item.view.setSelected();
    }
  }
}
