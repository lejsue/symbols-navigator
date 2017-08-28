'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { Point } from 'atom';

export default class TagParser {
  constructor(tags, grammar) {
    this.tags = tags;
    this.grammar = grammar;
    if (this.grammar === 'source.c++' || this.grammar === 'source.c' || this.grammar === 'source.cpp') {
      this.splitSymbol = '::';
    } else {
      this.splitSymbol = '.';
    }
  }

  splitParentTag(parentTag) {
    const index = parentTag.indexOf(':');

    return {
      type: parentTag.substr(0, index),
      parent: parentTag.substr(index + 1),
    };
  }

  splitNameTag(nameTag) {
    const index = nameTag.lastIndexOf(this.splitSymbol);
    if (index >= 0) {
      return nameTag.substr(index + this.splitSymbol.length);
    }

    return nameTag;
  }

  buildMissedParent(parents) {
    const newParent = { ...parents };
    const parentTags = Object.keys(newParent);
    parentTags.sort((a, b) => {
      const { parent: nameA } = this.splitParentTag(a);
      const { parent: nameB } = this.splitParentTag(b);

      if (nameA < nameB) {
        return -1;
      } else if (nameA > nameB) {
        return 1;
      }

      return 0;
    });

    for (const i in parentTags) {
      if (Object.prototype.hasOwnProperty.call(parentTags, i)) {
        const now = parentTags[i];
        const { type, parent: name } = this.splitParentTag(now);

        if (newParent[now] === null) {
          newParent[now] = {
            name,
            type,
            position: null,
            parent: null,
            access: null,
            signature: null,
          };

          this.tags.push(newParent[now]);

          if (i >= 1) {
            const pre = parentTags[i - 1];
            const { parent: preName } = this.splitParentTag(pre);
            if (now.indexOf(preName) >= 0) {
              newParent[now].parent = pre;
              newParent[now].name = this.splitNameTag(newParent[now].name);
            }
          }
        }
      }
    }

    return newParent;
  }

  parse() {
    const roots = [];
    const types = {};
    let parents = {};

    this.tags.sort((a, b) => {
      return a.position.row - b.position.row;
    });

    for (const tag of this.tags) {
      if (tag.parent) {
        parents[tag.parent] = null;
      }
    }

    for (const tag of this.tags) {
      let key = '';
      if (tag.parent) {
        const { parent } = this.splitParentTag(tag.parent);
        key = `${tag.type}:${parent}${this.splitSymbol}${tag.name}`;
      } else {
        key = `${tag.type}:${tag.name}`;
      }
      parents[key] = tag;
    }

    parents = this.buildMissedParent(parents);

    for (const tag of this.tags) {
      if (tag.parent) {
        const parent = parents[tag.parent];
        if (!parent.position) {
          parent.position = new Point(tag.position.row - 1);
        }
      }
    }

    this.tags.sort((a, b) => {
      return a.position.row - b.position.row;
    });

    for (const tag of this.tags) {
      tag.label = tag.name;
      tag.icon = `icon-${tag.type}`;
      if (tag.parent) {
        const parent = parents[tag.parent];
        if (parent.children == null) {
          parent.children = [];
        }
        parent.children.push(tag);
      } else {
        roots.push(tag);
      }
      types[tag.type] = null;
    }

    return {
      root: {
        label: 'root',
        icon: null,
        children: roots,
      },
      types: Object.keys(types),
    };
  }

  getNearestTag(row) {
    let left = 0;
    let right = this.tags.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midRow = this.tags[mid].position.row;

      if (row < midRow) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    const nearest = left - 1;

    return this.tags[nearest];
  }
}
