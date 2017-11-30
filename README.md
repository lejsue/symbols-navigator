# Symbols Navigator package

Symbols navigator for Atom.io, using new universal-ctgas for parsing and adding public/protected/private visibility icons.

This package is fork from [symbols-tree-view](https://atom.io/packages/symbols-tree-view) and [symbols-tree-nav](https://atom.io/packages/symbols-tree-nav), but rewritten in Javascript and removed some functions.

=> *tag-generator.js comes from tag-generator.coffee in [symbols-view](http://github.com/atom/symbols-view).* and *symbols-icon comes from [symbols-tree-view](https://atom.io/packages/symbols-tree-view).*

Press <kbd>ctrl</kbd> + <kbd>alt</kbd> + <kbd>o</kbd> to open/close the Symbols Navigator.

Install with `apm install symbols-navigator` or use *Install Packages* from *Atom Settings*.

![](https://user-images.githubusercontent.com/9697224/29392630-b17d254a-8331-11e7-979a-39392c03ebe5.PNG)

## Symbols Navigator in Docks

In Atom 1.17, a new UI component called "docks" are introduced. Symbols Navigator is using this new feature, therefore it can be dragged to left or right side, as same as Tree View package.

![](https://user-images.githubusercontent.com/9697224/29394189-55d733fc-833b-11e7-89d1-5bb18d1be59f.gif)

## Settings

* **`Collapsed By Default`** (default=false) If checked then all collapsable elements will be displayed collapsed by default.
*This implementation comes from [symbols-tree-nav](https://atom.io/packages/symbols-tree-nav).*
* ~~**`Scroll Animation`** (default=true) If checked then when you click the item in symbols-navigator, it will scroll to destination gradually. 
*This implementation comes from [symbols-tree-view](https://atom.io/packages/symbols-tree-view).*~~
* **`Show Syntax Icon`** (defalut=true) If checked then syntax icons will be displayed before each element.
*This implementation comes from [symbols-tree-nav](https://atom.io/packages/symbols-tree-nav).*
* **`Colors For Synatx`** (default=true) If checked then synatx icons will be colorized.
* **`Can be closed by clicking x`** (default=false) If checked then symbols-navigator can be closed by clicking the x on the tab.
* **`Auto Reveal On Start`** (default=false) If checked then symbols-navigator will auto reveal on start-up.
* **`Position`** (defalut=Left) Defalut position the symbols-navigator appear. Possible options: Right, Left.
* **`Sort By`** (defalut=Symbol Name) The rule symbols will be sorted by. Possible options: Symbol Name, Source Row.
* **`Auto Hide Types`** You can specify a list of types that will be hidden by default.
*This implementation comes from [symbols-tree-view](https://atom.io/packages/symbols-tree-view).*
* **`Alternative Ctags Binary`** You can specify a path to a binary to use for ctags instead of the original one in symbols-navigator.
*This implementation comes from [symbols-tree-nav](https://atom.io/packages/symbols-tree-nav).*
* **`Click Type`** (default=Double Click) You can specify which clicking event to trigger moving cursor to the symbol.

## Supported commands

* `symbols-navigator:toggle`
* `symbols-navigator:toggle-focus`

## Universal-ctags Version

Please find it in [version.txt](https://github.com/lejsue/symbols-navigator/blob/master/vendor/version.txt).

## TODO

I'm a PHP developer, and have made the switch from Netbeans to Atom. I'm trying to make the behavior of this Symbols Navigator as close as possible. I'll list some good features for improvement.

Any suggestions, forks and commits are highly appreciated!

* Fix the problem of tag geneator. Example code in JavaScript:
```
class A {
  AB() {
    function ABC() {}
  }
}
clas B {
  AB() {
    function ABC() {}
  }
}
  
```

## License

This software is licensed under the MIT License.
