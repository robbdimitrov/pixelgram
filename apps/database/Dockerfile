FROM migrate/migrate:v4.18.1
COPY migrations /migrations
COPY run.sh /run.sh
USER 65532
ENTRYPOINT ["/run.sh"]
