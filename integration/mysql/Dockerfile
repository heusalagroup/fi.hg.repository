ARG MYSQL_IMAGE=mysql:8

FROM $MYSQL_IMAGE as mysql-image

FROM mysql-image
COPY initial.sql /docker-entrypoint-initdb.d
CMD [ "--explicit-defaults-for-timestamp=OFF", "--default-authentication-plugin=mysql_native_password" ]
