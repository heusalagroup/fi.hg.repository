**Join our [Discord](https://discord.gg/UBTrHxA78f) to discuss about our software!**

# ***DEPRECATED: fi.hg.repository***

This project has been refactored directly into our main modules:

 * [`fi.hg.core`](https://github.com/heusalagroup/fi.hg.core) -- The zero 
   dependable core functionality. Includes the memory-only persister and entity 
   annotations. Will later include the HTTP persister as well.
 * [`fi.hg.pg`](https://github.com/heusalagroup/fi.hg.pg) -- The PostgreSQL 
   persister
 * [`fi.hg.mysql`](https://github.com/heusalagroup/fi.hg.mysql) -- The MySQL 
   persister

You can still keep using the old `fi.hg.repository` version  -- just don't 
update your git module reference to this new one. **However, we no longer 
support or maintain this older version.**

To revert back to previous version: 

```bash
git checkout 3fc163d1ebb75000cad627700452a0c4d706d8dd
```

### Migration guide

* References to `./fi/hg/repository` should be renamed to files under the
  `./fi/hg/core/data/`. The internal hierarchy did change a bit but file names 
  should still be identical. We advise you to use IDEA's Problems tab and auto 
  import feature to fix file paths for imports.
* Names for the previous simpler repository implementation have been 
  renamed to have `Simple` prefix so that these do not conflict with the 
  main data framework
* Add module `fi.hg.mysql` if you need MySQL persister
* Add module `fi.hg.pg` if you need PostgreSQL persister
* The `fi.hg.repository` git module can be removed from your project once you
  have migrated to the new one
