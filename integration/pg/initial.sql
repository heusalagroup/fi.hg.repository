
--
-- Table structure for table foos
--

DROP TABLE IF EXISTS foos;
CREATE TABLE foos (
  foo_id serial PRIMARY KEY,
  foo_name varchar(255) NOT NULL default ''
);

--
-- Table structure for table bars
--

DROP TABLE IF EXISTS bars;
CREATE TABLE bars (
  bar_id serial PRIMARY KEY,
  bar_name varchar(255) NOT NULL default ''
);

--
-- Table structure for table carts
--

DROP TABLE IF EXISTS carts;
CREATE TABLE carts (
  cart_id serial PRIMARY KEY,
  cart_name varchar(255) NOT NULL default ''
);

--
-- Table structure for table cart_items
--

DROP TABLE IF EXISTS cart_items;
CREATE TABLE cart_items (
  cart_item_id serial PRIMARY KEY,
  cart_id BIGINT NOT NULL,
  cart_item_name varchar(255) NOT NULL default ''
);
