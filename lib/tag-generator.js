'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { BufferedProcess, Point } from 'atom';

const Path = require('path');

export default class TagGenerator {
  constructor(path, scopeName) {
    this.path = path;
    this.scopeName = scopeName;
  }

  parseTagLine(line) {
    if (line.length > 0 && line[0] === '{') {
      let sections = {};
      try {
        sections = JSON.parse(line);
      } catch (exception) {
        return null;
      }

      if (sections.name == null || sections.line == null) {
        return null;
      }

      const tag = {
        position: new Point(parseInt(sections.line, 10) - 1),
        name: sections.name,
        type: sections.kind,
        parent: null,
        access: null,
        signature: null,
      };

      if (sections.scopeKind != null && sections.scopeKind !== '') {
        tag.parent = `${sections.scopeKind}:${sections.scope}`;
      }

      if (sections.access != null && sections.access !== '-') {
        tag.access = sections.access;
      }

      if (sections.signature != null && sections.signature !== '-') {
        tag.signature = sections.signature;
      }

      if (this.getLanguage() === 'Python' && tag.type === 'member') {
        tag.type = 'function';
      }

      return tag;
    }

    return null;
  }

  getLanguage() {
    if ((this.path != null) && (Path.extname(this.path) in ['.cson', '.gyp'])) {
      return 'Cson';
    }

    return {
      'source.c': 'C',
      'source.cpp': 'C++',
      'source.clojure': 'Lisp',
      'source.coffee': 'CoffeeScript',
      'source.css': 'Css',
      'source.css.less': 'Css',
      'source.css.scss': 'Css',
      'source.gfm': 'Markdown',
      'source.go': 'Go',
      'source.java': 'Java',
      'source.js': 'JavaScript',
      'source.js.jsx': 'JavaScript',
      'source.jsx': 'JavaScript',
      'source.json': 'Json',
      'source.makefile': 'Make',
      'source.objc': 'C',
      'source.objcpp': 'C++',
      'source.python': 'Python',
      'source.ruby': 'Ruby',
      'source.sass': 'Sass',
      'source.yaml': 'Yaml',
      'text.html': 'Html',
      'text.html.php': 'Php',
      'source.livecodescript': 'LiveCode',
      'source.scilab': 'Scilab',
      'source.matlab': 'Scilab',
      'source.octave': 'Scilab',
      'source.c++': 'C++',
      'source.objc++': 'C++',
    }[this.scopeName];
  }

  generate() {
    const tags = [];
    let command = '';
    if (atom.config.get('symbols-navigator.alternativeCtagsBinary') === 'default') {
      command = Path.resolve(__dirname, '..', 'vendor', `universal-ctags-${process.platform}`);
    } else {
      command = Path.resolve(atom.config.get('symbols-navigator.alternativeCtagsBinary'));
    }

    const defaultCtagsFile = require.resolve('./.ctags');
    const args = [`--options=${defaultCtagsFile}`, '-x'];

    if (atom.config.get('symbols-view.useEditorGrammarAsCtagsLanguage') !== '') {
      const language = this.getLanguage();
      if (language !== '') {
        args.push(`--language-force=${language}`);
      }
    }

    args.push('--_xformat={"line":"%n","name":"%N","kind":"%K","scopeKind":"%p","scope":"%s","access":"%a","signature":"%S"}');
    args.push(this.path);

    return new Promise((resolve) => {
      const stdout = (lines) => {
        for (const line of lines.split('\n')) {
          const tag = this.parseTagLine(line.trim());
          if (tag !== null) {
            tags.push(tag);
          }
        }
      };
      const stderr = () => {};
      const exit = () => {
        return resolve(tags);
      };

      return new BufferedProcess({ command, args, stdout, stderr, exit });
    });
  }
}
