# @heusalagroup/fi.hg.repository

This project is a Spring Data inspired annotation mechanism for entities and our `CrudRepository` implementation.

### It doesn't have many runtime dependencies

### We don't have traditional releases

We don't have traditional releases.  This project evolves directly to our git repository in an agile manner.

This git repository contains only the source code for compile time use case. It is meant to be used as a git submodule 
in a NodeJS or webpack project.

### License

Copyright (c) Heusala Group. All rights reserved. Licensed under the MIT License (the "[License](./LICENSE)");

## Index

 * [Install & maintain our library](#install--maintain-our-library)
   * [Checking out a project with git submodules](#checking-out-a-project-with-git-submodules)
   * [Updating upstream library code](#updating-upstream-library-code)
   * [Why git submodules, you may wonder?](#why-git-submodules-you-may-wonder)
 * [LogService](#logservice)
 * [Observer](#observer)
 * [Request](#request)
 * [RequestServer](#requestserver)
 * [Repository](#repository)
 * [ProcessUtils](#processutils)
   * [ProcessUtils.initEnvFromDefaultFiles()](#processutilsinitenvfromdefaultfiles)
   * [ProcessUtils.setupDestroyHandler(...)](#processutilssetupdestroyhandlershutdownhandler-errorhandler)

## Installing & using our library

Run the installation commands from your project's root directory. Usually it's where your `package.json` is located.

For these sample commands we expect your source files to be located in `./src` and we'll use `./src/fi/hg/NAME` for location for our sub modules.

Setup git submodules:

```shell
mkdir -p src/fi/hg

git submodule add git@github.com:heusalagroup/fi.hg.core.git src/fi/hg/core
git config -f .gitmodules submodule.src/fi/hg/core.branch main

git submodule add git@github.com:heusalagroup/fi.hg.repository.git src/fi/hg/repository
git config -f .gitmodules submodule.src/fi/hg/repository.branch main

```

Next install our required dependencies (newest [lodash library](https://lodash.com/) and [reflect-metadata library](https://www.npmjs.com/package/reflect-metadata)):

```shell
npm install --save-dev lodash @types/lodash reflect-metadata @types/node
```

You will also need to install `pg` module for `PgPersister`:

```shell
npm install --save pg @types/pg
```

We also have an identical `MySqlPersister`. In that case, install `mysql` module:

```shell
npm install --save mysql @types/mysql
```

## Documentation

### Entity class example

First define a class for your entity -- we'll create `User` class:

```typescript
import { Table, Entity, Id, Column } from "./fi/hg/repository/Entity";

@Table("users")
export class User extends Entity {

    @Id()
    @Column("id")
    public id?: string;

    @Column("name")
    public name: string;

    @Column("email")
    public email: string;

    @Column("age")
    public age: number;

    //...
}
```

### Repository interface example

Then create a repository interface for your entities:

```typescript
import {User} from "./model/User";
import CrudRepository from "./fi/hg/repository/CrudRepository";
import Persister from "./fi/hg/repository/Persister";

export interface UserRepository extends CrudRepository<User, string> {

    findAllByEmail   (email : string) : Promise<User[]>;
    findByEmail      (email : string) : Promise<User | undefined>;
    countByEmail     (email : string) : Promise<number>;
    existsByEmail    (email : string) : Promise<boolean>;
    deleteAllByEmail (email : string) : Promise<void>;
    
}
```

**Note!** *You don't need to implement these methods.*

The framework does that under the hood for you. 

In fact, these methods will always be created -- even if you don't declare them in your interface. Declaration is only 
necessary for TypeScript and your IDE to know they exist in your interface.

### Controller example

Then use it in your controller like this:

```typescript
import {User} from "./model/User";
import {UserRepository} from "./UserRepository";

export interface UserDto {
    id    ?: string;
    email ?: string;
}

export class UserController {
    
    private readonly _userRepository : UserRepository;
    
    constructor (userRepository : UserRepository) {
       this._userRepository = userRepository;
    }
    
    public async createUser (): Promise<UserDto> {
        
        const newUser = new User(/*...*/);
        
        const addedUser = await this._userRepository.save(newUser);
        
        return {id: addedUser.id};
       
    }
    
}
```

### Main runtime example

Finally, put everything together in your main runtime file:

```typescript
import PgPersister from "./fi/hg/repository/persisters/pg/PgPersister";
import {createCrudRepositoryWithPersister} from "./fi/hg/core/Repository";
import {User} from "./model/User";
import {UserRepository} from "./UserRepository";

const pgPersister    : Persister = new PgPersister();

const userRepository : UserRepository = createCrudRepositoryWithPersister<UserRepository, User, string>(new User(), pgPersister);
```

## Where we're going on with our Data implementation

We are also planning to implement `HttpPersister`, which would make it possible to use the API without a local dependency
for these modules. It would connect over an HTTP REST interface to a separate microservice with the real MySQL or 
PostgreSQL pool (including the dependency).
