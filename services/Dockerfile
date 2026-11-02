# syntax=docker/dockerfile:1
FROM maven:3.9.9-eclipse-temurin-21 AS build
ARG SERVICE
ENV MAVEN_OPTS="-Xmx256m"
WORKDIR /build
COPY services/${SERVICE}/pom.xml ./pom.xml
RUN --mount=type=cache,target=/root/.m2 mvn -B dependency:go-offline -DskipTests
COPY services/${SERVICE}/src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B package -DskipTests
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /build/target/*-SNAPSHOT.jar /app/app.jar
USER app
ENV JAVA_OPTS="-Xmx256m -XX:+ExitOnOutOfMemoryError -Dsun.net.inetaddr.ttl=5" SERVER_PORT=8080 SPRING_PROFILES_ACTIVE=independent
HEALTHCHECK --interval=10s --timeout=4s --start-period=90s --retries=12 CMD wget -q -O /dev/null http://127.0.0.1:${SERVER_PORT}/actuator/health || exit 1
ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -jar /app/app.jar"]
