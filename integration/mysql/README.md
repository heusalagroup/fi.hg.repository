# Integration tests for mysql persister

### Start MySQL server for testing

```shell
docker-compose build
docker-compose up
```

Will start mysql server at `localhost` port `3306`.

### Running the tests

You can configure following environment variables:

```shell
export TEST_SCOPES='integration'
export TEST_MYSQL_HOSTNAME='localhost'
export TEST_MYSQL_USERNAME='hg'
export TEST_MYSQL_PASSWORD=''
export TEST_MYSQL_DATABASE='hg'
export TEST_MYSQL_TABLE_PREFIX=''
export TEST_MYSQL_CHARSET='LATIN1_SWEDISH_CI'
```

The test are executed if these variables are defined and `TEST_SCOPES` 
includes `integration`.

You can start tests from our project testing environment (not part of this 
repository):

```shell
TEST_MYSQL_PASSWORD='rxPe4XHbonLeHwjvKdq9R9aDWf1xiUje' TEST_SCOPES=integration,hg npm test
```

### MySQL console

```shell
docker run -it --rm mysql:8 mysql -uhg -hhost.docker.internal -prxPe4XHbonLeHwjvKdq9R9aDWf1xiUje hg
```

You can also pass SQL dump files there like this:

```shell
docker run -i --rm mysql:8 mysql -uhg -hhost.docker.internal -prxPe4XHbonLeHwjvKdq9R9aDWf1xiUje hg < ./initial.sql
```

#### Quick guide to MySQL command line interface

 * Display all tables:
   ```mysql
   SHOW TABLES;
   ```
 * Display table information:
   ```mysql
   DESCRIBE `carts`;
   ```
 * Show all table rows:
   ```mysql
   SELECT * FROM `carts`;
   ```
 * Delete all table rows:
   ```mysql
   DELETE FROM `carts`;
   ```
* Set better paging support:
  ```postgresql
  pager less -S -R
  ```
* Exit program:
  ```postgresql
  exit
  ```
