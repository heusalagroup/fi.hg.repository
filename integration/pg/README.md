# Integration tests for PostgreSQL persister

### Start PostgreSQL server for testing

```shell
docker-compose build
docker-compose up
```

Will start PostgreSQL server at `localhost` port `5432`.

### Running the tests

You can configure following environment variables:

```shell
export TEST_SCOPES='integration'
export TEST_POSTGRES_HOSTNAME='localhost'
export TEST_POSTGRES_USERNAME='hg'
export TEST_POSTGRES_PASSWORD=''
export TEST_POSTGRES_DATABASE='hg'
export TEST_POSTGRES_TABLE_PREFIX=''
export TEST_POSTGRES_CHARSET=''
```

The test are executed if these variables are defined and `TEST_SCOPES` 
includes `integration`.

You can start tests from our project testing environment (not part of this 
repository):

```shell
TEST_POSTGRES_PASSWORD='rxPe4XHbonLeHwjvKdq9R9aDWf1xiUje' TEST_SCOPES=integration,hg npm test
```

### PostgreSQL console

```shell
docker run -it --rm postgres:15 psql -uhg -hhost.docker.internal -prxPe4XHbonLeHwjvKdq9R9aDWf1xiUje hg
```

You can also pass SQL dump files there like this:

```shell
docker run -i --rm postgres:15 psql -uhg -hhost.docker.internal -prxPe4XHbonLeHwjvKdq9R9aDWf1xiUje hg < ./initial.sql
```
